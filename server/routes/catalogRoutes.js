import { Router } from 'express';
import { z } from 'zod';
import { createCatalogController } from '../controllers/catalogController.js';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';
import { validateBody, validateId } from '../middleware/validationMiddleware.js';
import { categorySchema, supplierSchema } from '../models/Catalog.js';

export function createCatalogRouter(resource) {
  const router = Router();
  const schema = resource === 'categories' ? categorySchema : supplierSchema;
  const controller = createCatalogController(resource);
  router.use(authenticateToken);
  router.get('/', controller.list);
  router.get('/:id', validateId, controller.get);
  router.post('/', authorizeRoles('admin', 'manager'), validateBody(schema), controller.create);
  router.put('/:id', authorizeRoles('admin', 'manager'), validateId, validateBody(schema), controller.update);
  router.patch('/:id', authorizeRoles('admin', 'manager'), validateId,
    validateBody(schema.partial().refine((value) => Object.keys(value).length > 0, 'At least one field must be provided')), controller.update);
  router.delete('/:id', authorizeRoles('admin'), validateId, controller.remove);
  return router;
}
