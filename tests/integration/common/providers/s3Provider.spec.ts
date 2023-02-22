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
    it('returns all the files from S3', () => {
      const model = 'model1';
      const expected: string[] = ['a.txt', 'b.txt'];

      const result = provider.listFiles(model);

      expect(result).toStrictEqual(expected);
    });

    it('returns error string when model is not in the agreed folder', () => {
      const model = 'bla';

      const result = provider.listFiles(model);

      expect(result).toThrow(
        new AppError('', httpStatus.BAD_REQUEST, `Model ${model} doesn't exists in bucket ${config.get<string>('S3.bucket')}!`, true)
      );
    });
  });
});
