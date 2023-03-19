import { Logger } from '@map-colonies/js-logger';
import { OperationStatus } from '@map-colonies/mc-priority-queue';
import { inject, injectable } from 'tsyringe';
import { QueueFileHandler } from '../../handlers/queueFileHandler';
import { JobManagerWrapper } from '../../clients/jobManagerWrapper';
import { SERVICES } from '../../common/constants';
import { CreateJobBody, IConfig, IConfigProvider, IIngestionResponse, Payload } from '../../common/interfaces';

@injectable()
export class IngestionManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.CONFIG) private readonly config: IConfig,
    @inject(JobManagerWrapper) private readonly jobManagerClient: JobManagerWrapper,
    @inject(SERVICES.CONFIG_PROVIDER) private readonly configProvider: IConfigProvider,
    @inject(SERVICES.QUEUE_FILE_HANDLER) protected readonly queueFileHandler: QueueFileHandler) { }

  public async createModel(payload: Payload): Promise<IIngestionResponse> {
    this.logger.info({ msg: 'Creating job for model', path: payload.modelPath, provider: this.config.get<string>('ingestion.configProvider') });

    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    const modelName: string = payload.modelPath.split('/').slice(-1)[0];
    const createJobRequest: CreateJobBody = {
      resourceId: payload.modelId,
      version: '1',
      type: this.config.get<string>('worker.job.type'),
      parameters: { metadata: payload.metadata, modelId: payload.modelId, tilesetFilename: payload.tilesetFilename },
      productType: payload.metadata.productType,
      productName: payload.metadata.productName,
      percentage: 0,
      producerName: payload.metadata.producerName,
      status: OperationStatus.IN_PROGRESS,
      domain: '3D',
    };
    this.logger.info({ msg: 'Starts writing content to queue file' });
    try {
      await this.configProvider.listFiles(modelName);
      this.logger.info({ msg: 'Finished writing content to queue file. Creating Tasks' });
      const res: IIngestionResponse = await this.jobManagerClient.create(createJobRequest);
      this.logger.info({ msg: 'Tasks created successfully' });
      this.queueFileHandler.emptyQueueFile();
      return res;
    } catch (error) {
      this.logger.error({ msg: 'Failed in creating tasks' });
      this.queueFileHandler.emptyQueueFile();
      throw error;
    }
  }
}
