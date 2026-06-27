import { View } from "react-native";
import { useThemeColors } from "@/hooks/use-theme-colors";

function Bone({ className = "", tone }: { className?: string; tone: string }) {
  return (
    <View className={`rounded-md ${className}`} style={{ backgroundColor: tone }} />
  );
}

export function AnnouncementDetailSkeleton() {
  const colors = useThemeColors();
  const boneTone = colors.isDark ? "rgba(255,255,255,0.15)" : "#e8ecf5";

  return (
    <View className="flex-1" style={{ backgroundColor: colors.screenBg }}>
      <Bone className="h-64 w-full rounded-none" tone={boneTone} />

      <View className="-mt-6 gap-4 px-5 pb-8">
        <View
          className="gap-4 rounded-3xl border p-5"
          style={{
            backgroundColor: colors.cardBg,
            borderColor: colors.border,
            borderWidth: 0.5,
          }}
        >
          <View className="flex-row gap-2">
            <Bone className="h-6 w-24 rounded-full" tone={boneTone} />
            <Bone className="h-6 w-16 rounded-full" tone={boneTone} />
          </View>

          <View className="gap-2">
            <Bone className="h-7 w-full" tone={boneTone} />
            <Bone className="h-7 w-3/4" tone={boneTone} />
          </View>

          <View
            className="gap-2 rounded-2xl px-3 py-3"
            style={{ backgroundColor: colors.subtleFill }}
          >
            <Bone className="h-4 w-44" tone={boneTone} />
            <Bone className="h-3 w-36" tone={boneTone} />
          </View>
        </View>

        <View
          className="gap-4 rounded-3xl border p-5"
          style={{
            backgroundColor: colors.cardBg,
            borderColor: colors.border,
            borderWidth: 0.5,
          }}
        >
          <Bone className="h-4 w-40" tone={boneTone} />
          <View className="h-px" style={{ backgroundColor: colors.border }} />
          <View className="gap-3">
            <Bone className="h-4 w-full" tone={boneTone} />
            <Bone className="h-4 w-full" tone={boneTone} />
            <Bone className="h-4 w-5/6" tone={boneTone} />
            <Bone className="h-4 w-full" tone={boneTone} />
            <Bone className="h-4 w-4/5" tone={boneTone} />
            <Bone className="h-4 w-full" tone={boneTone} />
            <Bone className="h-4 w-2/3" tone={boneTone} />
          </View>
        </View>
      </View>
    </View>
  );
}
