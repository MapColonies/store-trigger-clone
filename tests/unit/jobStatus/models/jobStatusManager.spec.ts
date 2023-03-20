import jsLogger from '@map-colonies/js-logger';
import { OperationStatus } from '@map-colonies/mc-priority-queue';
import httpStatus from 'http-status-codes';
import { AppError } from '../../../../src/common/appError';
import { IJobStatusResponse } from '../../../../src/common/interfaces';
import { JobStatusManager } from '../../../../src/jobStatus/models/jobStatusManager';

let jobStatusManager: JobStatusManager;

describe('jobStatusManager', () => {
  const jobsManagerMock = {
    getJob: jest.fn(),
  };

  beforeEach(() => {
    // TODO: make it work with dependency injection
    jobStatusManager = new JobStatusManager(jsLogger({ enabled: false }), jobsManagerMock as never);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('#checkStatus', () => {
    it('return job status manager', async function () {
      // Arrange
      const jobId = '123';
      const expectedResponse: IJobStatusResponse = {
        percentage: 100,
        status: OperationStatus.COMPLETED,
      };
      jest.spyOn(jobStatusManager, "checkStatus").mockResolvedValue(expectedResponse);

      // Act
      const response = jobStatusManager.checkStatus(jobId);

      // Assert
      await expect(response).resolves.toStrictEqual(expectedResponse);
    });

    it(`rejects if job id doesn't exists`, async function () {
      // Arrange
      const jobId = '123';
      jobsManagerMock.getJob.mockResolvedValue(undefined);

      // Act + Assert
      await expect(jobStatusManager.checkStatus(jobId)).rejects.toThrow(new AppError('', httpStatus.NOT_FOUND, 'The Job ID is not exists!', true));
    });

    it('rejects if jobManager fails', async () => {
      // Arrange
      const jobId = '123';
      jobsManagerMock.getJob.mockRejectedValue(new AppError('', httpStatus.INTERNAL_SERVER_ERROR, '', true));

      // Act + Assert
      await expect(jobStatusManager.checkStatus(jobId)).rejects.toThrow(AppError);
    });
  });
});
