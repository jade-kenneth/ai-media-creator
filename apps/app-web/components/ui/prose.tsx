import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from '@radix-ui/react-slot';
import * as React from 'react';

import { cn } from '@/utils';

const proseVariants = cva(
  [
    'max-w-full',
    'min-w-full',
    'prose-headings:font-semibold!',
    'prose-headings:text-foreground!',
    'prose-a:text-primary!',
    'prose-a:underline!',
    'prose-a:underline-offset-3!',
    'prose-strong:text-foreground!',
    'prose-code:text-foreground!',
    'prose-hr:block!',
    'prose-hr:my-2!',
    'prose-hr:border-border!',
    '**:m-0',
    '[&_u]:underline-offset-3',
    '[&_p:empty]:before:block',
    '[&_p:empty]:before:h-4',
    '**:text-muted-foreground',
    '**:before:text-muted-foreground',
    '**:after:text-muted-foreground',
    '**:marker:text-muted-foreground/75',
    '**:leading-normal',
    '**:before:leading-normal',
    '**:after:leading-normal',
    '**:marker:leading-normal',
  ],
  {
    variants: {
      size: {
        sm: [
          'prose',
          'prose-sm',
          'prose-h1:text-[1.5rem]!',
          'prose-h2:text-[1.375rem]!',
          'prose-h3:text-[1.25rem]!',
          'prose-h4:text-[1.125rem]!',
          'prose-h5:text-[1rem]!',
          'prose-h6:text-[0.875rem]!',
        ],
        md: [
          'prose',
          'prose-h1:text-[1.625rem]!',
          'prose-h2:text-[1.5rem]!',
          'prose-h3:text-[1.375rem]!',
          'prose-h4:text-[1.25rem]!',
          'prose-h5:text-[1.125rem]!',
          'prose-h6:text-[1rem]!',
        ],
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

type ProseProps = React.ComponentPropsWithRef<'div'> &
  VariantProps<typeof proseVariants> & {
    asChild?: boolean;
  };

function Prose({
  className,
  size = 'md',
  asChild = false,
  ...props
}: ProseProps) {
  const Comp = asChild ? Slot : 'div';

  return (
    <Comp
      data-slot="prose"
      data-size={size}
      className={cn(proseVariants({ size }), className)}
      {...props}
    />
  );
}

export { Prose };
