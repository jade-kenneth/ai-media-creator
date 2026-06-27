import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { Badge, getCategoryLabel } from '@/components/ui/badge';
import { ErrorScreen } from '@/components/ui/error-screen';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useAnnouncementQuery } from '@/react-query/announcements/announcements-operations';
import { AnnouncementCategory } from '@/react-query/generated__types';
import { formatAnnouncementTime, formatFullDate } from '@/utils/date';

import { AnnouncementDetailSkeleton } from './components/announcement-detail-skeleton';
import { ContentRenderer } from './components/content-renderer';
import { PinnedBadge } from './components/pinned-badge';

export function AnnouncementDetailScreen() {
  const colors = useThemeColors();
  const sectionTitleColor = colors.isDark ? colors.bodyText : colors.primary;
  const { id } = useLocalSearchParams<{ id: string }>();

  const query = useAnnouncementQuery(id ? { id } : undefined, {
    enabled: !!id,
  });

  const announcement = query.data?.announcement ?? null;

  // Loading
  if (query.isLoading) {
    return <AnnouncementDetailSkeleton />;
  }

  // Error
  if (query.isError) {
    return (
      <ErrorScreen
        description="We couldn't load this announcement. Please try again."
        onRetry={() => query.refetch()}
        title="Unable to load announcement"
      />
    );
  }

  // Not found
  if (!announcement) {
    return (
      <ErrorScreen
        description="This announcement may have been removed or is no longer available."
        title="Announcement not found"
      />
    );
  }

  const goldCategories: AnnouncementCategory[] = [
    AnnouncementCategory.Event,
    AnnouncementCategory.HealthAdvisory,
    AnnouncementCategory.PowerInterruption,
  ];
  const tone: 'navy' | 'gold' = goldCategories.includes(announcement.category)
    ? 'gold'
    : 'navy';

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: colors.screenBg }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      {announcement.coverImageUrl ? (
        <View className="h-64 w-full">
          <Image
            accessibilityLabel={`Cover image for ${announcement.title}`}
            accessibilityRole="image"
            contentFit="cover"
            source={{ uri: announcement.coverImageUrl }}
            style={{ width: '100%', height: '100%' }}
          />
          <View className="absolute inset-0 bg-black/15" />
        </View>
      ) : null}

      <View
        className={`gap-4 px-5 pb-8 ${announcement.coverImageUrl ? '-mt-6' : 'pt-5'}`}
      >
        <View
          className="gap-4 rounded-xl border p-5"
          style={{
            backgroundColor: colors.cardBg,
            borderColor: colors.border,
            borderWidth: 0.5,
          }}
        >
          <View className="flex-row flex-wrap items-center gap-2">
            <Badge
              variant="custom"
              label={getCategoryLabel(announcement.category)}
              tone={tone}
            />
            {announcement.isPinned ? <PinnedBadge /> : null}
          </View>

          <Text
            accessibilityRole="header"
            className="text-2xl font-medium leading-8"
            style={{ color: colors.bodyText }}
            selectable
          >
            {announcement.title}
          </Text>

          <View
            className="gap-2 rounded-xl px-3 py-3"
            style={{ backgroundColor: colors.subtleFill }}
          >
            <View className="flex-row items-center gap-2">
              <MaterialIcons color={colors.mutedText} name="event" size={14} />
              <Text className="text-sm" style={{ color: colors.mutedText }}>
                {formatFullDate(announcement.publishedAt)}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <MaterialIcons
                color={colors.mutedText}
                name="schedule"
                size={14}
              />
              <Text className="text-xs" style={{ color: colors.mutedText }}>
                {formatAnnouncementTime(announcement.publishedAt)}
              </Text>
            </View>
          </View>
        </View>

        <View
          className="gap-4 rounded-xl border p-5"
          style={{
            backgroundColor: colors.cardBg,
            borderColor: colors.border,
            borderWidth: 0.5,
          }}
        >
          <View className="flex-row items-center gap-2">
            <MaterialIcons color={sectionTitleColor} name="article" size={16} />
            <Text
              className="text-sm font-semibold uppercase tracking-wide"
              style={{ color: sectionTitleColor }}
            >
              Announcement Details
            </Text>
          </View>

          <View className="h-px" style={{ backgroundColor: colors.border }} />

          <ContentRenderer content={announcement.content} />
        </View>
      </View>
    </ScrollView>
  );
}
