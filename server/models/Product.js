import { z } from 'zod';

const optionalId = z.coerce.number().int().positive().nullable().optional();
const nonNegativeMoney = z.coerce.number().finite().min(0);
const nonNegativeInt = z.coerce.number().int().min(0);

export const productCreateSchema = z.object({
  name: z.string().trim().min(2).max(180),
  sku: z.string().trim().min(2).max(80),
  category_id: z.coerce.number().int().positive(),
  supplier_id: optionalId,
  description: z.string().max(10000).nullable().optional(),
  purchase_price: nonNegativeMoney,
  selling_price: nonNegativeMoney,
  quantity: nonNegativeInt.default(0),
  minimum_stock: nonNegativeInt.default(5),
  status: z.enum(['active', 'inactive']).default('active')
});

export const productUpdateSchema = productCreateSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'At least one field must be provided'
);
