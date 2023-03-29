import { ListObjectsCommand, ListObjectsRequest, S3Client, S3ClientConfig, S3ServiceException } from '@aws-sdk/client-s3';
import { Logger } from '@map-colonies/js-logger';
import httpStatus from 'http-status-codes';
import { inject, injectable } from 'tsyringe';
import { QueueFileHandler } from '../../handlers/queueFileHandler';
import { AppError } from '../appError';
import { SERVICES } from '../constants';
import { IProvider, IS3Config } from '../interfaces';

@injectable()
export class S3Provider implements IProvider {
  private readonly s3: S3Client;

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
    };

    this.s3 = new S3Client(s3ClientConfig);
  }

  public async streamModelPathsToQueueFile(model: string): Promise<void> {
    const modelName = model + '/';

    /* eslint-disable @typescript-eslint/naming-convention */
    const params: ListObjectsRequest = {
      Bucket: this.s3Config.bucket,
      Delimiter: '/',
      Prefix: modelName,
    };

    const folders: string[] = [modelName];

    while (folders.length > 0) {
      params.Prefix = folders[0];
      await Promise.all(
        (
          await this.listOneLevelS3(params, [])
        ).map((item) => {
          if (item.endsWith('/')) {
            folders.push(item);
          } else {
            try {
              this.queueFileHandler.writeFileNameToQueueFile(item);
            } catch (err) {
              this.logger.error({ msg: `Didn't write the file: '${item}' in S3.` });
            }
          }
        })
      );
      folders.shift();
    }

    if (this.queueFileHandler.checkIfTempFileEmpty()) {
      throw new AppError(httpStatus.BAD_REQUEST, `Model ${model} doesn't exists in bucket ${this.s3Config.bucket}!`, true);
    }
  }

  private async listOneLevelS3(params: ListObjectsRequest, keysList: string[]): Promise<string[]> {
    try {
      const listObject = new ListObjectsCommand(params);
      const data = await this.s3.send(listObject);

      if (data.Contents) {
        keysList = keysList.concat(data.Contents.map((item) => (item.Key != undefined ? item.Key : '')));
      }

      if (data.CommonPrefixes) {
        keysList = keysList.concat(data.CommonPrefixes.map((item) => (item.Prefix != undefined ? item.Prefix : '')));
      }

      if (data.IsTruncated === true) {
        params.Marker = data.NextMarker;
        await this.listOneLevelS3(params, keysList);
      }
      return keysList;
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
