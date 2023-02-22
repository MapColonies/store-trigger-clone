import { Logger } from '@map-colonies/js-logger';
import { OperationStatus } from '@map-colonies/mc-priority-queue';
import { inject, injectable } from 'tsyringe';
import { JobManagerWrapper } from '../../clients/jobManagerWrapper';
import { SERVICES } from '../../common/constants';
import { CreateJobBody, IConfig, IConfigProvider, IIngestionResponse, Payload } from '../../common/interfaces';

@injectable()
export class IngestionManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.CONFIG) private readonly config: IConfig,
    @inject(JobManagerWrapper) private readonly jobManagerClient: JobManagerWrapper,
    @inject(SERVICES.CONFIGPROVIDER) private readonly configProvider: IConfigProvider
  ) {}

  public async createModel(payload: Payload): Promise<IIngestionResponse> {
    this.logger.info({ msg: 'creating tasks', path: payload.modelPath, provider: this.config.get<string>('ingestion.configProvider') });

    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    const modelName: string = payload.modelPath.split('/').slice(-1)[0];

    const createJobRequest: CreateJobBody = {
      resourceId: payload.modelId,
      version: '1',
      type: 'Ingestion_New',
      parameters: { metadata: payload.metadata },
      productType: payload.metadata.productType,
      productName: payload.metadata.productName,
      percentage: 0,
      producerName: payload.metadata.producerName,
      status: OperationStatus.IN_PROGRESS,
      domain: '3D',
    };
    try {
      const files: string[] = await this.configProvider.listFiles(modelName);
      const res: IIngestionResponse = await this.jobManagerClient.create(createJobRequest, files, payload.modelId);
      this.logger.info({ msg: 'Tasks created successfuly' });
      return res;
    } catch (error) {
      this.logger.error({ msg: 'Failed in creating tasks' });
      throw error;
    }
  }
}
