import jsLogger from '@map-colonies/js-logger';
import { ICreateTaskBody, OperationStatus } from '@map-colonies/mc-priority-queue';
import { JobManagerWrapper } from '../../../src/clients/jobManagerWrapper';
import { CreateJobBody, IIngestionResponse, ITaskParameters } from '../../../src/common/interfaces';
import { createMetadata, createUuid } from '../../helpers/helpers';

describe('jobManagerWrapper', () => {
  let jobManagerWrapper: JobManagerWrapper;

  const utilitiesMock = {
    filesToTasks: jest.fn(),
  };
  const jobsManagerMock = {
    createJob: jest.fn(),
  };

  beforeAll(() => {
    jobManagerWrapper = new JobManagerWrapper(jsLogger({ enabled: false }));
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create tests', () => {
    it(`should return the ingestion's response`, async () => {
      const files = ['a'];
      const modelId = createUuid();
      const tasks: ICreateTaskBody<ITaskParameters>[] = [
        {
          parameters: { paths: ['a', 'b'], modelId: modelId },
        },
      ];
      const job: CreateJobBody = {
        tasks: tasks,
        resourceId: 'bla',
        version: 's',
        type: 'bla',
        parameters: {
          metadata: createMetadata(),
        },
      };
      const res: IIngestionResponse = {
        jobID: '12',
        status: OperationStatus.IN_PROGRESS,
      };
      utilitiesMock.filesToTasks.mockReturnValue(tasks);
      jobsManagerMock.createJob.mockResolvedValue(job);

      const created = await jobManagerWrapper.create(job, files, modelId);

      expect(created).toMatchObject(res);
    });
  });
});
