export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    if (!payload) return null;

    const padded = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(padded);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getJwtTenantSlug(token: string): string | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  const slug = payload['tenantSlug'];
  if (typeof slug !== 'string' || !slug) return null;

  return slug;
}
