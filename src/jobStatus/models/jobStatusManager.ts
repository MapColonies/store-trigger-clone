import { IJobResponse, JobManagerClient } from '@map-colonies/mc-priority-queue';
import { inject, injectable } from 'tsyringe';
import { SERVICES } from '../../common/constants';
import { IJobParameters, IJobStatusResponse, ITaskParameters } from '../../common/interfaces';

@injectable()
export class JobStatusManager {
  public constructor(@inject(SERVICES.JOB_MANAGER_CLIENT) private readonly jobManagerClient: JobManagerClient) {}

  public async checkStatus(jobID: string): Promise<IJobStatusResponse> {
    const job: IJobResponse<IJobParameters, ITaskParameters> = await this.jobManagerClient.getJob(jobID);

    const jobResponse: IJobStatusResponse = {
      percentage: job.percentage,
      status: job.status,
    };

    return jobResponse;
  }
}
