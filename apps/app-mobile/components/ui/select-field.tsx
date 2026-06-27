import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

import { useThemeColors } from "@/hooks/use-theme-colors";

type SelectOption<T extends string> = {
  label: string;
  value: T;
};

type SelectFieldProps<T extends string> = {
  error?: string;
  label: string;
  options: SelectOption<T>[];
  placeholder: string;
  value?: T;
  onChange: (value: T) => void;
};

export function SelectField<T extends string>({
  error,
  label,
  onChange,
  options,
  placeholder,
  value,
}: SelectFieldProps<T>) {
  const colors = useThemeColors();
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = options.find((option) => option.value === value)?.label;

  return (
    <View className="gap-2">
      <Text className="text-sm font-medium" style={{ color: colors.bodyText }}>
        {label}
      </Text>
      <Pressable
        accessibilityLabel={`${label}, ${selectedLabel ?? placeholder}`}
        accessibilityHint="Opens a selection list"
        accessibilityRole="button"
        className="min-h-12 justify-center rounded-2xl border px-4"
        style={{
          backgroundColor: colors.cardBg,
          borderColor: error ? colors.error : colors.border,
          borderWidth: 0.5,
        }}
        onPress={() => setIsOpen(true)}
      >
        <Text
          className="text-base"
          style={{ color: selectedLabel ? colors.bodyText : colors.mutedText }}
        >
          {selectedLabel ?? placeholder}
        </Text>
      </Pressable>
      {error ? (
        <Text selectable className="text-sm" style={{ color: colors.error }}>
          {error}
        </Text>
      ) : null}

      <Modal animationType="slide" transparent visible={isOpen}>
        <View
          className="flex-1 justify-end"
          style={{
            backgroundColor: colors.isDark
              ? 'rgba(0, 0, 0, 0.65)'
              : 'rgba(0, 0, 0, 0.4)',
          }}
        >
          <View
            className="gap-2 rounded-t-3xl px-5 py-6"
            style={{
              backgroundColor: colors.cardBg,
              borderTopColor: colors.border,
              borderTopWidth: 0.5,
            }}
          >
            <Text className="text-lg font-semibold" style={{ color: colors.bodyText }}>
              {label}
            </Text>
            {options.map((option) => (
              <Pressable
                accessibilityLabel={option.label}
                accessibilityRole="button"
                accessibilityState={{ selected: option.value === value }}
                className="rounded-2xl px-4 py-3 active:opacity-80"
                key={option.value}
                onPress={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                style={{
                  backgroundColor:
                    option.value === value ? colors.infoBg : colors.subtleFill,
                }}
              >
                <Text
                  className="text-base"
                  style={{
                    color:
                      option.value === value ? colors.infoText : colors.bodyText,
                  }}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              className="mt-2 items-center rounded-2xl px-4 py-3 active:opacity-85"
              onPress={() => setIsOpen(false)}
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-base font-medium text-white">Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
