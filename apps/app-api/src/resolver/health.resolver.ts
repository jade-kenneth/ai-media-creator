import { Query, Resolver } from '@nestjs/graphql';
import { AppService } from '../app.service';

@Resolver()
export class HealthResolver {
  constructor(private readonly appService: AppService) {}

  @Query('_health')
  health(): 'ok' | 'degraded' {
    return this.appService.getHealthStatus();
  }
}
