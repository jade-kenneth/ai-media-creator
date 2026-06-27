import { Text } from 'react-native';

import { Prose } from '@/components/ui/prose';
import { useThemeColors } from '@/hooks/use-theme-colors';

type ContentRendererProps = {
  content: string;
};

export function ContentRenderer({ content }: ContentRendererProps) {
  const colors = useThemeColors();

  if (!content.trim()) {
    return (
      <Text
        className="text-base leading-7"
        style={{ color: colors.secondaryText }}
      >
        No content available.
      </Text>
    );
  }

  return <Prose size="md" html={content} />;
}
