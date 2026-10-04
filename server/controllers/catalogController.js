import * as service from '../services/catalogService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export function createCatalogController(resource) {
  return {
    list: asyncHandler(async (req, res) => {
      const result = await service.listResource(resource, req.query);
      res.json({ success: true, message: `${resource} retrieved successfully`, ...result });
    }),
    get: asyncHandler(async (req, res) => {
      const item = await service.getResource(resource, req.params.id);
      res.json({ success: true, message: `${resource.slice(0, -1)} retrieved successfully`, data: item });
    }),
    create: asyncHandler(async (req, res) => {
      const item = await service.createResource(resource, req.body);
      res.status(201).json({ success: true, message: `${resource.slice(0, -1)} created successfully`, data: item });
    }),
    update: asyncHandler(async (req, res) => {
      const item = await service.updateResource(resource, req.params.id, req.body);
      res.json({ success: true, message: `${resource.slice(0, -1)} updated successfully`, data: item });
    }),
    remove: asyncHandler(async (req, res) => {
      await service.deleteResource(resource, req.params.id);
      res.json({ success: true, message: `${resource.slice(0, -1)} deleted successfully`, data: null });
    })
  };
}
