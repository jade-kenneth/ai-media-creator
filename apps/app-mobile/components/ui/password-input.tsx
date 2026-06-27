import { useState } from "react";
import { Pressable, Text, type TextInputProps } from "react-native";

import { useThemeColors } from "@/hooks/use-theme-colors";

import { FormInput } from "./form-input";

type PasswordInputProps = Omit<TextInputProps, "secureTextEntry"> & {
  error?: string;
  forceLight?: boolean;
  label: string;
};

export function PasswordInput({
  error,
  forceLight = false,
  label,
  ...props
}: PasswordInputProps) {
  const colors = useThemeColors();
  const [isVisible, setIsVisible] = useState(false);

  return (
    <FormInput
      error={error}
      forceLight={forceLight}
      label={label}
      secureTextEntry={!isVisible}
      rightSlot={
        <Pressable
          accessibilityLabel={isVisible ? "Hide password" : "Show password"}
          accessibilityRole="button"
          onPress={() => setIsVisible((value) => !value)}
        >
          <Text className="text-sm font-medium" style={{ color: colors.primary }}>
            {isVisible ? "Hide" : "Show"}
          </Text>
        </Pressable>
      }
      {...props}
    />
  );
}
