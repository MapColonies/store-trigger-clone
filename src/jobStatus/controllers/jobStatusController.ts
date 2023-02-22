import { Logger } from '@map-colonies/js-logger';
import { RequestHandler } from 'express';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { SERVICES } from '../../common/constants';
import { IJobStatusResponse, JobStatusParams } from '../../common/interfaces';
import { JobStatusManager } from '../models/jobStatusManager';

type GetResourceHandler = RequestHandler<JobStatusParams, IJobStatusResponse>;

@injectable()
export class JobStatusController {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(JobStatusManager) private readonly manager: JobStatusManager
  ) {}

  public checkStatus: GetResourceHandler = async (req, res) => {
    const { jobID } = req.params;
    return res.status(httpStatus.OK).json(await this.manager.checkStatus(jobID));
  };
}
