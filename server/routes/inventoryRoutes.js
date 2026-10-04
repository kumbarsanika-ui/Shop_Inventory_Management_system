import { Router } from 'express';
import * as controller from '../controllers/inventoryController.js';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validationMiddleware.js';
import { stockTransactionSchema } from '../models/Catalog.js';

const router = Router();
router.use(authenticateToken);
router.get('/', controller.list);
router.get('/transactions', controller.listTransactions);
router.post('/transactions', authorizeRoles('admin', 'manager'), validateBody(stockTransactionSchema), controller.createTransaction);
export default router;
