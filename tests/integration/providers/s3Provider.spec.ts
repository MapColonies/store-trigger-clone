import fs from 'fs';
import os from 'os';
import config from 'config';
import jsLogger from '@map-colonies/js-logger';
import { randNumber, randWord } from '@ngneat/falso';
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

  beforeEach(() => {
    fs.truncateSync(queueFilePath, 0);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await s3Helper.clearBucket();
    await s3Helper.deleteBucket();
    s3Helper.killS3();
  });

  describe('streamModelPathsToQueueFile', () => {
    it('returns all the files from S3', async () => {
      const model = randWord();
      const lengthOfFiles = randNumber({ min: 1, max: 5 });
      const expectedFiles: string[] = [];
      for (let i = 0; i < lengthOfFiles; i++) {
        const file = randWord();
        await s3Helper.createFileOfModel(model, file);
        expectedFiles.push(`${model}/${file}`);
      }
      await s3Helper.createFileOfModel(model, 'subDir/file');
      expectedFiles.push(`${model}/subDir/file`);

      await provider.streamModelPathsToQueueFile(model);
      const result = fs.readFileSync(queueFilePath, 'utf-8');

      for (const file of expectedFiles) {
        expect(result).toContain(file);
      }
    });

    it('returns error string when model is not in the agreed folder', async () => {
      await expect(provider.streamModelPathsToQueueFile('bla')).rejects.toThrow(AppError);
    });
  });
});
