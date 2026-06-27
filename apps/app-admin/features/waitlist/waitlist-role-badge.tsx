import { Badge } from '@/components/ui/badge';
import { WaitlistRole } from '@/react-query/generated__types';
import { WAITLIST_ROLE_LABELS } from './constants';

type WaitlistRoleBadgeProps = {
  role: WaitlistRole;
};

function getRoleClassName(role: WaitlistRole) {
  switch (role) {
    case WaitlistRole.Member:
      return 'bg-primary text-primary-foreground';
    case WaitlistRole.OrganizationOfficial:
      return 'bg-[#171B5A]/10 text-[#171B5A]';
    case WaitlistRole.LguStaff:
      return 'border-[#171B5A]/25 text-[#171B5A]';
    case WaitlistRole.Other:
      return 'bg-muted text-muted-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export function WaitlistRoleBadge({ role }: WaitlistRoleBadgeProps) {
  const variant = role === WaitlistRole.LguStaff ? 'outline' : 'secondary';

  return (
    <Badge variant={variant} className={getRoleClassName(role)}>
      {WAITLIST_ROLE_LABELS[role]}
    </Badge>
  );
}
