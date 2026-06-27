import type { UserRecord } from '../users/repositories/users.repository';
import type { AuthenticatedUser } from './types/auth-context';

export function toAuthenticatedUser(
  user: Pick<UserRecord, 'email' | 'id' | 'isActive' | 'role'>,
  jti: string,
): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    jti: jti,
  };
}
