import * as supertest from 'supertest';
import { Payload } from '../../../../src/common/interfaces';

export class IngestionRequestSender {
  public constructor(private readonly app: Express.Application) {}

  public async createModel(payload: Payload): Promise<supertest.Response> {
    return supertest.agent(this.app).post('/ingestion').set('Content-Type', 'application/json').send(payload);
  }
}
