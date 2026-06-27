import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Badge, getCategoryLabel } from '@/components/ui/badge';
import { getAnnouncementIconSource } from '@/features/announcements/utils/announcement-icon';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { AnnouncementRecordFragment } from '@/react-query/generated__types';
import { AnnouncementCategory } from '@/react-query/generated__types';
import { formatAnnouncementTime } from '@/utils/date';
import { getPlainTextFromRichTextHtml } from '@/utils/rich-text';

import { PinnedBadge } from './pinned-badge';

type AnnouncementListItemProps = {
  announcement: AnnouncementRecordFragment;
  onPress: (id: string) => void;
};

const GOLD_CATEGORIES: AnnouncementCategory[] = [
  AnnouncementCategory.Event,
  AnnouncementCategory.HealthAdvisory,
  AnnouncementCategory.PowerInterruption,
];

const ACCENT_NAVY = '#1e3a5f';
const ACCENT_GOLD = '#b7791f';

function AnnouncementListItemComponent({
  announcement,
  onPress,
}: AnnouncementListItemProps) {
  const colors = useThemeColors();
  const previewContent = getPlainTextFromRichTextHtml(announcement.content);
  const isGold = GOLD_CATEGORIES.includes(announcement.category);
  const tone: 'navy' | 'gold' = isGold ? 'gold' : 'navy';
  const accentColor = isGold ? ACCENT_GOLD : ACCENT_NAVY;

  if (announcement.coverImageUrl) {
    const coverUrl = announcement.coverImageUrl;

    return (
      <Pressable
        accessibilityHint="Opens the full announcement details."
        accessibilityLabel={`View announcement ${announcement.title}`}
        className="rounded-2xl shadow-sm shadow-black/5 active:opacity-80 dark:shadow-none"
        onPress={() => onPress(announcement.id)}
        style={{
          backgroundColor: colors.cardBg,
          borderColor: colors.border,
          borderWidth: 0.5,
          overflow: 'hidden',
        }}
      >
        <View className="h-44">
          <Image
            cachePolicy="memory-disk"
            contentFit="cover"
            source={{ uri: coverUrl }}
            style={{ width: '100%', height: '100%' }}
            transition={200}
          />
          <View className="absolute left-3 top-3">
            <Badge
              label={getCategoryLabel(announcement.category)}
              tone={tone}
              variant="custom"
            />
          </View>
          {announcement.isPinned ? (
            <View className="absolute right-3 top-3">
              <PinnedBadge />
            </View>
          ) : null}
          <View
            className="absolute bottom-3 left-3 items-center justify-center rounded-xl"
            style={{
              width: 36,
              height: 36,
              backgroundColor: 'rgba(255,255,255,0.92)',
            }}
          >
            <Image
              contentFit="contain"
              source={getAnnouncementIconSource(announcement.category)}
              style={{ width: 24, height: 24 }}
            />
          </View>
        </View>

        <View className="gap-1.5 px-4 py-3">
          <Text
            className="text-base font-semibold leading-6"
            numberOfLines={2}
            style={{ color: colors.bodyText }}
          >
            {announcement.title}
          </Text>
          <Text
            className="text-sm leading-5"
            numberOfLines={2}
            style={{ color: colors.secondaryText }}
          >
            {previewContent}
          </Text>
          <Text className="text-xs" style={{ color: colors.mutedText }}>
            {formatAnnouncementTime(announcement.publishedAt)}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityHint="Opens the full announcement details."
      accessibilityLabel={`View announcement ${announcement.title}`}
      className="rounded-2xl shadow-sm shadow-black/5 active:opacity-80 dark:shadow-none"
      onPress={() => onPress(announcement.id)}
      style={{
        backgroundColor: colors.cardBg,
        borderColor: colors.border,
        borderWidth: 0.5,
        borderLeftColor: accentColor,
        borderLeftWidth: 3,
        overflow: 'hidden',
      }}
    >
      <View className="flex-row items-start gap-3 px-4 py-3">
        <View
          className="items-center justify-center rounded-xl"
          style={{
            width: 52,
            height: 52,
            backgroundColor: colors.subtleFill,
          }}
        >
          <Image
            contentFit="contain"
            source={getAnnouncementIconSource(announcement.category)}
            style={{ width: 36, height: 36 }}
          />
        </View>

        <View className="flex-1 gap-1.5">
          <View className="flex-row flex-wrap items-center justify-between gap-1">
            <Badge
              label={getCategoryLabel(announcement.category)}
              tone={tone}
              variant="custom"
            />
            {announcement.isPinned ? <PinnedBadge /> : null}
          </View>
          <Text
            className="text-base font-semibold leading-6"
            numberOfLines={2}
            style={{ color: colors.bodyText }}
          >
            {announcement.title}
          </Text>
          <Text
            className="text-sm leading-5"
            numberOfLines={2}
            style={{ color: colors.secondaryText }}
          >
            {previewContent}
          </Text>
          <Text className="text-xs" style={{ color: colors.mutedText }}>
            {formatAnnouncementTime(announcement.publishedAt)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export const AnnouncementListItem = memo(AnnouncementListItemComponent);
