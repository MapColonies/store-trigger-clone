import fs from 'fs';
import os from 'os';
import config from 'config';
import { container } from 'tsyringe';
import httpStatus from 'http-status-codes';
import jsLogger from '@map-colonies/js-logger';
import { getApp } from '../../../src/app';
import { NFSProvider } from '../../../src/providers/nfsProvider';
import { SERVICES } from '../../../src/common/constants';
import { INFSConfig } from '../../../src/common/interfaces';
import { AppError } from '../../../src/common/appError';
import { queueFileHandlerMock } from '../../helpers/mockCreator';

describe('NFSProvider tests', () => {
  let provider: NFSProvider;
  const queueFilePath = `${os.tmpdir()}/${config.get<string>('ingestion.queueFilePath')}`;
  const nfsConfig = config.get<INFSConfig>('NFS');

  beforeAll(() => {
    getApp({
      override: [
        { token: SERVICES.PROVIDER_CONFIG, provider: { useValue: nfsConfig } },
        { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
      ],
    });
    provider = container.resolve(NFSProvider);
  });

  beforeEach(() => {
    fs.truncateSync(queueFilePath, 0);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('streamModelPathsToQueueFile Function', () => {
    it('if the model exists in the agreed folder, returns all the file paths of the model', async () => {
      const model = 'model1';
      const expected = `${model}/b.txt\n${model}/folder/a.txt\n`;

      await provider.streamModelPathsToQueueFile(model);
      const result = fs.readFileSync(queueFilePath, 'utf-8');

      expect(result).toStrictEqual(expected);
    });

    it('if the model does not exists in the agreed folder, throws error', async () => {
      const model = 'bla';

      const result = async () => {
        await provider.streamModelPathsToQueueFile(model);
      };

      await expect(result).rejects.toThrow(AppError);
    });

    it('if queue file handler does not work, throws error', async () => {
      getApp({
        override: [
          { token: SERVICES.PROVIDER_CONFIG, provider: { useValue: nfsConfig } },
          { token: SERVICES.QUEUE_FILE_HANDLER, provider: { useValue: queueFileHandlerMock } },
          { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
        ],
      });
      provider = container.resolve(NFSProvider);

      const model = 'model1';
      queueFileHandlerMock.writeFileNameToQueueFile.mockRejectedValue(new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'queueFileHandler', false));

      const result = async () => {
        await provider.streamModelPathsToQueueFile(model);
      };

      await expect(result).rejects.toThrow(AppError);
    });
  });
});
