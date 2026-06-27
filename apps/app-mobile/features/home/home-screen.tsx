import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ViewWrapper from '@/components/View';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorScreen } from '@/components/ui/error-screen';
import { SectionHeader } from '@/components/ui/section-header';
import { useProfileName } from '@/hooks/use-profile-name';
import { useAnnouncementsQuery } from '@/react-query/announcements/announcements-operations';

import { AnnouncementCard } from './components/announcement-card';
import { GreetingHeader } from './components/greeting-header';
import { HomeScreenSkeleton } from './components/home-screen-skeleton';

/**
 * Example home screen. It greets the signed-in member and lists the latest
 * announcements pulled from the API. Use this as the starting point for your
 * own landing screen — swap the announcements feed for whatever your app's
 * primary content is.
 */
export function HomeScreen() {
  const router = useRouter();
  const { firstName, isLoadingProfile } = useProfileName();
  const announcementsQuery = useAnnouncementsQuery();

  const announcements = useMemo(
    () =>
      announcementsQuery.data?.pages.flatMap((page) =>
        page.announcements.edges.map((edge) => edge.node),
      ) ?? [],
    [announcementsQuery.data],
  );

  if (announcementsQuery.isLoading) {
    return <HomeScreenSkeleton />;
  }

  if (announcementsQuery.isError) {
    return <ErrorScreen onRetry={() => announcementsQuery.refetch()} />;
  }

  return (
    <ViewWrapper>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          <GreetingHeader
            firstName={firstName}
            isLoadingProfile={isLoadingProfile}
            stats={[]}
          />

          <View className="px-4">
            <SectionHeader title="Latest announcements" />

            {announcements.length === 0 ? (
              <EmptyState
                title="No announcements yet"
                description="Announcements published by your organization will show up here."
              />
            ) : (
              <View className="gap-3">
                {announcements.map((announcement) => (
                  <AnnouncementCard
                    key={announcement.id}
                    announcement={announcement}
                    onPress={(id) => router.push(`/(main)/announcements/${id}`)}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ViewWrapper>
  );
}
