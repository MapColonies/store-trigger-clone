import fs from 'fs';
import { ListObjectsCommand } from '@aws-sdk/client-s3';
import config from 'config';
import httpStatus from 'http-status-codes';
import { container } from 'tsyringe';
import { getApp } from '../../../../src/app';
import { AppError } from '../../../../src/common/appError';
import { S3Provider } from '../../../../src/common/providers/s3Provider';
import { s3Mock, s3Output } from '../../../helpers/mockCreator';

describe('S3Provider', () => {
  let provider: S3Provider;
  const queueFile = config.get<string>('ingestion.queueFileName');

  beforeAll(() => {
    getApp();
    provider = container.resolve(S3Provider);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('#list files', () => {
    it.only('returns all the files from S3', async () => {
      const model = 'model1';
      const expected: string[] = ['a.txt', 'b.txt'];
      s3Mock.on(ListObjectsCommand).resolves(s3Output);

      await provider.streamModelPathsToQueueFile(model);
      const result = fs.readFileSync(queueFile, 'utf-8');

      expect(result).toStrictEqual(expected);
    });

    it('returns error string when model is not in the agreed folder', async () => {
      const model = 'bla';

      const result = await provider.streamModelPathsToQueueFile(model);

      expect(result).toThrow(
        new AppError(httpStatus.BAD_REQUEST, `Model ${model} doesn't exists in bucket ${config.get<string>('S3.bucket')}!`, true)
      );
    });
  });
});
