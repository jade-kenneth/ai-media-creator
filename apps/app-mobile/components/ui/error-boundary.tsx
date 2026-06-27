import { Component, type ReactNode } from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { useThemeColors } from "@/hooks/use-theme-colors";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  private retry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return <ErrorBoundaryFallback onRetry={this.retry} />;
  }
}

function ErrorBoundaryFallback({ onRetry }: { onRetry: () => void }) {
  const colors = useThemeColors();
  const { t } = useTranslation();

  return (
    <View
      className="flex-1 items-center justify-center px-6"
      style={{ backgroundColor: colors.screenBg }}
    >
      <View
        className="w-full max-w-md gap-4 rounded-3xl p-6"
        style={{
          backgroundColor: colors.cardBg,
          borderColor: colors.border,
          borderWidth: 0.5,
        }}
      >
        <Text
          accessibilityRole="header"
          className="text-xl font-semibold"
          style={{ color: colors.bodyText }}
        >
          {t("common.unexpectedErrorTitle")}
        </Text>
        <Text
          className="text-sm leading-6"
          style={{ color: colors.secondaryText }}
        >
          {t("common.unexpectedErrorDescription")}
        </Text>
        <Button label={t("common.retry")} onPress={onRetry} />
      </View>
    </View>
  );
}
