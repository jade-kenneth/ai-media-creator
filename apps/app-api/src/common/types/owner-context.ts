/**
 * Who a studio record belongs to: the signed-in creator and the tenant
 * (workspace) from the request context. Never taken from client input.
 */
export interface OwnerContext {
  ownerId: string;
  organizationId: string | null;
}
