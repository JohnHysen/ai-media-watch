// controllers/videoController.ts
import { Request, Response } from 'express'
import { VideoAnalysis, DangerStatus } from '../db/models/VideoAnalysis'
import { User } from '../db/models/user'

// Создание записи (Python будет вызывать этот метод)
// Создание записи (Python будет вызывать этот метод)
export const createVideoAnalysis = async (req: Request, res: Response) => {
  try {
    const {
      video_url,
      title,
      tags,
      safety_percent,
      verdict_text,
      is_dangerous,
      duration_seconds,
      preview_image_url,
      checked_at,
      // userId больше не принимаем из тела!
    } = req.body

    // Проверка обязательных полей
    if (
      !video_url ||
      safety_percent === undefined ||
      !verdict_text ||
      is_dangerous === undefined ||
      !duration_seconds
    ) {
      return res.status(400).json({
        error:
          'Missing required fields: video_url, safety_percent, verdict_text, is_dangerous, duration_seconds',
      })
    }

    // Валидация verdict_text
    if (!Object.values(DangerStatus).includes(verdict_text)) {
      return res.status(400).json({
        error: `verdict_text must be one of: ${Object.values(DangerStatus).join(', ')}`,
      })
    }

    // Берём userId из авторизованного пользователя (установлен middleware accessLevel)
    const userId = req.user?.id || null

    const analysis = await VideoAnalysis.create({
      video_url,
      title: title || null,
      tags: tags || null,
      safety_percent,
      verdict_text,
      is_dangerous,
      duration_seconds,
      preview_image_url: preview_image_url || null,
      checked_at: checked_at ? new Date(checked_at) : new Date(),
      userId, // теперь безопасно
    })

    res.status(201).json(analysis)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Получить все записи с поддержкой фильтров и пагинации
export const getAllVideoAnalyses = async (req: Request, res: Response) => {
  try {
    // Параметры фильтрации из query
    const { is_dangerous, userId, limit = 50, offset = 0 } = req.query

    const whereClause: any = {}

    if (is_dangerous !== undefined) {
      whereClause.is_dangerous = is_dangerous === 'true'
    }
    if (userId) {
      whereClause.userId = userId
    }

    const analyses = await VideoAnalysis.findAndCountAll({
      where: whereClause,
      limit: Number(limit),
      offset: Number(offset),
      order: [['checked_at', 'DESC']],
      include: [
        { model: User, attributes: ['id', 'email', 'first_name', 'last_name'] },
      ],
    })

    res.json({
      total: analyses.count,
      limit: Number(limit),
      offset: Number(offset),
      data: analyses.rows,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Получить одну запись по ID
export const getVideoAnalysisById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const analysis = await VideoAnalysis.findByPk(id, {
      include: [
        { model: User, attributes: ['id', 'email', 'first_name', 'last_name'] },
      ],
    })

    if (!analysis) {
      return res.status(404).json({ error: 'Video analysis not found' })
    }

    res.json(analysis)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Получить все записи конкретного пользователя (альтернативный маршрут)
export const getAnalysesByUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    const user = await User.findByPk(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const analyses = await VideoAnalysis.findAll({
      where: { userId },
      order: [['checked_at', 'DESC']],
    })

    res.json(analyses)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Удалить запись (если нужно)
export const deleteVideoAnalysis = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const analysis = await VideoAnalysis.findByPk(id)
    if (!analysis) {
      return res.status(404).json({ error: 'Video analysis not found' })
    }

    await analysis.destroy()
    res.status(204).send()
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
