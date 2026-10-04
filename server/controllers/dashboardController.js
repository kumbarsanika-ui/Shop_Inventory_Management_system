import * as service from '../services/inventoryService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const dashboard = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Dashboard retrieved successfully', data: await service.getDashboard() });
});
export const reports = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Reports retrieved successfully', data: await service.getReports() });
});
