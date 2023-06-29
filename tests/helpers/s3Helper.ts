/* eslint-disable @typescript-eslint/naming-convention */
import { CreateBucketCommandInput, CreateBucketCommand, S3Client, S3ClientConfig, PutObjectCommand, PutObjectCommandInput, DeleteBucketCommandInput, DeleteBucketCommand, DeleteObjectCommandInput, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randSentence, randWord } from '@ngneat/falso';
import config from 'config';
import { inject, injectable } from 'tsyringe';
import { SERVICES } from '../../src/common/constants';
import { IS3Config } from '../../src/common/interfaces';

@injectable()
export class S3Helper {
  private readonly s3: S3Client;

  public constructor(@inject(SERVICES.PROVIDER_CONFIG) protected readonly s3Config: IS3Config) {
    const s3ClientConfig: S3ClientConfig = {
      endpoint: this.s3Config.endpointUrl,
      forcePathStyle: this.s3Config.forcePathStyle,
      credentials: {
        accessKeyId: this.s3Config.accessKeyId,
        secretAccessKey: this.s3Config.secretAccessKey,
      },
      region: this.s3Config.region,
    };
    this.s3 = new S3Client(s3ClientConfig);
  }

  public async createBucket(): Promise<void> {
    const input: CreateBucketCommandInput = {
      Bucket: config.get<string>('S3.bucket'),
    };
    const command = new CreateBucketCommand(input);
    await this.s3.send(command);
  }
  
  public async deleteBucket(): Promise<void> {
    const input: DeleteBucketCommandInput = {
      Bucket: config.get<string>('S3.bucket'),
    };
    const command = new DeleteBucketCommand(input);
    await this.s3.send(command);
  }

  public async createModel(): Promise<string> {
    const model = randWord();
    const input: PutObjectCommandInput = {
      Bucket: config.get<string>('S3.bucket'),
      Key: model,
      Body: Buffer.from(randSentence())
    };
    const command = new PutObjectCommand(input);
    const response = await this.s3.send(command);
    return model;
  }

  public async deleteModel(model: string): Promise<string> {
    const input: DeleteObjectCommandInput = {
      Bucket: config.get<string>('S3.bucket'),
      Key: model,
    };
    const command = new DeleteObjectCommand(input);
    await this.s3.send(command);
    return model;
  }
}
