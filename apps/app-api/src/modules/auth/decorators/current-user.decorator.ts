import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { AuthenticatedUser, GraphqlContext } from '../types/auth-context';

export const CurrentUser = createParamDecorator(
  (
    _data: unknown,
    context: ExecutionContext,
  ): AuthenticatedUser | undefined => {
    if (context.getType<'http' | 'graphql'>() === 'http') {
      return context.switchToHttp().getRequest()?.user;
    }

    const gqlContext = GqlExecutionContext.create(context);
    return gqlContext.getContext<GraphqlContext>()?.req?.user;
  },
);
