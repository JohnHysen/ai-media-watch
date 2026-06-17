import { Router } from 'express'
import { createAnalysisJob } from '../controllers/analysisQueueController'

// @ts-expect-error ????
const router = new Router()

router.post('/', createAnalysisJob)

export default router
