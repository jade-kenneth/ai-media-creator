import { View } from "react-native";

import { useThemeColors } from "@/hooks/use-theme-colors";

function Bone({ className = "" }: { className?: string }) {
  const colors = useThemeColors();

  return (
    <View
      className={`rounded-md ${className}`}
      style={{ backgroundColor: colors.subtleFill }}
    />
  );
}

type SkeletonCardProps = {
  withImage?: boolean;
};

export function SkeletonCard({ withImage = false }: SkeletonCardProps) {
  const colors = useThemeColors();

  if (withImage) {
    return (
      <View
        className="overflow-hidden rounded-2xl border shadow-sm shadow-black/5"
        style={{
          backgroundColor: colors.cardBg,
          borderColor: colors.border,
          borderWidth: 0.5,
        }}
      >
        <View
          className="h-44"
          style={{ backgroundColor: colors.subtleFill }}
        />
        <View className="gap-2 px-4 py-3">
          <Bone className="h-5 w-3/4" />
          <Bone className="h-4 w-full" />
          <Bone className="h-4 w-5/6" />
          <Bone className="h-3 w-24" />
        </View>
      </View>
    );
  }

  return (
    <View
      className="rounded-2xl border border-l-4 shadow-sm shadow-black/5"
      style={{
        backgroundColor: colors.cardBg,
        borderColor: colors.border,
        borderWidth: 0.5,
      }}
    >
      <View className="flex-row items-start gap-3 px-4 py-3">
        <Bone className="h-14 w-14 rounded-xl" />
        <View className="flex-1 gap-2 pt-0.5">
          <Bone className="h-5 w-20 rounded-full" />
          <Bone className="h-5 w-3/4" />
          <Bone className="h-4 w-full" />
          <Bone className="h-3 w-24" />
        </View>
      </View>
    </View>
  );
}
