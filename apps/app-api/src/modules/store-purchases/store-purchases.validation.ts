import { z } from 'zod';

export const appleNotificationBodySchema = z
  .object({ signedPayload: z.string().trim().min(1) })
  .strict();

export type AppleNotificationBody = z.infer<typeof appleNotificationBodySchema>;

export const googleNotificationBodySchema = z
  .object({
    message: z
      .object({
        data: z.string().trim().min(1),
        messageId: z.string().trim().min(1),
        publishTime: z.string().datetime().optional(),
      })
      .strict(),
    subscription: z.string().trim().min(1),
  })
  .strict();

export type GoogleNotificationBody = z.infer<
  typeof googleNotificationBodySchema
>;
