import { container } from 'tsyringe';
import { FileHandler } from "../../../src/clients/fileHandler";

describe('FileHandler', () => {
  let fileHandler: FileHandler;

  beforeAll(() => {
    fileHandler = container.resolve(FileHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('filesToTasks', () => {
    it(`returns a tasks`, () => {
      // Arrange
      const batchSize = 5;
      const modelId = '12345'
      ;

      // Act
      const extected: ICreateTaskBody<ITaskParameters>[] = [{ type: taskType, parameters: { paths: ['a', 'f'], modelId: modelId } }];
      const tasks = fileHandler.filesToTasks(batchSize, modelId);
      
      // Assert
      expect(tasks).toHaveLength(4);
    });
  });
});
