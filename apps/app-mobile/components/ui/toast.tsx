import { useEffect, useRef, useState } from "react";
import { Animated, Text, View } from "react-native";

import { useThemeColors } from "@/hooks/use-theme-colors";

type ToastType = "error" | "success" | "info";

type ToastPayload = {
  message: string;
  type?: ToastType;
};

type ToastListener = (payload: ToastPayload) => void;

const listeners = new Set<ToastListener>();

function subscribe(listener: ToastListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function showToast(payload: ToastPayload) {
  listeners.forEach((listener) => listener(payload));
}

export function ToastHost() {
  const colors = useThemeColors();
  const [toast, setToast] = useState<Required<ToastPayload> | null>(null);
  const translateY = useRef(new Animated.Value(-30)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsubscribe = subscribe(({ message, type }) => {
      setToast({
        message,
        type: type ?? "error",
      });
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!toast) return;

    const fadeIn = Animated.parallel([
      Animated.timing(opacity, {
        duration: 180,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        duration: 180,
        toValue: 0,
        useNativeDriver: true,
      }),
    ]);

    const fadeOut = Animated.parallel([
      Animated.timing(opacity, {
        duration: 180,
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        duration: 180,
        toValue: -30,
        useNativeDriver: true,
      }),
    ]);

    fadeIn.start();

    const timer = setTimeout(() => {
      fadeOut.start(({ finished }) => {
        if (finished) setToast(null);
      });
    }, 3200);

    return () => clearTimeout(timer);
  }, [opacity, toast, translateY]);

  if (!toast) return null;

  const palette =
    toast.type === "success"
      ? {
          backgroundColor: colors.successBg,
          borderColor: colors.successBorder,
          textColor: colors.successText,
        }
      : toast.type === "info"
        ? {
            backgroundColor: colors.infoBg,
            borderColor: colors.infoBorder,
            textColor: colors.infoText,
          }
        : {
            backgroundColor: colors.errorBg,
            borderColor: colors.errorBorder,
            textColor: colors.error,
          };

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      className="absolute inset-x-4 top-14 z-50"
      style={{ opacity, transform: [{ translateY }] }}
    >
      <View
        className="rounded-xl px-4 py-3 shadow-lg"
        style={{
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
          borderWidth: 0.5,
        }}
      >
        <Text
          className="text-sm font-semibold"
          style={{ color: palette.textColor }}
        >
          {toast.message}
        </Text>
      </View>
    </Animated.View>
  );
}
