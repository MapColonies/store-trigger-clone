import jsLogger, { LoggerOptions } from '@map-colonies/js-logger';
import config from 'config';
import { DependencyContainer } from 'tsyringe';
import { SERVICES } from '../../src/common/constants';
import { InjectionObject, registerDependencies } from '../../src/common/dependencyRegistration';
import { IConfigProvider, IIngestionConfig, INFSConfig, IS3Config } from '../../src/common/interfaces';
import getProvider from '../../src/common/providers/getProvider';
import { RegisterOptions } from '../../src/containerConfig';
import { QueueFileHandler } from '../../src/handlers/queueFileHandler';
import { ingestionRouterFactory, INGESTION_ROUTER_SYMBOL } from '../../src/ingestion/routes/ingestionRouter';
import { jobStatusRouterFactory, JOB_STATUS_ROUTER_SYMBOL } from '../../src/jobStatus/routes/jobStatusRouter';

export const BEFORE_ALL_TIMEOUT = 15000;
export const FLOW_TEST_TIMEOUT = 20000;
export const RERUN_TEST_TIMEOUT = 60000;

export const registerExternalValues = (options?: RegisterOptions): DependencyContainer => {
  const loggerConfig = config.get<LoggerOptions>('telemetry.logger');
  const fsConfig = config.get<INFSConfig>('NFS');
  const s3Config = config.get<IS3Config>('S3');
  const ingestionConfig = config.get<IIngestionConfig>('ingestion');
  const logger = jsLogger({ ...loggerConfig, prettyPrint: loggerConfig.prettyPrint });

  const dependencies: InjectionObject<unknown>[] = [
    { token: SERVICES.CONFIG, provider: { useValue: config } },
    { token: SERVICES.LOGGER, provider: { useValue: logger } },
    { token: INGESTION_ROUTER_SYMBOL, provider: { useFactory: ingestionRouterFactory } },
    { token: JOB_STATUS_ROUTER_SYMBOL, provider: { useFactory: jobStatusRouterFactory } },
    { token: SERVICES.NFS, provider: { useValue: fsConfig } },
    { token: SERVICES.S3, provider: { useValue: s3Config } },
    { token: SERVICES.QUEUE_FILE_HANDLER, provider: { useClass: QueueFileHandler } },
    {
      token: SERVICES.CONFIG_PROVIDER,
      provider: {
        useFactory: (): IConfigProvider => {
          return getProvider(ingestionConfig.configProvider);
        },
      },
    }
  ];

  return registerDependencies(dependencies, options?.override, options?.useChild);
};
