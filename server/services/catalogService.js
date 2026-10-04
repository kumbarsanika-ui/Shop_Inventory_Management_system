import * as repository from '../repositories/catalogRepository.js';
import { paginationMeta } from '../utils/pagination.js';
import { AppError } from '../utils/AppError.js';

function paged(result) {
  return { data: result.rows, pagination: paginationMeta(result.page, result.limit, result.total) };
}

export async function listProducts(query) { return paged(await repository.listProducts(query)); }
export async function getProduct(id) {
  const product = await repository.getProduct(id);
  if (!product) throw new AppError('Product was not found', 404, 'NOT_FOUND');
  return product;
}
export async function createProduct(data, userId) { return getProduct(await repository.createProduct(data, userId)); }
export async function updateProduct(id, data, userId) {
  if (!await repository.updateProduct(id, data, userId)) throw new AppError('Product was not found', 404, 'NOT_FOUND');
  return getProduct(id);
}
export async function deleteProduct(id) {
  if (!await repository.deleteProduct(id)) throw new AppError('Product was not found', 404, 'NOT_FOUND');
}

export async function listResource(resource, query) { return paged(await repository.listResource(resource, query)); }
export async function getResource(resource, id) {
  const value = await repository.getResource(resource, id);
  if (!value) throw new AppError(`${resource.slice(0, -1)} was not found`, 404, 'NOT_FOUND');
  return value;
}
export async function createResource(resource, data) { return getResource(resource, await repository.createResource(resource, data)); }
export async function updateResource(resource, id, data) {
  if (!await repository.updateResource(resource, id, data)) throw new AppError(`${resource.slice(0, -1)} was not found`, 404, 'NOT_FOUND');
  return getResource(resource, id);
}
export async function deleteResource(resource, id) {
  if (!await repository.deleteResource(resource, id)) throw new AppError(`${resource.slice(0, -1)} was not found`, 404, 'NOT_FOUND');
}
