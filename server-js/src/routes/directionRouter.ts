// src/routes/direction.routes.ts
import { Router } from 'express';
import {
  createDirection,
  getAllDirections,
  getDirectionById,
  updateDirection,
  deleteDirection,
  generateDirectionStructure,
  generateAndCreateDirection,
  getMarkerPresets,
  checkLLMStatus,
  testLLMConnection,
} from '../controllers/directionController';

const router = Router();

// ============= CRUD ОПЕРАЦИИ =============
router.post('/', createDirection);
router.get('/', getAllDirections);
router.get('/:id', getDirectionById);
router.put('/:id', updateDirection);
router.delete('/:id', deleteDirection);

// ============= ГЕНЕРАЦИЯ ЧЕРЕЗ LLM =============
router.post('/generate', generateDirectionStructure);
router.post('/generate-and-create', generateAndCreateDirection);

// ============= ПРЕСЕТЫ =============
router.get('/presets/markers', getMarkerPresets);

// ============= СИСТЕМНЫЕ =============
router.get('/llm/status', checkLLMStatus);
router.post('/llm/test', testLLMConnection);

export default router;