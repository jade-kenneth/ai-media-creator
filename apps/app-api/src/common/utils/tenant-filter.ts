import type { RepositoryFilter } from 'src/libs/repository';

export function applyTenantFilter<T>(
  filter: RepositoryFilter<T> | undefined,
  tenantId: string | null | undefined,
): RepositoryFilter<T> {
  if (!tenantId) return filter ?? {};
  return { ...filter, organizationId: tenantId } as unknown as RepositoryFilter<T>;
}
