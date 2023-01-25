import * as supertest from 'supertest';

export class JobStatusRequestSender {
  public constructor(private readonly app: Express.Application) {}

  public async getResource(): Promise<supertest.Response> {
    return supertest.agent(this.app).get('/jobStatus').set('Content-Type', 'application/json');
  }
}
