import { z } from 'zod';

/**
 * Xendit callback envelope. Only the fields the API acts on are required; the
 * rest of the provider payload is ignored rather than rejected so a provider
 * side addition cannot start failing deliveries.
 */
export const xenditCallbackBodySchema = z.object({
  id: z.string().trim().min(1).optional(),
  event: z.string().trim().min(1).optional(),
  data: z.object({
    reference_id: z.string().trim().min(1),
    status: z.string().trim().min(1),
    payment_request_id: z.string().trim().min(1).optional(),
  }),
});

export type XenditCallbackBody = z.infer<typeof xenditCallbackBodySchema>;
