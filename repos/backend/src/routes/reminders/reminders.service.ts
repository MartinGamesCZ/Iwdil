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

@Injectable()
export class RemindersService {
  private s3ClientInternal: S3Client;
  private s3ClientExternal: S3Client;
  private bucketName = 'iwdil';

  #qrQueueProcessing = false;

  constructor(
    private readonly ocrService: OcrService,
    private readonly llmService: LlmService,
    private readonly notificationsService: NotificationsService,
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
    if (!Number.isInteger(fsize) || fsize < 1 || fsize > 10485760) {
      throw new BadRequestException('Invalid file size');
    }

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

    return {};
  }

  @Cron(CronExpression.EVERY_SECOND)
  private async qrQueueProcessor() {
    // Lock
    if (this.#qrQueueProcessing) return;
    this.#qrQueueProcessing = true;

    try {
      this.#processNextQr();
    } catch (e) {}

    this.#qrQueueProcessing = false;
  }

  async #processNextQr() {
    const nextUnprocessed = await Database.get<QuickReminderEntity>().findOne({
      where: {
        status: ReminderStatus.ScheduledForProcessing,
      },
      relations: {
        user: true,
      },
    });
    if (!nextUnprocessed) return;

    console.log(`Processing quick reminder ${nextUnprocessed.id}`);

    nextUnprocessed.status = ReminderStatus.Processing;
    await Database.get<QuickReminderEntity>().save(nextUnprocessed);

    const res = await this.llmService.ask(
      `You are a profesional reminder creator. You will receive text extracted from a user uploaded image with a reminder (screenshot of what they need to do) and "when", which is when they want to get reminded. Your task is to return a correctly structured json.
      I have also given you current datetime, so you can work with values like "10:20" (I ALWAYS USE 24H format) and "in 40 minutes".
      If I give you just the text (10:32 for example), assume it's the closest time after current time (if it's currently < 10:32 then it's 10:32 today and if it's currently > 10:32 then it's 10:32 tomorrow).
      If you get for example "in one hour", "in one day", "in one week", etc. return the current datetime PLUS the hour/day/week in ISO string format.
      
      [BEGIN TEXT]
      ${nextUnprocessed.extractedText}
      [END TEXT]
      
      [BEGIN WHEN]
      ${nextUnprocessed.userGivenWhen}
      [END WHEN]

      [BEGIN CURRENT DATETIME -- DO NOT RETURN THIS, USE FOR REFERENCE]
      ${new Date().toISOString()}
      [END CURRENT DATETIME]
      
      Json format:
      {
        "datetime": "ISO STRING",
        "text": "Do something"
      }
        
      Keep the reminder text meaningful and short, don't just copy whatever you've got.`,
    );

    const infered = JSON.parse(res.content);

    nextUnprocessed.inferedText = infered.text;
    nextUnprocessed.inferedWhen = infered.datetime;
    nextUnprocessed.status = ReminderStatus.Scheduled;
    await Database.get<QuickReminderEntity>().save(nextUnprocessed);

    // Notify all clients
    this.notificationsService.push(nextUnprocessed.user.id, {
      type: 'qr:create',
      data: {
        id: nextUnprocessed.id,
        text: nextUnprocessed.inferedText,
        when: nextUnprocessed.inferedWhen,
      },
    });
  }
}
