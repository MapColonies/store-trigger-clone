import { Logger } from '@map-colonies/js-logger';
import { IJobResponse, JobManagerClient } from '@map-colonies/mc-priority-queue';
import { inject, injectable } from 'tsyringe';
import httpStatus from 'http-status-codes';
import { AppError } from '../../common/appError';
import { SERVICES } from '../../common/constants';
import { IJobParameters, IJobStatusResponse, ITaskParameters } from '../../common/interfaces';

@injectable()
export class JobStatusManager {
  public constructor(
    @inject(SERVICES.JOB_MANAGER_CLIENT) private readonly jobManagerClient: JobManagerClient,
  ) {}

  public async checkStatus(jobID: string): Promise<IJobStatusResponse> {
    const job: IJobResponse<IJobParameters, ITaskParameters> | undefined = await this.jobManagerClient.getJob(jobID);
    if (job == undefined) {
      throw new AppError(httpStatus.NOT_FOUND, 'The Job ID is not exists!', true);
    }
    
    const jobResponse: IJobStatusResponse = {
      percentage: job.percentage,
      status: job.status,
    };
    
    return jobResponse;
  }
}
