import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as users from '../repositories/userRepository.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export async function register(data) {
  const role = await users.findRoleByName('staff');
  if (!role) throw new AppError('Default staff role is not configured', 500, 'ROLE_CONFIGURATION_ERROR');
  const password_hash = await bcrypt.hash(data.password, 12);
  const id = await users.createUser({ ...data, role_id: role.id, password_hash });
  return users.findUserById(id);
}

export async function login({ email, password }) {
  const user = await users.findUserByEmail(email.toLowerCase());
  const validPassword = user && await bcrypt.compare(password, user.password_hash);
  if (!validPassword || !user.is_active) throw new AppError('Email or password is incorrect', 401, 'INVALID_CREDENTIALS');
  const token = jwt.sign({ id: user.id, role: user.role, name: user.full_name }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
  const { password_hash, ...safeUser } = user;
  return { token, user: safeUser };
}
