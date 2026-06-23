// routes/proxyRoutes.ts
import { Router } from 'express'
import axios from 'axios'

const router = Router()

router.get('/analyze', async (req, res) => {
  try {
    const { url, userId } = req.query
    if (!url) {
      return res.status(400).json({ error: 'Missing url parameter' })
    }
    const response = await axios.get('http://localhost:8000/analyze', {
      params: { url, userId: userId || undefined },
      timeout: 120000, // 2 минуты
    })
    res.json(response.data)
  } catch (error) {
    console.error('❌ Ошибка прокси-запроса к Python:', error.message)
    res.status(500).json({ error: 'Ошибка при обращении к серверу анализа' })
  }
})

export default router
