import { Logger } from '@map-colonies/js-logger';
import { RequestHandler } from 'express';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { SERVICES } from '../../common/constants';
import { IExportResponse, Payload } from '../../common/interfaces';
import { ExportManager } from '../models/exportManager';

type CreateResourceHandler = RequestHandler<undefined, IExportResponse, Payload>;

@injectable()
export class ExportController {

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(ExportManager) private readonly manager: ExportManager,
  ) {}

  public create: CreateResourceHandler = (req, res, next) => {
    const userInput: Payload = req.body;
    try {
      const jobCreated = this.manager.createModel(userInput);
      this.logger.debug(`User input: ${JSON.stringify(userInput)}`);
      return res.status(httpStatus.CREATED).json(jobCreated);
    } catch (err) {
      next(err);
    }
  };
}
