import * as fs from 'fs';
import { Logger } from '@map-colonies/js-logger';
import httpStatus from 'http-status-codes';
import { container } from 'tsyringe';
import config from 'config';
import { SERVICES } from '../constants';
import { IConfigProvider, IFSConfig } from '../interfaces';
import { AppError } from '../appError';
import { writeFileNameToQueueFile } from '../utilities';

export class FSProvider implements IConfigProvider {
  private readonly logger: Logger;
  private readonly config: IFSConfig;

  public constructor() {
    this.logger = container.resolve(SERVICES.LOGGER);
    this.config = config.get<IFSConfig>('FS');
  }

  public async listFiles(model: string): Promise<void> {
    if (!fs.existsSync(`${this.config.pvPath}/${model}`)) {
      throw new AppError('', httpStatus.BAD_REQUEST, `Model ${model} doesn't exists in the agreed folder`, true);
    }

    const folders: string[] = [model];
    // const files: string[] = [];

    while (folders.length > 0) {
      await Promise.all(
        fs.readdirSync(`${this.config.pvPath}/${folders[0]}`).map((file) => {
          if (fs.lstatSync(`${this.config.pvPath}/${folders[0]}/${file}`).isDirectory()) {
            folders.push(`${folders[0]}/${file}`);
          } else {
            try {
              writeFileNameToQueueFile(`${folders[0]}/${file}`);
            } catch (err) {
              this.logger.error({ msg: `Didn't write the file: '${folders[0]}/${file}' in FS.` });
            }
            // files.push(`${folders[0]}/${file}`);
          }
        })
      );

      folders.shift();
    }
  }
}
