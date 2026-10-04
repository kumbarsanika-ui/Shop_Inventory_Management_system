import * as service from '../services/userService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const result = await service.listUsers(req.query);
  res.json({ success: true, message: 'Users retrieved successfully', ...result });
});
export const get = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'User retrieved successfully', data: await service.getUser(req.params.id) });
});
export const create = asyncHandler(async (req, res) => {
  const user = await service.createUser(req.body);
  res.status(201).json({ success: true, message: 'User created successfully', data: user });
});
export const update = asyncHandler(async (req, res) => {
  const user = await service.updateUser(req.params.id, req.body);
  res.json({ success: true, message: 'User updated successfully', data: user });
});
export const remove = asyncHandler(async (req, res) => {
  await service.deleteUser(req.params.id, req.user.id);
  res.json({ success: true, message: 'User deleted successfully', data: null });
});
export const roles = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Roles retrieved successfully', data: await service.listRoles() });
});
export const getRole = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Role retrieved successfully', data: await service.getRole(req.params.id) });
});
export const createRole = asyncHandler(async (req, res) => {
  const id = await service.createRole(req.body);
  res.status(201).json({ success: true, message: 'Role created successfully', data: { id } });
});
export const updateRole = asyncHandler(async (req, res) => {
  const data = await service.updateRole(req.params.id, req.body);
  res.json({ success: true, message: 'Role updated successfully', data });
});
export const deleteRole = asyncHandler(async (req, res) => {
  await service.deleteRole(req.params.id);
  res.json({ success: true, message: 'Role deleted successfully', data: null });
});
