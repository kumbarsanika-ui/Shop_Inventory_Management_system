import { z } from 'zod';

export const registerSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(190),
  password: z.string().min(8).max(72)
});

export const userCreateSchema = registerSchema.extend({
  role_id: z.coerce.number().int().positive(),
  is_active: z.coerce.boolean().default(true)
});

export const userUpdateSchema = z.object({
  full_name: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email().max(190).optional(),
  role_id: z.coerce.number().int().positive().optional(),
  is_active: z.coerce.boolean().optional(),
  password: z.string().min(8).max(72).optional()
}).refine((value) => Object.keys(value).length > 0, 'At least one field must be provided');
