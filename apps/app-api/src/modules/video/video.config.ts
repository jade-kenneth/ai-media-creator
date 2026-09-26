import type { ConfigService } from '@nestjs/config';

/**
 * AI scene clips are offered only with the video beta on, the clip flag on
 * and a video service key set (Product Specification §3.18).
 */
export function aiClipsEnabled(configService: ConfigService): boolean {
  return (
    configService.get<boolean>('VIDEO_BETA_ENABLED') === true &&
    configService.get<boolean>('AI_CLIPS_ENABLED') === true &&
    Boolean(configService.get<string>('MINIMAX_API_KEY'))
  );
}
