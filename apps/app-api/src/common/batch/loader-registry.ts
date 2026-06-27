import { Inject, Injectable, forwardRef } from '@nestjs/common';
import type { MemberProfile, User } from 'src/graphql/generated/graphql';
import type { UserRecord } from 'src/modules/users/repositories/users.repository';
import { UsersService } from 'src/modules/users/users.service';
import type { AuthenticatedRequest } from '../../modules/auth/types/auth-context';
import { MembersService } from '../../modules/members/members.service';
import {
  createBatchLoader,
  type RequestBatchLoader,
} from './request-batch-loader';

export type LoaderRegistry = {
  memberByUserId: RequestBatchLoader<string, MemberProfile>;
  memberById: RequestBatchLoader<string, MemberProfile>;
  userById: RequestBatchLoader<string, User>;
  userRecordById: RequestBatchLoader<string, UserRecord>;
};

@Injectable()
export class LoaderFactory {
  constructor(
    @Inject(forwardRef(() => MembersService))
    private readonly membersService: MembersService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  forRequest(req: AuthenticatedRequest): LoaderRegistry {
    req.__loaders ??= this.build();

    return req.__loaders;
  }

  private build(): LoaderRegistry {
    return {
      memberByUserId: createBatchLoader((userIds) =>
        this.membersService.findManyByUserIds(userIds),
      ),
      memberById: createBatchLoader((ids) =>
        this.membersService.findManyByIds(ids),
      ),
      userById: createBatchLoader((ids) =>
        this.usersService.findManyByIds(ids),
      ),
      userRecordById: createBatchLoader((ids) =>
        this.usersService.findManyRecordsByIds(ids),
      ),
    };
  }
}
