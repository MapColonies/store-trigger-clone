import jsLogger from '@map-colonies/js-logger';
import { ICreateTaskBody, OperationStatus } from '@map-colonies/mc-priority-queue';
import { JobManagerWrapper } from '../../../src/clients/jobManagerWrapper';
import { CreateJobBody, ITaskParameters } from '../../../src/common/interfaces';
import { createJobParameters, createUuid } from '../../helpers/helpers';

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
        parameters: createJobParameters(),
      };
      jobsManagerMock.createJob.mockResolvedValue(job);

      const created = await jobManagerWrapper.create(job);

      expect(created).toHaveProperty('jobID');
      expect(created).toHaveProperty('status');
      expect(created.status).toBe(OperationStatus.IN_PROGRESS);
    });

    it(`should return an error when jobService is not avaliable`, async () => {
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
        parameters: createJobParameters(),
      };
      jobsManagerMock.createJob.mockRejectedValue(new Error('Job Service is not avaliable'));

      await expect(jobManagerWrapper.create(job)).rejects.toThrow('Job Service is not avaliable');
    });
  });
});
