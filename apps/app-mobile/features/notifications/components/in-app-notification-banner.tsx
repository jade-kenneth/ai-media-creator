import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  PanResponder,
  Pressable,
  Text,
  View,
  type GestureResponderEvent,
} from "react-native";

import { useThemeColors } from "@/hooks/use-theme-colors";

type InAppNotificationBannerPayload = {
  body?: string | null;
  id: string;
  title?: string | null;
};

type InAppNotificationBannerProps = {
  notification: InAppNotificationBannerPayload | null;
  onDismiss: () => void;
  onPress: (event: GestureResponderEvent) => void;
};

export function InAppNotificationBanner({
  notification,
  onDismiss,
  onPress,
}: InAppNotificationBannerProps) {
  const colors = useThemeColors();
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dy) > 8,
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dy < 0) {
            translateY.setValue(Math.max(gestureState.dy, -120));
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy <= -35 || gestureState.vy <= -0.35) {
            Animated.parallel([
              Animated.timing(opacity, {
                duration: 140,
                toValue: 0,
                useNativeDriver: true,
              }),
              Animated.timing(translateY, {
                duration: 140,
                toValue: -120,
                useNativeDriver: true,
              }),
            ]).start(({ finished }) => {
              if (finished) onDismiss();
            });
            return;
          }

          Animated.spring(translateY, {
            damping: 18,
            stiffness: 220,
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
      }),
    [onDismiss, opacity, translateY]
  );

  useEffect(() => {
    if (!notification) return;

    translateY.setValue(-120);
    opacity.setValue(0);

    Animated.parallel([
      Animated.timing(opacity, {
        duration: 180,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        damping: 18,
        stiffness: 220,
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          duration: 180,
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          duration: 180,
          toValue: -120,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) onDismiss();
      });
    }, 4000);

    return () => clearTimeout(timer);
  }, [notification, onDismiss, opacity, translateY]);

  if (!notification) return null;

  return (
    <Animated.View
      className="absolute inset-x-4 top-14 z-[60]"
      style={{ opacity, transform: [{ translateY }] }}
      {...panResponder.panHandlers}
    >
      <Pressable
        accessibilityHint="Opens the related screen"
        accessibilityLabel={notification.title ?? "Notification"}
        accessibilityRole="button"
        className="rounded-2xl px-4 py-3 shadow-lg"
        onPress={onPress}
        style={{
          backgroundColor: colors.primary,
        }}
      >
        <View className="flex-row items-start justify-between gap-2">
          <View className="flex-1">
            <Text className="text-sm font-semibold text-white" numberOfLines={1}>
              {notification.title ?? "New notification"}
            </Text>
            {notification.body ? (
              <Text className="mt-1 text-xs leading-5 text-white" numberOfLines={2}>
                {notification.body}
              </Text>
            ) : null}
          </View>
          <Pressable
            accessibilityLabel="Dismiss notification"
            accessibilityRole="button"
            className="h-6 w-6 items-center justify-center rounded-full"
            onPress={(event) => {
              event.stopPropagation();
              onDismiss();
            }}
          >
            <MaterialIcons
              color="rgba(255,255,255,0.7)"
              name="close"
              size={16}
            />
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
}
