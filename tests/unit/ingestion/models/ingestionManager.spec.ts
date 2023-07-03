import jsLogger from '@map-colonies/js-logger';
import { OperationStatus } from '@map-colonies/mc-priority-queue';
import { randNumber } from '@ngneat/falso';
import httpStatus from 'http-status-codes';
import { container } from 'tsyringe';
import { getApp } from '../../../../src/app';
import { AppError } from '../../../../src/common/appError';
import { SERVICES } from '../../../../src/common/constants';
import { CreateJobBody, IIngestionResponse, Payload } from '../../../../src/common/interfaces';
import { IngestionManager } from '../../../../src/ingestion/models/ingestionManager';
import {
  configProviderMock,
  createJobPayload,
  createPayload,
  createUuid,
  jobManagerClientMock,
  queueFileHandlerMock,
  createFile,
  createJobParameters,
} from '../../../helpers/mockCreator';

let ingestionManager: IngestionManager;
let payload: Payload;
let jobPayload: CreateJobBody;

describe('ingestionManager', () => {
  beforeEach(() => {
    payload = createPayload('model');
    jobPayload = createJobPayload(payload);

    getApp({
      override: [
        { token: SERVICES.QUEUE_FILE_HANDLER, provider: { useValue: queueFileHandlerMock } },
        { token: SERVICES.JOB_MANAGER_CLIENT, provider: { useValue: jobManagerClientMock } },
        { token: SERVICES.PROVIDER, provider: { useValue: configProviderMock } },
        { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
      ],
    });

    ingestionManager = container.resolve(IngestionManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createJob Service', () => {
    it('returns create job response', async () => {
      // Arrange
      const response: IIngestionResponse = {
        jobID: '1234',
        status: OperationStatus.IN_PROGRESS,
      };
      jobManagerClientMock.createJob.mockResolvedValue({ id: '1234', status: OperationStatus.IN_PROGRESS });
      // Act
      const modelResponse = await ingestionManager.createJob(jobPayload);
      //Assert
      expect(modelResponse).toMatchObject(response);
    });

    it('rejects if jobManager fails', async () => {
      // Arrange
      jobManagerClientMock.createJob.mockRejectedValue(new AppError(httpStatus.INTERNAL_SERVER_ERROR, '', true));
      // Act && Assert
      await expect(ingestionManager.createJob(jobPayload)).rejects.toThrow(AppError);
    });
  });

  describe('createModel Service', () => {
    it('resolves without error when everything is ok', async () => {
      // Arrange
      const jobId = createUuid();
      const parameters = createJobParameters();
      const filesAmount = randNumber({ min: 1, max: 8 });
      queueFileHandlerMock.initialize.mockResolvedValue(undefined);
      configProviderMock.streamModelPathsToQueueFile.mockResolvedValue(filesAmount);
      for (let i = 0; i < filesAmount; i++) {
        queueFileHandlerMock.readline.mockReturnValueOnce(createFile());
      }
      queueFileHandlerMock.readline.mockReturnValueOnce(createFile(true));
      queueFileHandlerMock.readline.mockReturnValueOnce(null);
      jobManagerClientMock.getJob.mockResolvedValue({ parameters });
      jobManagerClientMock.updateJob.mockResolvedValue(undefined);
      queueFileHandlerMock.emptyQueueFile.mockResolvedValue(undefined);

      // Act
      const response = await ingestionManager.createModel(payload, jobId);

      //Assert
      expect(response).toBeUndefined();
    });

    it(`rejects if couldn't initialize queue file`, async () => {
      // Arrange
      const jobId = createUuid();
      queueFileHandlerMock.initialize.mockRejectedValue(new AppError(httpStatus.INTERNAL_SERVER_ERROR, '', true));

      // Act && Assert
      await expect(ingestionManager.createModel(payload, jobId)).rejects.toThrow(AppError);
    });

    it(`rejects if couldn't empty queue file`, async () => {
      // Arrange
      const jobId = createUuid();
      queueFileHandlerMock.emptyQueueFile.mockRejectedValue(new AppError(httpStatus.INTERNAL_SERVER_ERROR, '', true));

      // Act && Assert
      await expect(ingestionManager.createModel(payload, jobId)).rejects.toThrow(AppError);
    });

    it('rejects if the provider failed', async () => {
      // Arrange
      const jobId = createUuid();
      queueFileHandlerMock.initialize.mockResolvedValue(undefined);
      configProviderMock.streamModelPathsToQueueFile.mockRejectedValue(new AppError(httpStatus.INTERNAL_SERVER_ERROR, '', true));

      // Act && Assert
      await expect(ingestionManager.createModel(payload, jobId)).rejects.toThrow(AppError);
    });

    it(`rejects if couldn't read from queue file`, async () => {
      // Arrange
      const jobId = createUuid();
      const filesAmount = randNumber({ min: 1, max: 8 });
      queueFileHandlerMock.initialize.mockResolvedValue(undefined);
      configProviderMock.streamModelPathsToQueueFile.mockResolvedValue(filesAmount);
      queueFileHandlerMock.readline.mockImplementation(() => {
        throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, '', true);
      });
      queueFileHandlerMock.emptyQueueFile.mockResolvedValue(undefined);

      // Act && Assert
      await expect(ingestionManager.createModel(payload, jobId)).rejects.toThrow(AppError);
    });

    it('rejects if there is a problem with job manager', async () => {
      // Arrange
      const jobId = createUuid();
      const filesAmount = randNumber({ min: 1, max: 8 });
      queueFileHandlerMock.initialize.mockResolvedValue(undefined);
      configProviderMock.streamModelPathsToQueueFile.mockResolvedValue(filesAmount);
      for (let i = 0; i < filesAmount; i++) {
        queueFileHandlerMock.readline.mockReturnValueOnce(createFile());
      }
      queueFileHandlerMock.readline.mockReturnValueOnce(null);
      jobManagerClientMock.getJob.mockRejectedValue(new AppError(httpStatus.INTERNAL_SERVER_ERROR, '', true));
      queueFileHandlerMock.emptyQueueFile.mockResolvedValue(undefined);

      // Act && Assert
      await expect(ingestionManager.createModel(payload, jobId)).rejects.toThrow(AppError);
    });
  });
});
