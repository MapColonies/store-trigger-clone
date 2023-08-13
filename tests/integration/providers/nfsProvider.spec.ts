import fs from 'fs';
import os from 'os';
import config from 'config';
import { container } from 'tsyringe';
import httpStatus from 'http-status-codes';
import jsLogger from '@map-colonies/js-logger';
import { getApp } from '../../../src/app';
import { NFSProvider } from '../../../src/providers/nfsProvider';
import { SERVICES } from '../../../src/common/constants';
import { NFSConfig } from '../../../src/common/interfaces';
import { AppError } from '../../../src/common/appError';
import { queueFileHandlerMock } from '../../helpers/mockCreator';
import { QueueFileHandler } from '../../../src/handlers/queueFileHandler';

describe('NFSProvider tests', () => {
  let provider: NFSProvider;
  let queueFileHandler: QueueFileHandler;
  const modelName = 'model1';
  const modelId = 'someId';
  const queueFilePath = os.tmpdir();
  const nfsConfig = config.get<NFSConfig>('NFS');

  beforeAll(() => {
    getApp({
      override: [
        { token: SERVICES.PROVIDER_CONFIG, provider: { useValue: nfsConfig } },
        { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
      ],
    });
    provider = container.resolve(NFSProvider);
    queueFileHandler = container.resolve(QueueFileHandler);
  });

  beforeEach(async () => {
    await queueFileHandler.createQueueFile(modelId);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await queueFileHandler.deleteQueueFile(modelId);
  });

  describe('streamModelPathsToQueueFile Function', () => {
    it('if the model exists in the agreed folder, returns all the file paths of the model', async () => {
      const expected = `${modelName}/b.txt\n${modelName}/folder/a.txt\n`;

      await provider.streamModelPathsToQueueFile(modelId, modelName);
      const result = fs.readFileSync(`${queueFilePath}/${modelId}`, 'utf-8');

      expect(result).toStrictEqual(expected);
    });

    it('if the model does not exists in the agreed folder, throws error', async () => {
      const modelName = 'bla';

      const result = async () => {
        await provider.streamModelPathsToQueueFile(modelId, modelName);
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

      queueFileHandlerMock.writeFileNameToQueueFile.mockRejectedValue(new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'queueFileHandler', false));

      const result = async () => {
        await provider.streamModelPathsToQueueFile(modelId, modelName);
      };

      await expect(result).rejects.toThrow(AppError);
    });
  });
});
