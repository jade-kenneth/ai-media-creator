import { stripHtml } from 'string-strip-html';

export function getPlainTextFromRichTextHtml(value: string): string {
  return stripHtml(value).result;
}
