import { Logger } from '@map-colonies/js-logger';
import { ICreateTaskBody, OperationStatus } from '@map-colonies/mc-priority-queue';
import { inject, injectable } from 'tsyringe';
import { JobManagerWrapper } from '../../clients/jobManagerWrapper';
import { SERVICES } from '../../common/constants';
import { CreateJobBody, IConfig, IConfigProvider, IExportResponse, ITaskParameters, Payload } from '../../common/interfaces';
import { filesToTasks } from '../../common/utilities';

@injectable()
export class ExportManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.CONFIG) private readonly config: IConfig,
    @inject(JobManagerWrapper) private readonly jobManagerClient: JobManagerWrapper,
    @inject(SERVICES.CONFIGPROVIDER) private readonly configProvider: IConfigProvider
    ) {}

  public async createModel(payload: Payload): Promise<IExportResponse> {

    this.logger.info({ msg: 'creating tasks', path: payload.modelPath });
    
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    const modelName: string = payload.modelPath.split('/').slice(-1)[0];
    const files: string[] = await this.configProvider.listFiles(modelName);
    const type = payload.metadata.type ?? 'unknown3D';

    const createJobRequest: CreateJobBody = {
      resourceId: payload.modelId,
      version: '1',
      type: type,
      parameters: { metadata: payload.metadata },
      productType: payload.metadata.productType,
      productName: payload.metadata.productName,
      percentage: 0,
      producerName: payload.metadata.producerName,
      status: OperationStatus.IN_PROGRESS,
    }

    const res: IExportResponse = await this.jobManagerClient.create(createJobRequest, files);

    return res;
  }
}
