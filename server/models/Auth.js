import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email().max(190),
  password: z.string().min(1).max(72)
});
