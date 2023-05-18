import { ICreateTaskBody, OperationStatus } from '@map-colonies/mc-priority-queue';
import { randNumber } from '@ngneat/falso';
import httpStatus from 'http-status-codes';
import { container } from 'tsyringe';
import { getApp } from '../../../../src/app';
import { AppError } from '../../../../src/common/appError';
import { SERVICES } from '../../../../src/common/constants';
import { CreateJobBody, IIngestionResponse, ITaskParameters, Payload } from '../../../../src/common/interfaces';
import { IngestionManager } from '../../../../src/ingestion/models/ingestionManager';
import {
  configProviderMock,
  createBatch,
  createJobPayload,
  createFakeTasks,
  createPayload,
  createFakeTask,
  createUuid,
  jobManagerClientMock,
  queueFileHandlerMock,
  createFile,
  getTaskType,
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
      const tasks = createFakeTasks();
      queueFileHandlerMock.initialize.mockResolvedValue('');
      configProviderMock.streamModelPathsToQueueFile.mockResolvedValue('');
      jest.spyOn(ingestionManager as any, 'createTasks').mockResolvedValue(tasks);
      jest.spyOn(ingestionManager as any, 'createTasksForJob').mockResolvedValue('');
      queueFileHandlerMock.emptyQueueFile.mockResolvedValue('');

      // Act
      const response = await ingestionManager.createModel(payload, jobId);

      //Assert
      expect(response).toBeUndefined();
    });

    it('rejects if one of the services fails', async () => {
      // Arrange
      const jobId = createUuid();
      queueFileHandlerMock.initialize.mockResolvedValue('');
      configProviderMock.streamModelPathsToQueueFile.mockRejectedValue(new AppError(httpStatus.INTERNAL_SERVER_ERROR, '', true));

      // Act && Assert
      await expect(ingestionManager.createModel(payload, jobId)).rejects.toThrow(AppError);
    });
  });

  describe('isFileInBlackList tests', () => {
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

  describe('createTasksForJob Function', () => {
    it('resolves without error when jobManager is ok', async () => {
      // Arrange
      const jobID = createUuid();
      const tasks = createFakeTasks();
      jobManagerClientMock.createTaskForJob.mockResolvedValue('');

      // Act
      const response = await ingestionManager['createTasksForJob'](jobID, tasks);

      //Assert
      expect(response).toBeUndefined();
    });

    it('rejects if there is a problem with jobManager', async () => {
      // Arrange
      const jobID = createUuid();
      const tasks = createFakeTasks();
      jobManagerClientMock.createTaskForJob.mockRejectedValue(new AppError(httpStatus.INTERNAL_SERVER_ERROR, '', true));

      // Act && Assert
      await expect(ingestionManager['createTasksForJob'](jobID, tasks)).rejects.toThrow(AppError);
    });
  });

  describe('createTasks Function', () => {
    it('creates tasks with paths in length of batch size', () => {
      // Arrange
      const batchSize = createBatch({ min: 1, max: 5 });
      const modelId = createUuid();
      const filesAmount = randNumber({ min: 1, max: 8 });
      for (let i = 0; i < filesAmount; i++) {
        queueFileHandlerMock.readline.mockReturnValueOnce(createFile());
      }
      queueFileHandlerMock.readline.mockReturnValueOnce(null);
      jest.spyOn(ingestionManager as any, 'buildTaskFromChunk').mockReturnValue(createFakeTask());

      // Act
      const response = ingestionManager['createTasks'](batchSize, modelId);

      //Assert
      expect(response).toEqual(expect.objectContaining<ICreateTaskBody<ITaskParameters>[]>([]));
      expect(response).toHaveLength(Math.ceil(filesAmount / batchSize));
    });
  });

  describe('buildTaskFromChunk Function', () => {
    it('creates tasks array of paths', () => {
      // Arrange
      const paths = [createFile(), createFile(), createFile()];
      const modelId = createUuid();
      const tasks: ICreateTaskBody<ITaskParameters> = {
        type: getTaskType(),
        parameters: { paths, modelId },
      };

      // Act
      const response = ingestionManager['buildTaskFromChunk'](paths, modelId);

      //Assert
      expect(response).toStrictEqual(tasks);
    });
  });
});
