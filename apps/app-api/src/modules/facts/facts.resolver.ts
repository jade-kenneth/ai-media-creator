import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentOwner } from 'src/common/decorators/current-owner.decorator';
import { ServiceValidatedArgs } from 'src/common/decorators/service-validated-args.decorator';
import type { OwnerContext } from 'src/common/types/owner-context';
import type {
  AddProductFactInput,
  ProductFact,
  Project,
  SetProductFactStatusInput,
  UpdateProductFactTextInput,
} from 'src/graphql/generated/graphql';
import { GraphqlAuthGuard } from '../auth/guards/graphql-auth.guard';
import { FactsService } from './facts.service';

@Resolver()
@UseGuards(GraphqlAuthGuard)
export class FactsResolver {
  constructor(private readonly factsService: FactsService) {}

  @Query('productFacts')
  productFacts(
    @Args('projectId') projectId: string,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<ProductFact[]> {
    return this.factsService.list(projectId, owner);
  }

  @Mutation('continueToFacts')
  continueToFacts(
    @Args('projectId') projectId: string,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<Project> {
    return this.factsService.continueToFacts(projectId, owner);
  }

  @Mutation('addProductFact')
  addProductFact(
    @ServiceValidatedArgs('input') input: AddProductFactInput,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<ProductFact> {
    return this.factsService.add(owner, input);
  }

  @Mutation('updateProductFactText')
  updateProductFactText(
    @ServiceValidatedArgs('input') input: UpdateProductFactTextInput,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<ProductFact> {
    return this.factsService.updateText(owner, input);
  }

  @Mutation('setProductFactStatus')
  setProductFactStatus(
    @ServiceValidatedArgs('input') input: SetProductFactStatusInput,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<ProductFact> {
    return this.factsService.setStatus(owner, input);
  }

  @Mutation('removeProductFact')
  removeProductFact(
    @Args('id') id: string,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<boolean> {
    return this.factsService.remove(id, owner);
  }
}
