import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import config from 'config';
import LineByLine from 'n-readlines';
import { singleton } from 'tsyringe';

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
    await fs.appendFile(this.queueFilePath, fileName + '\n');
  }

  public async checkIfTempFileEmpty(): Promise<boolean> {
    const fileStat = await fs.stat(this.queueFilePath);
    return fileStat.size === 0;
  }

  public async emptyQueueFile(): Promise<void> {
    await fs.truncate(this.queueFilePath, 0);
    this.liner = new LineByLine(this.queueFilePath);
  }

  private async createQueueFile(): Promise<void> {
    const filePath = path.join(this.queueFilePath);
    await fs.writeFile(filePath, '', 'utf8');
  }
}
