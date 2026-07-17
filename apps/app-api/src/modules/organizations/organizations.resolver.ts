import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ServiceValidatedArgs } from 'src/common/decorators/service-validated-args.decorator';
import type { RepositoryFilter } from 'src/libs/repository';
import type {
  Organization,
  CreateOrganizationInput,
  UpdateOrganizationInput,
} from '../../graphql/generated/graphql';
import { UserRole } from '../../graphql/generated/graphql';
import { Roles } from '../auth/decorators/roles.decorator';
import { GraphqlAuthGuard } from '../auth/guards/graphql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { OrganizationsService } from './organizations.service';
import type { OrganizationRecord } from './repositories/organizations.repository';

@Resolver('Organization')
export class OrganizationsResolver {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Query('organizations')
  async organizations(
    @Args('filter') filter?: RepositoryFilter<OrganizationRecord>,
  ): Promise<Organization[]> {
    return this.organizationsService.findAll(filter);
  }

  @Query('organization')
  async organization(@Args('id') id: string): Promise<Organization | null> {
    return this.organizationsService.findByIdOrNull(id);
  }

  @Mutation('createOrganization')
  @UseGuards(GraphqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async createOrganization(
    @ServiceValidatedArgs('input') input: CreateOrganizationInput,
  ): Promise<Organization> {
    return this.organizationsService.create(input);
  }

  @Mutation('updateOrganization')
  @UseGuards(GraphqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async updateOrganization(
    @Args('id') id: string,
    @ServiceValidatedArgs('input') input: UpdateOrganizationInput,
  ): Promise<Organization> {
    return this.organizationsService.update(id, input);
  }

  @Mutation('deactivateOrganization')
  @UseGuards(GraphqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async deactivateOrganization(@Args('id') id: string): Promise<Organization> {
    return this.organizationsService.deactivate(id);
  }

  @Mutation('reactivateOrganization')
  @UseGuards(GraphqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async reactivateOrganization(@Args('id') id: string): Promise<Organization> {
    return this.organizationsService.reactivate(id);
  }
}
