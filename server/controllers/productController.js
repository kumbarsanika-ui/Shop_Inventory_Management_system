import * as service from '../services/catalogService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const result = await service.listProducts(req.query);
  res.json({ success: true, message: 'Products retrieved successfully', ...result });
});
export const get = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Product retrieved successfully', data: await service.getProduct(req.params.id) });
});
export const create = asyncHandler(async (req, res) => {
  const product = await service.createProduct(req.body, req.user.id);
  res.status(201).json({ success: true, message: 'Product created successfully', data: product });
});
export const update = asyncHandler(async (req, res) => {
  const product = await service.updateProduct(req.params.id, req.body, req.user.id);
  res.json({ success: true, message: 'Product updated successfully', data: product });
});
export const remove = asyncHandler(async (req, res) => {
  await service.deleteProduct(req.params.id);
  res.json({ success: true, message: 'Product deleted successfully', data: null });
});
