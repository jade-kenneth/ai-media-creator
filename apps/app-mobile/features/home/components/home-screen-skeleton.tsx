import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { useThemeColors } from "@/hooks/use-theme-colors";

type SkeletonProps = {
  className?: string;
  navyCard?: boolean;
};

function Skeleton({ className = "", navyCard = false }: SkeletonProps) {
  const colors = useThemeColors();
  const shimmer = useSharedValue(-120);

  useEffect(() => {
    shimmer.value = withRepeat(
      withSequence(
        withTiming(260, { duration: 1200 }),
        withTiming(-120, { duration: 0 }),
      ),
      -1,
      false,
    );
  }, [shimmer]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmer.value }, { rotate: "10deg" }],
  }));

  return (
    <View
      className={`overflow-hidden rounded-lg ${className}`}
      style={{
        backgroundColor: navyCard
          ? "rgba(255,255,255,0.15)"
          : colors.subtleFill,
      }}
    >
      <Animated.View
        className="absolute -top-4 bottom-[-16px] w-12 bg-white opacity-25"
        style={shimmerStyle}
      />
    </View>
  );
}

export function HomeScreenSkeleton() {
  const colors = useThemeColors();

  return (
    <View className="gap-6 px-5 py-6">
      {/* Hero skeleton */}
      <View
        className="gap-3 rounded-2xl p-4"
        style={{
          backgroundColor: colors.primary,
          borderColor: colors.border,
          borderWidth: 0.5,
        }}
      >
        <Skeleton className="h-3 w-24" navyCard />
        <Skeleton className="h-7 w-52" navyCard />
        <Skeleton className="h-4 w-44" navyCard />
        <View className="flex-row gap-3">
          <Skeleton className="h-16 flex-1 rounded-xl" navyCard />
          <Skeleton className="h-16 flex-1 rounded-xl" navyCard />
          <Skeleton className="h-16 flex-1 rounded-xl" navyCard />
        </View>
      </View>

      <Skeleton className="h-16 rounded-[20px]" />

      {/* Quick actions skeleton */}
      <View className="gap-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-28 rounded-[22px]" />
        <View className="flex-row flex-wrap gap-3">
          <Skeleton className="h-[104px] flex-1 rounded-2xl" />
          <Skeleton className="h-[104px] flex-1 rounded-2xl" />
        </View>
        <View className="flex-row flex-wrap gap-3">
          <Skeleton className="h-[104px] flex-1 rounded-2xl" />
          <Skeleton className="h-[104px] flex-1 rounded-2xl" />
        </View>
      </View>

      {/* Pinned announcements skeleton */}
      <View className="gap-3">
        <Skeleton className="h-4 w-40" />
        <View className="flex-row gap-3">
          <Skeleton className="h-32 w-72 rounded-2xl" />
          <Skeleton className="h-32 w-72 rounded-2xl" />
        </View>
      </View>

      {/* Announcements skeleton */}
      <View className="gap-3">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </View>

      {/* Schedules skeleton */}
      <View className="gap-3">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="h-52 rounded-[24px]" />
        <Skeleton className="h-28 rounded-[20px]" />
      </View>

      {/* Community polls skeleton */}
      <View className="gap-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-80 rounded-[24px]" />
      </View>

      {/* Emergency contacts skeleton */}
      <View className="gap-3">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </View>
    </View>
  );
}
