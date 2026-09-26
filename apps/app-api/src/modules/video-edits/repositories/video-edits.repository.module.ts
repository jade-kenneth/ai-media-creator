import { Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { TOKENS } from 'src/types/tokens';
import { VideoEditsRepositoryFactory } from './video-edits.repository';

@Module({
  providers: [
    {
      provide: TOKENS.VIDEO_EDITS_REPOSITORY,
      useFactory: VideoEditsRepositoryFactory,
      inject: [getConnectionToken()],
    },
  ],
  exports: [TOKENS.VIDEO_EDITS_REPOSITORY],
})
export class VideoEditsRepositoryModule {}
