import { Image } from 'expo-image';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

type GuideBubbleLayout = 'hero' | 'standard' | 'compact';

type GuideBubbleProps = {
  avatarSource: number;
  bubbleMinWidth?: number;
  forceCover?: boolean;
  imageOffsetX?: number;
  imageScale?: number;
  layout: GuideBubbleLayout;
  message: string;
};

export function GuideBubble({
  avatarSource,
  forceCover = false,
  imageOffsetX = 0,
  imageScale = 1,
  layout,
  message,
}: GuideBubbleProps) {
  const dotAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    const cycleMs = 1200;
    const staggerMs = 100;

    const loops = dotAnimations.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * staggerMs),
          Animated.timing(value, {
            toValue: 1,
            duration: 220,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 260,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay(cycleMs - index * staggerMs - 480),
        ]),
      ),
    );

    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [dotAnimations]);

  const { width: screenWidth } = useWindowDimensions();

  const isHero = layout === 'hero';
  const useContainImage = !forceCover && (isHero || layout === 'compact');

  // Aspect ratios derived from original design dimensions (h/w)
  const aspectRatio = 360 / 236;
  const maxImageWidth = 282;
  const widthFraction = isHero ? 0.72 : 0.42;
  const imageWidth =
    Math.min(maxImageWidth, screenWidth * widthFraction) * imageScale;
  const imageHeight = imageWidth * aspectRatio * imageScale;
  const arrowSide = isHero ? 'left' : 'right';

  return (
    <View
      className="mb-5"
      style={{
        flexDirection: isHero ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: isHero ? 2 : 12,
        marginTop: isHero ? -24 : -10,
        minHeight: imageHeight + (isHero ? 14 : 8),
      }}
    >
      <View
        className="flex-1 rounded-3xl border bg-white px-4 py-4"
        style={{
          borderColor: '#dce7f5',

          borderWidth: 1,
          marginLeft: isHero ? -18 : 0,
          marginTop: isHero ? 18 : 0,
          shadowColor: '#0e3a82',
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 8 },
        }}
      >
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: isHero ? 42 : 34,
            [arrowSide]: -8,
            width: 16,
            height: 16,
            backgroundColor: '#FFFFFF',
            borderColor: '#dce7f5',
            borderLeftWidth: isHero ? 1 : 0,
            borderBottomWidth: isHero ? 1 : 0,
            borderTopWidth: isHero ? 0 : 1,
            borderRightWidth: isHero ? 0 : 1,
            transform: [{ rotate: '45deg' }],
          }}
        />
        <Text className="text-sm leading-6" style={{ color: '#223254' }}>
          {message}
        </Text>
        <View className="mt-2.5 flex-row items-center" style={{ gap: 5 }}>
          {dotAnimations.map((value, index) => (
            <Animated.View
              key={index}
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                backgroundColor: '#0B5ED7',
                opacity: value.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.35, 1],
                }),
                transform: [
                  {
                    translateY: value.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -4],
                    }),
                  },
                ],
              }}
            />
          ))}
        </View>
      </View>

      <Image
        source={avatarSource}
        contentFit="contain"
        style={{
          width: imageWidth,
          height: imageHeight,
          marginLeft: isHero ? -56 : 0,
          marginTop: isHero ? 10 : 0,
          borderRadius: 12,
          backgroundColor: 'transparent',
          transform: [{ translateX: imageOffsetX }],
        }}
      />
    </View>
  );
}
