import * as fs from 'fs';
import { Logger } from '@map-colonies/js-logger';
import httpStatus from 'http-status-codes';
import { container } from 'tsyringe';
import config from 'config';
import { SERVICES } from '../constants';
import { IConfigProvider, INFSConfig } from '../interfaces';
import { AppError } from '../appError';
import { QueueFileHandler } from '../../handlers/queueFileHandler';

export class NFSProvider implements IConfigProvider {
  private readonly logger: Logger;
  private readonly config: INFSConfig;
  private readonly queueFileHandler:  QueueFileHandler;

  public constructor() {
    this.logger = container.resolve(SERVICES.LOGGER);
    this.config = config.get<INFSConfig>('NFS');
    this.queueFileHandler = container.resolve(SERVICES.QUEUE_FILE_HANDLER);
  }

  public async listFiles(model: string): Promise<void> {
    if (!fs.existsSync(`${this.config.pvPath}/${model}`)) {
      throw new AppError('', httpStatus.BAD_REQUEST, `Model ${model} doesn't exists in the agreed folder`, true);
    }

    const folders: string[] = [model];

    while (folders.length > 0) {
      await Promise.all(
        fs.readdirSync(`${this.config.pvPath}/${folders[0]}`).map((file) => {
          if (fs.lstatSync(`${this.config.pvPath}/${folders[0]}/${file}`).isDirectory()) {
            folders.push(`${folders[0]}/${file}`);
          } else {
            try {
              this.queueFileHandler.writeFileNameToQueueFile(`${folders[0]}/${file}`);
            } catch (err) {
              this.logger.error({ msg: `Didn't write the file: '${folders[0]}/${file}' in FS.` });
              throw err;
            }
          }
        })
      );

      folders.shift();
    }
  }
}
