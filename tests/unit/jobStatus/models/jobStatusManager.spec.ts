import jsLogger from '@map-colonies/js-logger';
import { OperationStatus } from '@map-colonies/mc-priority-queue';
import httpStatus from 'http-status-codes';
import { AppError } from '../../../../src/common/appError';
import { IJobStatusResponse } from '../../../../src/common/interfaces';
import { JobStatusManager } from '../../../../src/jobStatus/models/jobStatusManager';
import { createUuid } from '../../../helpers/helpers';

let jobStatusManager: JobStatusManager;

describe('jobStatusManager', () => {
  const jobsManagerMock = {
    getJob: jest.fn(),
  };

  beforeEach(function () {
    jobStatusManager = new JobStatusManager(jsLogger({ enabled: false }), jobsManagerMock as never);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('#checkStatus', () => {
    it('resolves without errors', async function () {
      const jobId = createUuid();
      const jobResponse: IJobStatusResponse = {
        percentage: 100,
        status: OperationStatus.COMPLETED,
      };
      jobsManagerMock.getJob.mockResolvedValue(jobResponse);

      const created: IJobStatusResponse = await jobStatusManager.checkStatus(jobId);

      expect(created).toStrictEqual(jobResponse);
    });

    it(`rejects if job id doesn't exists`, async function () {
      const jobId = createUuid();
      jobsManagerMock.getJob.mockResolvedValue(undefined);

      const created: IJobStatusResponse = await jobStatusManager.checkStatus(jobId);

      await expect(created).rejects.toThrow(new AppError('', httpStatus.NOT_FOUND, 'The Job ID is not exists!', true));
    });

    it('rejects if jobManager fails', async () => {
      const jobId = createUuid();
      jobsManagerMock.getJob.mockRejectedValue(new AppError('', httpStatus.INTERNAL_SERVER_ERROR, '', false));

      const created = await jobStatusManager.checkStatus(jobId);

      await expect(created).rejects.toThrow(AppError);
    });
  });
});
