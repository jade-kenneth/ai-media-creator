import { ScrollView, Text } from 'react-native';
import type { ReactNode } from 'react';
import type { SFSymbol } from 'sf-symbols-typescript';

import { EmptyState } from '@/components/ui/empty-state';
import { useThemeColors } from '@/hooks/use-theme-colors';

type PlaceholderScreenProps = {
  actionLabel?: string;
  description: string;
  icon: SFSymbol;
  iconFallback?: ReactNode;
  onAction?: () => void;
  title: string;
};

export function PlaceholderScreen({
  actionLabel,
  description,
  icon,
  iconFallback,
  onAction,
  title,
}: PlaceholderScreenProps) {
  const colors = useThemeColors();

  return (
    <ScrollView
      contentContainerClassName="flex-grow justify-center px-5 py-8"
      contentContainerStyle={{ backgroundColor: colors.screenBg }}
      contentInsetAdjustmentBehavior="automatic">
      <EmptyState
        actionLabel={actionLabel}
        description={description}
        icon={icon}
        iconFallback={
          iconFallback ?? (
            <Text
              className="text-2xl font-semibold"
              style={{ color: colors.primary }}
            >
              •
            </Text>
          )
        }
        onAction={onAction}
        title={title}
      />
    </ScrollView>
  );
}
