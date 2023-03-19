import config from 'config';
import jsLogger from '@map-colonies/js-logger';
import { OperationStatus } from '@map-colonies/mc-priority-queue';
import httpStatus from 'http-status-codes';
import { AppError } from '../../../../src/common/appError';
import { IngestionManager } from '../../../../src/ingestion/models/ingestionManager';
import { createPayload, createUuid } from '../../../helpers/helpers';
import { IIngestionResponse, Payload } from '../../../../src/common/interfaces';

let ingestionManager: IngestionManager;

describe('ingestionManager', () => {
  const jobsManagerMock = {
    create: jest.fn(),
  };
  const configProviderMock = {
    listFiles: jest.fn(),
  };

  beforeEach(() => {
    ingestionManager = new IngestionManager(jsLogger({ enabled: false }), config as never, jobsManagerMock as never, configProviderMock as never);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('#createModel', () => {
    const payload: Payload = createPayload('model1');
    it('resolves without errors', async () => {
      const response: IIngestionResponse = {
        jobID: createUuid(),
        status: OperationStatus.IN_PROGRESS,
      };
      configProviderMock.listFiles.mockResolvedValue(undefined);
      jobsManagerMock.create.mockResolvedValue(response);

      await expect(ingestionManager.createModel(payload)).resolves.toMatchObject(response);
    });

    it('rejects if listFiles fails', async () => {
      const payload: Payload = createPayload('model1');
      configProviderMock.listFiles.mockRejectedValue(new AppError('', httpStatus.INTERNAL_SERVER_ERROR, '', true));

      await expect(ingestionManager.createModel(payload)).rejects.toThrow(AppError);
    });

    it('rejects if jobManager fails', async () => {
      const payload: Payload = createPayload('model1');
      configProviderMock.listFiles.mockResolvedValue(undefined);
      jobsManagerMock.create.mockRejectedValue(new AppError('', httpStatus.INTERNAL_SERVER_ERROR, '', true));

      await expect(ingestionManager.createModel(payload)).rejects.toThrow(AppError);
    });
  });
});
