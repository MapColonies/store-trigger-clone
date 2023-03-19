/* eslint-disable @typescript-eslint/naming-convention */
import { container, inject, injectable } from 'tsyringe';
import { ListObjectsCommand, ListObjectsRequest, S3Client, S3ClientConfig, S3ServiceException } from '@aws-sdk/client-s3';
import { Logger } from '@map-colonies/js-logger';
import httpStatus from 'http-status-codes';
import { IConfigProvider, IS3Config } from '../interfaces';
import { SERVICES } from '../constants';
import { AppError } from '../appError';
import { QueueFileHandler } from '../../handlers/queueFileHandler';

@injectable()
export class S3Provider implements IConfigProvider {
  private readonly s3: S3Client;
  private readonly logger: Logger;
  private readonly s3Config: IS3Config;

  public constructor(@inject(SERVICES.FILE_HANDLER) protected readonly queueFileHandler: QueueFileHandler) {
    this.logger = container.resolve(SERVICES.LOGGER);
    this.s3Config = container.resolve(SERVICES.S3);

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

  public async listFiles(model: string): Promise<void> {
    const modelName = model + '/';

    const params: ListObjectsRequest = {
      Bucket: this.s3Config.bucket,
      Delimiter: '/',
      Prefix: modelName,
    };

    const folders: string[] = [modelName];
    // const files: string[] = [];

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
      throw new AppError('', httpStatus.BAD_REQUEST, `Model ${modelName} doesn't exists in bucket ${this.s3Config.bucket}!`, true);
    }
  }

  private async listOneLevelS3(params: ListObjectsRequest, keysList: string[]): Promise<string[]> {
    try {
      const data = await this.s3.send(new ListObjectsCommand(params));

      if (data.Contents) {
        keysList = keysList.concat(data.Contents.map((item) => (item.Key != undefined ? item.Key : '')));
      }

      if (data.CommonPrefixes) {
        keysList = keysList.concat(data.CommonPrefixes.map((item) => (item.Prefix != undefined ? item.Prefix : '')));
      }

      if (data.IsTruncated == true) {
        params.Marker = data.NextMarker;
        await this.listOneLevelS3(params, keysList);
      }
      return keysList;
    } catch (e) {
      if (e instanceof S3ServiceException) {
        throw new AppError(
          '',
          e.$metadata.httpStatusCode ?? httpStatus.INTERNAL_SERVER_ERROR,
          `${e.name}, message: ${e.message}, bucket: ${this.s3Config.bucket}}`,
          true
        );
      }
      this.logger.error({ msg: e });
      throw new AppError('', httpStatus.INTERNAL_SERVER_ERROR, "Didn't throw a S3 exception in listing files", true);
    }
  }
}
