import { AppError } from '../utils/AppError.js';

export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) return next(result.error);
    req.body = result.data;
    next();
  };
}

export function validateId(req, res, next) {
  if (!/^\d+$/.test(req.params.id) || Number(req.params.id) < 1) {
    return next(new AppError('ID must be a positive integer', 422, 'VALIDATION_ERROR'));
  }
  next();
}
