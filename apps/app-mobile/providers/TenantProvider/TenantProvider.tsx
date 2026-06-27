import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import {
  clearSelectedOrganization,
  getSelectedOrganization,
  saveSelectedOrganization,
} from './store';
import type { SelectedOrganization } from './types';
import { organizationsRequest } from '@/react-query/organizations/organizations-operations';

type TenantContextValue = {
  tenant: SelectedOrganization | null;
  isLoading: boolean;
  setTenant: (organization: SelectedOrganization) => Promise<void>;
  clearTenant: () => Promise<void>;
};

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({ children }: PropsWithChildren) {
  const [tenant, setTenantState] = useState<SelectedOrganization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    void getSelectedOrganization().then((saved) => {
      if (!isMountedRef.current) return;
      if (!saved) {
        setTenantState(null);
        setIsLoading(false);
        return;
      }

      setTenantState(saved);
      setIsLoading(false);

      void refreshTenant(saved).then((freshTenant) => {
        if (!isMountedRef.current || !freshTenant) return;
        setTenantState(freshTenant);
      });
    });

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const refreshTenant = useCallback(
    async (organization: SelectedOrganization): Promise<SelectedOrganization | null> => {
      const result = await organizationsRequest({
        filter: {
          slug: organization.organizationSlug,
          isActive: true,
        },
      });

      if (!result.ok || !result.data.organizations[0]) {
        const fallback = { ...organization, features: organization.features ?? [] };
        await saveSelectedOrganization(fallback);
        return fallback;
      }

      const fresh = result.data
        .organizations[0] as (typeof result.data.organizations)[0] & {
        features?: string[];
      };
      const merged: SelectedOrganization = {
        address: fresh.address ?? null,
        organizationId: fresh.id,
        organizationSlug: fresh.slug,
        organizationName: fresh.name,
        organizationLogoUrl: fresh.logoUrl ?? null,
        contactNumber: fresh.contactNumber ?? null,
        primaryColor: fresh.primaryColor ?? null,
        features: Array.isArray(fresh.features) ? fresh.features : [],
      };
      await saveSelectedOrganization(merged);
      return merged;
    },
    [],
  );

  const setTenant = useCallback(
    async (organization: SelectedOrganization) => {
      const baseTenant = { ...organization, features: organization.features ?? [] };
      await saveSelectedOrganization(baseTenant);
      setTenantState(baseTenant);

      const freshTenant = await refreshTenant(baseTenant);
      if (!freshTenant || !isMountedRef.current) return;
      setTenantState(freshTenant);
    },
    [refreshTenant],
  );

  const clearTenant = useCallback(async () => {
    await clearSelectedOrganization();
    setTenantState(null);
  }, []);

  return (
    <TenantContext.Provider
      value={{ tenant, isLoading, setTenant, clearTenant }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be used within TenantProvider');
  return ctx;
}
