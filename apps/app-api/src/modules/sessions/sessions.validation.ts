import { z } from 'zod';

export const googleAuthBodySchema = z
  .object({
    idToken: z.string().trim().min(1, 'idToken is required.'),
  })
  .strict();

export type GoogleAuthBody = z.infer<typeof googleAuthBodySchema>;
