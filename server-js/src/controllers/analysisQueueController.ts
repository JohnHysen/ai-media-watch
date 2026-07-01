import { Request, Response } from 'express'
import { AnalysisQueue, QueueStatus } from '../db/models/AnalysisQueue'
import { VideoAnalysis } from '../db/models/VideoAnalysis'
import { User } from '../db/models/user'

export const createAnalysisJob = async (req: Request, res: Response) => {
  try {
    // Получаем userId из тела запроса (с фронтенда) или из токена
    const { url, userId } = req.body
    const finalUserId = userId ?? req.user?.id ?? null

    if (!url) {
      return res.status(400).json({
        ok: false,
        message: 'Некорректная ссылка на видео',
      })
    }

    const existingAnalysis = await VideoAnalysis.findOne({
      where: { video_url: url },
    })
    if (existingAnalysis) {
      return res.status(409).json({
        ok: false,
        message: 'Это видео уже было проанализировано',
      })
    }

    const existingInQueue = await AnalysisQueue.findOne({
      where: {
        url,
        status: [QueueStatus.PENDING, QueueStatus.PROCESSING],
      },
    })
    if (existingInQueue) {
      return res.status(409).json({
        ok: false,
        message: 'Это видео уже в очереди на обработку',
      })
    }

    await AnalysisQueue.create({
      url,
      userId: finalUserId,
      status: QueueStatus.PENDING,
      platform: 'unknown',
      priority: 1,
    })

    return res.status(201).json({
      ok: true,
      message: 'Видео добавлено в очередь обработки',
    })
  } catch (error) {
    console.error('Ошибка создания задачи:', error)
    return res.status(500).json({
      ok: false,
      message: 'Внутренняя ошибка сервера',
    })
  }
}

export const getQueue = async (req: Request, res: Response) => {
  try {
    const { status, limit = 100, offset = 0 } = req.query
    const where: any = {}
    if (status) where.status = status

    const items = await AnalysisQueue.findAndCountAll({
      where,
      order: [
        ['priority', 'ASC'],
        ['createdAt', 'ASC'],
      ],
      limit: Number(limit),
      offset: Number(offset),
      include: [
        { model: User, attributes: ['id', 'email', 'first_name', 'last_name'] },
      ],
    })

    res.json({
      total: items.count,
      limit: Number(limit),
      offset: Number(offset),
      data: items.rows,
    })
  } catch (error) {
    console.error('Ошибка получения очереди:', error)
    res.status(500).json({
      ok: false,
      message: 'Внутренняя ошибка сервера',
    })
  }
}

export const updatePriority = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { priority } = req.body

    if (
      priority === undefined ||
      !Number.isInteger(priority) ||
      priority < 0 ||
      priority > 3
    ) {
      return res
        .status(400)
        .json({ error: 'Приоритет должен быть целым числом от 0 до 3' })
    }

    const job = await AnalysisQueue.findByPk(id)
    if (!job) {
      return res.status(404).json({ error: 'Задача не найдена' })
    }

    if (job.status !== QueueStatus.PENDING) {
      return res.status(400).json({
        error: 'Можно изменять приоритет только у задач в статусе PENDING',
      })
    }

    job.priority = priority
    await job.save()

    res.json({ message: 'Приоритет обновлён', job })
  } catch (error) {
    console.error('Ошибка обновления приоритета:', error)
    res.status(500).json({ error: 'Внутренняя ошибка сервера' })
  }
}

export const deleteQueueItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const job = await AnalysisQueue.findByPk(id)
    if (!job) {
      return res.status(404).json({ error: 'Задача не найдена' })
    }

    if (job.status === QueueStatus.PROCESSING) {
      return res
        .status(400)
        .json({ error: 'Нельзя удалить задачу, которая обрабатывается' })
    }

    await job.destroy()
    res.json({ message: 'Задача удалена' })
  } catch (error) {
    console.error('Ошибка удаления задачи:', error)
    res.status(500).json({ error: 'Внутренняя ошибка сервера' })
  }
}
