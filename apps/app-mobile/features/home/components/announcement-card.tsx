import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Badge, getCategoryLabel } from '@/components/ui/badge';
import { getAnnouncementIconSource } from '@/features/announcements/utils/announcement-icon';
import { useThemeColors } from '@/hooks/use-theme-colors';
import {
  AnnouncementCategory,
  type AnnouncementRecordFragment,
} from '@/react-query/generated__types';
import { formatAnnouncementTime } from '@/utils/date';
import { getPlainTextFromRichTextHtml } from '@/utils/rich-text';

type AnnouncementCardProps = {
  announcement: AnnouncementRecordFragment;
  onPress: (id: string) => void;
  compact?: boolean;
};

function getBadgeTone(category: AnnouncementCategory): 'navy' | 'gold' | 'red' {
  if (category === AnnouncementCategory.Emergency) return 'red';
  if (
    category === AnnouncementCategory.Event ||
    category === AnnouncementCategory.HealthAdvisory ||
    category === AnnouncementCategory.PowerInterruption
  ) {
    return 'gold';
  }
  return 'navy';
}

function AnnouncementCardComponent({
  announcement,
  onPress,
  compact = false,
}: AnnouncementCardProps) {
  const colors = useThemeColors();
  const previewContent = getPlainTextFromRichTextHtml(announcement.content);
  const hasCover = Boolean(announcement.coverImageUrl) && !compact;

  async function handlePress() {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // silently ignore — haptics unavailable on some devices
    }
    onPress(announcement.id);
  }

  return (
    <Pressable
      accessibilityLabel={`Open announcement ${announcement.title}`}
      accessibilityRole="button"
      className={`overflow-hidden rounded-2xl border active:opacity-80 ${compact ? 'min-w-[272px]' : ''}`}
      onPress={handlePress}
      style={{
        backgroundColor: colors.cardBg,
        borderColor: colors.border,
        borderWidth: 0.5,
      }}
    >
      {announcement.category === AnnouncementCategory.Emergency ? (
        <View className="h-1 w-full" style={{ backgroundColor: colors.error }} />
      ) : null}

      {hasCover ? (
        <View className="h-44">
          <Image
            cachePolicy="memory-disk"
            contentFit="cover"
            source={{ uri: announcement.coverImageUrl ?? '' }}
            style={{ height: '100%', width: '100%' }}
            transition={180}
          />


          <View className="absolute left-3 top-3">
            <Badge
              label={getCategoryLabel(announcement.category)}
              tone={getBadgeTone(announcement.category)}
              variant="custom"
            />
          </View>

          {announcement.isPinned ? (
            <View className="absolute right-3 top-3 flex-row items-center gap-1 rounded-full px-2 py-0.5"
              style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
            >
              <MaterialIcons color="#ffffff" name="push-pin" size={11} />
              <Text className="text-[11px] font-semibold text-white">
                Pinned
              </Text>
            </View>
          ) : null}

          <View
            className="absolute bottom-3 left-3 items-center justify-center rounded-xl"
            style={{
              width: 32,
              height: 32,
              backgroundColor: 'rgba(255,255,255,0.92)',
            }}
          >
            <Image
              contentFit="contain"
              source={getAnnouncementIconSource(announcement.category)}
              style={{ width: 22, height: 22 }}
            />
          </View>
        </View>
      ) : null}

      <View className={`gap-3 p-3.5 ${hasCover ? 'pt-5' : ''}`}>
        {!hasCover ? (
          <View className="flex-row items-center gap-2">
            {announcement.isPinned ? (
              <View className="flex-row items-center gap-1">
                <MaterialIcons
                  color={colors.isDark ? colors.bodyText : colors.primary}
                  name="push-pin"
                  size={12}
                />
                <Text
                  className="text-[11px] font-medium"
                  style={{
                    color: colors.isDark ? colors.bodyText : colors.primary,
                  }}
                >
                  Naka-pin
                </Text>
              </View>
            ) : null}
            <Badge
              label={getCategoryLabel(announcement.category)}
              tone={getBadgeTone(announcement.category)}
              variant="custom"
            />
          </View>
        ) : null}

        <View className={`flex-row items-center gap-2 ${!hasCover ? '' : ''}`}>
          {!hasCover ? (
            <View
              className={`${compact ? 'h-12 w-12' : 'h-14 w-14'} items-center justify-center rounded-[14px]`}
              style={{ backgroundColor: colors.subtleFill }}
            >
              <Image
                contentFit="contain"
                source={getAnnouncementIconSource(announcement.category)}
                style={{
                  height: compact ? 42 : 48,
                  width: compact ? 42 : 48,
                }}
              />
            </View>
          ) : null}

          <View className="min-w-0 flex-1 gap-1">
            <Text
              className={`${hasCover ? 'text-[15px]' : 'text-sm'} font-semibold leading-snug`}
              numberOfLines={compact ? 2 : 3}
              style={{ color: colors.bodyText }}
            >
              {announcement.title}
            </Text>

            {!compact ? (
              <Text
                className="text-xs leading-[17px]"
                numberOfLines={hasCover ? 2 : 3}
                style={{ color: colors.secondaryText }}
              >
                {previewContent}
              </Text>
            ) : null}
          </View>
        </View>

        {!compact ? (
          <View className="flex-row items-center justify-between gap-3">
            <Text className="text-[11px]" style={{ color: colors.mutedText }}>
              {formatAnnouncementTime(announcement.publishedAt)}
            </Text>
            <Text
              className="text-[11px] font-medium"
              style={{ color: colors.primaryInteractive }}
            >
              Read more →
            </Text>
          </View>
        ) : (
          <Text className="text-[11px]" style={{ color: colors.mutedText }}>
            {formatAnnouncementTime(announcement.publishedAt)}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

export const AnnouncementCard = memo(AnnouncementCardComponent);
