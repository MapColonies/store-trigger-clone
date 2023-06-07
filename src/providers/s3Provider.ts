import { ListObjectsCommand, ListObjectsRequest, S3Client, S3ClientConfig, S3ServiceException } from '@aws-sdk/client-s3';
import { Logger } from '@map-colonies/js-logger';
import httpStatus from 'http-status-codes';
import { inject, injectable } from 'tsyringe';
import { QueueFileHandler } from '../handlers/queueFileHandler';
import { AppError } from '../common/appError';
import { SERVICES } from '../common/constants';
import { IProvider, IS3Config } from '../common/interfaces';

@injectable()
export class S3Provider implements IProvider {
  private readonly s3: S3Client;
  private filesCount: number;

  public constructor(
    @inject(SERVICES.PROVIDER_CONFIG) protected readonly s3Config: IS3Config,
    @inject(SERVICES.LOGGER) protected readonly logger: Logger,
    @inject(SERVICES.QUEUE_FILE_HANDLER) protected readonly queueFileHandler: QueueFileHandler
  ) {
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
    this.filesCount = 0;
  }

  public async streamModelPathsToQueueFile(model: string): Promise<void> {
    const modelName = model + '/';

    /* eslint-disable @typescript-eslint/naming-convention */
    const params: ListObjectsRequest = {
      Bucket: this.s3Config.bucket,
      Delimiter: '/',
      Prefix: modelName,
    };

    await this.listS3Recursively(params);

    if (await this.queueFileHandler.checkIfTempFileEmpty()) {
      throw new AppError(httpStatus.NOT_FOUND, `Model ${model} doesn't exists in bucket ${this.s3Config.bucket}!`, true);
    }

    this.logger.debug({ msg: `There are ${this.filesCount} files in model ${model}` });
  }

  private async listS3Recursively(params: ListObjectsRequest): Promise<void> {
    try {
      const listObject = new ListObjectsCommand(params);
      const data = await this.s3.send(listObject);

      if (data.Contents) {
        for (let index = 0; index < data.Contents.length; index++) {
          if(data.Contents[index].Key == undefined) {
            throw new AppError(httpStatus.NO_CONTENT, 'found content without file name', true);
          }
          await this.queueFileHandler.writeFileNameToQueueFile(data.Contents[index].Key as string);
          this.filesCount++;
        }
      }

      if (data.CommonPrefixes) {
        for (let index = 0; index < data.CommonPrefixes.length; index++) {
          if(data.CommonPrefixes[index].Prefix != undefined) {
            const nextParams: ListObjectsRequest = {
              Bucket: this.s3Config.bucket,
              Delimiter: '/',
              Prefix: data.CommonPrefixes[index].Prefix,
            }
            await this.listS3Recursively(nextParams);
          }
        }
      }

      if (data.IsTruncated === true) {
        if (data.Contents == undefined) {
          throw new AppError(httpStatus.CONFLICT, 'IsTruncated is true but has contents is empty', true);
        }
        const nextParams: ListObjectsRequest = {
          Bucket: this.s3Config.bucket,
          Delimiter: '/',
          Prefix: data.Prefix,
          Marker: data.Contents[data.Contents.length - 1].Key
        }
        await this.listS3Recursively(nextParams);
      }

      this.logger.debug({ msg: `Listed ${this.filesCount} files` });
    } catch (e) {
      this.logger.error({ msg: e });
      this.handleS3Error(this.s3Config.bucket, e);
    }
  }

  private handleS3Error(s3Bucket: string, error: unknown): never {
    let statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    let message = "Didn't throw a S3 exception in file";

    if (error instanceof S3ServiceException) {
      statusCode = error.$metadata.httpStatusCode ?? statusCode;
      message = `${error.name}, message: ${error.message}, bucket: ${s3Bucket}`;
    }

    throw new AppError(statusCode, message, true);
  }
}
