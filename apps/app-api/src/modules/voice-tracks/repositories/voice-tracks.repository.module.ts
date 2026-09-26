import { Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { TOKENS } from 'src/types/tokens';
import { VoiceTracksRepositoryFactory } from './voice-tracks.repository';

@Module({
  providers: [
    {
      provide: TOKENS.VOICE_TRACKS_REPOSITORY,
      useFactory: VoiceTracksRepositoryFactory,
      inject: [getConnectionToken()],
    },
  ],
  exports: [TOKENS.VOICE_TRACKS_REPOSITORY],
})
export class VoiceTracksRepositoryModule {}
