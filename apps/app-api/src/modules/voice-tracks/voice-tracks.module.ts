import { Module } from '@nestjs/common';
import { S3Module } from '../s3/s3.module';
import { VoiceModule } from '../voice/voice.module';
import { VoiceTracksRepositoryModule } from './repositories/voice-tracks.repository.module';
import { VoiceTracksResolver } from './voice-tracks.resolver';
import { VoiceTracksService } from './voice-tracks.service';

@Module({
  imports: [VoiceTracksRepositoryModule, VoiceModule, S3Module],
  providers: [VoiceTracksService, VoiceTracksResolver],
  exports: [VoiceTracksService],
})
export class VoiceTracksModule {}
