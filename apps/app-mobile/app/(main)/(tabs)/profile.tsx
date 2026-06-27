import { useFeatureFlag } from '@/hooks/use-feature-flag';
import { FEATURE_FLAGS } from '@/utils/feature-flags';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ProfileScreen } from '@/features/profile/profile-screen';

export default function ProfileTabRoute() {
  const isEnabled = useFeatureFlag(FEATURE_FLAGS.MEMBER_PROFILE);

  useEffect(() => {
    if (!isEnabled) {
      router.replace('/(main)/(tabs)');
    }
  }, [isEnabled]);

  if (!isEnabled) return null;
  return <ProfileScreen />;
}
