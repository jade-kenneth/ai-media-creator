import { EditProfileScreen } from '@/features/profile/edit-profile-screen';
import { useFeatureFlag } from '@/hooks/use-feature-flag';
import { FEATURE_FLAGS } from '@/utils/feature-flags';
import { router } from 'expo-router';
import { useEffect } from 'react';

export default function EditProfileRoute() {
  const isEnabled = useFeatureFlag(FEATURE_FLAGS.MEMBER_PROFILE);

  useEffect(() => {
    if (!isEnabled) {
      router.replace('/(main)/(tabs)');
    }
  }, [isEnabled]);

  if (!isEnabled) return null;
  return <EditProfileScreen />;
}
