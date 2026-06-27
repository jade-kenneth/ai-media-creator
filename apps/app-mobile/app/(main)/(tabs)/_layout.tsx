import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Easing, Platform, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors } from '@/hooks/use-theme-colors';
import { colors } from '@/theme/colors';

const SPRING = { damping: 16, stiffness: 220 } as const;

type TabBarIconProps = {
  activeIconName: keyof typeof MaterialIcons.glyphMap;
  activeIconColor: string;
  activeSurfaceColor: string;
  color: string;
  focused: boolean;
  inactiveSurfaceColor: string;
  inactiveIconName: keyof typeof MaterialIcons.glyphMap;
  size: number;
};

function TabBarIcon({
  activeIconName,
  activeIconColor,
  activeSurfaceColor,
  color,
  focused,
  inactiveSurfaceColor,
  inactiveIconName,
  size,
}: TabBarIconProps) {
  const pillWidth = useSharedValue(focused ? 52 : 38);
  const iconScale = useSharedValue(focused ? 1 : 0.86);
  const dotOpacity = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    pillWidth.value = withSpring(focused ? 52 : 38, SPRING);
    iconScale.value = withSpring(focused ? 1 : 0.86, SPRING);
    dotOpacity.value = withSpring(focused ? 1 : 0, SPRING);
  }, [focused, pillWidth, iconScale, dotOpacity]);

  const pillStyle = useAnimatedStyle(() => ({
    width: pillWidth.value,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const dotStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
  }));

  return (
    <View className="items-center gap-1">
      <Animated.View
        className="items-center justify-center overflow-hidden"
        style={[
          {
            backgroundColor: focused
              ? activeSurfaceColor
              : inactiveSurfaceColor,
            borderColor: focused ? 'rgba(255,255,255,0.22)' : 'transparent',
            borderRadius: 16,
            borderWidth: focused ? 0.5 : 0,
            boxShadow: focused ? '0 4px 12px rgba(0,0,0,0.18)' : 'none',
            height: 34,
          },
          pillStyle,
        ]}
      >
        <Animated.View style={iconStyle}>
          <MaterialIcons
            color={focused ? activeIconColor : color}
            name={focused ? activeIconName : inactiveIconName}
            size={size + 1}
          />
        </Animated.View>
      </Animated.View>
      <Animated.View
        style={[
          {
            backgroundColor: activeSurfaceColor,
            borderRadius: 2,
            height: 3,
            width: 3,
          },
          dotStyle,
        ]}
      />
    </View>
  );
}

function TabBarBackground({ isDark }: { isDark: boolean }) {
  return (
    <View
      className="absolute inset-0 overflow-hidden rounded-[30px]"
      style={{
        backgroundColor: isDark
          ? 'rgba(18,25,74,0.92)'
          : 'rgba(255,255,255,0.9)',
      }}
    >
      <LinearGradient
        colors={
          isDark
            ? ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.02)']
            : ['rgba(255,255,255,0.96)', 'rgba(244,246,251,0.88)']
        }
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={{ flex: 1 }}
      />
      <View
        className="absolute left-4 right-4 top-0 h-px"
        style={{
          backgroundColor: isDark
            ? 'rgba(255,255,255,0.16)'
            : 'rgba(255,255,255,0.9)',
        }}
      />
    </View>
  );
}

export default function MainTabsLayout() {
  const { t } = useTranslation();
  const themeColors = useThemeColors();
  const isDark = themeColors.isDark;
  const insets = useSafeAreaInsets();

  const activeColor = themeColors.tabActive;
  const inactiveColor = themeColors.tabInactive;
  const activeIconColor = isDark ? colors.primary : colors.cardBg;
  const activeSurfaceColor = isDark ? colors.accent : colors.primary;
  const inactiveSurfaceColor = isDark
    ? 'rgba(255,255,255,0.05)'
    : 'rgba(26,31,94,0.04)';
  const tabBarBackground = isDark
    ? 'rgba(18,25,74,0.01)'
    : 'rgba(255,255,255,0.01)';
  const tabBarBorderColor = isDark
    ? 'rgba(255,255,255,0.12)'
    : 'rgba(26,31,94,0.08)';
  const tabBarBottom = Math.max(
    insets.bottom,
    Platform.OS === 'android' ? 10 : 8,
  );
  const tabBarHeight = 62;

  function tabHapticListeners() {
    return {
      tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    };
  }

  function renderTabBarIcon(
    activeIconName: keyof typeof MaterialIcons.glyphMap,
    inactiveIconName: keyof typeof MaterialIcons.glyphMap,
  ) {
    return function TabBarIconRenderer({
      color,
      focused,
      size,
    }: {
      color: string;
      focused: boolean;
      size: number;
    }) {
      return (
        <TabBarIcon
          activeIconColor={activeIconColor}
          activeIconName={activeIconName}
          activeSurfaceColor={activeSurfaceColor}
          color={color}
          focused={focused}
          inactiveIconName={inactiveIconName}
          inactiveSurfaceColor={inactiveSurfaceColor}
          size={size}
        />
      );
    };
  }

  return (
    <Tabs
      screenOptions={{
        animation: 'shift',
        headerShown: false,
        tabBarActiveTintColor: activeColor,
        tabBarBackground: () => <TabBarBackground isDark={isDark} />,
        tabBarInactiveTintColor: inactiveColor,
        tabBarHideOnKeyboard: true,
        transitionSpec: {
          animation: 'timing',
          config: {
            duration: 180,
            easing: Easing.out(Easing.cubic),
          },
        },
        tabBarIconStyle: {
          marginBottom: -2,
          marginTop: 2,
        },
        tabBarItemStyle: {
          borderRadius: 20,
          minHeight: 56,
          paddingVertical: 2,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.2,
          marginTop: 0,
        },
        tabBarStyle: {
          backgroundColor: tabBarBackground,
          borderColor: tabBarBorderColor,
          borderRadius: 30,
          borderWidth: 1,
          bottom: tabBarBottom,
          boxShadow: isDark
            ? '0 10px 40px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)'
            : '0 4px 24px rgba(26,31,94,0.14), 0 1px 4px rgba(26,31,94,0.06)',
          height: tabBarHeight,

          paddingBottom: 8,
          paddingHorizontal: 6,
          paddingTop: 6,
          width: '90%',
          marginLeft: '5%',
          marginRight: '5%',
          position: 'absolute',
        },
      }}
    >
      <Tabs.Screen
        listeners={tabHapticListeners()}
        name="index"
        options={{
          title: t('navigation.home'),
          tabBarIcon: renderTabBarIcon('home-filled', 'home'),
        }}
      />
      <Tabs.Screen
        listeners={tabHapticListeners()}
        name="notifications"
        options={{
          title: t('navigation.alerts'),
          tabBarIcon: renderTabBarIcon(
            'notifications-active',
            'notifications-none',
          ),
        }}
      />
      <Tabs.Screen
        listeners={tabHapticListeners()}
        name="profile"
        options={{
          title: t('navigation.profile'),
          tabBarIcon: renderTabBarIcon('person', 'person-outline'),
        }}
      />
    </Tabs>
  );
}
