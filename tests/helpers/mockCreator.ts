import config from 'config';
import RandExp from 'randexp';
import { mockClient } from 'aws-sdk-client-mock';
import { ListObjectsCommandOutput, S3Client } from '@aws-sdk/client-s3';
import { randBetweenDate, randNumber, randPastDate, randUuid, randWord } from '@ngneat/falso';
import { Polygon } from 'geojson';
import { Layer3DMetadata, ProductType, RecordStatus, RecordType } from '@map-colonies/mc-model-types';
import jsLogger from '@map-colonies/js-logger';
import { ICreateTaskBody, OperationStatus } from '@map-colonies/mc-priority-queue';
import { RandomNumberOptions } from '@ngneat/falso/lib/number';
import { CreateJobBody, IJobParameters, ITaskParameters, Payload } from '../../src/common/interfaces';
import { RegisterOptions } from '../../src/containerConfig';
import { SERVICES } from '../../src/common/constants';

const classificationHelper = new RandExp('^[0-9]$').gen();
const listOfRandomWords = ['avi', 'אבי', 'lalalalala', 'וןםפ'];
const maxResolutionMeter = 8000;
const noData = 999;
const maxAccuracySE90 = 250;
const maxRelativeAccuracyLEP90 = 100;
const maxVisualAccuracy = 100;
const minX = 1;
const minY = 2;
const maxX = 3;
const maxY = 4;

export const getBaseRegisterOptions = (): Required<RegisterOptions> => {
  return {
    override: [
      { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
      { token: SERVICES.CONFIG, provider: { useValue: config } },
    ],
    useChild: true,
  };
};

export const createUuid = (): string => {
  return randUuid();
};

export const createFootprint = (): Polygon => {
  return {
    type: 'Polygon',
    coordinates: [
      [
        [minX, minY],
        [maxX, minY],
        [maxX, maxY],
        [minX, maxY],
      ],
    ],
  };
};

export const createBatch = (options?: RandomNumberOptions | undefined): number => {
  return randNumber(options);
};

export const createFile = (): string => {
  return `${randWord()}.txt`;
};

export const createBlackListFile = (): string => {
  return `${randWord()}.zip`;
};

export const getTaskType = (): string => {
  return config.get<string>('fileSyncer.task.type');
};

export const createMetadata = (): Layer3DMetadata => {
  const sourceDateStart = randPastDate();
  const sourceDateEnd = randBetweenDate({ from: sourceDateStart, to: new Date() });
  const minResolutionMeter = randNumber({ max: maxResolutionMeter });
  return {
    productId: Math.floor(Math.random() * listOfRandomWords.length).toString(),
    productName: Math.floor(Math.random() * listOfRandomWords.length).toString(),
    productType: ProductType.PHOTO_REALISTIC_3D,
    description: Math.floor(Math.random() * listOfRandomWords.length).toString(),
    creationDate: randPastDate(),
    sourceDateStart: sourceDateStart,
    sourceDateEnd: sourceDateEnd,
    minResolutionMeter: minResolutionMeter,
    maxResolutionMeter: randNumber({ min: minResolutionMeter, max: maxResolutionMeter }),
    maxAccuracyCE90: randNumber({ min: 0, max: noData }),
    absoluteAccuracyLE90: randNumber({ min: 0, max: noData }),
    accuracySE90: randNumber({ min: 0, max: maxAccuracySE90 }),
    relativeAccuracySE90: randNumber({ min: 0, max: maxRelativeAccuracyLEP90 }),
    visualAccuracy: randNumber({ min: 0, max: maxVisualAccuracy }),
    sensors: [randWord()],
    footprint: createFootprint(),
    heightRangeFrom: randNumber(),
    heightRangeTo: randNumber(),
    srsId: randNumber().toString(),
    srsName: randWord(),
    region: [randWord()],
    classification: classificationHelper,
    productionSystem: randWord(),
    productionSystemVer: Math.floor(Math.random() * listOfRandomWords.length).toString(),
    producerName: randWord(),
    minFlightAlt: randNumber(),
    maxFlightAlt: randNumber(),
    geographicArea: randWord(),
    productStatus: RecordStatus.UNPUBLISHED,
    productBoundingBox: undefined,
    productVersion: undefined,
    type: RecordType.RECORD_3D,
    updateDate: undefined,
    productSource: randWord(),
  };
};

export const createPayload = (modelName: string): Payload => {
  return {
    modelId: createUuid(),
    modelName,
    tilesetFilename: 'tileset.json',
    metadata: createMetadata(),
  };
};

export const createJobPayload = (payload: Payload): CreateJobBody => {
  return {
    resourceId: payload.modelId,
    version: '1',
    type: config.get<string>('fileSyncer.job.type'),
    parameters: createJobParameters(),
    productType: payload.metadata.productType,
    productName: payload.metadata.productName,
    percentage: 0,
    producerName: payload.metadata.producerName,
    status: OperationStatus.IN_PROGRESS,
    domain: '3D',
  };
};

export const createFakeTask = (): ICreateTaskBody<ITaskParameters> => {
  const modelId = createUuid();
  return {
    parameters: {
      paths: [createFile(), createFile()],
      modelId,
      lastIndexError: 0
    },
  };
};

export const createFakeTasks = (): ICreateTaskBody<ITaskParameters>[] => {
  const taskSize = randNumber({ min: 1, max: 5 });
  const tasks: ICreateTaskBody<ITaskParameters>[] = [];
  for (let i = 0; i < taskSize; i++) {
    tasks.push(createFakeTask());
  }
  return tasks;
};

export const createJobParameters = (): IJobParameters => {
  return {
    metadata: createMetadata(),
    modelId: createUuid(),
    tilesetFilename: 'tileset.json',
    filesCount: 0
  };
};

export const queueFileHandlerMock = {
  emptyQueueFile: jest.fn(),
  readline: jest.fn(),
  initialize: jest.fn(),
  writeFileNameToQueueFile: jest.fn(),
};

export const fsMock = {
  writeFile: jest.fn(),
  stat: jest.fn(),
  truncate: jest.fn(),
  appendFile: jest.fn(),
};

export const s3Mock = mockClient(S3Client);

/* eslint-disable @typescript-eslint/naming-convention */
export const s3Output: ListObjectsCommandOutput = {
  Contents: [{ Key: 'model1/file1' }],
  CommonPrefixes: [{ Prefix: 'model1/file2' }],
  IsTruncated: false,
  $metadata: {},
};

export const s3EmptyOutput: ListObjectsCommandOutput = {
  $metadata: {},
};

export const jobManagerClientMock = {
  createJob: jest.fn(),
  createTaskForJob: jest.fn(),
};

export const configProviderMock = {
  streamModelPathsToQueueFile: jest.fn(),
};

export const ingestionResponseMock = {
  jobID: 'my-job-id',
  status: OperationStatus.IN_PROGRESS,
};
