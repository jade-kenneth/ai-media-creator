import type { PropsWithChildren } from "react";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

type ScreenContainerProps = PropsWithChildren<{
  className?: string;
  edges?: Edge[];
}>;

export function ScreenContainer({
  children,
  className = "",
  edges = ["bottom", "left", "right"],
}: ScreenContainerProps) {
  return (
    <SafeAreaView
      className={`flex-1 bg-brand-screen-bg px-5 py-6 dark:bg-brand-dark-bg ${className}`}
      edges={edges}
    >
      {children}
    </SafeAreaView>
  );
}
