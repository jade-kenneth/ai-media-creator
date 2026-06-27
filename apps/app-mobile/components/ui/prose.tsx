import RenderHtml from 'react-native-render-html';
import { useWindowDimensions, View, type ViewProps } from 'react-native';
import { twMerge } from 'tailwind-merge';

import { useThemeColors } from '@/hooks/use-theme-colors';

type ProseProps = ViewProps & {
  className?: string;
  html?: string;
  size?: 'sm' | 'md';
};

export function Prose({
  children,
  className,
  html,
  size = 'md',
  ...props
}: ProseProps) {
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const bodyFontSize = size === 'sm' ? 14 : 16;
  const bodyLineHeight = size === 'sm' ? 22 : 28;
  const headingScale = size === 'sm' ? 1 : 1.08;

  return (
    <View
      className={twMerge(
        'w-full self-stretch',
        size === 'sm' ? 'gap-2' : 'gap-3',
        className,
      )}
      {...props}
    >
      {html ? (
        <RenderHtml
          contentWidth={width}
          source={{ html }}
          baseStyle={{
            color: colors.secondaryText,
            fontSize: bodyFontSize,
            lineHeight: bodyLineHeight,
          }}
          tagsStyles={{
            body: {
              color: colors.secondaryText,
              fontSize: bodyFontSize,
              lineHeight: bodyLineHeight,
            },
            p: {
              color: colors.secondaryText,
              fontSize: bodyFontSize,
              lineHeight: bodyLineHeight,
              marginBottom: 16,
              marginTop: 0,
            },
            div: {
              color: colors.secondaryText,
            },
            span: {
              color: colors.secondaryText,
            },
            strong: {
              color: colors.bodyText,
              fontWeight: '700',
            },
            b: {
              color: colors.bodyText,
              fontWeight: '700',
            },
            em: {
              fontStyle: 'italic',
            },
            i: {
              fontStyle: 'italic',
            },
            u: {
              textDecorationLine: 'underline',
            },
            h1: {
              color: colors.bodyText,
              fontSize: Math.round(28 * headingScale),
              fontWeight: '700',
              lineHeight: Math.round(34 * headingScale),
              marginBottom: 12,
              marginTop: 0,
            },
            h2: {
              color: colors.bodyText,
              fontSize: Math.round(24 * headingScale),
              fontWeight: '700',
              lineHeight: Math.round(30 * headingScale),
              marginBottom: 12,
              marginTop: 0,
            },
            h3: {
              color: colors.bodyText,
              fontSize: Math.round(20 * headingScale),
              fontWeight: '700',
              lineHeight: Math.round(26 * headingScale),
              marginBottom: 10,
              marginTop: 0,
            },
            h4: {
              color: colors.bodyText,
              fontSize: Math.round(18 * headingScale),
              fontWeight: '700',
              lineHeight: Math.round(24 * headingScale),
              marginBottom: 10,
              marginTop: 0,
            },
            h5: {
              color: colors.bodyText,
              fontSize: Math.round(16 * headingScale),
              fontWeight: '700',
              lineHeight: Math.round(22 * headingScale),
              marginBottom: 8,
              marginTop: 0,
            },
            h6: {
              color: colors.bodyText,
              fontSize: Math.round(15 * headingScale),
              fontWeight: '700',
              lineHeight: Math.round(21 * headingScale),
              marginBottom: 8,
              marginTop: 0,
            },
            a: {
              color: colors.primaryInteractive,
              textDecorationLine: 'underline',
            },
            ul: {
              marginBottom: 16,
              marginTop: 0,
            },
            ol: {
              marginBottom: 16,
              marginTop: 0,
            },
            li: {
              color: colors.secondaryText,
              fontSize: bodyFontSize,
              lineHeight: bodyLineHeight,
              marginBottom: 6,
            },
            blockquote: {
              borderLeftColor: colors.border,
              borderLeftWidth: 3,
              color: colors.secondaryText,
              marginBottom: 16,
              marginLeft: 0,
              marginTop: 0,
              paddingLeft: 12,
            },
          }}
        />
      ) : (
        children
      )}
    </View>
  );
}
