import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import config from 'config';
import httpStatus from 'http-status-codes';
import LineByLine from 'n-readlines';
import { singleton } from 'tsyringe';
import { AppError } from '../common/appError';

@singleton()
export class QueueFileHandler {
  private readonly queueFilePath: string;
  private liner!: LineByLine;

  public constructor() {
    const tempDir = os.tmpdir();
    this.queueFilePath = `${tempDir}/${config.get<string>('ingestion.queueFilePath')}`;
  }

  public async initialize(): Promise<void> {
    await this.createQueueFile();
    this.liner = new LineByLine(this.queueFilePath);
  }

  public readline(): string | null {
    const line = this.liner.next();

    if (line === false) {
      return null;
    }

    return line.toString('ascii');
  }

  public async writeFileNameToQueueFile(fileName: string): Promise<void> {
    try {
      await fs.appendFile(this.queueFilePath, fileName + '\n');
    } catch (err) {
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, `Didn't write the file: '${fileName}'`, true);
    }
  }

  public async checkIfTempFileEmpty(): Promise<boolean> {
    try {
      const fileStat = await fs.stat(this.queueFilePath);
      return fileStat.size === 0;
    } catch (err) {
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, `Problem with fs. Can't see if the file is empty or not`, true);
    }
  }

  public async emptyQueueFile(): Promise<void> {
    try {
      await fs.truncate(this.queueFilePath, 0);
      this.liner = new LineByLine(this.queueFilePath);
    } catch (err) {
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, `Didn't remove the content of the queue file`, true);
    }
  }

  private async createQueueFile(): Promise<void> {
    const filePath = path.join(this.queueFilePath);
    try {
      await fs.writeFile(filePath, '', 'utf8');
    } catch (err) {
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, `Can't create queue file`, true);
    }
  }
}
