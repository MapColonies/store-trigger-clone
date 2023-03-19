import { inject, injectable } from 'tsyringe';
import config from 'config';
import { Logger } from '@map-colonies/js-logger';
import { ICreateTaskBody, JobManagerClient, OperationStatus } from '@map-colonies/mc-priority-queue';
import { SERVICES } from '../common/constants';
import { CreateJobBody, IJobParameters, IIngestionResponse, ITaskParameters } from '../common/interfaces';
import { QueueFileHandler } from '../handlers/queueFileHandler';

@injectable()
export class JobManagerWrapper extends JobManagerClient {
  public constructor(@inject(SERVICES.LOGGER) protected readonly logger: Logger,
    @inject(SERVICES.QUEUE_FILE_HANDLER) protected readonly queueFileHandler: QueueFileHandler) {
    super(
      logger,
      config.get<string>('worker.job.type'),
      config.get<string>('jobManager.url'));
  }

  public async create(job: CreateJobBody): Promise<IIngestionResponse> {
    const batchSize: number = config.get<number>('worker.task.batches');
    const tasks: ICreateTaskBody<ITaskParameters>[] = this.queueFileHandler.filesToTasks(batchSize, job.resourceId);
    job.tasks = tasks;

    const jobResponse = await this.createJob<IJobParameters, ITaskParameters>(job);

    const res: IIngestionResponse = {
      jobID: jobResponse.id,
      status: OperationStatus.IN_PROGRESS,
    };

    return res;
  }
}
