import { GuidedOnboardingScreen } from '@/features/auth/guided-onboarding-screen';

export default function RegistrationPendingRoute() {
  return <GuidedOnboardingScreen initialStep="submitted" />;
}
