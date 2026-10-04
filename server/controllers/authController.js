import * as service from '../services/authService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const register = asyncHandler(async (req, res) => {
  const user = await service.register(req.body);
  res.status(201).json({ success: true, message: 'Account created', data: user });
});

export const login = asyncHandler(async (req, res) => {
  const result = await service.login(req.body);
  res.json({ success: true, message: 'Signed in successfully', data: result });
});

export const logout = (req, res) => {
  res.json({ success: true, message: 'Signed out successfully', data: null });
};
