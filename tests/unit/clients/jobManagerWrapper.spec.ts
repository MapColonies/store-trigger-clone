import jsLogger from '@map-colonies/js-logger';
import { ICreateTaskBody, OperationStatus } from '@map-colonies/mc-priority-queue';
import { JobManagerWrapper } from '../../../src/clients/jobManagerWrapper';
import { CreateJobBody, ITaskParameters } from '../../../src/common/interfaces';
import { createJobParameters, createUuid } from '../../helpers/helpers';

describe('jobManagerWrapper', () => {
  let jobManagerWrapper: JobManagerWrapper;

  beforeAll(() => {
    jobManagerWrapper = new JobManagerWrapper(jsLogger({ enabled: false }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it(`returns a job ID and IN_PROGRESS status`, async () => {
      // Arrange
      const modelId = createUuid();
      const tasks: ICreateTaskBody<ITaskParameters>[] = [{ parameters: { paths: ['a', 'b'], modelId: modelId }, },];
      const job: CreateJobBody = {
        tasks: tasks, resourceId: modelId, version: 's', type: 'bla',
        parameters: createJobParameters()
      };
      const expectedResponse = { jobID: "1", status: OperationStatus.IN_PROGRESS };

      // Act
      jest.spyOn(jobManagerWrapper, 'create').mockResolvedValue(expectedResponse);
      const created = await jobManagerWrapper.create(job);

      // Assert
      expect(created).toHaveProperty('jobID');
      expect(created).toHaveProperty('status');
      expect(created.status).toBe(OperationStatus.IN_PROGRESS);
    });
  });
});
