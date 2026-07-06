import { GUARDS_METADATA } from '@nestjs/common/constants';
import { UserRole } from 'src/graphql/generated/graphql';
import { ROLES_KEY } from '../auth/auth.constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MailController } from './mail.controller';

describe('MailController', () => {
  it('guards email sending with admin-only JWT auth', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      MailController.prototype.send,
    );
    const roles = Reflect.getMetadata(ROLES_KEY, MailController.prototype.send);

    expect(guards).toContain(JwtAuthGuard);
    expect(guards).toContain(RolesGuard);
    expect(roles).toEqual([UserRole.ADMIN]);
  });
});
