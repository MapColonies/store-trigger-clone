import * as fs from 'fs';
import { ICreateTaskBody } from '@map-colonies/mc-priority-queue';
import config from 'config';
import httpStatus from 'http-status-codes';
import { ITaskParameters } from '../../../src/common/interfaces';
import * as utils from '../../../src/common/utilities';
import { createUuid } from '../../helpers/helpers';
import { AppError } from '../../../src/common/appError';

describe('utilities tests', () => {
  const taskType = config.get<string>('worker.taskType');
  const queueFile = config.get<string>('ingestion.queueFile');
  const fsMock = {
    statSync: jest.fn(),
    truncate: jest.fn(),
    appendFile: jest.fn(),
  };

  describe('filesToTasks tests', () => {
    it('Should return task with the files in it when batches is bigger than files', () => {
      const modelId = createUuid();
      const batchSize = 5;
      fs.writeFileSync(queueFile, "a\nf");
      const extected: ICreateTaskBody<ITaskParameters>[] = [{ type: taskType, parameters: { paths: ['a', 'f'], modelId: modelId } }];

      const result = utils.filesToTasks(batchSize, modelId);

      expect(result).toStrictEqual(extected);
    });

    it('Should return tasks with the files in it when batches is smaller than files', () => {
      const modelId = createUuid();
      const batchSize = 1;
      fs.writeFileSync(queueFile, 'a\nf', { encoding: 'utf8', flag: 'w' });
      const extected: ICreateTaskBody<ITaskParameters>[] = [
        { type: taskType, parameters: { paths: ['a'], modelId: modelId } },
        { type: taskType, parameters: { paths: ['f'], modelId: modelId } },
      ];

      const result = utils.filesToTasks(batchSize, modelId);

      expect(result).toStrictEqual(extected);
    });
  });

  describe('writeFileNameToQueueFile tests', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
    
    it('Should write the file name to the queue file', () => {
      const file = 'bla.txt';

      utils.writeFileNameToQueueFile(file);
      const result = fs.readFileSync(queueFile, 'utf-8');

      expect(result).toContain(file);
    });

    it(`Should throw error if can't write`, () => {
      const file = 'bla.txt';
      fsMock.appendFile.mockRejectedValue(new Error());

      expect(utils.writeFileNameToQueueFile(file)).toThrow(new AppError('', httpStatus.INTERNAL_SERVER_ERROR, `Didn't write the file: '${file}'`, false));
    });
  });

  describe('checkIfTempFileEmpty tests', () => {
    beforeEach(() => {
      fs.truncate(queueFile, 0, (err) => {
        if (err) {
          throw new AppError('', httpStatus.INTERNAL_SERVER_ERROR, `Didn't remove the content of the queue file`, false);
        }
      });
    });
    it('should return true when queue file is empty', () => {
      const result = utils.checkIfTempFileEmpty();

      expect(result).toBe(true);
    });

    it('should return false when queue file is not empty', () => {
      fs.writeFileSync(queueFile, 'bla', { encoding: 'utf8', flag: 'w' });

      const result = utils.checkIfTempFileEmpty();

      expect(result).toBe(false);
    });

    it('should throw error when reading a file', () => {
      fs.writeFileSync(queueFile, 'bla', { encoding: 'utf8', flag: 'w' });
      fsMock.statSync.mockImplementation(() => {
        throw new Error();
      });
            
      expect(utils.checkIfTempFileEmpty()).toThrow(new AppError('', httpStatus.INTERNAL_SERVER_ERROR, `Problem with fs. Can't see if the file is empty or not`, false));
    });

  });

  describe('emptyQueueFile tests', () => {
    it('should empty queue file', () => {
      fs.writeFileSync(queueFile, 'bla', { encoding: 'utf8', flag: 'w' });
      
      utils.emptyQueueFile();
      const fileContent = fs.readFileSync(queueFile, { encoding: 'utf8' });
      
      expect(fileContent).toBe('');
    });

    it('should throw an error when there is a problem', () => {
      fsMock.truncate.mockRejectedValue(new Error());
            
      expect(utils.emptyQueueFile()).toThrow(new AppError('', httpStatus.INTERNAL_SERVER_ERROR, `Didn't remove the content of the queue file`, false));
    });
  });
});
