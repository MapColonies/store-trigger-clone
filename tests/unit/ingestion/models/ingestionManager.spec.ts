import { OperationStatus } from '@map-colonies/mc-priority-queue';
import httpStatus from 'http-status-codes';
import { container } from 'tsyringe';
import { getApp } from '../../../../src/app';
import { AppError } from '../../../../src/common/appError';
import { SERVICES } from '../../../../src/common/constants';
import { IIngestionResponse, Payload } from '../../../../src/common/interfaces';
import { QueueFileHandler } from '../../../../src/handlers/queueFileHandler';
import { IngestionManager } from '../../../../src/ingestion/models/ingestionManager';
import { createPayload, queueFileHandlerMock } from '../../../helpers/mockCreator';

let ingestionManager: IngestionManager;
let payload: Payload;

describe('ingestionManager', () => {
  const jobManagerClientMock = {
    createJob: jest.fn(),
  };

  const configProviderMock = {
    streamModelPathsToQueueFile: jest.fn(),
  };

  beforeAll(() => {
    payload = createPayload('model1');
    getApp({
      override: [
        { token: QueueFileHandler, provider: { useValue: queueFileHandlerMock } },
        { token: SERVICES.JOB_MANAGER_CLIENT, provider: { useValue: jobManagerClientMock } },
        { token: SERVICES.PROVIDER, provider: { useValue: configProviderMock } },
      ],
    });

    ingestionManager = container.resolve(IngestionManager);
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

      configProviderMock.streamModelPathsToQueueFile.mockResolvedValue(undefined);
      jobManagerClientMock.createJob.mockResolvedValue({ id: '1234', status: OperationStatus.IN_PROGRESS });

      const modelResponse = await ingestionManager.createModel(payload);

      expect(modelResponse).toMatchObject(response);
    });

    it('rejects if streamModelPathsToQueueFile fails', async () => {
      configProviderMock.streamModelPathsToQueueFile.mockRejectedValue(new AppError(httpStatus.INTERNAL_SERVER_ERROR, '', true));

      await expect(ingestionManager.createModel(payload)).rejects.toThrow(AppError);
    });

    it('rejects if jobManager fails', async () => {
      configProviderMock.streamModelPathsToQueueFile.mockResolvedValue(undefined);
      jobManagerClientMock.createJob.mockRejectedValue(new AppError(httpStatus.INTERNAL_SERVER_ERROR, '', true));

      await expect(ingestionManager.createModel(payload)).rejects.toThrow(AppError);
    });
  });
});
