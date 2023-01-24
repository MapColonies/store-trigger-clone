import * as supertest from 'supertest';

export class ExportRequestSender {
  public constructor(private readonly app: Express.Application) {}

  public async getResource(): Promise<supertest.Response> {
    return supertest.agent(this.app).get('/export').set('Content-Type', 'application/json');
  }

  public async createResource(): Promise<supertest.Response> {
    return supertest.agent(this.app).post('/export').set('Content-Type', 'application/json');
  }
}
