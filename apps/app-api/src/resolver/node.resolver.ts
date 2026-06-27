import { Parent, ResolveField, Resolver } from '@nestjs/graphql';

type GraphqlNode = {
  __typename?: string;
  nodeType?: string;
};

@Resolver('Node')
export class NodeResolver {
  @ResolveField('__resolveType')
  resolveType(@Parent() node: GraphqlNode): string | null {
    return node.__typename ?? node.nodeType ?? null;
  }
}
