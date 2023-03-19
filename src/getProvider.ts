// import { FSProvider } from './common/providers/fSProvider';
import httpStatus from 'http-status-codes';
import { S3Provider } from './common/providers/s3Provider';
import { IConfigProvider } from './common/interfaces';
import { NFSProvider } from './common/providers/nfsProvider';
import { AppError } from './common/appError';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const getProvider = (provider: string): IConfigProvider => {
  switch (provider.toLowerCase()) {
    case 'nfs':
      return new NFSProvider();
    case 's3':
      return new S3Provider();
    default:
      throw new AppError(
        '',
        httpStatus.INTERNAL_SERVER_ERROR,
        `Invalid config provider received: ${provider} - available values:  "nfs" or "s3"`,
        false
      );
  }
};
