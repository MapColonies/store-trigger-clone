import jsLogger from '@map-colonies/js-logger';
import { JobStatusManager } from '../../../../src/jobStatus/models/jobStatusManager';

let jobStatusManager: JobStatusManager;

describe('ExportManager', () => {
  beforeEach(function () {
    jobStatusManager = new JobStatusManager(jsLogger({ enabled: false }));
  });
  describe('#getResource', () => {
    it('should return resource of kind avi', function () {
      // action
      const resource = jobStatusManager.getResource();

      // expectation
      expect(resource.kind).toBe('avi');
      expect(resource.isAlive).toBe(false);
    });
  });
});
