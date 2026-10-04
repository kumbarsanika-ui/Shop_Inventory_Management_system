import { Router } from 'express';
import * as controller from '../controllers/productController.js';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';
import { validateBody, validateId } from '../middleware/validationMiddleware.js';
import { productCreateSchema, productUpdateSchema } from '../models/Product.js';

const router = Router();
router.use(authenticateToken);
router.get('/', controller.list);
router.get('/:id', validateId, controller.get);
router.post('/', authorizeRoles('admin', 'manager'), validateBody(productCreateSchema), controller.create);
router.put('/:id', authorizeRoles('admin', 'manager'), validateId, validateBody(productCreateSchema), controller.update);
router.patch('/:id', authorizeRoles('admin', 'manager'), validateId, validateBody(productUpdateSchema), controller.update);
router.delete('/:id', authorizeRoles('admin'), validateId, controller.remove);
export default router;
