import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { useThemeColors } from '@/hooks/use-theme-colors';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
};

export function PageHeader({ title, subtitle, rightSlot }: PageHeaderProps) {
  const colors = useThemeColors();

  return (
    <View className="flex-row items-start justify-between gap-3 px-5 pb-2 pt-4">
      <View className="min-w-0 flex-1 gap-0.5">
        <Text
          accessibilityRole="header"
          className="text-[24px] font-semibold leading-8"
          numberOfLines={1}
          style={{ color: colors.bodyText }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            className="text-[13px]"
            numberOfLines={2}
            style={{ color: colors.mutedText }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightSlot ? <View className="min-h-12 justify-center">{rightSlot}</View> : null}
    </View>
  );
}
