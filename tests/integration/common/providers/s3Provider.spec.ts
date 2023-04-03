import fs from 'fs';
import { ListObjectsCommand } from '@aws-sdk/client-s3';
import config from 'config';
import { container } from 'tsyringe';
import { getApp } from '../../../../src/app';
import { AppError } from '../../../../src/common/appError';
import { S3Provider } from '../../../../src/common/providers/s3Provider';
import { s3EmptyOutput, s3Mock, s3Output } from '../../../helpers/mockCreator';

describe('S3Provider', () => {
  let provider: S3Provider;
  const queueFile = config.get<string>('ingestion.queueFilePath');

  beforeAll(() => {
    getApp();
    provider = container.resolve(S3Provider);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('#list files', () => {
    beforeEach(() => {
      fs.truncateSync(queueFile, 0);
    });

    it('returns all the files from S3', async () => {
      const model = 'model1';
      const expected = `${model}/file1\n${model}/file2\n`;
      s3Mock.on(ListObjectsCommand).resolves(s3Output);

      await provider.streamModelPathsToQueueFile(model);
      const result = fs.readFileSync(queueFile, 'utf-8');

      expect(result).toStrictEqual(expected);
    });

    it('returns error string when model is not in the agreed folder', async () => {
      const model = 'bla';
      s3Mock.on(ListObjectsCommand).resolves(s3EmptyOutput);

      await expect(provider.streamModelPathsToQueueFile(model)).rejects.toThrow(AppError);
    });
  });
});
