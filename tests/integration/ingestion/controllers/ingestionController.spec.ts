/* eslint-disable @typescript-eslint/naming-convention */
import jsLogger from '@map-colonies/js-logger';
import httpStatusCodes from 'http-status-codes';
import config from 'config';
import mockAxios from 'jest-mock-axios';
import { OperationStatus } from '@map-colonies/mc-priority-queue';
import { ListObjectsCommandOutput, S3ServiceException } from '@aws-sdk/client-s3';
import { getApp } from '../../../../src/app';
import { SERVICES } from '../../../../src/common/constants';
import { IngestionRequestSender } from '../helpers/requestSender';
import { createPayload } from '../../../helpers/mockCreator';

describe('ModelsController', function () {
  let requestSender: IngestionRequestSender;
  beforeEach(function () {
    const app = getApp({
      override: [
        { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
        { token: SERVICES.CONFIG, provider: { useValue: config } },
      ],
      useChild: true,
    });
    requestSender = new IngestionRequestSender(app);
  });
  afterEach(function () {
    // container.reset();
    mockAxios.reset();
  });

  describe('POST /ingestion on NFS', function () {
    describe('Happy Path 🙂', function () {
      it('should return 201 status code and the added model', async function () {
        const payload = createPayload('model1');

        const response = await requestSender.createModel(payload);

        expect(response.status).toBe(httpStatusCodes.CREATED);
        expect(response.body).toHaveProperty('jobId');
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
        const invalidPayload = createPayload('bla');
        mockAxios.post.mockRejectedValueOnce(new Error('JobManager is not avaliable'));

        const response = await requestSender.createModel(invalidPayload);

        expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(response.body).toHaveProperty('message', 'JobManager is not avaliable');
      });
    });
  });

  describe('POST /ingestion on S3', function () {
    const s3Mock = {
      send: jest.fn(),
    };
    describe('Happy Path 🙂', function () {
      it('should return 201 status code and the added model', async function () {
        const payload = createPayload('model1');
        const s3Response: ListObjectsCommandOutput = {
          $metadata: {},
          Contents: [{ Key: 'a' }],
        };
        s3Mock.send.mockResolvedValueOnce(s3Response);
        mockAxios.post.mockResolvedValue({ jobId: '123', status: OperationStatus.IN_PROGRESS });
        const response = await requestSender.createModel(payload);

        expect(response.status).toBe(httpStatusCodes.CREATED);
        expect(response.body).toHaveProperty('jobId');
        expect(response.body).toHaveProperty('status', OperationStatus.IN_PROGRESS);
      });
    });

    describe('Bad Path 😡', function () {
      it(`should return 400 status code and error message if model doesn't exists`, async function () {
        const invalidPayload = createPayload('bla');
        const s3Response: ListObjectsCommandOutput = {
          $metadata: {},
          Contents: [],
        };
        s3Mock.send.mockResolvedValueOnce(s3Response);

        const response = await requestSender.createModel(invalidPayload);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHaveProperty('message', `Model bla doesn't exists in bucket ${config.get<string>('S3.bucket')}!`);
      });
    });

    describe('Sad Path 😥', function () {
      it('should return 500 status code if a network exception happens in minio', async function () {
        const invalidPayload = createPayload('model1');
        const s3Response: S3ServiceException = {
          $metadata: {},
          $fault: 'server',
          name: 'name',
          message: 'massage',
        };
        s3Mock.send.mockRejectedValueOnce(s3Response);

        const response = await requestSender.createModel(invalidPayload);

        expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(response.body).toHaveProperty(
          'message',
          `${s3Response.name}, message: ${s3Response.message}, bucket: ${config.get<string>('S3.bucket')}}`
        );
      });

      it('should return 500 status code if a network exception happens in job service', async function () {
        const invalidPayload = createPayload('model1');
        const s3Response: ListObjectsCommandOutput = {
          $metadata: {},
          Contents: [{ Key: 'a' }],
        };
        s3Mock.send.mockResolvedValueOnce(s3Response);
        mockAxios.post.mockRejectedValueOnce(new Error('JobManager is not avaliable'));

        const response = await requestSender.createModel(invalidPayload);

        expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(response.body).toHaveProperty('message', 'JobManager is not avaliable');
      });
    });
  });
});
