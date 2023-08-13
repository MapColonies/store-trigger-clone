import fs from 'fs/promises';
import os from 'os';
import LineByLine from 'n-readlines';
import { singleton } from 'tsyringe';

@singleton()
export class QueueFileHandler {
  private readonly queueFilePath: string;
  private readonly linerDictionary: { [key: string]: LineByLine };

  public constructor() {
    this.queueFilePath = os.tmpdir();
    this.linerDictionary = {};
  }

  public async createQueueFile(model: string): Promise<void> {
    await fs.writeFile(`${this.queueFilePath}/${model}`, '', 'utf8');
    this.linerDictionary[model] = new LineByLine(`${this.queueFilePath}/${model}`);
  }

  public readline(model: string): string | null {
    const line = this.linerDictionary[model].next();

    if (line === false) {
      return null;
    }

    return line.toString('ascii');
  }

  public async writeFileNameToQueueFile(model: string, fileName: string): Promise<void> {
    await fs.appendFile(`${this.queueFilePath}/${model}`, fileName + '\n');
  }

  public async checkIfTempFileEmpty(model: string): Promise<boolean> {
    const fileStat = await fs.stat(`${this.queueFilePath}/${model}`);
    return fileStat.size === 0;
  }

  public async deleteQueueFile(model: string): Promise<void> {
    await fs.rm(`${this.queueFilePath}/${model}`);
    delete this.linerDictionary[model];
  }
}
