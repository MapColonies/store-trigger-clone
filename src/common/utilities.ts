import * as fs from 'fs';
import LineByLine = require('n-readlines');
import httpStatus from 'http-status-codes';
import { ICreateTaskBody } from '@map-colonies/mc-priority-queue';
import config from 'config';
import { ITaskParameters } from './interfaces';
import { AppError } from './appError';

export const filesToTasks = (batchSize: number, modelId: string): ICreateTaskBody<ITaskParameters>[] => {
  const tasks: ICreateTaskBody<ITaskParameters>[] = [];
  const queueFilePath: string = config.get<string>('ingestion.queueFile');
  const taskType: string = config.get<string>('worker.taskType');
  const liner = new LineByLine(queueFilePath);
  let line = liner.next();
  let chunk: string[] = [];

  while (line != false) {
    chunk.push(line.toString('ascii'));

    if (chunk.length === batchSize) {
      const parameters: ITaskParameters = { paths: chunk, modelId: modelId };
      const task: ICreateTaskBody<ITaskParameters> = {
        type: taskType,
        parameters: parameters,
      };
      tasks.push(task);
      chunk = [];
    }
    line = liner.next();
  }

  if (chunk.length > 0) {
    const parameters: ITaskParameters = { paths: chunk, modelId: modelId };
    const task: ICreateTaskBody<ITaskParameters> = {
      type: taskType,
      parameters: parameters,
    };
    tasks.push(task);
  }

  return tasks;
};

export const writeFileNameToQueueFile = (fileName: string): void => {
  const queueFilePath: string = config.get<string>('ingestion.queueFile');
  try {
    // const writeStream = fs.createWriteStream(queueFilePath, { flags: 'a' });
    // writeStream.write(fileName + '\n');
    // writeStream.end();
    fs.appendFileSync(queueFilePath, fileName + '\n');
  } catch (err) {
    throw new AppError('', httpStatus.INTERNAL_SERVER_ERROR, `Didn't write the file: '${fileName}'`, false);
  }
};

export const checkIfTempFileEmpty = (): boolean => {
  const queueFilePath: string = config.get<string>('ingestion.queueFile');
  try {
    return fs.statSync(queueFilePath).size === 0 ? true : false;
  } catch (err) {
    throw new AppError('', httpStatus.INTERNAL_SERVER_ERROR, `Problem with fs. Can't see if the file is empty or not`, false);
  }
};

export const emptyQueueFile = (): void => {
  const queueFilePath: string = config.get<string>('ingestion.queueFile');
  fs.truncate(queueFilePath, 0, (err) => {
    if (err) {
      throw new AppError('', httpStatus.INTERNAL_SERVER_ERROR, `Didn't remove the content of the queue file`, false);
    }
  });
};
