import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';

export function notFoundHandler(req, res, next) {
  next(new AppError(`Route ${req.method} ${req.originalUrl} was not found`, 404, 'NOT_FOUND'));
}

export function errorHandler(error, req, res, next) {
  let statusCode = error.statusCode || 500;
  let code = error.code || 'INTERNAL_ERROR';
  let message = error.message || 'An unexpected error occurred';

  if (error instanceof ZodError) {
    statusCode = 422;
    code = 'VALIDATION_ERROR';
    message = error.issues.map((issue) => issue.message).join(', ');
  } else if (error.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    code = 'DUPLICATE_RECORD';
    message = 'A record with those unique values already exists';
  } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = 422;
    code = 'INVALID_REFERENCE';
    message = 'One of the referenced records does not exist';
  } else if (error.code === 'ER_ROW_IS_REFERENCED_2') {
    statusCode = 409;
    code = 'RECORD_IN_USE';
    message = 'This record is still referenced by other records';
  } else if (error.type === 'entity.parse.failed') {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Request body must contain valid JSON';
  } else if (error.type === 'entity.too.large') {
    statusCode = 413;
    code = 'PAYLOAD_TOO_LARGE';
    message = 'Request body is too large';
  }

  if (statusCode >= 500) message = 'An unexpected server error occurred';
  res.status(statusCode).json({ success: false, message, error: code });
}
