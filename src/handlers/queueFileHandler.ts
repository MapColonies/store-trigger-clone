import fs from 'fs';
import config from 'config';
import httpStatus from 'http-status-codes';
import LineByLine from 'n-readlines';
import { injectable } from 'tsyringe';
import { AppError } from '../common/appError';

@injectable()
export class QueueFileHandler {
  private readonly queueFilePath: string;
  private readonly liner;

  public constructor() {
    this.queueFilePath = config.get<string>('ingestion.queueFile');
    this.liner = new LineByLine(this.queueFilePath);
  }

  public readline(): string | null {
    const line = this.liner.next();

    if (line === false) {
      return null;
    }

    return line.toString('ascii');
  }

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
