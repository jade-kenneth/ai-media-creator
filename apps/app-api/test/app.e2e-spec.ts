import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({
          environment: expect.any(String),
          runtime: {
            memoryUsage: {
              arrayBuffersBytes: expect.any(Number),
              externalBytes: expect.any(Number),
              heapTotalBytes: expect.any(Number),
              heapUsedBytes: expect.any(Number),
              rssBytes: expect.any(Number),
            },
            nodeVersion: expect.any(String),
            pid: expect.any(Number),
            service: expect.any(String),
            uptimeSeconds: expect.any(Number),
          },
          status: expect.any(String),
          timestamp: expect.any(String),
          database: {
            status: expect.any(String),
            readyState: expect.any(Number),
          },
        });
      });
  });
});
