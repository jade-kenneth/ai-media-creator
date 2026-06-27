import { Text, View } from 'react-native';

import { useThemeColors } from '@/hooks/use-theme-colors';

type ComingSoonOverlayProps = {
  icon: string;
  title: string;
  subtitle?: string;
  borderRadius?: number;
};

export function ComingSoonOverlay({
  icon,
  title,
  subtitle,
  borderRadius = 20,
}: ComingSoonOverlayProps) {
  const colors = useThemeColors();

  return (
    <View
      className="absolute inset-0 items-center justify-center px-5"
      pointerEvents="none"
      style={{
        backgroundColor: colors.isDark
          ? 'rgba(13,16,51,0.82)'
          : 'rgba(255,255,255,0.72)',
        borderRadius,
      }}
    >
      <Text className="text-[32px] leading-9">{icon}</Text>
      <Text
        className="mt-2 text-center text-[13px] font-bold"
        numberOfLines={1}
        style={{ color: colors.bodyText }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          className="mt-0.5 text-center text-[11px]"
          numberOfLines={2}
          style={{ color: colors.mutedText }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
