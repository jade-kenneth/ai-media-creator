import { Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { TOKENS } from 'src/types/tokens';
import { AnnouncementsRepositoryFactory } from './announcements.repository';

@Module({
  imports: [],
  providers: [
    {
      provide: TOKENS.ANNOUNCEMENTS_REPOSITORY, // IDENTIFIER FOR DEPENDENCY INJECTION
      useFactory: AnnouncementsRepositoryFactory, // FACTORY FUNCTION TO CREATE THE REPOSITORY INSTANCE
      inject: [getConnectionToken()], // INJECTING THE MONGOOSE CONNECTION TO THE FACTORY FUNCTION
    },
  ],
  exports: [TOKENS.ANNOUNCEMENTS_REPOSITORY], // IDENTIFIER FOR DEPENDENCY INJECTION
})
export class AnnouncementsRepositoryModule {}
