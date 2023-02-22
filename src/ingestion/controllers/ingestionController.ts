import { Logger } from '@map-colonies/js-logger';
import { RequestHandler } from 'express';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { AppError } from '../../common/appError';
import { SERVICES } from '../../common/constants';
import { IIngestionResponse, Payload } from '../../common/interfaces';
import { IngestionManager } from '../models/ingestionManager';

type CreateResourceHandler = RequestHandler<undefined, IIngestionResponse, Payload>;

@injectable()
export class IngestionController {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(IngestionManager) private readonly manager: IngestionManager
  ) {}

  public create: CreateResourceHandler = async (req, res, next) => {
    const userInput: Payload = req.body;
    try {
      const jobCreated = this.manager.createModel(userInput);
      this.logger.debug(`User input: ${JSON.stringify(userInput)}`);
      return res.status(httpStatus.CREATED).json(await jobCreated);
    } catch (error) {
      if (error instanceof AppError) {
        this.logger.error({ msg: `Failed in ingesting a new model! Reason: ${error.message}` });
      }
      next(error);
    }
  };
}
