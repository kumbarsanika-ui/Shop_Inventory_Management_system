import * as service from '../services/inventoryService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const result = await service.listInventory(req.query);
  res.json({ success: true, message: 'Inventory retrieved successfully', ...result });
});
export const listTransactions = asyncHandler(async (req, res) => {
  const result = await service.listTransactions(req.query);
  res.json({ success: true, message: 'Stock transactions retrieved successfully', ...result });
});
export const createTransaction = asyncHandler(async (req, res) => {
  const result = await service.createTransaction(req.body, req.user.id);
  res.status(201).json({ success: true, message: 'Stock transaction recorded', data: result });
});
