import { ListObjectsCommand } from '@aws-sdk/client-s3';
import { OperationStatus } from '@map-colonies/mc-priority-queue';
import config from 'config';
import httpStatus from 'http-status-codes';
import httpStatusCodes from 'http-status-codes';
import { container } from 'tsyringe';
import { getApp } from '../../../../src/app';
import { AppError } from '../../../../src/common/appError';
import { SERVICES } from '../../../../src/common/constants';
import { IIngestionResponse, IProvider } from '../../../../src/common/interfaces';
import { getProvider } from '../../../../src/common/providers/getProvider';
import { IngestionManager } from '../../../../src/ingestion/models/ingestionManager';
import { createPayload, ingestionResponseMock, s3Mock, s3Output } from '../../../helpers/mockCreator';
import { IngestionRequestSender } from '../helpers/requestSender';

describe('IngestionController', function () {
  let requestSender: IngestionRequestSender;
  let ingestionManager: IngestionManager;
  const s3Config = config.get<string>('S3');

  const jobManagerClientMock = {
    createJob: jest.fn(),
  };

  beforeAll(() => {
    const app = getApp({
      override: [
        { token: SERVICES.JOB_MANAGER_CLIENT, provider: { useValue: jobManagerClientMock } },
        {
          token: SERVICES.PROVIDER,
          provider: {
            useFactory: (): IProvider => {
              return getProvider('s3');
            },
          },
        },
      ],
    });

    ingestionManager = container.resolve(IngestionManager);
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
        // s3Mock.on(ListObjectsCommand).resolves(s3Output);
        jobManagerClientMock.createJob.mockResolvedValueOnce({ id: '1' });

        const response = await requestSender.create(payload);

        expect(response.status).toBe(httpStatusCodes.CREATED);
        expect(response.body).toHaveProperty('jobID', '1');
        expect(response.body).toHaveProperty('status', OperationStatus.IN_PROGRESS);
      });
    });

    // describe('Bad Path 😡', function () {
    //   it(`should return 400 status code and error message if model doesn't exists`, async function () {
    //     const invalidPayload = createPayload('bla');
    //     s3Mock.on(ListObjectsCommand).resolves(s3EmptyOutput);

    //     const response = await requestSender.create(invalidPayload);

    //     expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    //     expect(response.body).toHaveProperty('message', `Model bla doesn't exists in bucket ${bucket}!`);
    //   });
    // });

    describe('Sad Path 😥', function () {
      it('should return 500 status code if a network exception happens in job manager', async function () {
        const payload = createPayload('bla');
        // s3Mock.on(ListObjectsCommand).resolves(s3Output);
        jobManagerClientMock.createJob.mockRejectedValueOnce(new Error('JobManager is not available'));

        const response = await requestSender.create(payload);

        expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(response.body).toHaveProperty('message', 'JobManager is not available');
      });

      // it('should return 500 status code if a network exception happens in amazon s3', async function () {
      //   const payload = createPayload('bla');
      //   s3Mock.on(ListObjectsCommand).rejects();

      //   const response = await requestSender.create(payload);

      //   expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
      //   expect(response.body).toHaveProperty('message', `Didn't throw a S3 exception in file`);
      // });
    });
  });

  // describe('POST /ingestion on NFS', function () {
  //   const nfsConfig = config.get<string>('NFS');

  //   beforeAll(function () {
  //     const app = getApp({
  //       override: [
  //         { token: SERVICES.JOB_MANAGER_CLIENT, provider: { useValue: jobManagerClientMock } },
  //         { token: SERVICES.PROVIDER_CONFIG, provider: { useValue: nfsConfig } },
  //         {
  //           token: SERVICES.PROVIDER,
  //           provider: {
  //             useFactory: (): IProvider => {
  //               return getProvider('nfs');
  //             },
  //           },
  //         },
  //       ],
  //     });

  //     requestSender = new IngestionRequestSender(app);
  //   });

  //   describe('Happy Path 🙂', function () {
  //     it('should return 201 status code and the added model', async function () {
  //       const payload = createPayload('model1');
  //       jobManagerClientMock.createJob.mockResolvedValue({ id: '123', status: OperationStatus.IN_PROGRESS });

  //       const response = await requestSender.create(payload);

  //       expect(response.status).toBe(httpStatusCodes.CREATED);
  //       expect(response.body).toHaveProperty('jobID', '123');
  //       expect(response.body).toHaveProperty('status', OperationStatus.IN_PROGRESS);
  //     });
  //   });

  //   describe('Bad Path 😡', function () {
  //     it(`should return 400 status code and error message if model doesn't exists`, async function () {
  //       const invalidPayload = createPayload('bla');

  //       const response = await requestSender.create(invalidPayload);

  //       expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
  //       expect(response.body).toHaveProperty('message', `Model bla doesn't exists in the agreed folder`);
  //     });
  //   });

  //   describe('Sad Path 😥', function () {
  //     it('should return 500 status code if a network exception happens in job service', async function () {
  //       const invalidPayload = createPayload('model1');
  //       jobManagerClientMock.createJob.mockRejectedValueOnce(new Error('JobManager is not available'));

  //       const response = await requestSender.create(invalidPayload);

  //       expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
  //       expect(response.body).toHaveProperty('message', 'JobManager is not available');
  //     });
  //   });
  // });

  // describe('create', () => {
  //   it('should create a new job and return it in the response', async () => {
  //     const payload = createPayload('my-model');
  //     ingestionManager.createJob(ingestionResponseMock);

  //     const response = await requestSender.create(payload);

  //     expect(response.status).toBe(201);
  //     expect(response.body).toHaveProperty('jobID');
  //   });

  //   it('should return an error if there is an AppError', async () => {
  //     const payload = createPayload('my-model');
  //     managerMock.createJob.mockRejectedValue(new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'some error message', true));

  //     const response = await requestSender.create(payload);

  //     expect(response.status).toBe(500);
  //     expect(response.body).toHaveProperty('message', 'some error message');
  //   });
  // });
});
