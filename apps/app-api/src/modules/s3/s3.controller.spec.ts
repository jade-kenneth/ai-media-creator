import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { S3Controller } from './s3.controller';

describe('S3Controller', () => {
  it('guards presigned upload URL creation with JWT auth', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      S3Controller.prototype.createPresignedUploadUrl,
    );

    expect(guards).toContain(JwtAuthGuard);
  });
});
