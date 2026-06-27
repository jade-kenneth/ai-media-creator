import { GuidedOnboardingScreen } from '@/features/auth/guided-onboarding-screen';

export default function OrganizationPickerRoute() {
  return <GuidedOnboardingScreen initialStep="organization" />;
}
