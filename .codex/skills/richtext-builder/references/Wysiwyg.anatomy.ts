import { createAnatomy } from '@ark-ui/react/anatomy';

export const anatomy = createAnatomy('wysiwyg', [
  'root',
  'content',
  'control',
  'hardBreakTrigger',
  'headingTrigger',
  'boldTrigger',
  'bulletListTrigger',
  'headingTrigger',
  'imageTrigger',
  'italicTrigger',
  'linkTrigger',
  'orderedListTrigger',
  'strikeTrigger',
  'underlineTrigger',
  'undoTrigger',
  'redoTrigger',
  'blockquoteTrigger',
  'bubbleMenu',
  'textAlignTrigger',
  'codeBlockTrigger',
  'floatingMenu',
  'charactersCount',
]);

export const parts = anatomy.build();
