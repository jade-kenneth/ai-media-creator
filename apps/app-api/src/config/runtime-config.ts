import { ConfigService } from '@nestjs/config';
import { resolve } from 'node:path';

const projectRoot = resolve(__dirname, '..', '..');
const workspaceRoot = resolve(projectRoot, '..', '..');

export function resolveEnvFilePaths(): string[] {
  return [
    resolve(projectRoot, '.env'),
    resolve(workspaceRoot, '.env'),
  ];
}

export function createMongoConnectionOptions(
  configService: ConfigService,
) {
  const mongodbUri = configService.get<string>('MONGODB_URI');

  if (!mongodbUri) {
    throw new Error('MONGODB_URI is not configured.');
  }

  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  return {
    uri: mongodbUri,
    autoIndex: !isProduction,
    onConnectionCreate: (connection) => {
      connection.on('connected', () => {
        console.log('MongoDB connection established.');
      });
      connection.on('disconnected', () => {
        console.warn('MongoDB connection disconnected.');
      });
      connection.on('error', (error) => {
        console.error(`MongoDB connection error: ${error.message}`);
      });
    },
    connectionErrorFactory: (error) => {
      console.error(`MongoDB connection failed: ${error.message}`);

      return error;
    },
  };
}
