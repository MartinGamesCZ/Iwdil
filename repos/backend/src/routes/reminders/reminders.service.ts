import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import axios from 'axios';
import { OcrService } from 'src/services/ocr.service';
import { LlmService } from 'src/services/llm.service';
import { QuickReminderEntity } from 'src/database/entities/QuickReminderEntity';
import { randomUUID } from 'crypto';
import { Database } from 'src/database/database';
import { UserEntity } from 'src/database/entities/UserEntity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReminderStatus } from 'src/types/reminder';
import { NotificationsService } from '../notifications/notifications.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ReminderDataExtractionPrompt } from 'src/prompts/reminder-data-extraction';
import { LessThan } from 'typeorm';
import { Message } from 'ollama';

@Injectable()
export class RemindersService {
  private s3ClientInternal: S3Client;
  private s3ClientExternal: S3Client;
  private bucketName = 'iwdil';

  constructor(
    private readonly ocrService: OcrService,
    private readonly llmService: LlmService,
    private readonly notificationsService: NotificationsService,
    @InjectQueue('quick-reminders')
    private readonly qrQueue: Queue,
  ) {
    const credentials = {
      accessKeyId: process.env.MINIO_ACCESS_KEY!,
      secretAccessKey: process.env.MINIO_SECRET_KEY!,
    };

    this.s3ClientInternal = new S3Client({
      endpoint: process.env.MINIO_ENDPOINT!,
      credentials,
      region: 'us-east-1',
      forcePathStyle: true,
    });

    this.s3ClientExternal = new S3Client({
      endpoint: process.env.MINIO_EXTERNAL_ENDPOINT!,
      credentials,
      region: 'us-east-1',
      forcePathStyle: true,
    });
  }

  async quickCreateUpload(
    userId: string,
    size: string,
  ): Promise<{ url: string }> {
    const fsize = Number(size);
    if (!Number.isInteger(fsize) || fsize < 1 || fsize > 10485760)
      throw new BadRequestException('Invalid file size');

    const key = `uploads/${userId}/snippet.png`;
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: 'image/png',
      // Limit size to 10MB
      ContentLength: fsize,
    });

    // Generate the presigned URL using the external client
    const url = await getSignedUrl(this.s3ClientExternal, command, {
      expiresIn: 3600,
    });

    return { url };
  }

  async quickCreateGetSnippetUrl(
    userId: string,
    internal: boolean = false,
  ): Promise<{ url: string | null }> {
    const key = `uploads/${userId}/snippet.png`;

    const headCommand = new HeadObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    const res = await this.s3ClientInternal.send(headCommand).catch(() => null);
    if (!res) return { url: null };

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const url = await getSignedUrl(
      internal ? this.s3ClientInternal : this.s3ClientExternal,
      command,
      {
        expiresIn: 3600,
      },
    );

    return { url };
  }

  async quickCreate(userId: string, when: string) {
    if (!userId) throw new UnauthorizedException('Unauthorized');

    const user = await Database.get<UserEntity>().findOne({
      where: {
        id: userId,
      },
    });
    if (!user)
      // should never occur (auth guard creates the entity)
      throw new UnauthorizedException(
        'Unauthorized, something really is messed up :3',
      );

    if (!when || when.trim().length < 1)
      throw new BadRequestException('When cannot be empty');

    // Get snippet buffer
    const snippet = await this.quickCreateGetSnippetUrl(userId, true);
    if (!snippet.url) throw new BadRequestException('No snippet found');

    const { data: snippetBuffer } = await axios.get(snippet.url, {
      responseType: 'arraybuffer',
    });

    // Parse image text (takes max 4 seconds, so we don't need to put it into queue)
    const text = await this.ocrService.extract(Buffer.from(snippetBuffer));

    const id = randomUUID();

    // Move the image to bucket/uploads/USER_ID/<id>.png
    const moveCommand = new CopyObjectCommand({
      Bucket: this.bucketName,
      CopySource: encodeURI(`${this.bucketName}/uploads/${userId}/snippet.png`),
      Key: `uploads/${userId}/${id}.png`,
      MetadataDirective: 'REPLACE',
    });

    await this.s3ClientInternal.send(moveCommand);

    // Create quick reminder entity
    const qrEntity = new QuickReminderEntity();

    qrEntity.id = id;
    qrEntity.user = user;
    qrEntity.extractedText = text;
    qrEntity.userGivenWhen = when;

    await Database.get<QuickReminderEntity>().save(qrEntity);

    await this.qrQueue.add('process-reminder', { reminderId: qrEntity.id });

    return {};
  }
  async quickProcess(reminderId: string) {
    const qr = await Database.get<QuickReminderEntity>().findOne({
      where: {
        id: reminderId,
      },
      relations: {
        user: true,
      },
    });
    if (!qr) return;

    console.log(`Processing quick reminder ${qr.id}`);

    qr.status = ReminderStatus.Processing;
    await Database.get<QuickReminderEntity>().save(qr);

    let infered: {
      text: string;
      datetime: string;
    } | null = null;
    let messages: Message[] = [
      {
        role: 'user',
        content: ReminderDataExtractionPrompt(
          qr.extractedText,
          qr.userGivenWhen,
        ),
      },
    ];

    for (let tries = 0; tries < 3; tries++) {
      console.log('Infer try ' + (tries + 1));

      const res = await this.llmService.chat(messages, { temperature: 0.1 });

      infered = JSON.parse(
        this.llmService.stripOutJson(res.output.message.content),
      );

      messages.push(res.output.message);

      if (
        new Date(infered!.datetime).getTime() >
        new Date(
          new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Prague' }),
        ).getTime()
      )
        break;

      messages.push({
        role: 'user',
        content: "INVALID DATETIME, ISN'T IT IN THE PAST?",
      });
    }

    qr.inferedText = infered!.text;
    qr.inferedWhen = infered!.datetime;
    qr.status = ReminderStatus.Scheduled;
    await Database.get<QuickReminderEntity>().save(qr);

    // Notify all clients
    this.notificationsService.push(qr.user.id, {
      type: 'qr:create',
      data: {
        id: qr.id,
        text: qr.inferedText,
        when: qr.inferedWhen,
      },
    });

    console.log(`Done processing ${qr.id}`);
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async checkDue() {
    // Get all due
    const reminders = await Database.get<QuickReminderEntity>().find({
      where: {
        status: ReminderStatus.Scheduled,
        inferedWhen: LessThan(
          new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Prague' }),
        ),
      },
      relations: {
        user: true,
      },
    });

    for (const reminder of reminders) {
      await this.notificationsService.push(reminder.user.id, {
        type: 'qr:due',
        data: reminder,
      });

      reminder.status = ReminderStatus.Completed;
      await Database.get<QuickReminderEntity>().save(reminder);
    }
  }
}
