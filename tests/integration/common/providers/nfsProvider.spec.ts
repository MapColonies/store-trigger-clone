import fs from 'fs';
import config from 'config';
import { container } from 'tsyringe';
import { getApp } from '../../../../src/app';
import { SERVICES } from '../../../../src/common/constants';
import { NFSProvider } from '../../../../src/common/providers/nfsProvider';

describe('FSProvider', () => {
  let provider: NFSProvider;
  const queueFile = config.get<string>('ingestion.queueFilePath');
  const nfsConfig = config.get<string>('NFS');

  beforeEach(() => {
    getApp({
      override: [{ token: SERVICES.PROVIDER_CONFIG, provider: { useValue: nfsConfig } }],
    });
    provider = container.resolve(NFSProvider);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('#list files', () => {
    beforeEach(() => {
      fs.truncateSync(queueFile, 0);
    });
    it('returns all the files of the model if the model exists in the agreed folder', async () => {
      const model = 'model1';
      const expected = `${model}/a.txt\n${model}/b.txt\n`;

      await provider.streamModelPathsToQueueFile(model);
      const result = fs.readFileSync(queueFile, 'utf-8');

      expect(result).toStrictEqual(expected);
    });

    it('returns error string when model is not in the agreed folder', async () => {
      const model = 'bla';

      const result = async () => {
        await provider.streamModelPathsToQueueFile(model);
      };

      await expect(result).rejects.toThrow(`Model bla doesn't exists in the agreed folder`);
    });
  });
});
