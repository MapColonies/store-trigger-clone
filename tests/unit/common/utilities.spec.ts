import { ICreateTaskBody } from '@map-colonies/mc-priority-queue';
import config from 'config';
import { ITaskParameters } from '../../../src/common/interfaces';
import * as utils from '../../../src/common/utilities';
import { createUuid } from '../../helpers/helpers';

describe('utilities tests', () => {
  describe('filesToTasks tests', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('Should return task with the files in it when batches is bigger than files', () => {
      const files: string[] = ['a', 'f'];
      const modelId = createUuid();
      const taskType = config.get<string>('worker.taskType');
      const batchSize = 5;
      const extected: ICreateTaskBody<ITaskParameters>[] = [{ type: taskType, parameters: { paths: ['a', 'f'], modelId: modelId } }];

      const result = utils.filesToTasks(files, batchSize, modelId, taskType, []);

      expect(result).toStrictEqual(extected);
    });

    it('Should return tasks with the files in it when batches is smaller than files', () => {
      const files: string[] = ['a', 'f'];
      const modelId = createUuid();
      const taskType = config.get<string>('worker.taskType');
      const batchSize = 1;
      const extected: ICreateTaskBody<ITaskParameters>[] = [
        { type: taskType, parameters: { paths: ['a'], modelId: modelId } },
        { type: taskType, parameters: { paths: ['f'], modelId: modelId } },
      ];
    
      const result = utils.filesToTasks(files, batchSize, modelId, taskType, []);
    
      expect(result).toStrictEqual(extected);
    });
  });
});
