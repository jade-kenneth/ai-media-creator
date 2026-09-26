import { Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { TOKENS } from 'src/types/tokens';
import { ProjectsRepositoryFactory } from './projects.repository';

@Module({
  providers: [
    {
      provide: TOKENS.PROJECTS_REPOSITORY,
      useFactory: ProjectsRepositoryFactory,
      inject: [getConnectionToken()],
    },
  ],
  exports: [TOKENS.PROJECTS_REPOSITORY],
})
export class ProjectsRepositoryModule {}
