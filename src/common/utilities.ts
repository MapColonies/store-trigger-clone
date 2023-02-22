import * as fs from 'fs';

import { ICreateTaskBody } from '@map-colonies/mc-priority-queue';
import { ITaskParameters } from './interfaces';
import { AppError } from './appError';

export const filesToTasks = (files: string[], batchSize: number, modelId: string, taskType: string, tasks: ICreateTaskBody<ITaskParameters>[]): ICreateTaskBody<ITaskParameters>[] => {
  for (let i = 0; i < files.length; i += batchSize) {
    const parameters: ITaskParameters = { paths: files.slice(i, i + batchSize), modelId: modelId };
    const task: ICreateTaskBody<ITaskParameters> = {
      type: taskType,
      parameters: parameters,
    };
    tasks.push(task);
  }
  return tasks;
};

// export const writeFileNameToTempFile = (fileName: string): void => {
//   fs.appendFile('./dist/tempFilesNames.txt', fileName, (err) => {
//     if (err) {
//       throw new AppError('', httpStatus.INTERNAL_SERVER_ERROR, `Didn't write the file: '${fileName}'`, true);
//     }
//   });
// }