import { View } from "react-native";

import { useThemeColors } from "@/hooks/use-theme-colors";

function Bone({
  className = "",
  tone,
}: {
  className?: string;
  tone: string;
}) {
  return (
    <View
      className={`rounded-md ${className}`}
      style={{ backgroundColor: tone }}
    />
  );
}

export function ProfileSkeleton() {
  const colors = useThemeColors();
  const boneTone = colors.isDark ? "rgba(255,255,255,0.15)" : "#e8ecf5";

  return (
    <View className="gap-5 px-5 py-5">
      {/* Profile hero card */}
      <View
        className="gap-4 rounded-[20px] px-5 py-5"
        style={{ backgroundColor: colors.primary }}
      >
        {/* Avatar + name row */}
        <View className="flex-row items-center gap-4">
          <Bone className="h-20 w-20 rounded-full" tone="rgba(255,255,255,0.15)" />
          <View className="flex-1 gap-2">
            <Bone className="h-5 w-40" tone="rgba(255,255,255,0.15)" />
            <Bone className="h-3.5 w-32" tone="rgba(255,255,255,0.15)" />
            <Bone className="h-5 w-28 rounded-full" tone="rgba(255,255,255,0.15)" />
          </View>
        </View>
        {/* Stats strip */}
        <View
          className="flex-row rounded-2xl px-2 py-3"
          style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
        >
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              className="flex-1 items-center gap-1.5"
              style={i > 0 ? { borderLeftColor: 'rgba(255,255,255,0.1)', borderLeftWidth: 1 } : undefined}
            >
              <Bone className="h-4 w-10" tone="rgba(255,255,255,0.15)" />
              <Bone className="h-3 w-14" tone="rgba(255,255,255,0.1)" />
            </View>
          ))}
        </View>
      </View>

      {/* Digital ID section */}
      <View className="gap-2">
        <Bone className="h-3 w-24" tone={boneTone} />
        <Bone className="h-24 rounded-[20px]" tone={boneTone} />
      </View>

      {/* Personal Information section */}
      <View className="gap-2">
        <Bone className="h-3 w-36" tone={boneTone} />
        <View
          className="rounded-xl border px-4"
          style={{
            backgroundColor: colors.cardBg,
            borderColor: colors.border,
            borderWidth: 0.5,
          }}
        >
          {[0, 1, 2].map((i) => (
            <View key={i}>
              <View className="flex-row items-center justify-between py-3">
                <Bone className="h-3.5 w-20" tone={boneTone} />
                <Bone className="h-3.5 w-28" tone={boneTone} />
              </View>
              {i < 2 && (
                <View className="h-px" style={{ backgroundColor: colors.border }} />
              )}
            </View>
          ))}
        </View>
      </View>

      {/* My Documents section */}
      <View className="gap-2">
        <Bone className="h-3 w-28" tone={boneTone} />
        <Bone className="h-14 rounded-[14px]" tone={boneTone} />
      </View>

      {/* Settings section */}
      <View className="gap-2">
        <Bone className="h-3 w-16" tone={boneTone} />
        <View
          className="rounded-xl border"
          style={{
            backgroundColor: colors.cardBg,
            borderColor: colors.border,
            borderWidth: 0.5,
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <View key={i}>
              <View className="flex-row items-center gap-3 px-4 py-3.5">
                <Bone className="h-9 w-9 rounded-full" tone={boneTone} />
                <View className="flex-1 gap-1.5">
                  <Bone className="h-3.5 w-32" tone={boneTone} />
                  {i > 0 && <Bone className="h-3 w-24" tone={boneTone} />}
                </View>
                <Bone className="h-5 w-12 rounded-full" tone={boneTone} />
              </View>
              {i < 3 && (
                <View className="mx-4 h-px" style={{ backgroundColor: colors.border }} />
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Log out text */}
      <View className="items-center py-3">
        <Bone className="h-3.5 w-16" tone={boneTone} />
      </View>
    </View>
  );
}
