import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Text, View } from 'react-native';

import { useThemeColors } from '@/hooks/use-theme-colors';

type GreetingStat = {
  label: string;
  value: number;
};

type GreetingHeaderProps = {
  firstName: string;
  isLoadingProfile?: boolean;
  stats: GreetingStat[];
};

const statIconMap: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  Board: 'campaign',
  Schedules: 'event',
  Recaps: 'history-edu',
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Maayong buntag';
  if (hour < 18) return 'Maayong hapon';
  return 'Maayong gabii';
}

function getDayIcon(): string {
  const hour = new Date().getHours();
  return hour >= 18 || hour < 5 ? '🌙' : '☀️';
}

export function GreetingHeader({
  firstName,
  isLoadingProfile = false,
  stats,
}: GreetingHeaderProps) {
  const colors = useThemeColors();

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View
      className="overflow-hidden rounded-2xl p-4"
      style={{ backgroundColor: colors.heroBg }}
    >
      <View
        accessible
        accessibilityLabel="Current day period"
        className="absolute right-0 top-0 h-24 w-24 items-center justify-center rounded-full"
      >
        <View className="absolute inset-0 rounded-full bg-white opacity-[0.06]" />
        <Text className="text-[26px] leading-8">{getDayIcon()}</Text>
      </View>
      <View className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-white opacity-[0.04]" />

      <View className="flex-row items-center justify-between gap-3">
        <Text
          className="text-[12px] font-medium"
          style={{ color: 'rgba(255,255,255,0.68)' }}
        >
          {today}
        </Text>
        {/*
        <Pressable
          accessibilityHint="Shows a coming soon message."
          accessibilityLabel="Weather is coming soon"
          accessibilityRole="button"
          className="min-h-10 flex-row items-center gap-1.5 rounded-full px-3"
          onPress={() =>
            showToast({ message: 'Weather is coming soon!', type: 'info' })
          }
          style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
        >
          <Text className="text-[13px]">☁️</Text>
          <Text className="text-[12px] font-semibold text-white">31°C</Text>
        </Pressable>
        */}
      </View>

      <Text
        accessibilityRole="header"
        className="mt-5 text-[22px] font-bold leading-7 text-white"
        numberOfLines={2}
      >
        {getGreeting()},{'\n'}
        {isLoadingProfile ? 'Member' : firstName}! 👋
      </Text>
      <Text
        className="mt-1 text-[13px] font-medium leading-5"
        style={{ color: 'rgba(255,255,255,0.72)' }}
      >
        {"Here's what's happening in your organization today."}
      </Text>

      <View className="mt-5 flex-row gap-2">
        {stats.map((stat) => (
          <View
            key={stat.label}
            className="min-h-[64px] flex-1 justify-between rounded-2xl px-2.5 py-2.5"
            style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
          >
            <View className="flex-row items-center gap-1.5">
              <MaterialIcons
                color={colors.accent}
                name={statIconMap[stat.label] ?? 'info-outline'}
                size={15}
              />
              <Text
                className="text-[17px] font-bold"
                style={{ color: colors.accent }}
              >
                {stat.value}
              </Text>
            </View>
            <Text
              className="text-[10px] font-medium"
              numberOfLines={1}
              style={{ color: 'rgba(255,255,255,0.72)' }}
            >
              {stat.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
