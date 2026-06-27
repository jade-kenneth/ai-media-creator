import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useThemeColors } from '@/hooks/use-theme-colors';

type ComingSoonPillProps = {
  compact?: boolean;
};

export function ComingSoonPill({ compact = false }: ComingSoonPillProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();

  return (
    <View
      accessibilityLabel={t('common.comingSoon')}
      className="self-start rounded-full border px-2 py-0.5"
      importantForAccessibility="no"
      style={{
        backgroundColor: colors.comingSoonBg,
        borderColor: colors.comingSoonBorder,
        borderWidth: 0.5,
      }}
    >
      <Text
        className="text-[10px] font-extrabold uppercase"
        style={{ color: colors.comingSoonText, letterSpacing: 0.5 }}
      >
        {compact ? t('common.soon') : t('common.comingSoon')}
      </Text>
    </View>
  );
}
