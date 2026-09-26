import { ConfigService } from '@nestjs/config';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const projectRoot = resolve(__dirname, '..', '..');
const workspaceRoot = resolve(projectRoot, '..', '..');

export function resolveEnvFilePaths(): string[] {
  return [resolve(projectRoot, '.env'), resolve(workspaceRoot, '.env')];
}

/**
 * The absolute folder media jobs make their work folders in. A blank
 * RENDER_TMP_DIR counts as unset: the schema drops it, and ConfigService then
 * returns the raw '' from process.env. A relative folder would break FFmpeg,
 * which runs with the work folder as its working directory.
 */
export function resolveRenderTmpDir(configService: ConfigService): string {
  return resolve(
    configService.get<string>('RENDER_TMP_DIR')?.trim() || tmpdir(),
  );
}

export function createMongoConnectionOptions(configService: ConfigService) {
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
