import { Logger } from '@map-colonies/js-logger';
import { OperationStatus } from '@map-colonies/mc-priority-queue';
import { RequestHandler } from 'express';
import httpStatus from 'http-status-codes';
import { inject, injectable } from 'tsyringe';
import { AppError } from '../../common/appError';
import { SERVICES } from '../../common/constants';
import { CreateJobBody, IConfig, IIngestionResponse, Payload } from '../../common/interfaces';
import { IngestionManager } from '../models/ingestionManager';

type CreateResourceHandler = RequestHandler<undefined, IIngestionResponse, Payload>;

@injectable()
export class IngestionController {
  private readonly jobType: string;

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.CONFIG) private readonly config: IConfig,
    @inject(IngestionManager) private readonly manager: IngestionManager
  ) {
    this.jobType = this.config.get<string>('worker.job.type');
  }

  public create: CreateResourceHandler = async (req, res, next) => {
    const payload: Payload = req.body;

    const createJobRequest: CreateJobBody = {
      resourceId: payload.modelId,
      version: '1',
      type: this.jobType,
      parameters: { metadata: payload.metadata, modelId: payload.modelId, tilesetFilename: payload.tilesetFilename },
      productType: payload.metadata.productType,
      productName: payload.metadata.productName,
      percentage: 0,
      producerName: payload.metadata.producerName,
      status: OperationStatus.IN_PROGRESS,
      domain: '3D',
    };

    try {
      const jobCreated = await this.manager.createJob(createJobRequest);
      this.logger.debug(`Job created payload`, payload);
      res.status(httpStatus.CREATED).json(jobCreated);
      await this.manager.createModel(payload, jobCreated.jobID);
    } catch (error) {
      if (error instanceof AppError) {
        this.logger.error({ msg: `Failed in ingesting a new model! Reason: ${error.message}` });
      }
      return next(error);
    }
  };
}
