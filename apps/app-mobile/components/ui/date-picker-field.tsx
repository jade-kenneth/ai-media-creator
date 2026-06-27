import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useThemeColors } from "@/hooks/use-theme-colors";

type DatePickerFieldProps = {
  error?: string;
  label: string;
  maximumDate?: Date;
  value?: Date | null;
  onChange: (value: Date) => void;
};

export function DatePickerField({
  error,
  label,
  maximumDate,
  onChange,
  value,
}: DatePickerFieldProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (event: DateTimePickerEvent, nextValue?: Date) => {
    setIsOpen(false);

    if (event.type !== "set" || !nextValue) return;
    onChange(nextValue);
  };

  return (
    <View className="gap-2">
      <Text className="text-sm font-medium" style={{ color: colors.bodyText }}>
        {label}
      </Text>
      <Pressable
        accessibilityLabel={`${label}, ${
          value ? format(value, "MMMM d, yyyy") : t("common.notSelected")
        }`}
        accessibilityHint={t("common.opensDatePicker")}
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
          style={{ color: value ? colors.bodyText : colors.mutedText }}
        >
          {value ? format(value, "MMMM d, yyyy") : t("common.selectBirthdate")}
        </Text>
      </Pressable>
      {error ? (
        <Text selectable className="text-sm" style={{ color: colors.error }}>
          {error}
        </Text>
      ) : null}
      {isOpen ? (
        <DateTimePicker
          display="default"
          maximumDate={maximumDate}
          mode="date"
          onChange={handleChange}
          value={value ?? new Date(2000, 0, 1)}
        />
      ) : null}
    </View>
  );
}
