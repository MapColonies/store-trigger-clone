import * as fs from 'fs';
import config from 'config';
import httpStatus from 'http-status-codes';
import { S3Provider } from '../../../../src/common/providers/s3Provider';
import { AppError } from '../../../../src/common/appError';

describe('S3Provider', () => {
  let provider: S3Provider;

  beforeEach(() => {
    provider = new S3Provider();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('#list files', () => {
    it('returns all the files from S3', async () => {
      const model = 'model1';
      const expected: string[] = ['a.txt', 'b.txt'];
      const queueFile = config.get<string>('ingestion.queueFile');

      await provider.listFiles(model);
      const result = fs.readFileSync(queueFile, 'utf-8');

      expect(result).toStrictEqual(expected);
    });

    it('returns error string when model is not in the agreed folder', async () => {
      const model = 'bla';

      const result = await provider.listFiles(model);

      expect(result).toThrow(
        new AppError(httpStatus.BAD_REQUEST, `Model ${model} doesn't exists in bucket ${config.get<string>('S3.bucket')}!`, true)
      );
    });
  });
});
