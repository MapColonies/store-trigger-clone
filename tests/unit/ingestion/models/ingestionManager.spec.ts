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
    ingestionManager = new IngestionManager(
      jsLogger({ enabled: false }), 
      config as never, 
      jobsManagerMock as never, 
      configProviderMock as never
    );
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('#createModel', () => {
    it('resolves without errors', async () => {
      const payload: Payload = createPayload('model1');
      const files = ['a.txt', 'b.txt'];
      const response: IIngestionResponse = {
        jobID: createUuid(),
        status: OperationStatus.IN_PROGRESS,
      };
      configProviderMock.listFiles.mockResolvedValue(files);
      jobsManagerMock.create.mockResolvedValue(response);

      const created = await ingestionManager.createModel(payload);

      expect(created).toMatchObject(response);
    });

    it('rejects if listFiles fails', async () => {
      const payload: Payload = createPayload('model1');
      configProviderMock.listFiles.mockRejectedValue(new AppError('', httpStatus.INTERNAL_SERVER_ERROR, '', false));

      const created = await ingestionManager.createModel(payload);

      expect(created).toThrow(AppError);
    });

    it('rejects if jobManager fails', async () => {
      const payload: Payload = createPayload('model1');
      const files = ['a.txt', 'b.txt'];
      configProviderMock.listFiles.mockResolvedValue(files);
      jobsManagerMock.create.mockRejectedValue(new AppError('', httpStatus.INTERNAL_SERVER_ERROR, '', false));

      const created = await ingestionManager.createModel(payload);

      expect(created).toThrow(AppError);
    });
  });
});
