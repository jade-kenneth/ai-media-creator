import { Module } from '@nestjs/common';
import { ElevenLabsVoiceProvider } from './providers/elevenlabs-voice.provider';
import { VoiceService } from './voice.service';

@Module({
  providers: [ElevenLabsVoiceProvider, VoiceService],
  exports: [VoiceService],
})
export class VoiceModule {}
