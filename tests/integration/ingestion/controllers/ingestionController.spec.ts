// import fs from 'fs';
import { ListObjectsCommand } from '@aws-sdk/client-s3';
import { JobManagerClient, OperationStatus } from '@map-colonies/mc-priority-queue';
import config from 'config';
import httpStatusCodes from 'http-status-codes';
import { container } from 'tsyringe';
import { getApp } from '../../../../src/app';
import { createPayload, s3EmptyOutput, s3Mock, s3Output } from '../../../helpers/mockCreator';
import { IngestionRequestSender } from '../helpers/requestSender';

describe('ModelsController', function () {
  let requestSender: IngestionRequestSender;
  const jobManagerClientMock = {
    createJob: jest.fn(),
  };
  const bucket = config.get<string>('S3.bucket');
  
  beforeAll(function () {
    const app = getApp({
      override: [
        { token: JobManagerClient, provider: { useValue: jobManagerClientMock } },
      ]
    });

    requestSender = new IngestionRequestSender(app);
  });

  afterAll(function () {
    container.reset();
    jest.restoreAllMocks();
  });

  describe('POST /ingestion on S3', function () {
    
    describe('Happy Path 🙂', function () {
      it('should return 201 status code and the added model', async function () {
        const payload = createPayload('model1');
        s3Mock.on(ListObjectsCommand).resolves(s3Output);
        jobManagerClientMock.createJob.mockResolvedValue({ id: '1', status: OperationStatus.IN_PROGRESS });

        const response = await requestSender.createModel(payload);

        expect(response.status).toBe(httpStatusCodes.CREATED);
        expect(response.body).toHaveProperty('jobID', '1');
        expect(response.body).toHaveProperty('status', OperationStatus.IN_PROGRESS);
      });
    });

    describe('Bad Path 😡', function () {
      it(`should return 400 status code and error message if model doesn't exists`, async function () {
        const invalidPayload = createPayload('bla');
        s3Mock.on(ListObjectsCommand).resolves(s3EmptyOutput);

        const response = await requestSender.createModel(invalidPayload);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHaveProperty('message', `Model bla doesn't exists in bucket ${bucket}!`);
      });
    });

    describe('Sad Path 😥', function () {
      it('should return 500 status code if a network exception happens in job service', async function () {
        const payload = createPayload('bla');
        s3Mock.on(ListObjectsCommand).resolves(s3Output);
        jobManagerClientMock.createJob.mockRejectedValueOnce(new Error('JobManager is not available'));

        const response = await requestSender.createModel(payload);

        expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(response.body).toHaveProperty('message', 'JobManager is not available');
      });

      it('should return 500 status code if a network exception happens in amazon s3', async function () {
        const payload = createPayload('bla');
        s3Mock.on(ListObjectsCommand).rejects();

        const response = await requestSender.createModel(payload);

        expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(response.body).toHaveProperty('message', `Didn't throw a S3 exception in file`);
      });
    });
  });

  describe('POST /ingestion on NFS', function () {

    describe('Happy Path 🙂', function () {
      it('should return 201 status code and the added model', async function () {
        const payload = createPayload('model1');
        jobManagerClientMock.createJob.mockResolvedValue({ id: '123', status: OperationStatus.IN_PROGRESS });

        const response = await requestSender.createModel(payload);

        expect(response.status).toBe(httpStatusCodes.CREATED);
        expect(response.body).toHaveProperty('jobId', '123');
        expect(response.body).toHaveProperty('status', OperationStatus.IN_PROGRESS);
      });
    });

    describe('Bad Path 😡', function () {
      it(`should return 400 status code and error message if model doesn't exists`, async function () {
        const invalidPayload = createPayload('bla');

        const response = await requestSender.createModel(invalidPayload);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHaveProperty('message', `Model bla doesn't exists in the agreed folder`);
      });
    });

    describe('Sad Path 😥', function () {
      it('should return 500 status code if a network exception happens in job service', async function () {
        const invalidPayload = createPayload('model1');
        jobManagerClientMock.createJob.mockRejectedValueOnce(new Error('JobManager is not available'));

        const response = await requestSender.createModel(invalidPayload);

        expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(response.body).toHaveProperty('message', 'JobManager is not available');
      });
    });
  });
});
