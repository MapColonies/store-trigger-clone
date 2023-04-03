import { Layer3DMetadata } from '@map-colonies/mc-model-types';
import { ICreateJobBody, IJobResponse, OperationStatus } from '@map-colonies/mc-priority-queue';
import { Providers } from './enums';

export interface IConfig {
  get: <T>(setting: string) => T;
  has: (setting: string) => boolean;
}

export interface OpenApiConfig {
  filePath: string;
  basePath: string;
  jsonPath: string;
  uiPath: string;
}

export interface Payload {
  /**
   * Ingestion model unique identifier
   */
  modelId: string;
  /**
   * Model files location path
   */
  modelPath: string;
  /**
   * Model tileset filename
   */
  tilesetFilename: string;
  /**
   * Metadata
   */
  metadata: Layer3DMetadata;
}

export interface IProvider {
  streamModelPathsToQueueFile: (model: string) => Promise<void>;
}

export interface IIngestionConfig {
  configProvider: Providers;
}

export interface IJobParameters {
  tilesetFilename: string;
  modelId: string;
  metadata: Layer3DMetadata;
}

export interface ITaskParameters {
  paths: string[];
  modelId: string;
}

export interface IS3Config {
  accessKeyId: string;
  secretAccessKey: string;
  endpointUrl: string;
  bucket: string;
  region: string;
  sslEnabled: boolean;
  forcePathStyle: boolean;
}

export interface INFSConfig {
  pvPath: string;
}

export interface IIngestionResponse {
  jobID: string;
  status: OperationStatus;
}

export interface IJobStatusResponse {
  percentage: number;
  status: OperationStatus;
}

export interface JobStatusParams {
  jobID: string;
}

export type JobResponse = IJobResponse<IJobParameters, ITaskParameters>;
export type CreateJobBody = ICreateJobBody<IJobParameters, ITaskParameters>;
