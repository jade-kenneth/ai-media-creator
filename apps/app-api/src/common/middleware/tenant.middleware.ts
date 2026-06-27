import { ForbiddenException, Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { UserRole } from 'src/graphql/generated/graphql';
import type {
  AuthenticatedRequest,
  JwtPayload,
} from 'src/modules/auth/types/auth-context';
import { OrganizationsService } from 'src/modules/organizations/organizations.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly organizationsService: OrganizationsService) {}

  async use(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.slice(7);
    const decoded = jwt.decode(token) as JwtPayload | null;

    if (!decoded?.tenantSlug || decoded.role === UserRole.SUPER_ADMIN) {
      return next();
    }

    const organization = await this.organizationsService.findBySlug(decoded.tenantSlug);

    if (!organization || !organization.isActive) {
      throw new ForbiddenException('Tenant not found or inactive.');
    }

    req.tenantId = organization.id;
    req.tenantSlug = organization.slug;

    next();
  }
}
