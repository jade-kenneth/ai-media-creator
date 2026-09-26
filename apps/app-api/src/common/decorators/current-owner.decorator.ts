import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { GraphqlContext } from 'src/modules/auth/types/auth-context';
import type { OwnerContext } from '../types/owner-context';

/**
 * The owner context for creator-owned studio data: the authenticated user and
 * the tenant resolved by the tenant middleware. Use behind GraphqlAuthGuard.
 */
export const CurrentOwner = createParamDecorator(
  (_data: unknown, context: ExecutionContext): OwnerContext => {
    const request =
      GqlExecutionContext.create(context).getContext<GraphqlContext>().req;

    return {
      ownerId: request.user?.id ?? '',
      organizationId: request.tenantId ?? null,
    };
  },
);
