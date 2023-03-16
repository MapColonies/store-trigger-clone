import fs from 'fs';
import config from 'config';
import jsLogger from '@map-colonies/js-logger';
import { ICreateTaskBody, OperationStatus } from '@map-colonies/mc-priority-queue';
import { JobManagerWrapper } from '../../../src/clients/jobManagerWrapper';
import { CreateJobBody, ITaskParameters } from '../../../src/common/interfaces';
import { createJobParameters, createUuid } from '../../helpers/helpers';

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
    const queueFile = config.get<string>('ingestion.queueFile');

    it(`should return the ingestion's response`, async () => {
      const modelId = createUuid();
      const tasks: ICreateTaskBody<ITaskParameters>[] = [
        {
          parameters: { paths: ['a', 'b'], modelId: modelId },
        },
      ];
      const job: CreateJobBody = {
        tasks: tasks,
        resourceId: modelId,
        version: 's',
        type: 'bla',
        parameters: createJobParameters(),
      };
      utilitiesMock.filesToTasks.mockReturnValue(tasks);
      jobsManagerMock.createJob.mockResolvedValue(job);
      fs.writeFileSync(queueFile, 'a\nf', { encoding: 'utf8', flag: 'w' });

      const created = await jobManagerWrapper.create(job);

      expect(created).toHaveProperty('jobID');
      expect(created).toHaveProperty('status');
      expect(created.status).toBe(OperationStatus.IN_PROGRESS);
    });
  });
});
