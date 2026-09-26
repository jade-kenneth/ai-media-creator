import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentOwner } from 'src/common/decorators/current-owner.decorator';
import { ServiceValidatedArgs } from 'src/common/decorators/service-validated-args.decorator';
import type { OwnerContext } from 'src/common/types/owner-context';
import type {
  AssetUploadTicket,
  CreateAssetUploadInput,
  ProjectAsset,
} from 'src/graphql/generated/graphql';
import { GraphqlAuthGuard } from '../auth/guards/graphql-auth.guard';
import { AssetsService } from './assets.service';

@Resolver()
@UseGuards(GraphqlAuthGuard)
export class AssetsResolver {
  constructor(private readonly assetsService: AssetsService) {}

  @Query('projectAssets')
  projectAssets(
    @Args('projectId') projectId: string,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<ProjectAsset[]> {
    return this.assetsService.list(projectId, owner);
  }

  @Mutation('createAssetUpload')
  createAssetUpload(
    @ServiceValidatedArgs('input') input: CreateAssetUploadInput,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<AssetUploadTicket> {
    return this.assetsService.createUpload(owner, input);
  }

  @Mutation('completeAssetUpload')
  completeAssetUpload(
    @Args('id') id: string,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<ProjectAsset> {
    return this.assetsService.completeUpload(id, owner);
  }

  @Mutation('removeAsset')
  removeAsset(
    @Args('id') id: string,
    @CurrentOwner() owner: OwnerContext,
  ): Promise<boolean> {
    return this.assetsService.remove(id, owner);
  }
}
