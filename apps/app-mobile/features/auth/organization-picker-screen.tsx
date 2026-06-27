import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTenant } from '@/providers/TenantProvider';
import type { OrganizationPickerRecord } from '@/react-query/organizations/organizations-operations';
import { useOrganizationsQuery } from '@/react-query/organizations/organizations-operations';
import { explainGraphqlErrorMessage } from '@/react-query/graphql-error';
import { colors } from '@/theme/colors';

type OrganizationRowProps = {
  item: OrganizationPickerRecord;
  isSelected: boolean;
  onPress: () => void;
  themeColors: typeof colors;
};

function OrganizationRow({
  item,
  isSelected,
  onPress,
  themeColors,
}: OrganizationRowProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={item.name}
      onPress={onPress}
      android_ripple={{ color: 'rgba(26,31,94,0.08)' }}
      style={({ pressed }) => ({
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View
        className="flex-row items-center gap-3 px-4 py-3.5"
        style={
          isSelected
            ? {
                borderLeftWidth: 3,
                borderLeftColor: themeColors.primary,
                backgroundColor: `${themeColors.primary}08`,
              }
            : { borderLeftWidth: 3, borderLeftColor: 'transparent' }
        }
      >
        <View className="flex-1 gap-0.5">
          <Text
            className="text-sm font-semibold"
            style={{
              color: isSelected ? themeColors.primary : themeColors.bodyText,
            }}
          >
            {item.name}
          </Text>
        </View>
        {isSelected ? (
          <MaterialIcons
            name="check-circle"
            size={20}
            color={themeColors.primary}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        ) : (
          <MaterialIcons
            name="chevron-right"
            size={20}
            color={themeColors.mutedText}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        )}
      </View>
      <View
        className="mx-4"
        style={{ height: 0.5, backgroundColor: themeColors.border }}
      />
    </Pressable>
  );
}

export function OrganizationPickerScreen() {
  const insets = useSafeAreaInsets();
  const { setTenant } = useTenant();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const listQuery = useOrganizationsQuery({ filter: { isActive: true } });

  const allOrganizations = useMemo(() => {
    return listQuery.data?.organizations ?? [];
  }, [listQuery.data]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return allOrganizations;
    return allOrganizations.filter((b) => b.name.toLowerCase().includes(term));
  }, [allOrganizations, search]);

  const selectedOrganization =
    allOrganizations.find((b) => b.id === selectedId) ?? null;

  async function handleContinue() {
    if (!selectedOrganization) return;
    setIsSaving(true);
    try {
      await setTenant({
        address: selectedOrganization.address ?? null,
        organizationId: selectedOrganization.id,
        organizationSlug: selectedOrganization.slug,
        organizationName: selectedOrganization.name,
        organizationLogoUrl: selectedOrganization.logoUrl ?? null,
        contactNumber: selectedOrganization.contactNumber ?? null,
        primaryColor: selectedOrganization.primaryColor ?? null,
        features: selectedOrganization.features,
      });
      router.replace('/(auth)/login');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: colors.screenBg, paddingTop: insets.top }}
    >
      {/* Hero */}
      <View className="items-center px-6 pb-6 pt-10 gap-3">
        <View
          className="mb-1 size-16 items-center justify-center rounded-3xl"
          style={{ backgroundColor: colors.subtleFill }}
        >
          <MaterialIcons
            name="location-city"
            size={32}
            color={colors.primary}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        </View>
        <Text
          className="text-center text-2xl font-bold"
          style={{ color: colors.bodyText }}
        >
          Welcome to the{'\n'}Organization App
        </Text>
        <Text
          className="text-center text-sm"
          style={{ color: colors.secondaryText }}
        >
          Select your organization to get started.
        </Text>
      </View>

      {/* Search */}
      <View className="px-5 pb-3">
        <View
          className="flex-row items-center gap-3 rounded-2xl border px-4"
          style={{
            backgroundColor: colors.cardBg,
            borderColor: colors.border,
            borderWidth: 0.5,
            height: 48,
          }}
        >
          <MaterialIcons
            name="search"
            size={20}
            color={colors.mutedText}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <TextInput
            accessibilityLabel="Search organizations"
            placeholder="Search..."
            placeholderTextColor={colors.mutedText}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            className="flex-1 text-sm"
            style={{ color: colors.bodyText }}
          />
          {search.length > 0 ? (
            <Pressable
              onPress={() => setSearch('')}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              hitSlop={8}
            >
              <MaterialIcons name="close" size={18} color={colors.mutedText} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* List */}
      <View
        className="mx-5 flex-1 overflow-hidden rounded-2xl border"
        style={{
          backgroundColor: colors.cardBg,
          borderColor: colors.border,
          borderWidth: 0.5,
        }}
      >
        {listQuery.isLoading ? (
          <View className="flex-1 items-center justify-center gap-3">
            <ActivityIndicator color={colors.primary} />
            <Text className="text-sm" style={{ color: colors.mutedText }}>
              Loading organizations…
            </Text>
          </View>
        ) : listQuery.isError ? (
          <View className="flex-1 items-center justify-center gap-3 px-6">
            <MaterialIcons
              name="error-outline"
              size={32}
              color={colors.error}
            />
            <Text
              className="text-center text-sm"
              style={{ color: colors.secondaryText }}
            >
              {explainGraphqlErrorMessage(
                listQuery.error,
                'Unable to load organizations. Please try again.',
              )}
            </Text>
            <Pressable
              onPress={() => {
                void listQuery.refetch();
              }}
              accessibilityRole="button"
              accessibilityLabel="Retry"
            >
              <Text
                className="text-sm font-semibold"
                style={{ color: colors.primary }}
              >
                Try again
              </Text>
            </Pressable>
          </View>
        ) : filtered.length === 0 ? (
          <View className="flex-1 items-center justify-center gap-2 px-6">
            <Text className="text-sm" style={{ color: colors.mutedText }}>
              No organizations found.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <OrganizationRow
                item={item}
                isSelected={item.id === selectedId}
                onPress={() => setSelectedId(item.id)}
                themeColors={colors}
              />
            )}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Continue button */}
      <View
        className="px-5 pt-4"
        style={{ paddingBottom: Math.max(insets.bottom, 16) + 4 }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue"
          accessibilityState={{
            disabled: !selectedOrganization || isSaving,
          }}
          onPress={() => {
            void handleContinue();
          }}
          disabled={!selectedOrganization || isSaving}
          android_ripple={
            selectedOrganization && !isSaving
              ? { color: 'rgba(255,255,255,0.2)' }
              : undefined
          }
          style={({ pressed }) => {
            const isDisabled = !selectedOrganization || isSaving;
            return {
              backgroundColor: isDisabled
                ? colors.secondaryText
                : colors.primary,
              opacity: pressed && !isDisabled ? 0.85 : 1,
              borderRadius: 16,
              height: 52,
              alignItems: 'center',
              justifyContent: 'center',
            };
          }}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-base text-center font-semibold text-black">
              Continue
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
