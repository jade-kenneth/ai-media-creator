import { z } from 'zod';

export const sendEmailBodySchema = z
  .object({
    to: z.string().trim().email('to must be a valid email address.'),
    subject: z.string().trim().min(1, 'subject is required.'),
    html: z.string().trim().min(1, 'html is required.'),
  })
  .strict();

export type SendEmailBody = z.infer<typeof sendEmailBodySchema>;
