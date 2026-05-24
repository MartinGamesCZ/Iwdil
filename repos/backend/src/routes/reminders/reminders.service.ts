import { BadRequestException, Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class RemindersService {
  private s3ClientInternal: S3Client;
  private s3ClientExternal: S3Client;
  private bucketName = 'iwdil-qc';

  constructor() {
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

    const url = await getSignedUrl(this.s3ClientExternal, command, {
      expiresIn: 3600,
    });

    return { url };
  }
}
