import type { Request, Response } from 'express';
import type { UserRole } from 'src/graphql/generated/graphql';

export enum TokenType {
  ACCESS = 'ACCESS',
  REFRESH = 'REFRESH',
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  type: TokenType;
  jti: string;
  tenantSlug?: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  jti: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  tenantId?: string;
  tenantSlug?: string;
}

export interface GraphqlContext {
  req: AuthenticatedRequest;
  res?: Response;
}
