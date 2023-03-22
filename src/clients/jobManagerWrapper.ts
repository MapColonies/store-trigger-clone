import { inject, injectable } from 'tsyringe';
import config from 'config';
import { Logger } from '@map-colonies/js-logger';
import { ICreateTaskBody, JobManagerClient, OperationStatus } from '@map-colonies/mc-priority-queue';
import { SERVICES } from '../common/constants';
import { CreateJobBody, IJobParameters, IIngestionResponse, ITaskParameters } from '../common/interfaces';
import { QueueFileHandler } from '../handlers/queueFileHandler';

@injectable()
export class JobManagerWrapper extends JobManagerClient {
  private readonly taskType: string;

  public constructor(@inject(SERVICES.LOGGER) protected readonly logger: Logger,
    @inject(SERVICES.QUEUE_FILE_HANDLER) protected readonly queueFileHandler: QueueFileHandler) {
    super(
      logger,
      config.get<string>('worker.job.type'),
      config.get<string>('jobManager.url'));

    this.taskType = config.get<string>('worker.task.type');
  }

  public async create(job: CreateJobBody): Promise<IIngestionResponse> {
    const batchSize: number = config.get<number>('worker.task.batches');
    const tasks: ICreateTaskBody<ITaskParameters>[] = this.createTasks(batchSize, job.resourceId);
    job.tasks = tasks;

    const jobResponse = await this.createJob<IJobParameters, ITaskParameters>(job);

    const res: IIngestionResponse = {
      jobID: jobResponse.id,
      status: OperationStatus.IN_PROGRESS,
    };

    return res;
  }

  public createTasks(batchSize: number, modelId: string): ICreateTaskBody<ITaskParameters>[] {
    const tasks: ICreateTaskBody<ITaskParameters>[] = [];
    let chunk: string[] = [];
    let data: string | null = this.queueFileHandler.readline();

    while (data !== null) {
      chunk.push(data);

      if (chunk.length === batchSize) {
        const task = this.createTaskFromChunk(chunk, modelId);
        tasks.push(task);
        chunk = [];
      }

      data = this.queueFileHandler.readline();
    }

    // Create task from the rest of the last chunk
    if (chunk.length > 0) {
      const task = this.createTaskFromChunk(chunk, modelId);
      tasks.push(task);
    }

    return tasks;
  }

  private createTaskFromChunk(chunk: string[], modelId: string): ICreateTaskBody<ITaskParameters> {
    const parameters: ITaskParameters = { paths: chunk, modelId };
    return { type: this.taskType, parameters };
  }
}
