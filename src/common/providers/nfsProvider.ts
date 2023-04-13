import fs from 'fs';
import { Logger } from '@map-colonies/js-logger';
import httpStatus from 'http-status-codes';
import { inject, injectable } from 'tsyringe';
import { QueueFileHandler } from '../../handlers/queueFileHandler';
import { AppError } from '../appError';
import { SERVICES } from '../constants';
import { IProvider, INFSConfig } from '../interfaces';

@injectable()
export class NFSProvider implements IProvider {
  // public constructor(@inject(SERVICES.S3) protected readonly config: INFSConfig,
  public constructor(
    @inject(SERVICES.PROVIDER_CONFIG) protected readonly config: INFSConfig,
    @inject(SERVICES.LOGGER) protected readonly logger: Logger,
    @inject(SERVICES.QUEUE_FILE_HANDLER) protected readonly queueFileHandler: QueueFileHandler
  ) {}

  public async streamModelPathsToQueueFile(model: string): Promise<void> {
    if (!fs.existsSync(`${this.config.pvPath}/${model}`)) {
      throw new AppError(httpStatus.NOT_FOUND, `Model ${model} doesn't exists in the agreed folder`, true);
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
