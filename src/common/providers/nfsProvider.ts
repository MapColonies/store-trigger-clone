import fs from 'fs/promises';
import { Logger } from '@map-colonies/js-logger';
import httpStatus from 'http-status-codes';
import { inject, injectable } from 'tsyringe';
import { QueueFileHandler } from '../../handlers/queueFileHandler';
import { AppError } from '../appError';
import { SERVICES } from '../constants';
import { IProvider, INFSConfig } from '../interfaces';

@injectable()
export class NFSProvider implements IProvider {
  public constructor(
    @inject(SERVICES.PROVIDER_CONFIG) protected readonly config: INFSConfig,
    @inject(SERVICES.LOGGER) protected readonly logger: Logger,
    @inject(SERVICES.QUEUE_FILE_HANDLER) protected readonly queueFileHandler: QueueFileHandler
  ) {}

  public async streamModelPathsToQueueFile(model: string): Promise<void> {
    let filesCount = 0;
    const modelPath = `${this.config.pvPath}/${model}`;
    try {
      await fs.access(modelPath);
    } catch (error) {
      this.logger.error(error, modelPath);
      throw new AppError(httpStatus.NOT_FOUND, `Model ${model} doesn't exists in the agreed folder`, true);
    }

    const folders: string[] = [model];

    while (folders.length > 0) {
      const files = await fs.readdir(`${this.config.pvPath}/${folders[0]}`);
      this.logger.info({ msg: 'Listing folder', folder: folders[0], filesCount });
      for (const file of files) {
        const fileStats = await fs.stat(`${this.config.pvPath}/${folders[0]}/${file}`);
        if (fileStats.isDirectory()) {
          folders.push(`${folders[0]}/${file}`);
        } else {
          try {
            await this.queueFileHandler.writeFileNameToQueueFile(`${folders[0]}/${file}`);
            filesCount++;
          } catch (err) {
            this.logger.error({ msg: `Didn't write the file: '${folders[0]}/${file}' in FS.` });
            throw err;
          }
        }
      }

      folders.shift();
    }
  }
}
