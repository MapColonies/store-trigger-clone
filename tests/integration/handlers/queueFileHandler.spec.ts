import fs from 'fs';
import { QueueFileHandler } from '../../../src/handlers/queueFileHandler';

describe('QueueFileHandler', () => {
    let queueFileHandler: QueueFileHandler;

    beforeEach(async () => {
        queueFileHandler = new QueueFileHandler();
        await queueFileHandler.initialize();
    });

    afterEach(async () => {
        await queueFileHandler.emptyQueueFile();
    });

    it('should be able to write a file name to the queue file and read it', async () => {
        const fileName = 'test-file.txt';
        await queueFileHandler.writeFileNameToQueueFile(fileName);

        const line = queueFileHandler.readline();

        expect(line).toBe(fileName);
    });

    it('should be able to empty the queue file', async () => {
        const fileName = 'test-file.txt';
        await queueFileHandler.writeFileNameToQueueFile(fileName);

        let isEmpty = await queueFileHandler.checkIfTempFileEmpty();
        expect(isEmpty).toBe(false);

        await queueFileHandler.emptyQueueFile();
        isEmpty = await queueFileHandler.checkIfTempFileEmpty();
        expect(isEmpty).toBe(true);
    });

    it('should be able to create a queue file', async () => {
        const filePath = queueFileHandler['queueFilePath'];
        await queueFileHandler.emptyQueueFile();
        await queueFileHandler.createQueueFile();

        const fileExists = await fs.promises.access(filePath, fs.constants.F_OK)
            .then(() => true)
            .catch(() => false);
        expect(fileExists).toBe(true);
    });
});
