import * as fs from 'fs';
import { Logger } from '@map-colonies/js-logger';
import httpStatus from 'http-status-codes';
import { container, inject, injectable } from 'tsyringe';
import { SERVICES } from '../constants';
import { IConfigProvider } from '../interfaces';
import { AppError } from '../appError';

@injectable()
export class FSProvider implements IConfigProvider {
//   private readonly fsConfig: IFSConfig;

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    // this.logger = container.resolve(SERVICES.LOGGER);
    @inject(SERVICES.FS) private readonly fsConfig: IS3Config,
    // this.fsConfig = container.resolve(SERVICES.FS),
  ){}

  public async listFiles(model: string): Promise<string[]> {
  
    let count = 0;
    const rootDir: string = config.get('3dir');
  
  
    if (!fs.existsSync(`${model}`)) {
      throw new AppError('', httpStatus.BAD_REQUEST, `Model ${modelName} doesn't exists in the agreed folder`, false);
    }
  
    const folders: string[] = [model];
  
    while (folders.length > 0) {
      // console.log("Listing folder: " + folders[0]);
  
      await Promise.all(fs.readdirSync(`${rootDir}/${folders[0]}`)
      .map(async (file) => {
        if (fs.lstatSync(`${rootDir}/${folders[0]}/${file}`).isDirectory()) {
          folders.push(`${folders[0]}/${file}`);
        } else {
          count = count + 1;
          await addKeyToQueue(pgBoss, model, `${folders[0]}/${file}`);
        }
      }));
  
      folders.shift();
    }
    if (count == 0) {
      throw new PathNotExists(`Model ${model} doesn't exists in bucket ${config.get<string>('s3.bucket')}!`);
    }
  
    await addSizeToQueue(pgBoss, model, count);
  
    
    return count;
  }
}
