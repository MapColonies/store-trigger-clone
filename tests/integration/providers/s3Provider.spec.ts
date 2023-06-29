import fs from 'fs';
import os from 'os';
import config from 'config';
import jsLogger from '@map-colonies/js-logger';
import { container } from 'tsyringe';
import { AppError } from '../../../src/common/appError';
import { S3Provider } from '../../../src/providers/s3Provider';
import { getApp } from '../../../src/app';
import { SERVICES } from '../../../src/common/constants';
import { IS3Config } from '../../../src/common/interfaces';
import { S3Helper } from '../../helpers/s3Helper';

describe('S3Provider tests', () => {
  let provider: S3Provider;
  let s3Helper: S3Helper;
  let model: string;

  const queueFilePath = `${os.tmpdir()}/${config.get<string>('ingestion.queueFilePath')}`;
  const s3Config = config.get<IS3Config>('S3');

  beforeAll(async () => {
    getApp({
      override: [
        { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
        { token: SERVICES.PROVIDER_CONFIG, provider: { useValue: s3Config } },
        // { token: SERVICES.QUEUE_FILE_HANDLER, provider: { useValue: queueFileHandlerMock } },
      ],
    });
    provider = container.resolve(S3Provider);
    s3Helper = container.resolve(S3Helper);
   
    await s3Helper.createBucket();
  });
  
  beforeEach(async () => {
    fs.truncateSync(queueFilePath, 0);
    model = await s3Helper.createModel();
  });
  
  afterEach(async () => {
    jest.clearAllMocks();
    await s3Helper.deleteModel(model);
  });

  afterAll(async () => {
    await s3Helper.deleteBucket();
  })
  
  describe('streamModelPathsToQueueFile', () => {
    it.only('returns all the files from S3', async () => {
      const expected = `${model}/file1\n${model}/file2\n`;

      await provider.streamModelPathsToQueueFile(model);
      const result = fs.readFileSync(queueFilePath, 'utf-8');

      expect(result).toStrictEqual(expected);
    });

    it('returns error string when model is not in the agreed folder', async () => {
      const model = 'bla';

      await expect(provider.streamModelPathsToQueueFile(model)).rejects.toThrow(AppError);
    });
  });
});
