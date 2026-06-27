import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

export interface HealthResponse {
  environment: 'development' | 'production' | 'test';
  runtime: {
    memoryUsage: {
      arrayBuffersBytes: number;
      externalBytes: number;
      heapTotalBytes: number;
      heapUsedBytes: number;
      rssBytes: number;
    };
    nodeVersion: string;
    pid: number;
    service: string;
    uptimeSeconds: number;
  };
  status: 'ok' | 'degraded';
  timestamp: string;
  database: {
    status: DatabaseStatus;
    readyState: number;
  };
}

type DatabaseStatus =
  | 'disconnected'
  | 'connected'
  | 'connecting'
  | 'disconnecting'
  | 'uninitialized';

@Injectable()
export class AppService {
  constructor(
    @InjectConnection()
    private readonly connection: Connection,
    private readonly configService: ConfigService,
  ) {}

  getHealth(): HealthResponse {
    const database = {
      readyState: this.connection.readyState,
      status: mapDatabaseStatus(this.connection.readyState),
    };
    const memoryUsage = process.memoryUsage();

    return {
      environment:
        this.configService.get<'development' | 'production' | 'test'>(
          'NODE_ENV',
        ) ?? 'development',
      runtime: {
        memoryUsage: {
          arrayBuffersBytes: memoryUsage.arrayBuffers,
          externalBytes: memoryUsage.external,
          heapTotalBytes: memoryUsage.heapTotal,
          heapUsedBytes: memoryUsage.heapUsed,
          rssBytes: memoryUsage.rss,
        },
        nodeVersion: process.version,
        pid: process.pid,
        service: 'app-api',
        uptimeSeconds: roundUptimeSeconds(process.uptime()),
      },
      status: database.status === 'connected' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      database,
    };
  }

  getHealthStatus(): HealthResponse['status'] {
    return this.getHealth().status;
  }
}

function mapDatabaseStatus(readyState: number): DatabaseStatus {
  switch (readyState) {
    case 0:
      return 'disconnected';
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    case 3:
      return 'disconnecting';
    default:
      return 'uninitialized';
  }
}

function roundUptimeSeconds(value: number): number {
  return Math.round(value * 1000) / 1000;
}
