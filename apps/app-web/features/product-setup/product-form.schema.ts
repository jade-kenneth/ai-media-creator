import { z } from 'zod';

/** Client-side feedback mirroring the API's product rules. */
const httpsUrl = z
  .string()
  .trim()
  .refine((value) => {
    try {
      return new URL(value).protocol === 'https:';
    } catch {
      return false;
    }
  }, 'Enter a full link that starts with https://');

export const productFormSchema = z.object({
  title: z.string().trim().max(120, 'Use 120 characters or fewer.'),
  category: z.string().trim().max(80, 'Use 80 characters or fewer.'),
  price: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || (/^\d+(\.\d{1,2})?$/.test(value) && Number(value) <= 10_000_000),
      'Enter a price in pesos, like 899.',
    ),
  description: z.string().trim().max(2000, 'Use 2,000 characters or fewer.'),
  affiliateUrl: z.union([z.literal(''), httpsUrl]),
  features: z
    .array(
      z.object({
        id: z.string(),
        text: z.string().max(160, 'Use 160 characters or fewer.'),
      }),
    )
    .max(12, 'You can add up to 12 features.'),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const continueSchema = productFormSchema.extend({
  title: z.string().trim().min(1, 'Add a product title.').max(120, 'Use 120 characters or fewer.'),
  affiliateUrl: z
    .string()
    .trim()
    .min(1, 'Add the affiliate link.')
    .pipe(httpsUrl),
});

export const importUrlSchema = httpsUrl;

/** A 24-hex id so a new feature keeps its identity across autosaves. */
export function newFeatureId() {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
