import config from 'config';
import { ICreateTaskBody } from '@map-colonies/mc-priority-queue';
import { container } from 'tsyringe';
import { ITaskParameters } from '../../../src/common/interfaces';
import { QueueFileHandler } from '../../../src/handlers/queueFileHandler';

describe('QueueFileHandler', () => {
  let queueFileHandler: QueueFileHandler;
  let taskType: string;

  beforeAll(() => {
    taskType = config.get<string>('worker.taskType');
    queueFileHandler = container.resolve(QueueFileHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('filesToTasks', () => {
    it(`returns a tasks`, () => {
      // Arrange
      const batchSize = 5;
      const modelId = '12345'
      const expectedResponse: ICreateTaskBody<ITaskParameters>[] = [{ type: taskType, parameters: { paths: ['a', 'f'], modelId: modelId } }];

      // Act
      fs.writeFileSync(LineByLine, 'a\nf', { encoding: 'utf8', flag: 'w' });
      jest.spyOn(fs, 'fetch').mockImplementation(() => mockFetchPromise);
      const tasks = queueFileHandler.filesToTasks(batchSize, modelId);

      // Assert
      expect(tasks).toStrictEqual(expectedResponse);
    });
  });
});
