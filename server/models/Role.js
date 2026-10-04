import { z } from 'zod';

export const roleCreateSchema = z.object({
  name: z.string().trim().min(2).max(40),
  description: z.string().max(255).nullable().optional()
});

export const roleUpdateSchema = roleCreateSchema;

export const rolePatchSchema = roleUpdateSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'At least one field must be provided'
);
