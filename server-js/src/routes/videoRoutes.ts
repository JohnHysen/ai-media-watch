// routes/videoRoutes.ts
import { Router } from 'express'
import {
  createVideoAnalysis,
  getAllVideoAnalyses,
  getVideoAnalysisById,
  getAnalysesByUser,
  deleteVideoAnalysis,
  scrapVideo,
} from '../controllers/videoController'

const router = Router()

// Создание записи (для Python)
router.post('/video-analysis', createVideoAnalysis)

// Получение всех записей с фильтрацией
router.get('/video-analysis', getAllVideoAnalyses)

// Получение одной записи
router.get('/video-analysis/:id', getVideoAnalysisById)

// Получение всех записей пользователя
router.get('/video-analysis/user/:userId', getAnalysesByUser)

// Удаление записи
router.delete('/video-analysis/:id', deleteVideoAnalysis)

router.get('/video-scrap', scrapVideo)
export default router
