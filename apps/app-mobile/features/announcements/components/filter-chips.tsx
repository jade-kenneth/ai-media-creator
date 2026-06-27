import { useCallback } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { getCategoryLabel } from "@/components/ui/badge";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { AnnouncementCategory } from "@/react-query/generated__types";

const ALL_CATEGORIES = Object.values(AnnouncementCategory);

type FilterChipsProps = {
  selected: AnnouncementCategory | null;
  onSelect: (category: AnnouncementCategory | null) => void;
};

export function FilterChips({ selected, onSelect }: FilterChipsProps) {
  const handlePress = useCallback(
    (category: AnnouncementCategory | null) => {
      onSelect(category === selected ? null : category);
    },
    [selected, onSelect]
  );

  return (
    <ScrollView
      horizontal
      contentContainerClassName="gap-2 px-5"
      showsHorizontalScrollIndicator={false}
    >
      <Chip
        isSelected={selected === null}
        label="All"
        onPress={() => handlePress(null)}
      />
      {ALL_CATEGORIES.map((category) => (
        <Chip
          key={category}
          isSelected={selected === category}
          label={getCategoryLabel(category)}
          onPress={() => handlePress(category)}
        />
      ))}
    </ScrollView>
  );
}

type ChipProps = {
  isSelected: boolean;
  label: string;
  onPress: () => void;
};

function Chip({ isSelected, label, onPress }: ChipProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={`Filter by ${label}`}
      onPress={onPress}
    >
      <View
        className="rounded-full border px-3.5 py-1.5"
        style={{
          backgroundColor: isSelected ? colors.primary : colors.subtleFill,
          borderColor: isSelected ? colors.primary : colors.border,
          borderWidth: 0.5,
        }}
      >
        <Text
          className="text-sm font-medium"
          style={{ color: isSelected ? colors.cardBg : colors.mutedText }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
