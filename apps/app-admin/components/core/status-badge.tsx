import type { LucideIcon } from 'lucide-react';
import {
  Ban,
  CheckCheck,
  CheckCircle,
  Clock,
  Package,
  Search,
  XCircle,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils';

type ToneBadgeProps = {
  icon: LucideIcon;
  label: string;
  className: string;
};

function ToneBadge({ icon: Icon, label, className }: ToneBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        'h-6 gap-1.5 rounded-full border border-black/5 px-2.5 py-1 text-[11px] font-semibold shadow-sm dark:border-white/10',
        className,
      )}
    >
      <Icon className="size-3.5" />
      {label}
    </Badge>
  );
}

const documentStatusMap = {
  PENDING: {
    label: 'Pending',
    icon: Clock,
    className:
      'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    icon: Search,
    className: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  },
  APPROVED: {
    label: 'Approved',
    icon: CheckCircle,
    className:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  },
  REJECTED: {
    label: 'Rejected',
    icon: XCircle,
    className: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
  },
  READY_FOR_PICKUP: {
    label: 'Ready for Pickup',
    icon: Package,
    className:
      'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  },
  COMPLETED: {
    label: 'Completed',
    icon: CheckCheck,
    className:
      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: Ban,
    className:
      'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
  },
} as const;

const announcementCategoryMap = {
  NEWS: {
    label: 'News',
    icon: Search,
    className: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  },
  EVENT: {
    label: 'Event',
    icon: Package,
    className:
      'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  },
  EMERGENCY: {
    label: 'Emergency',
    icon: XCircle,
    className: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
  },
  ROAD_CLOSURE: {
    label: 'Road Closure',
    icon: Clock,
    className:
      'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
  },
  POWER_INTERRUPTION: {
    label: 'Power Interruption',
    icon: Ban,
    className:
      'bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400',
  },
  HEALTH_ADVISORY: {
    label: 'Health Advisory',
    icon: CheckCircle,
    className:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  },
  GENERAL_NOTICE: {
    label: 'General Notice',
    icon: CheckCheck,
    className:
      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
} as const;

const scheduleCategoryMap = {
  GARBAGE_COLLECTION: {
    label: 'Garbage Collection',
    icon: CheckCircle,
    className:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  },
  VACCINATION: {
    label: 'Vaccination',
    icon: Search,
    className: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  },
  CLINIC_SCHEDULE: {
    label: 'Clinic Schedule',
    icon: Search,
    className: 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400',
  },
  PAYOUT_SCHEDULE: {
    label: 'Payout Schedule',
    icon: Clock,
    className:
      'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  },
  ORGANIZATION_EVENT: {
    label: 'Organization Event',
    icon: Package,
    className:
      'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  },
  CLEANUP_DRIVE: {
    label: 'Cleanup Drive',
    icon: CheckCircle,
    className: 'bg-lime-50 text-lime-700 dark:bg-lime-950 dark:text-lime-400',
  },
  GENERAL_SCHEDULE: {
    label: 'General Schedule',
    icon: CheckCheck,
    className:
      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
} as const;

const publishStateMap = {
  PUBLISHED: {
    label: 'Published',
    icon: CheckCircle,
    className:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  },
  DRAFT: {
    label: 'Draft',
    icon: Clock,
    className:
      'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  },
} as const;

export function DocumentStatusBadge({
  status,
}: {
  status: keyof typeof documentStatusMap;
}) {
  const config = documentStatusMap[status];
  return <ToneBadge {...config} />;
}

export function AnnouncementCategoryBadge({
  category,
}: {
  category: keyof typeof announcementCategoryMap;
}) {
  const config = announcementCategoryMap[category];
  return <ToneBadge {...config} />;
}

export function ScheduleCategoryBadge({
  category,
}: {
  category: keyof typeof scheduleCategoryMap;
}) {
  const config = scheduleCategoryMap[category];
  return <ToneBadge {...config} />;
}

export function PublishStateBadge({
  state,
}: {
  state: keyof typeof publishStateMap;
}) {
  const config = publishStateMap[state];
  return <ToneBadge {...config} />;
}
