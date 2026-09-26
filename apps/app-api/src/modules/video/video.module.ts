import { Module } from '@nestjs/common';
import { MiniMaxVideoProvider } from './providers/minimax-video.provider';

@Module({
  providers: [MiniMaxVideoProvider],
  exports: [MiniMaxVideoProvider],
})
export class VideoModule {}
