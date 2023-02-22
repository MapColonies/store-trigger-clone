import httpStatus from 'http-status-codes';
import { FSProvider } from '../../../../src/common/providers/fSProvider';
import { AppError } from '../../../../src/common/appError';

describe('FSProvider', () => {
  let provider: FSProvider;

  beforeEach(() => {
    provider = new FSProvider();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('#list files', () => {
    it('returns all the files of the model if the model exists in the agreed folder', () => {
      const model = 'model1';
      const expected: string[] = ['a.txt', 'b.txt'];

      const result = provider.listFiles(model);

      expect(result).toStrictEqual(expected);
    });

    it('returns error string when model is not in the agreed folder', () => {
      const model = 'bla';

      const result = provider.listFiles(model);

      expect(result).toThrow(new AppError('', httpStatus.BAD_REQUEST, `Model ${model} doesn't exists in the agreed folder`, true));
    });
  });
});
