import fs from 'fs';
import { singleton } from 'tsyringe';
import config from 'config';
import LineByLine = require('n-readlines');
import httpStatus from 'http-status-codes';
import { ICreateTaskBody } from '@map-colonies/mc-priority-queue';
import { ITaskParameters } from '../common/interfaces';
import { AppError } from '../common/appError';

@singleton()
export class FileHandler {
  private readonly queueFilePath: string;

  public constructor() {
    this.queueFilePath = config.get<string>('ingestion.queueFile');
  }

  public filesToTasks(batchSize: number, modelId: string): ICreateTaskBody<ITaskParameters>[] {
    const tasks: ICreateTaskBody<ITaskParameters>[] = [];
    const taskType: string = config.get<string>('worker.taskType');
    const liner = new LineByLine(this.queueFilePath);
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

  public writeFileNameToQueueFile(fileName: string): void {
    try {
      // const writeStream = fs.createWriteStream(queueFilePath, { flags: 'a' });
      // writeStream.write(fileName + '\n');
      // writeStream.end();
      fs.appendFileSync(this.queueFilePath, fileName + '\n');
    } catch (err) {
      throw new AppError('', httpStatus.INTERNAL_SERVER_ERROR, `Didn't write the file: '${fileName}'`, false);
    }
  };

  public checkIfTempFileEmpty(): boolean {
    try {
      return fs.statSync(this.queueFilePath).size === 0 ? true : false;
    } catch (err) {
      throw new AppError('', httpStatus.INTERNAL_SERVER_ERROR, `Problem with fs. Can't see if the file is empty or not`, false);
    }
  };

  public emptyQueueFile(): void {
    fs.truncate(this.queueFilePath, 0, (err) => {
      if (err) {
        throw new AppError('', httpStatus.INTERNAL_SERVER_ERROR, `queue fiDidn't remove the content of the le`, false);
      }
    });
  };
}
