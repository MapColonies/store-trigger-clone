import { OperationStatus } from '@map-colonies/mc-priority-queue';
import httpStatusCodes from 'http-status-codes';
import mockAxios from 'jest-mock-axios';
import { getApp } from '../../../src/app';
import { JobStatusRequestSender } from './helpers/requestSender';

describe('jobStatusController', function () {
  let requestSender: JobStatusRequestSender;
  const jobManagerClientMock = {
    getJob: jest.fn(),
  };

  beforeEach(function () {
    const app = getApp();
    requestSender = new JobStatusRequestSender(app);
  });

  afterEach(function () {
    mockAxios.reset();
  });

  describe('GET /checkStatus', function () {
    describe('Happy Path', function () {
      it('should return 200 status code and the job status and percentage', async function () {
        const jobId = '1234';
        jobManagerClientMock.getJob.mockResolvedValue({ percentage: 100, status: OperationStatus.COMPLETED });

        const response = await requestSender.checkStatus(jobId);

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toHaveProperty('status', OperationStatus.COMPLETED);
        expect(response.body).toHaveProperty('percentage', 100);
      });
    });

    describe('Bad Path', function () {
      // All requests with status code of 400
    });

    describe('Sad Path', function () {
      it('should return 404 status code if job id not exists', async function () {
        const jobId = '1234';
        mockAxios.post.mockResolvedValue(undefined);

        const response = await requestSender.checkStatus(jobId);

        expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
        expect(response.body).toHaveProperty('message', 'The Job ID is not exists!');
      });

      it('should return 500 status code if job manager is unavailable', async function () {
        const jobId = '1234';
        mockAxios.post.mockRejectedValueOnce(new Error('JobManager is not avaliable'));

        const response = await requestSender.checkStatus(jobId);

        expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(response.body).toHaveProperty('message', 'JobManager is not available');
      });
    });
  });
});
