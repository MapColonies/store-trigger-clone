/* eslint-disable @typescript-eslint/naming-convention */
import { container } from 'tsyringe';
import { ListObjectsCommand, ListObjectsRequest, S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import { Logger } from '@map-colonies/js-logger';
import httpStatus from 'http-status-codes';
import { IConfigProvider, IS3Config } from '../interfaces';
import { SERVICES } from '../constants';
import { AppError } from '../appError';

export class S3Provider implements IConfigProvider {
  private readonly s3: S3Client;
  private readonly logger: Logger;
  private readonly s3Config: IS3Config;

  public constructor() {
    this.logger = container.resolve(SERVICES.LOGGER);
    this.s3Config = container.resolve(SERVICES.S3);

    const s3ClientConfig: S3ClientConfig = {
      endpoint: this.s3Config.endpointUrl,
      forcePathStyle: this.s3Config.forcePathStyle,
      credentials: {
        accessKeyId: this.s3Config.accessKeyId,
        secretAccessKey: this.s3Config.secretAccessKey,
      },
    }

    this.s3 = new S3Client(s3ClientConfig);
  }

  public async listFiles(model: string): Promise<string[]> {
    const modelName = model + '/';
  
    const params: ListObjectsRequest = {
      Bucket: this.s3Config.bucket,
      Delimiter: '/',
      Prefix: modelName,
    };
  
    const folders: string[] = [modelName];
    const files: string[] = [];
  
    while (folders.length > 0) {
      params.Prefix = folders[0];
      await Promise.all(
        (
          await this.listOneLevelS3(params, [])
        ).map((item) => {
          if (item.endsWith('/')) {
            folders.push(item);
          } else {
            files.push(item);
          }
        })
      );
      folders.shift();
    }
  
    if (files.length == 0) {
      throw new AppError('', httpStatus.BAD_REQUEST, `Model ${modelName} doesn't exists in bucket ${this.s3Config.bucket}!`, false);
    }
    
    return files;
  }

  private async listOneLevelS3(params: ListObjectsRequest, keysList: string[]): Promise<string[]> {
    const data = await this.s3.send(new ListObjectsCommand(params));
  
    if (data.$metadata.httpStatusCode != httpStatus.OK) {
      throw new Error("Didn't get status code 200 when tried to read the model in S3 ");
    }
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
  }
}
