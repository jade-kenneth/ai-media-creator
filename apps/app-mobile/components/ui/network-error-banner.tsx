import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";
import { Animated, Text, View } from "react-native";

import { useThemeColors } from "@/hooks/use-theme-colors";

/**
 * Shows a non-blocking banner at the top of the screen whenever the device
 * loses its internet connection.  Auto-hides when connectivity is restored.
 */
export function NetworkErrorBanner() {
  const colors = useThemeColors();
  const [isOffline, setIsOffline] = useState(false);
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = state.isConnected === false;
      setIsOffline(offline);

      Animated.timing(opacity, {
        toValue: offline ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });

    return unsubscribe;
  }, [opacity]);

  if (!isOffline) return null;

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={{ opacity }}
      className="absolute inset-x-0 top-0 z-50"
    >
      <View
        className="px-4 py-2.5"
        style={{
          backgroundColor: colors.isDark ? "rgba(204,51,51,0.88)" : colors.error,
        }}
      >
        <Text
          className="text-center text-sm font-semibold"
          style={{ color: colors.cardBg }}
        >
          No internet connection
        </Text>
      </View>
    </Animated.View>
  );
}
