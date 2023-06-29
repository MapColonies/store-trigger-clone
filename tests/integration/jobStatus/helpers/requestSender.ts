import * as supertest from 'supertest';

export class JobStatusRequestSender {
  public constructor(private readonly app: Express.Application) {}

  public async checkStatus(id: string): Promise<supertest.Response> {
    return supertest.agent(this.app).get(`/jobStatus/${id}`).set('Content-Type', 'application/json');
  }
}
