import jsLogger from '@map-colonies/js-logger';
import { ICreateTaskBody, OperationStatus } from '@map-colonies/mc-priority-queue';
import { JobManagerWrapper } from '../../../src/clients/jobManagerWrapper';
import { CreateJobBody, ITaskParameters } from '../../../src/common/interfaces';
import { QueueFileHandler } from '../../../src/handlers/queueFileHandler';
import { createJobParameters } from '../../helpers/mockCreator';

describe('jobManagerWrapper', () => {
  let jobManagerWrapper: JobManagerWrapper;

  const queueFileHandlerMock = {
    readline: jest.fn(),
  }

  beforeAll(() => {
    jobManagerWrapper = new JobManagerWrapper(jsLogger({ enabled: false }),
      queueFileHandlerMock as never as QueueFileHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it(`returns a job ID and IN_PROGRESS status`, async () => {
      const modelId = 'model1';
      const tasks: ICreateTaskBody<ITaskParameters>[] = [{
        parameters: { paths: ['filePath1', 'filePath2', 'filePath3'], modelId: modelId, }, type: "Ingestion"
      }];
      const jobParams: CreateJobBody = { resourceId: modelId, version: 's', type: 'bla', tasks, parameters: createJobParameters() };
      const jobExpectedResponse = { jobID: "1", status: OperationStatus.IN_PROGRESS };
      const createJobMockResponse = { id: "1", status: OperationStatus.IN_PROGRESS };


      jobManagerWrapper.createJob = jest.fn().mockReturnValue(createJobMockResponse);
      queueFileHandlerMock.readline.mockReturnValueOnce("filePath1");
      queueFileHandlerMock.readline.mockReturnValueOnce("filePath2");
      queueFileHandlerMock.readline.mockReturnValueOnce("filePath3");
      queueFileHandlerMock.readline.mockReturnValue(null);
      const jobResponse = await jobManagerWrapper.create(jobParams);

      expect(jobResponse).toHaveProperty('jobID');
      expect(jobResponse).toHaveProperty('status');
      expect(jobResponse.status).toBe(OperationStatus.IN_PROGRESS);
      expect(jobResponse).toEqual(jobExpectedResponse);
    });
  });

  describe('createTasks', () => {
    it(`returns a tasks array from queue path file`, () => {
      const modelId = 'modelId1';
      const batchSize = 3;
      const expectedTasks: ICreateTaskBody<ITaskParameters>[] = [{
        parameters: { paths: ['filePath1', 'filePath2', 'filePath3'], modelId: modelId, }, type: "Ingestion"
      }];

      queueFileHandlerMock.readline.mockReturnValueOnce("filePath1");
      queueFileHandlerMock.readline.mockReturnValueOnce("filePath2");
      queueFileHandlerMock.readline.mockReturnValueOnce("filePath3");
      queueFileHandlerMock.readline.mockReturnValue(null);
      const tasks: ICreateTaskBody<ITaskParameters>[] = jobManagerWrapper.createTasks(batchSize, modelId);

      expect(expectedTasks).toEqual(tasks);
    });
  });
});
