import { Module } from '@nestjs/common';
import { RenderProbe } from './render.probe';
import { RenderService } from './render.service';

@Module({
  providers: [RenderProbe, RenderService],
  exports: [RenderProbe, RenderService],
})
export class RenderModule {}
