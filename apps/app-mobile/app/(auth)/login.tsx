import { GuidedOnboardingScreen } from '@/features/auth/guided-onboarding-screen';

export default function LoginRoute() {
  return <GuidedOnboardingScreen initialStep="login" />;
}
