import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { TURNSTILE_ACTION_KEY } from './turnstile.constants';
import { TurnstileService, type TurnstileRequest } from './turnstile.service';

@Injectable()
export class TurnstileGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly turnstileService: TurnstileService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const action = this.reflector.getAllAndOverride<string>(
      TURNSTILE_ACTION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!action) {
      return true;
    }

    await this.turnstileService.assertVerified(resolveRequest(context), {
      action,
    });

    return true;
  }
}

function resolveRequest(context: ExecutionContext): TurnstileRequest {
  const request =
    context.getType<string>() === 'graphql'
      ? GqlExecutionContext.create(context).getContext<{
          req?: TurnstileRequest;
        }>()?.req
      : context.switchToHttp().getRequest<TurnstileRequest | undefined>();

  if (!request?.headers) {
    throw new InternalServerErrorException(
      'Turnstile could not read the incoming request.',
    );
  }

  return request;
}
