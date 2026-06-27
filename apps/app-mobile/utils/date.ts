import { format } from "date-fns";
import { enUS } from "date-fns/locale";

import i18n from "@/i18n";

const dateOptions = { locale: enUS };

const numberFormatter = new Intl.NumberFormat();

export function formatCount(value: number) {
  return numberFormatter.format(value);
}

export function formatAnnouncementTime(publishedAt: string | null | undefined) {
  if (!publishedAt) {
    return i18n.t("common.dateUnavailable");
  }

  const date = new Date(publishedAt);

  if (Number.isNaN(date.getTime())) {
    return i18n.t("common.dateUnavailable");
  }

  return format(date, "MMM d, yyyy", dateOptions);
}

export function formatFullDate(dateValue: string | null | undefined) {
  if (!dateValue) {
    return i18n.t("common.unknownDate");
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return i18n.t("common.unknownDate");
  }

  return format(date, "MMMM d, yyyy · h:mm a", dateOptions);
}

export function formatScheduleDate(dateValue: string) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return i18n.t("common.tbd");
  }

  return format(date, "MMM d", dateOptions);
}

export function formatShortDate(dateValue: string | null | undefined) {
  if (!dateValue) {
    return "—";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return format(date, "MMMM d, yyyy", dateOptions);
}
