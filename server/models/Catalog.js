import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().max(500).nullable().optional()
});

export const supplierSchema = z.object({
  name: z.string().trim().min(2).max(140),
  contact_name: z.string().trim().max(120).nullable().optional(),
  email: z.string().trim().email().max(190).nullable().optional().or(z.literal('')),
  phone: z.string().trim().regex(/^\+?[\d\s().-]{7,40}$/).nullable().optional(),
  address: z.string().max(500).nullable().optional()
});

export const stockTransactionSchema = z.object({
  product_id: z.coerce.number().int().positive(),
  transaction_type: z.enum(['stock_in', 'stock_out', 'adjustment']),
  quantity: z.coerce.number().int().min(0),
  reference: z.string().max(120).nullable().optional(),
  notes: z.string().max(500).nullable().optional()
}).refine((value) => value.transaction_type === 'adjustment' || value.quantity > 0, {
  path: ['quantity'],
  message: 'Stock in and stock out movements must be greater than zero'
});
