import { useTenant } from '@/providers/TenantProvider';
import { useThemeColors } from '@/hooks/use-theme-colors';

import { colors } from './colors';

export function useTenantColors() {
  const { tenant } = useTenant();
  const themeColors = useThemeColors();
  const primary = tenant?.primaryColor ?? colors.primary;

  if (primary === colors.primary) return themeColors;

  return {
    ...themeColors,
    primary,
    subtleFill: `${primary}10`,
  };
}
