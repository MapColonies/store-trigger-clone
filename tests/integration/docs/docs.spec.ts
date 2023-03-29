import httpStatusCodes from 'http-status-codes';
import { getApp } from '../../../src/app';
import { DocsRequestSender } from './helpers/docsRequestSender';

describe('ingestion', function () {
  let requestSender: DocsRequestSender;
  beforeEach(function () {
    const app = getApp();
    requestSender = new DocsRequestSender(app);
  });

  describe('Happy Path', function () {
    it('should return 200 status code and the resource', async function () {
      const response = await requestSender.getDocs();

      expect(response.status).toBe(httpStatusCodes.MOVED_PERMANENTLY);
      expect(response.redirect).toBe(true);
      expect(response.type).toBe('text/html');
    });
  });
});
