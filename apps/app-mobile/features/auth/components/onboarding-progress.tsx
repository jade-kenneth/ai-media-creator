import { View } from 'react-native';

import { colors } from '@/theme/colors';

type OnboardingProgressProps = {
  activeStep: number;
  totalSteps?: number;
};

export function OnboardingProgress({
  activeStep,
  totalSteps = 3,
}: OnboardingProgressProps) {
  return (
    <View className="mt-3 flex-row items-center justify-center gap-2">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const isActive = index <= activeStep;
        return (
          <View
            key={index}
            className="h-2 rounded-full"
            style={{
              width: isActive ? 24 : 8,
              backgroundColor: isActive ? colors.primary : '#d6deed',
            }}
          />
        );
      })}
    </View>
  );
}
