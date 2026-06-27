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

function SummarySkeleton() {
  const colors = useThemeColors();

  return (
    <View
      className="overflow-hidden rounded-[28px] border shadow-sm shadow-black/5"
      style={{
        backgroundColor: colors.cardBg,
        borderColor: colors.border,
        borderWidth: 0.5,
      }}
    >
      <View
        className="gap-4 px-4 py-4"
        style={{ backgroundColor: colors.elevatedCard }}
      >
        <View className="flex-row items-start gap-3">
          <Bone className="h-12 w-12 rounded-2xl bg-white/15" />
          <View className="flex-1 gap-2">
            <Bone className="h-3 w-32 rounded-full bg-white/15" />
            <Bone className="h-6 w-36 bg-white/15" />
            <Bone className="h-3 w-full bg-white/15" />
            <Bone className="h-3 w-4/5 bg-white/15" />
          </View>
        </View>
        <Bone className="h-12 w-full rounded-2xl bg-white/15" />
      </View>

      <View className="gap-4 px-4 py-4">
        <View className="flex-row gap-2">
          <Bone className="h-[68px] flex-1 rounded-2xl" />
          <Bone className="h-[68px] flex-1 rounded-2xl" />
          <Bone className="h-[68px] flex-1 rounded-2xl" />
        </View>
        <Bone className="h-12 w-full rounded-2xl" />
      </View>
    </View>
  );
}

function SkeletonItem({ unread = false }: { unread?: boolean }) {
  const colors = useThemeColors();

  return (
    <View
      className="overflow-hidden rounded-[24px] border shadow-sm shadow-black/5"
      style={{
        backgroundColor: colors.cardBg,
        borderColor: colors.border,
        borderWidth: 0.5,
      }}
    >
      <View className="flex-row">
        {/* Accent stripe */}
        <View
          className="w-1"
          style={{
            backgroundColor: unread
              ? colors.primary
              : 'transparent',
          }}
        />
        <View className="flex-1 flex-row items-start gap-3 px-4 py-[18px]">
          <Bone className="h-12 w-12 rounded-[18px]" />
          <View className="flex-1 gap-2">
            {/* Type row */}
            <View className="flex-row items-center justify-between gap-2">
              <Bone className="h-3 w-24 rounded-full" />
              {unread ? <Bone className="h-5 w-12 rounded-full" /> : null}
            </View>
            {/* Title */}
            <Bone className={`h-4 ${unread ? 'w-4/5' : 'w-3/4'}`} />
            {/* Message */}
            <Bone className="h-3 w-full" />
            <Bone className="h-3 w-2/3" />
            {/* Timestamp */}
            <View className="flex-row items-center justify-between pt-0.5">
              <Bone className="h-2.5 w-16" />
              <Bone className="h-3 w-12 rounded-full" />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

export function NotificationsListSkeleton() {
  return (
    <View className="gap-3 px-5 pb-4 pt-1">
      <SummarySkeleton />

      {/* Simulated NEW section */}
      <Bone className="h-3 w-8" />
      <SkeletonItem unread />
      <SkeletonItem unread />

      {/* Simulated EARLIER section */}
      <View className="pt-2">
        <Bone className="h-3 w-16" />
      </View>
      <SkeletonItem />
      <SkeletonItem />
      <SkeletonItem />
    </View>
  );
}
