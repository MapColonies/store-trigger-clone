import jsLogger from '@map-colonies/js-logger';
import { OperationStatus } from '@map-colonies/mc-priority-queue';
import config from 'config';
import httpStatus from 'http-status-codes';
import { JobManagerWrapper } from '../../../../src/clients/jobManagerWrapper';
import { AppError } from '../../../../src/common/appError';
import { IConfig, IIngestionResponse, IProvider, Payload } from '../../../../src/common/interfaces';
import { QueueFileHandler } from '../../../../src/handlers/queueFileHandler';
import { IngestionManager } from '../../../../src/ingestion/models/ingestionManager';
import { createPayload } from '../../../helpers/mockCreator';

let ingestionManager: IngestionManager;
let payload: Payload;

describe('ingestionManager', () => {
  const jobsManagerMock = {
    create: jest.fn(),
  };

  const configProviderMock = {
    listFiles: jest.fn(),
  };

  const queueFileHandlerMock = {
    emptyQueueFile: jest.fn(),
  }

  beforeAll(() => {
    payload = createPayload('model1');
    ingestionManager = new IngestionManager(jsLogger({ enabled: false }),
      config as IConfig,
      jobsManagerMock as unknown as JobManagerWrapper,
      configProviderMock as unknown as IProvider,
      queueFileHandlerMock as unknown as QueueFileHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('#createModel', () => {
    it('returns create model response', async () => {
      const response: IIngestionResponse = {
        jobID: '1234',
        status: OperationStatus.IN_PROGRESS,
      };

      configProviderMock.listFiles.mockResolvedValue(undefined);
      jobsManagerMock.create.mockResolvedValue(response);

      const modelResponse = await ingestionManager.createModel(payload)

      expect(modelResponse).toMatchObject(response);
    });

    it('rejects if listFiles fails', async () => {
      configProviderMock.listFiles.mockRejectedValue(new AppError(httpStatus.INTERNAL_SERVER_ERROR, '', true));

      await expect(ingestionManager.createModel(payload)).rejects.toThrow(AppError);
    });

    it('rejects if jobManager fails', async () => {
      configProviderMock.listFiles.mockResolvedValue(undefined);
      jobsManagerMock.create.mockRejectedValue(new AppError(httpStatus.INTERNAL_SERVER_ERROR, '', true));

      await expect(ingestionManager.createModel(payload)).rejects.toThrow(AppError);
    });
  });
});
