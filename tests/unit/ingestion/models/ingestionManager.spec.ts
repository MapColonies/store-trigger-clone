import { OperationStatus } from '@map-colonies/mc-priority-queue';
import httpStatus from 'http-status-codes';
import { container } from 'tsyringe';
import { getApp } from '../../../../src/app';
import { AppError } from '../../../../src/common/appError';
import { SERVICES } from '../../../../src/common/constants';
import { CreateJobBody, IIngestionResponse, Payload } from '../../../../src/common/interfaces';
import { QueueFileHandler } from '../../../../src/handlers/queueFileHandler';
import { IngestionManager } from '../../../../src/ingestion/models/ingestionManager';
import { createJobPayload, createPayload, createUuid, queueFileHandlerMock } from '../../../helpers/mockCreator';

let ingestionManager: IngestionManager;
let payload: Payload;
let jobPayload: CreateJobBody;

describe('ingestionManager', () => {
  const jobManagerClientMock = {
    createJob: jest.fn(),
  };

  const configProviderMock = {
    streamModelPathsToQueueFile: jest.fn(),
  };

  beforeAll(() => {
    payload = createPayload('model');
    jobPayload = createJobPayload(payload);

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

  describe('#createJob', () => {
    it('returns create job response', async () => {
      const response: IIngestionResponse = {
        jobID: '1234',
        status: OperationStatus.IN_PROGRESS,
      };

      configProviderMock.streamModelPathsToQueueFile.mockResolvedValue(undefined);
      jobManagerClientMock.createJob.mockResolvedValue({ id: '1234', status: OperationStatus.IN_PROGRESS });

      const modelResponse = await ingestionManager.createJob(jobPayload);

      expect(modelResponse).toMatchObject(response);
    });

    it('rejects if jobManager fails', async () => {
      configProviderMock.streamModelPathsToQueueFile.mockResolvedValue(undefined);
      jobManagerClientMock.createJob.mockRejectedValue(new AppError(httpStatus.INTERNAL_SERVER_ERROR, '', true));

      await expect(ingestionManager.createJob(jobPayload)).rejects.toThrow(AppError);
    });
  });

  describe('#createModel', () => {
    it('rejects if streamModelPathsToQueueFile fails', async () => {
      const jobId = createUuid();
      configProviderMock.streamModelPathsToQueueFile.mockRejectedValue(new AppError(httpStatus.INTERNAL_SERVER_ERROR, '', true));

      await expect(ingestionManager.createModel(payload, jobId)).rejects.toThrow(AppError);
    });
  });

  describe('isFileInBlackList tests', () =>{
    it('returns true if the file is in the black list', () => {
      const file = 'word.zip';

      const response = ingestionManager['isFileInBlackList'](file);

      expect(response).toBe(true);
    });

    it('returns false if the file is not in the black list', () => {
      const file = 'word.txt';

      const response = ingestionManager['isFileInBlackList'](file);

      expect(response).toBe(false);
    });
  });
});
