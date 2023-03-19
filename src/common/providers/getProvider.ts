import httpStatus from 'http-status-codes';
import { container } from 'tsyringe';
import { AppError } from '../appError';
import { IConfigProvider } from '../interfaces';
import { NFSProvider } from './nfsProvider';

function getProvider(provider: string): IConfigProvider {
  switch (provider.toLowerCase()) {
    case 'nfs':
      return container.resolve(NFSProvider);
    case 's3':
      return container.resolve(NFSProvider);
    default:
      throw new AppError(
        '',
        httpStatus.INTERNAL_SERVER_ERROR,
        `Invalid config provider received: ${provider} - available values:  "nfs" or "s3"`,
        false
      );
  }
};

export default getProvider;