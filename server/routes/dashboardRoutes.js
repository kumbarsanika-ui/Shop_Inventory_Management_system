import { Router } from 'express';
import { dashboard, reports } from '../controllers/dashboardController.js';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();
router.use(authenticateToken);
router.get('/', authorizeRoles('admin', 'manager'), dashboard);
router.get('/reports', authorizeRoles('admin', 'manager'), reports);
export default router;
