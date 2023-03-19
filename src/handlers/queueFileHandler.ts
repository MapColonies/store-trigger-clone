import fs from 'fs';
import { injectable } from 'tsyringe';
import config from 'config';
import LineByLine from 'n-readlines';
import httpStatus from 'http-status-codes';
import { ICreateTaskBody } from '@map-colonies/mc-priority-queue';
import { ITaskParameters } from '../common/interfaces';
import { AppError } from '../common/appError';

@injectable()
export class QueueFileHandler {
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
      fs.appendFileSync(this.queueFilePath, fileName + '\n');
    } catch (err) {
      throw new AppError('', httpStatus.INTERNAL_SERVER_ERROR, `Didn't write the file: '${fileName}'`, true);
    }
  };

  public checkIfTempFileEmpty(): boolean {
    try {
      return fs.statSync(this.queueFilePath).size === 0 ? true : false;
    } catch (err) {
      throw new AppError('', httpStatus.INTERNAL_SERVER_ERROR, `Problem with fs. Can't see if the file is empty or not`, true);
    }
  };

  public emptyQueueFile(): void {
    fs.truncate(this.queueFilePath, 0, (err) => {
      if (err) {
        throw new AppError('', httpStatus.INTERNAL_SERVER_ERROR, `Didn't remove the content of the queue file`, true);
      }
    });
  };
}
