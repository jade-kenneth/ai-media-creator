import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';

type OnboardingShellProps = {
  children: ReactNode;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
  useScrollView?: boolean;
};

const topClouds = [
  {
    left: -42,
    top: 52,
    width: 176,
    height: 70,
    opacity: 0.78,
    scale: 1,
  },
  {
    right: -30,
    top: 22,
    width: 196,
    height: 78,
    opacity: 0.88,
    scale: 1.08,
  },
  {
    left: 86,
    top: 142,
    width: 118,
    height: 48,
    opacity: 0.5,
    scale: 0.82,
  },
  {
    right: 92,
    top: 118,
    width: 138,
    height: 56,
    opacity: 0.58,
    scale: 0.9,
  },
] as const;

export function OnboardingShell({
  children,
  title,
  subtitle,
  onBack,
  showBack = false,
  useScrollView = true,
}: OnboardingShellProps) {
  const shellBackground = '#f3f8ff';
  const shellPanel = '#f7fbff';
  const cloudColor = '#ffffff';
  const cityColor = '#d9ebff';
  const buildingColor = '#c5dcfb';
  const backButtonBg = '#e8f1ff';
  const titleColor = '#0b5ed7';

  const backBar = (
    <View className="min-h-12 flex-row items-center justify-between px-5 py-2">
      {showBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="size-12 items-center justify-center rounded-full"
          onPress={onBack}
          style={{ backgroundColor: backButtonBg }}
        >
          <MaterialIcons
            color={colors.primary}
            name="arrow-back-ios-new"
            size={18}
          />
        </Pressable>
      ) : (
        <View className="size-12" />
      )}
      <View className="size-12" />
    </View>
  );

  const titleBlock = (
    <View className="mb-5 gap-1">
      <Text
        className="text-[32px] font-bold leading-10"
        style={{ color: titleColor }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text className="text-sm" style={{ color: colors.secondaryText }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView
      className="flex-1"
      edges={['top', 'bottom']}
      style={{ backgroundColor: shellBackground }}
    >
      <View className="flex-1" style={{ backgroundColor: shellBackground }}>
        <View
          className="absolute left-0 right-0 top-0"
          style={{
            height: 320,
            backgroundColor: shellPanel,
          }}
        />

        <View
          pointerEvents="none"
          className="absolute left-0 right-0 top-0 overflow-hidden"
          style={{ height: 230 }}
        >
          {topClouds.map((cloud, index) => (
            <View
              key={index}
              className="absolute"
              style={{
                left: 'left' in cloud ? cloud.left : undefined,
                right: 'right' in cloud ? cloud.right : undefined,
                top: cloud.top,
                width: cloud.width,
                height: cloud.height,
                opacity: cloud.opacity,
                transform: [{ scale: cloud.scale }],
              }}
            >
              <View
                className="absolute bottom-0 left-0 right-0"
                style={{
                  backgroundColor: cloudColor,
                  height: cloud.height * 0.58,
                  borderRadius: 999,
                }}
              />
              <View
                className="absolute"
                style={{
                  backgroundColor: cloudColor,
                  left: cloud.width * 0.12,
                  bottom: cloud.height * 0.16,
                  width: cloud.height * 0.64,
                  height: cloud.height * 0.64,
                  borderRadius: 999,
                }}
              />
              <View
                className="absolute"
                style={{
                  backgroundColor: cloudColor,
                  left: cloud.width * 0.34,
                  bottom: cloud.height * 0.22,
                  width: cloud.height * 0.84,
                  height: cloud.height * 0.84,
                  borderRadius: 999,
                }}
              />
              <View
                className="absolute"
                style={{
                  backgroundColor: cloudColor,
                  right: cloud.width * 0.12,
                  bottom: cloud.height * 0.12,
                  width: cloud.height * 0.58,
                  height: cloud.height * 0.58,
                  borderRadius: 999,
                }}
              />
            </View>
          ))}
        </View>

        <View
          pointerEvents="none"
          className="absolute bottom-0 left-0 right-0 overflow-hidden"
          style={{
            height: 180,
            opacity: 0.98,
          }}
        >
          <View
            className="absolute"
            style={{
              left: -54,
              right: -54,
              bottom: -98,
              height: 220,
              backgroundColor: cityColor,
              borderTopLeftRadius: 170,
              borderTopRightRadius: 230,
              transform: [{ rotate: '-4deg' }],
            }}
          />
          <View
            className="absolute"
            style={{
              right: -42,
              bottom: -94,
              width: 210,
              height: 190,
              backgroundColor: cityColor,
              borderTopLeftRadius: 140,
              borderTopRightRadius: 110,
              transform: [{ rotate: '8deg' }],
            }}
          />
          <View
            className="absolute bottom-0 left-0 right-0 flex-row items-end justify-around px-5"
            style={{ height: 108 }}
          >
            {[
              { width: 28, height: 77 },
              { width: 38, height: 98 },
              { width: 30, height: 60 },
              { width: 36, height: 87 },
              { width: 46, height: 68 },
              { width: 40, height: 100 },
              { width: 30, height: 74 },
            ].map((building, index) => (
              <View
                key={index}
                style={{
                  width: building.width,
                  height: building.height,
                  backgroundColor: buildingColor,
                  opacity: 0.72,
                }}
              />
            ))}
          </View>
        </View>

        <KeyboardAvoidingView behavior="padding" className="flex-1">
          {backBar}

          {useScrollView ? (
            <ScrollView
              className="flex-1"
              contentContainerClassName="flex-grow px-5 pb-8 justify-center"
              contentInsetAdjustmentBehavior="automatic"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {titleBlock}

              {children}
            </ScrollView>
          ) : (
            <View className="flex-1 px-5 pb-8">
              {titleBlock}
              {children}
            </View>
          )}
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}
