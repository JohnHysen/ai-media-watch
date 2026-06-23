import { Router } from 'express'
import {
  createVideoAnalysis,
  createVideoAnalysisInternal,
  getAllVideoAnalyses,
  getVideoAnalysisById,
  getAnalysesByUser,
  scrapVideo,
} from '../controllers/videoController'
import authMiddleware from '../middleware/authMiddleware'

const router = Router()

router.post('/create', createVideoAnalysis)
router.post('/internal/create', createVideoAnalysisInternal)

router.get('/', getAllVideoAnalyses)
router.get('/:id', authMiddleware, getVideoAnalysisById)
router.get('/user/:userId', authMiddleware, getAnalysesByUser)
router.post('/scrap', authMiddleware, scrapVideo)

export default router
