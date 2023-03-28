import fs from 'fs';
import { Logger } from '@map-colonies/js-logger';
import config from 'config';
import httpStatus from 'http-status-codes';
import LineByLine from 'n-readlines';
import { inject, injectable } from 'tsyringe';
import { AppError } from '../common/appError';
import { SERVICES } from '../common/constants';

@injectable()
export class QueueFileHandler {
  private readonly queueFilePath: string;
  private readonly liner;

  public constructor(@inject(SERVICES.LOGGER) private readonly logger: Logger) {
    this.queueFilePath = config.get<string>('ingestion.queueFile');
    console.log(this.queueFilePath);
    this.createQueueFile();
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
    try {
      fs.truncateSync(this.queueFilePath, 0,);
    } catch (err) {
      throw new AppError('', httpStatus.INTERNAL_SERVER_ERROR, `Didn't remove the content of the queue file`, true);
    };
  };

  private createQueueFile(): void {
    try {
      if (!fs.existsSync(this.queueFilePath)) {
        fs.writeFileSync(this.queueFilePath, '', 'utf8');
      }
    } catch (err) {
      throw new AppError('', httpStatus.INTERNAL_SERVER_ERROR, `Cant create queue file`, true);
    };
  }
}
