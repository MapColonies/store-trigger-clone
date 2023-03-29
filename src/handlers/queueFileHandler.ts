import fs from 'fs';
import path from 'path';
import { Logger } from '@map-colonies/js-logger';
import config from 'config';
import httpStatus from 'http-status-codes';
import LineByLine from 'n-readlines';
import { inject, injectable } from 'tsyringe';
import { AppError } from '../common/appError';
import { SERVICES } from '../common/constants';

@injectable()
export class QueueFileHandler {
  private readonly queueFileName: string;
  private readonly liner;

  public constructor(@inject(SERVICES.LOGGER) private readonly logger: Logger) {
    this.queueFileName = config.get<string>('ingestion.queueFileName');
    this.createQueueFile();
    this.liner = new LineByLine(this.queueFileName);
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
      fs.appendFileSync(this.queueFileName, fileName + '\n');
    } catch (err) {
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, `Didn't write the file: '${fileName}'`, true);
    }
  };

  public checkIfTempFileEmpty(): boolean {
    try {
      return fs.statSync(this.queueFileName).size === 0 ? true : false;
    } catch (err) {
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, `Problem with fs. Can't see if the file is empty or not`, true);
    }
  };

  public emptyQueueFile(): void {
    try {
      fs.truncateSync(this.queueFileName, 0);
    } catch (err) {
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, `Didn't remove the content of the queue file`, true);
    };
  };

  private createQueueFile(): void {
    const filePath = path.join(process.cwd(), this.queueFileName);
    try {
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '', 'utf8');
      }
    } catch (err) {
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, `Cant create queue file`, true);
    };
  }
}
