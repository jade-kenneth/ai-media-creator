import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { GraphqlContext } from 'src/modules/auth/types/auth-context';

export const CurrentTenant = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string | undefined => {
    if (context.getType<'http' | 'graphql'>() === 'http') {
      return context.switchToHttp().getRequest()?.tenantId;
    }

    const gqlContext = GqlExecutionContext.create(context);
    return gqlContext.getContext<GraphqlContext>()?.req?.tenantId;
  },
);
