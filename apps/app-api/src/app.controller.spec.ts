import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getConnectionToken } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) =>
              key === 'NODE_ENV' ? 'test' : undefined,
            ),
          },
        },
        {
          provide: getConnectionToken(),
          useValue: { readyState: 1 },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('home', () => {
    it('should return the boilerplate landing HTML', () => {
      expect(appController.getHome()).toContain('App Boilerplate API');
    });
  });

  describe('health', () => {
    it('should return an ok health response', () => {
      expect(appController.getHealthEndpoint()).toEqual({
        environment: 'test',
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
          service: 'app-api',
          uptimeSeconds: expect.any(Number),
        },
        status: 'ok',
        timestamp: expect.any(String),
        database: {
          status: 'connected',
          readyState: 1,
        },
      });
    });
  });
});
