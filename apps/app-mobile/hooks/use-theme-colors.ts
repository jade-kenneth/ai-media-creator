import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors } from '@/theme/colors';

export function useThemeColors() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return {
    primary: colors.primary,
    primaryInteractive: isDark ? colors.dark.primaryInteractive : colors.primaryInteractive,
    accent: colors.accent,
    accentDark: colors.accentDark,
    screenBg: isDark ? colors.dark.screenBg : colors.screenBg,
    cardBg: isDark ? colors.dark.cardBg : colors.cardBg,
    elevatedCard: isDark ? colors.dark.elevatedCard : colors.cardBg,
    border: isDark ? colors.dark.border : colors.border,
    cardBorder: isDark ? colors.dark.cardBorder : colors.cardBorder,
    bodyText: isDark ? colors.dark.bodyText : colors.bodyText,
    secondaryText: isDark ? colors.dark.secondaryText : colors.secondaryText,
    mutedText: isDark ? colors.dark.mutedText : colors.mutedText,
    subtleFill: isDark ? colors.dark.subtleFill : colors.subtleFill,
    goldPillBg: isDark ? colors.dark.goldPillBg : colors.goldPillBg,
    goldPillText: isDark ? colors.dark.goldPillText : colors.goldPillText,
    goldPillBorder: isDark ? colors.dark.goldPillBorder : colors.goldPillBorder,
    comingSoonBg: isDark ? colors.dark.comingSoonBg : colors.comingSoonBg,
    comingSoonText: isDark ? colors.dark.comingSoonText : colors.comingSoonText,
    comingSoonBorder: isDark ? colors.dark.comingSoonBorder : colors.comingSoonBorder,
    successBg: isDark ? colors.dark.successBg : colors.successBg,
    successText: isDark ? colors.dark.successText : colors.successText,
    successBorder: isDark ? colors.dark.successBorder : colors.successBorder,
    infoBg: isDark ? colors.dark.infoBg : colors.infoBg,
    infoText: isDark ? colors.dark.infoText : colors.infoText,
    infoBorder: isDark ? colors.dark.infoBorder : colors.infoBorder,
    warningBg: isDark ? colors.dark.warningBg : colors.warningBg,
    warningText: isDark ? colors.dark.warningText : colors.warningText,
    warningBorder: isDark ? colors.dark.warningBorder : colors.warningBorder,
    requestPendingBg: isDark
      ? colors.dark.requestPendingBg
      : colors.requestPendingBg,
    requestReviewBg: isDark
      ? colors.dark.requestReviewBg
      : colors.requestReviewBg,
    requestApprovedBg: isDark
      ? colors.dark.requestApprovedBg
      : colors.requestApprovedBg,
    requestRejectedBg: isDark
      ? colors.dark.requestRejectedBg
      : colors.requestRejectedBg,
    requestReadyBg: isDark ? colors.dark.requestReadyBg : colors.requestReadyBg,
    requestReadyText: isDark
      ? colors.dark.requestReadyText
      : colors.requestReadyText,
    requestReadyBorder: isDark
      ? colors.dark.requestReadyBorder
      : colors.requestReadyBorder,
    heroBg: isDark ? colors.dark.heroBg : colors.heroBg,
    heroOverlay: isDark ? colors.dark.heroOverlay : colors.heroOverlay,
    cardShadowColor: isDark
      ? colors.dark.cardShadowColor
      : colors.cardShadowColor,
    tabActive: isDark ? colors.dark.tabActive : colors.tabActive,
    tabInactive: isDark ? colors.dark.tabInactive : colors.tabInactive,
    errorBg: isDark ? colors.dark.errorBg : colors.errorBg,
    errorBorder: isDark ? colors.dark.errorBorder : colors.errorBorder,
    error: isDark ? colors.dark.error : colors.error,
    isDark,
  };
}
