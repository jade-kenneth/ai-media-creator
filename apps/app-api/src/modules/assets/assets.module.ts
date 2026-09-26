import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module';
import { S3Module } from '../s3/s3.module';
import { AssetsResolver } from './assets.resolver';
import { AssetsService } from './assets.service';
import { AssetsRepositoryModule } from './repositories/assets.repository.module';

@Module({
  imports: [AssetsRepositoryModule, ProjectsModule, S3Module],
  providers: [AssetsService, AssetsResolver],
  exports: [AssetsService],
})
export class AssetsModule {}
