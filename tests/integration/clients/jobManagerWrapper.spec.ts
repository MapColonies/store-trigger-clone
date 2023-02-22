import jsLogger from '@map-colonies/js-logger';
import { ICreateTaskBody, OperationStatus } from '@map-colonies/mc-priority-queue';
import { JobManagerWrapper } from '../../../src/clients/jobManagerWrapper';
import { CreateJobBody, IIngestionResponse, ITaskParameters } from '../../../src/common/interfaces';
import { createMetadata, createUuid } from '../../helpers/helpers';

describe('jobManagerWrapper', () => {
  let jobManagerWrapper: JobManagerWrapper;

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
          parameters: { paths: ['a'], modelId },
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
      jobsManagerMock.createJob.mockResolvedValue(job);

      const created = await jobManagerWrapper.create(job, files, modelId);

      expect(created).toMatchObject(res);
    });

    it(`should return an error when jobService is not avaliable`, async () => {
      const files = ['a'];
      const modelId = createUuid();
      const tasks: ICreateTaskBody<ITaskParameters>[] = [
        {
          parameters: { paths: ['a'], modelId },
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
      jobsManagerMock.createJob.mockRejectedValue(new Error('Job Service is not avaliable'));

      const created = await jobManagerWrapper.create(job, files, modelId);

      expect(created).toThrow('Job Service is not avaliable');
    });
  });
});
