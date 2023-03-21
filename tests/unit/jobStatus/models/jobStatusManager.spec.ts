import jsLogger from '@map-colonies/js-logger';
import { OperationStatus } from '@map-colonies/mc-priority-queue';
import httpStatus from 'http-status-codes';
import { JobManagerWrapper } from '../../../../src/clients/jobManagerWrapper';
import { AppError } from '../../../../src/common/appError';
import { IJobStatusResponse } from '../../../../src/common/interfaces';
import { JobStatusManager } from '../../../../src/jobStatus/models/jobStatusManager';

let jobStatusManager: JobStatusManager;

describe('jobStatusManager', () => {
  const jobManagerWrapperMock = {
    getJob: jest.fn(),
  }

  beforeAll(() => {
    jobStatusManager = new JobStatusManager(jsLogger({ enabled: false }),
      jobManagerWrapperMock as unknown as JobManagerWrapper);
  })

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('#checkStatus', () => {
    it('return job status manager', async function () {
      const jobId = '123';
      const expectedResponse: IJobStatusResponse = {
        percentage: 100,
        status: OperationStatus.COMPLETED,
      };
      jobManagerWrapperMock.getJob.mockResolvedValue(expectedResponse);

      const response = await jobStatusManager.checkStatus(jobId);

      expect(response).toMatchObject(expectedResponse);
    });

    it(`rejects if job id doesn't exists`, async function () {
      const jobId = '123';
      jobManagerWrapperMock.getJob.mockResolvedValue(undefined);

      await expect(jobStatusManager.checkStatus(jobId)).rejects.toThrow(new AppError('', httpStatus.NOT_FOUND, 'The Job ID is not exists!', true));
    });

    it('rejects if jobManager fails', async () => {
      const jobId = '123';
      jobManagerWrapperMock.getJob.mockRejectedValue(new AppError('', httpStatus.INTERNAL_SERVER_ERROR, '', true));

       await expect(jobStatusManager.checkStatus(jobId)).rejects.toThrow(AppError);
    });
  });
});

