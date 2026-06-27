import { ark } from '@ark-ui/react/factory';
import { ComponentPropsWithRef } from 'react';
import { tv, VariantProps } from 'tailwind-variants';
import { Merge } from 'type-fest';
import { splitProps } from '~/utils/splitProps';

const proseRecipe = tv({
  base: [
    'max-w-full',
    'min-w-full',

    'prose',
    'prose-headings:font-semibold!',
    'prose-a:underline-offset-3!',
    'prose-hr:block!',
    'prose-hr:my-2!',
    'prose-hr:border-border-secondary!',

    '**:m-0',
    '[&_u]:underline-offset-3',
    '[&_p:empty]:before:block',
    '[&_p:empty]:before:h-4',

    '**:text-fg-secondary-700',
    '**:before:text-fg-secondary-700',
    '**:after:text-fg-secondary-700',
    '**:marker:text-fg-secondary-700/75',

    '**:leading-normal',
    '**:before:leading-normal',
    '**:after:leading-normal',
    '**:marker:leading-normal/75',
  ],
  variants: {
    size: {
      sm: [
        'prose-sm',
        'prose-h1:text-[1.5rem]!',
        'prose-h2:text-[1.375rem]!',
        'prose-h3:text-[1.25rem]!',
        'prose-h4:text-[1.125rem]!',
        'prose-h5:text-[1rem]!',
        'prose-h6:text-[0.875rem]!',
      ],
      md: [
        'prose-md',
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
});

interface ProseProps
  extends Merge<
    ComponentPropsWithRef<'div'>,
    VariantProps<typeof proseRecipe>
  > {
  asChild?: boolean;
}

export function Prose(props: ProseProps) {
  const [recipeProps, localProps] = splitProps(props, [
    ...proseRecipe.variantKeys,
    'className',
  ]);

  return <ark.div className={proseRecipe(recipeProps)} {...localProps} />;
}
