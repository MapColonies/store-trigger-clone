import fs from 'fs';
import { container } from 'tsyringe';
import { AppError } from '../../../src/common/appError';
import { QueueFileHandler } from '../../../src/handlers/queueFileHandler';
import { createFile, fsMock } from '../../helpers/mockCreator';

describe('QueueFileHandler', () => {
  let queueFileHandler: QueueFileHandler;


  beforeEach(() => {
    queueFileHandler = container.resolve(QueueFileHandler);
  });

  afterEach(() => {
    container.reset();
    jest.clearAllMocks();
  });

  describe('initialize Function', () => {
    it('creates the queue file and initialize the liner', async () => {
      // Arrange
      jest.spyOn(queueFileHandler as any, 'createQueueFile').mockResolvedValue('');

      // Act
      await queueFileHandler.initialize();

      //Assert
      expect(queueFileHandler['createQueueFile']).toHaveBeenCalled();
    });
  });

  describe('createQueueFile Function', () => {
    it('creates the queue file', async () => {
      // Arrange
      jest.spyOn(fs,'writeFile').mockResolvedValue('' as never);

      // Act
      const response = await queueFileHandler['createQueueFile']();

      //Assert
      expect(response).toBeUndefined();
    });

    it('rejects the creation when there is a problem with fs', async () => {
      // Arrange
      jest.spyOn(fs,'writeFile').mockRejectedValue(Error('error') as never);

      // Act && Assert
      await expect(queueFileHandler['createQueueFile']()).rejects.toThrow(AppError);
    });
  });

  describe('emptyQueueFile Function', () => {
    it('empty the queue file', async () => {
      // Arrange
      fsMock.truncate.mockResolvedValue('');

      // Act
      const response = await queueFileHandler.emptyQueueFile();

      //Assert
      expect(response).toBeUndefined();
    });

    it('rejects the creation when there is a problem with fs', async () => {
      // Arrange
      fsMock.truncate.mockRejectedValue(new Error(''));

      // Act && Assert
      await expect(queueFileHandler.emptyQueueFile()).rejects.toThrow(AppError);
    });
  });

  describe('checkIfTempFileEmpty Function', () => {
    it('returns true when queue file is empty', async () => {
      // Arrange
      fsMock.stat.mockResolvedValue({ size: 0 });

      // Act
      const response = await queueFileHandler.checkIfTempFileEmpty();

      //Assert
      expect(response).toBe(true);
    });

    it('returns false when queue file is not empty', async () => {
      // Arrange
      fsMock.stat.mockResolvedValue({ size: 3 });

      // Act
      const response = await queueFileHandler.checkIfTempFileEmpty();

      //Assert
      expect(response).toBe(false);
    });

    it('rejects when there is a problem with fs', async () => {
      // Arrange
      fsMock.stat.mockRejectedValue(new Error(''));

      // Act && Assert
      await expect(queueFileHandler.checkIfTempFileEmpty()).rejects.toThrow(AppError);
    });
  });

  describe('writeFileNameToQueueFile Function', () => {
    it('writes a file path to the queue file', async () => {
      // Arrange
      const fileName = createFile();
      fsMock.appendFile.mockResolvedValue('');

      // Act
      const response = await queueFileHandler.writeFileNameToQueueFile(fileName);

      //Assert
      expect(response).toHaveReturned();
    });

    it('rejects the write when there is a problem with fs', async () => {
      // Arrange
      const fileName = createFile();
      fsMock.appendFile.mockRejectedValue(new Error(''));

      // Act && Assert
      await expect(queueFileHandler.writeFileNameToQueueFile(fileName)).rejects.toThrow(AppError);
    });
  });

  describe('readline Function', () => {
    it('return a file path when queue file is not empty', () => {
      // Arrange
      const fileName = createFile();
      jest.spyOn(queueFileHandler as any, 'liner').mockResolvedValue(fileName);

      // Act
      const response = queueFileHandler.readline();

      //Assert
      expect(response).toBe(fileName);
    });

    it('return null when queue file is empty', () => {
      // Arrange
      const fileName = createFile();
      fsMock.appendFile.mockRejectedValue(new Error(''));

      // Act
      const response = queueFileHandler.readline();

      // Assert
      expect(response).toBeNull();
    });
  });
});
