import { Logger } from '@map-colonies/js-logger';
import { ICreateTaskBody, JobManagerClient, OperationStatus } from '@map-colonies/mc-priority-queue';
import { inject, injectable } from 'tsyringe';
import { SERVICES } from '../../common/constants';
import { CreateJobBody, IConfig, IIngestionResponse, IJobParameters, IProvider, ITaskParameters, Payload } from '../../common/interfaces';
import { QueueFileHandler } from '../../handlers/queueFileHandler';

@injectable()
export class IngestionManager {
  private readonly providerName: string;
  private readonly taskType: string;
  private readonly batchSize: number;

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.CONFIG) private readonly config: IConfig,
    @inject(SERVICES.JOB_MANAGER_CLIENT) private readonly jobManagerClient: JobManagerClient,
    @inject(SERVICES.PROVIDER) private readonly provider: IProvider,
    @inject(SERVICES.QUEUE_FILE_HANDLER) protected readonly queueFileHandler: QueueFileHandler
  ) {
    this.providerName = this.config.get<string>('ingestion.provider');
    this.batchSize = config.get<number>('worker.task.batches');
    this.taskType = config.get<string>('worker.task.type');
  }

  public async createModel(payload: Payload): Promise<void> {
    this.logger.info({ msg: 'Creating job for model', name: payload.modelName, provider: this.providerName });

    try {
      this.logger.info({ msg: 'Starts writing content to queue file' });
      await this.queueFileHandler.initialize();
      await this.provider.streamModelPathsToQueueFile(payload.modelName);
      this.logger.info({ msg: 'Finished writing content to queue file. Creating Tasks' });

      this.createTasks(this.batchSize, payload.modelId);
      this.logger.info({ msg: 'Tasks created successfully' });
      await this.queueFileHandler.emptyQueueFile();
    } catch (error) {
      this.logger.error({ msg: 'Failed in creating tasks' });
      await this.queueFileHandler.emptyQueueFile();
      throw error;
    }
  }

  public async createJob(job: CreateJobBody): Promise<IIngestionResponse> {
    const jobResponse = await this.jobManagerClient.createJob<IJobParameters, ITaskParameters>(job);

    const res: IIngestionResponse = {
      jobID: jobResponse.id,
      status: OperationStatus.IN_PROGRESS,
    };

    return res;
  }

  private createTasks(batchSize: number, modelId: string): ICreateTaskBody<ITaskParameters>[] {
    const tasks: ICreateTaskBody<ITaskParameters>[] = [];
    let chunk: string[] = [];
    let data: string | null = this.queueFileHandler.readline();

    while (data !== null) {
      chunk.push(data);

      if (chunk.length === batchSize) {
        const task = this.buildTaskFromChunk(chunk, modelId);
        tasks.push(task);
        chunk = [];
      }

      data = this.queueFileHandler.readline();
    }

    // Create task from the rest of the last chunk
    if (chunk.length > 0) {
      const task = this.buildTaskFromChunk(chunk, modelId);
      tasks.push(task);
    }

    return tasks;
  }

  private buildTaskFromChunk(chunk: string[], modelId: string): ICreateTaskBody<ITaskParameters> {
    const parameters: ITaskParameters = { paths: chunk, modelId };
    return { type: this.taskType, parameters };
  }
}
