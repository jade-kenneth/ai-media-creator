import {
  KeyboardAvoidingView,
  ScrollView,
  type ScrollViewProps,
} from 'react-native';
import type { PropsWithChildren } from 'react';

type KeyboardAvoidingContainerProps = PropsWithChildren<{
  contentContainerClassName?: string;
  scrollProps?: ScrollViewProps;
}>;

export function KeyboardAvoidingContainer({
  children,
  contentContainerClassName = '',
  scrollProps,
}: KeyboardAvoidingContainerProps) {
  return (
    <KeyboardAvoidingView
      behavior="padding"
      className="flex-1">
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName={`flex-grow gap-6 px-5 py-8 ${contentContainerClassName}`}
        keyboardShouldPersistTaps="handled"
        {...scrollProps}>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
