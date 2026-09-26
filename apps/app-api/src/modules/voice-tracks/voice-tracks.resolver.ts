import { UseGuards } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import type { VoiceOption } from 'src/graphql/generated/graphql';
import { GraphqlAuthGuard } from '../auth/guards/graphql-auth.guard';
import { VoiceTracksService } from './voice-tracks.service';

@Resolver()
@UseGuards(GraphqlAuthGuard)
export class VoiceTracksResolver {
  constructor(private readonly voiceTracksService: VoiceTracksService) {}

  @Query('voiceOptions')
  voiceOptions(): Promise<VoiceOption[]> {
    return this.voiceTracksService.options();
  }
}
