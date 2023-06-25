import { CreateBucketCommandInput, CreateBucketCommand, S3Client, S3ClientConfig, PutObjectCommand, PutObjectCommandInput } from '@aws-sdk/client-s3';
import { randWord } from '@ngneat/falso';
import config from 'config';
import { inject, injectable } from 'tsyringe';
import { SERVICES } from '../../../../src/common/constants';
import { IS3Config } from '../../../../src/common/interfaces';

@injectable()
export class FakeMinio {
  private readonly s3: S3Client;
  private readonly s3Config: IS3Config;
  
  public constructor() {
    this.s3Config = config.get<IS3Config>('S3');
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
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Bucket: config.get<string>('S3.bucket'),
    };
    const command = new CreateBucketCommand(input);
    await this.s3.send(command);
  }

  public async createModel(): Promise<string> {
    const model = randWord();
    /* eslint-disable @typescript-eslint/naming-convention */
    const input: PutObjectCommandInput = {
      Bucket: config.get<string>('S3.bucket'),
      Key: model,
    };
    /* eslint-enable @typescript-eslint/naming-convention */
    const command = new PutObjectCommand(input);
    await this.s3.send(command);
    return model;
  }
}
