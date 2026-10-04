import * as repository from '../repositories/inventoryRepository.js';
import { paginationMeta } from '../utils/pagination.js';
import { AppError } from '../utils/AppError.js';

export async function createTransaction(data, userId) {
  const result = await repository.createStockTransaction(data, userId);
  if (!result) throw new AppError('Product was not found', 404, 'NOT_FOUND');
  if (result.insufficientStock) throw new AppError(`Only ${result.available} units are available`, 422, 'INSUFFICIENT_STOCK');
  return result;
}

export async function listTransactions(query) {
  const result = await repository.listStockTransactions(query);
  return { data: result.rows, pagination: paginationMeta(result.page, result.limit, result.total) };
}
export async function listInventory(query) {
  const result = await repository.listInventory(query);
  return { data: result.rows, pagination: paginationMeta(result.page, result.limit, result.total) };
}
export const getDashboard = repository.getDashboard;
export const getReports = repository.getReports;
