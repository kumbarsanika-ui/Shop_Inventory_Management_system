import bcrypt from 'bcryptjs';
import * as repository from '../repositories/userRepository.js';
import { paginationMeta } from '../utils/pagination.js';
import { AppError } from '../utils/AppError.js';

export async function listUsers(query) {
  const result = await repository.listUsers(query);
  return { data: result.rows, pagination: paginationMeta(result.page, result.limit, result.total) };
}
export async function getUser(id) {
  const user = await repository.findUserById(id);
  if (!user) throw new AppError('User was not found', 404, 'NOT_FOUND');
  return user;
}
export async function createUser(data) {
  const { password, ...user } = data;
  const password_hash = await bcrypt.hash(password, 12);
  return getUser(await repository.createUser({ ...user, password_hash }));
}
export async function updateUser(id, data) {
  const { password, ...fields } = data;
  if (password) fields.password_hash = await bcrypt.hash(password, 12);
  if (!await repository.updateUser(id, fields)) throw new AppError('User was not found', 404, 'NOT_FOUND');
  return getUser(id);
}
export async function deleteUser(id, currentUserId) {
  if (Number(id) === Number(currentUserId)) throw new AppError('You cannot delete your own account', 422, 'SELF_DELETE');
  if (!await repository.deleteUser(id)) throw new AppError('User was not found', 404, 'NOT_FOUND');
}
export const listRoles = repository.listRoles;
export async function getRole(id) {
  const role = await repository.findRoleById(id);
  if (!role) throw new AppError('Role was not found', 404, 'NOT_FOUND');
  return role;
}
export async function createRole(data) { return repository.createRole(data); }
export async function updateRole(id, data) {
  if (!await repository.updateRole(id, data)) throw new AppError('Role was not found', 404, 'NOT_FOUND');
  return getRole(id);
}
export async function deleteRole(id) {
  if (!await repository.deleteRole(id)) throw new AppError('Role was not found or is assigned to a user', 404, 'NOT_FOUND');
}
