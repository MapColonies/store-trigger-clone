import { Logger } from '@map-colonies/js-logger';
import { ICreateTaskBody, JobManagerClient, OperationStatus } from '@map-colonies/mc-priority-queue';
import { inject, injectable } from 'tsyringe';
import { QueueFileHandler } from '../../handlers/queueFileHandler';
import { SERVICES } from '../../common/constants';
import { CreateJobBody, IConfig, IProvider, IIngestionResponse, Payload, ITaskParameters, IJobParameters } from '../../common/interfaces';

@injectable()
export class IngestionManager {
  private readonly providerName: string;
  private readonly jobType: string;
  private readonly taskType: string;
  private readonly batchSize: number;
  
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.CONFIG) private readonly config: IConfig,
    @inject(JobManagerClient) private readonly jobManagerClient: JobManagerClient,
    @inject(SERVICES.PROVIDER) private readonly provider: IProvider,
    @inject(SERVICES.QUEUE_FILE_HANDLER) protected readonly queueFileHandler: QueueFileHandler) {
    this.providerName = this.config.get<string>('ingestion.provider');
    this.jobType = this.config.get<string>('worker.job.type');
    this.batchSize = config.get<number>('worker.task.batches');
    this.taskType = config.get<string>('worker.task.type');
  }

  public async createModel(payload: Payload): Promise<IIngestionResponse> {
    this.logger.info({ msg: 'Creating job for model', path: payload.modelPath, provider: this.providerName });

    const modelName: string = this.extractModelNameFromPath(payload.modelPath);
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
      this.logger.info({ msg: 'Starts writing content to queue file' });
      await this.provider.listFiles(modelName);
      this.logger.info({ msg: 'Finished writing content to queue file. Creating Tasks' });

      const res: IIngestionResponse = await this.createJob(createJobRequest);
      this.logger.info({ msg: 'Tasks created successfully' });
      this.queueFileHandler.emptyQueueFile();
      return res;
    } catch (error) {
      this.logger.error({ msg: 'Failed in creating tasks' });
      this.queueFileHandler.emptyQueueFile();
      throw error;
    }
  }

  public async createJob(job: CreateJobBody): Promise<IIngestionResponse> {
    const tasks: ICreateTaskBody<ITaskParameters>[] = this.createTasks(this.batchSize, job.resourceId);
    job.tasks = tasks;

    const jobResponse = await this.jobManagerClient.createJob<IJobParameters, ITaskParameters>(job);

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

  private extractModelNameFromPath(modelPath: string): string {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    return modelPath.split('/').slice(-1)[0];
  }
}
