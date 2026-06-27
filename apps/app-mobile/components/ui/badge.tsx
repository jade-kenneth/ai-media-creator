import { Text, View } from "react-native";

import type {
  AnnouncementCategory,
  EmergencyContactType,
  ScheduleCategory,
} from "@/react-query/generated__types";
import { useThemeColors } from "@/hooks/use-theme-colors";

type Tone = "navy" | "gold" | "red";

const categoryTone: Record<AnnouncementCategory, Tone> = {
  EMERGENCY: "red",
  EVENT: "gold",
  GENERAL_NOTICE: "navy",
  HEALTH_ADVISORY: "gold",
  NEWS: "navy",
  POWER_INTERRUPTION: "gold",
  ROAD_CLOSURE: "navy",
};

const scheduleCategoryTone: Record<ScheduleCategory, Tone> = {
  ORGANIZATION_EVENT: "navy",
  CLEANUP_DRIVE: "gold",
  CLINIC_SCHEDULE: "gold",
  GARBAGE_COLLECTION: "gold",
  GENERAL_SCHEDULE: "navy",
  PAYOUT_SCHEDULE: "gold",
  VACCINATION: "navy",
};

const emergencyContactTypeTone: Record<EmergencyContactType, Tone> = {
  AMBULANCE: "red",
  ORGANIZATION_HALL: "navy",
  ORGANIZATION_TANOD: "gold",
  DISASTER_RESPONSE_TEAM: "red",
  FIRE_STATION: "red",
  HEALTH_CENTER: "red",
  POLICE: "navy",
};

const categoryLabels: Record<AnnouncementCategory, string> = {
  EMERGENCY: "Emergency",
  EVENT: "Event",
  GENERAL_NOTICE: "General Notice",
  HEALTH_ADVISORY: "Health Advisory",
  NEWS: "News",
  POWER_INTERRUPTION: "Power Interruption",
  ROAD_CLOSURE: "Road Closure",
};

const scheduleCategoryLabels: Record<ScheduleCategory, string> = {
  ORGANIZATION_EVENT: "Organization Event",
  CLEANUP_DRIVE: "Cleanup Drive",
  CLINIC_SCHEDULE: "Clinic Schedule",
  GARBAGE_COLLECTION: "Garbage Collection",
  GENERAL_SCHEDULE: "General",
  PAYOUT_SCHEDULE: "Payout",
  VACCINATION: "Vaccination",
};

const emergencyContactTypeLabels: Record<EmergencyContactType, string> = {
  AMBULANCE: "Ambulance",
  ORGANIZATION_HALL: "Organization Hall",
  ORGANIZATION_TANOD: "Organization Tanod",
  DISASTER_RESPONSE_TEAM: "Disaster Response",
  FIRE_STATION: "Fire Station",
  HEALTH_CENTER: "Health Center",
  POLICE: "Police",
};

export function getCategoryLabel(category: AnnouncementCategory): string {
  return categoryLabels[category] ?? category;
}

export function getScheduleCategoryLabel(category: ScheduleCategory): string {
  return scheduleCategoryLabels[category] ?? category;
}

export function getEmergencyContactTypeLabel(
  type: EmergencyContactType
): string {
  return emergencyContactTypeLabels[type] ?? type;
}

type BadgeProps =
  | { variant: "category"; value: AnnouncementCategory }
  | { variant: "scheduleCategory"; value: ScheduleCategory }
  | { variant: "emergencyContactType"; value: EmergencyContactType }
  | { variant: "custom"; label: string; tone?: Tone };

export function Badge(props: BadgeProps) {
  const colors = useThemeColors();
  let label: string;
  let tone: Tone;

  switch (props.variant) {
    case "category":
      label = categoryLabels[props.value];
      tone = categoryTone[props.value];
      break;
    case "scheduleCategory":
      label = scheduleCategoryLabels[props.value];
      tone = scheduleCategoryTone[props.value];
      break;
    case "emergencyContactType":
      label = emergencyContactTypeLabels[props.value];
      tone = emergencyContactTypeTone[props.value];
      break;
    case "custom":
      label = props.label;
      tone = props.tone ?? "navy";
      break;
  }

  const palette =
    tone === "gold"
      ? {
          backgroundColor: colors.goldPillBg,
          borderColor: colors.goldPillBorder,
          textColor: colors.goldPillText,
        }
      : tone === "red"
        ? {
            backgroundColor: colors.errorBg,
            borderColor: colors.errorBorder,
            textColor: colors.error,
          }
        : {
            backgroundColor: colors.subtleFill,
            borderColor: colors.cardBorder,
            textColor: colors.isDark ? colors.bodyText : colors.primary,
          };

  return (
    <View
      className="self-start rounded-full border px-2.5 py-0.5"
      style={{
        backgroundColor: palette.backgroundColor,
        borderColor: palette.borderColor,
        borderWidth: 0.5,
      }}
    >
      <Text
        accessibilityLabel={label}
        className="text-xs font-semibold"
        style={{ color: palette.textColor }}
      >
        {label}
      </Text>
    </View>
  );
}
