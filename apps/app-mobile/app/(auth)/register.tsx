import { GuidedOnboardingScreen } from '@/features/auth/guided-onboarding-screen';

export default function RegisterRoute() {
  return <GuidedOnboardingScreen initialStep="register-name" />;
}
