import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export function authenticateToken(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(new AppError('A bearer token is required', 401, 'UNAUTHENTICATED'));
  }
  try {
    req.user = jwt.verify(token, env.JWT_SECRET);
    next();
  } catch {
    next(new AppError('The access token is invalid or expired', 401, 'INVALID_TOKEN'));
  }
}

export function authorizeRoles(...roles) {
  const permitted = roles.map((role) => role.toLowerCase());
  return (req, res, next) => {
    if (!req.user || !permitted.includes(req.user.role.toLowerCase())) {
      return next(new AppError('You do not have permission to perform this action', 403, 'FORBIDDEN'));
    }
    next();
  };
}
