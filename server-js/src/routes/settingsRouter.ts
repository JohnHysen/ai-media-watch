import { Router } from 'express'
import {
  getSettings,
  updateSettings,
  toggleScraping,
  triggerVideoScrape,
  getScrapeStatus,
  startScrapingProcess,
  stopScrapingProcess,
} from '../controllers/settingsController'
import authMiddleware from '../middleware/authMiddleware'
import { requireRole } from '../middleware/checkRoleMiddleware'

const router = Router()

router.get('/', authMiddleware, getSettings)
router.put('/', authMiddleware, requireRole(['ADMIN']), updateSettings)
router.post(
  '/toggle-scraping',
  authMiddleware,
  requireRole(['ADMIN']),
  toggleScraping
)
router.post(
  '/scrape-video',
  authMiddleware,
  requireRole(['ADMIN']),
  triggerVideoScrape
)
router.get('/status', authMiddleware, requireRole(['ADMIN']), getScrapeStatus)

router.post(
  '/scrape/start',
  authMiddleware,
  requireRole(['ADMIN']),
  startScrapingProcess
)
router.post(
  '/scrape/stop',
  authMiddleware,
  requireRole(['ADMIN']),
  stopScrapingProcess
)

export default router
