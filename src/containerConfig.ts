import jsLogger, { LoggerOptions } from '@map-colonies/js-logger';
import { logMethod, Metrics } from '@map-colonies/telemetry';
import { trace } from '@opentelemetry/api';
import config from 'config';
import { DependencyContainer } from 'tsyringe/dist/typings/types';
import { SERVICES, SERVICE_NAME } from './common/constants';
import { InjectionObject, registerDependencies } from './common/dependencyRegistration';
import { INFSConfig, IProvider, IS3Config } from './common/interfaces';
import { getProvider, getProviderConfig } from './common/providers/getProvider';
import { tracing } from './common/tracing';
import { QueueFileHandler } from './handlers/queueFileHandler';
import { ingestionRouterFactory, INGESTION_ROUTER_SYMBOL } from './ingestion/routes/ingestionRouter';
import { jobStatusRouterFactory, JOB_STATUS_ROUTER_SYMBOL } from './jobStatus/routes/jobStatusRouter';

export interface RegisterOptions {
  override?: InjectionObject<unknown>[];
  useChild?: boolean;
}

export const registerExternalValues = (options?: RegisterOptions): DependencyContainer => {
  const loggerConfig = config.get<LoggerOptions>('telemetry.logger');
  // const fsConfig = config.get<INFSConfig>('NFS');
  // const s3Config = config.get<IS3Config>('S3');
  const provider = config.get<string>('ingestion.provider');
  // @ts-expect-error the signature is wrong
  const logger = jsLogger({ ...loggerConfig, prettyPrint: loggerConfig.prettyPrint, hooks: { logMethod } });

  const metrics = new Metrics(SERVICE_NAME);
  const meter = metrics.start();

  tracing.start();
  const tracer = trace.getTracer(SERVICE_NAME);

  const dependencies: InjectionObject<unknown>[] = [
    { token: SERVICES.CONFIG, provider: { useValue: config } },
    { token: SERVICES.LOGGER, provider: { useValue: logger } },
    { token: SERVICES.TRACER, provider: { useValue: tracer } },
    { token: SERVICES.METER, provider: { useValue: meter } },
    { token: INGESTION_ROUTER_SYMBOL, provider: { useFactory: ingestionRouterFactory } },
    { token: JOB_STATUS_ROUTER_SYMBOL, provider: { useFactory: jobStatusRouterFactory } },
    {
      token: SERVICES.PROVIDER_CONFIG,
      provider: {
        useFactory: (): INFSConfig | IS3Config => {
          return getProviderConfig(provider);
        },
      },
    },
    // { token: SERVICES.S3, provider: { useValue: s3Config } },
    { token: SERVICES.QUEUE_FILE_HANDLER, provider: { useClass: QueueFileHandler } },
    {
      token: SERVICES.PROVIDER,
      provider: {
        useFactory: (): IProvider => {
          return getProvider(provider);
        },
      },
    },
    {
      token: 'onSignal',
      provider: {
        useValue: {
          useValue: async (): Promise<void> => {
            await Promise.all([tracing.stop(), metrics.stop()]);
          },
        },
      },
    },
  ];

  return registerDependencies(dependencies, options?.override, options?.useChild);
};
