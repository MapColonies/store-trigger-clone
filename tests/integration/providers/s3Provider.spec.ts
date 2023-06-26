import fs from 'fs';
import os from 'os';
import config from 'config';
import { ListObjectsCommand } from '@aws-sdk/client-s3';
import jsLogger from '@map-colonies/js-logger';
import { container } from 'tsyringe';
import { AppError } from '../../../src/common/appError';
import { S3Provider } from '../../../src/providers/s3Provider';
import { getApp } from '../../../src/app';
import { queueFileHandlerMock, s3EmptyOutput, s3Mock, s3Output } from '../../helpers/mockCreator';
import { SERVICES } from '../../../src/common/constants';
import { IS3Config } from '../../../src/common/interfaces';
import { S3Helper } from '../ingestion/helpers/s3Helper';

describe('S3Provider tests', () => {
  let provider: S3Provider;
  let s3Helper: S3Helper;

  const queueFilePath = `${os.tmpdir()}/${config.get<string>('ingestion.queueFilePath')}`;
  const s3Config = config.get<IS3Config>('S3');

  beforeAll(async () => {
    getApp({
      override: [
        { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
        { token: SERVICES.PROVIDER_CONFIG, provider: { useValue: s3Config } },
        { token: SERVICES.QUEUE_FILE_HANDLER, provider: { useValue: queueFileHandlerMock } },
      ],
    });
    provider = container.resolve(S3Provider);
    s3Helper = container.resolve(S3Helper);
   
    await s3Helper.createBucket();
    await s3Helper.createModel();
  });

  beforeEach(() => {
    fs.truncateSync(queueFilePath, 0);
  });

  afterEach(() => {
    jest.clearAllMocks();

  });

  describe('streamModelPathsToQueueFile', () => {
    it.only('returns all the files from S3', async () => {
      const model = 'model1';
      const expected = `${model}/file1\n${model}/file2\n`;
      s3Mock.on(ListObjectsCommand).resolvesOnce(s3Output);

      await provider.streamModelPathsToQueueFile(model);
      const result = fs.readFileSync(queueFilePath, 'utf-8');

      expect(result).toStrictEqual(expected);
    });

    it('returns error string when model is not in the agreed folder', async () => {
      const model = 'bla';
      s3Mock.on(ListObjectsCommand).resolvesOnce(s3EmptyOutput);

      await expect(provider.streamModelPathsToQueueFile(model)).rejects.toThrow(AppError);
    });
  });
});
