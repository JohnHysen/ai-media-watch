import { Request, Response } from 'express'
import { VideoAnalysis, DangerStatus } from '../db/models/VideoAnalysis'
import { User } from '../db/models/user'
import { ApifyClient } from 'apify-client'
import { autoAddResourceFromAnalysis } from './fraudResourceController' // импортируем функцию из соседнего файла

const client = new ApifyClient({
  token: process.env.APIFY_TOKEN,
})

const input = {
  hashtags: [
    'onlinecasino',
    'gambling',
    'betting',
    'passiveincome',
    'guaranteedprofit',
    'cryptosignals',
    'mlm',
  ],
  searchQueries: [
    'casino',
    'online casino',
    'казино',
    'игровые автоматы',
    'ставки',
    'betting',
  ],
  searchSection: '/video',
  resultsPerPage: 1,
  maxFollowersPerProfile: 0,
  maxFollowingPerProfile: 0,
  commentsPerPost: 0,
  topLevelCommentsPerPost: 0,
  maxRepliesPerComment: 0,
  proxyCountryCode: 'None',
}

// ============================================================
// 1. ПУБЛИЧНЫЙ ЭНДПОИНТ (с авторизацией, userId из req.user)
// ============================================================
export const createVideoAnalysis = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || null

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
      reason,
      primary_risk,
      uploader,
    } = req.body

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

    if (!Object.values(DangerStatus).includes(verdict_text)) {
      return res.status(400).json({
        error: `verdict_text must be one of: ${Object.values(DangerStatus).join(', ')}`,
      })
    }

    console.log('Создание записи для userId:', userId)

    // 1. Создаём запись о видеоанализе
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
      userId,
      reason: reason || null,
      primary_risk: primary_risk || null,
      uploader: uploader || null,
    })

    // 2. Автоматическое добавление в реестр мошеннических ресурсов
    if (analysis.is_dangerous && analysis.uploader) {
      try {
        await autoAddResourceFromAnalysis(analysis)
      } catch (err) {
        console.error('Ошибка при авто-добавлении в реестр:', err)
      }
    }

    res.status(201).json(analysis)
  } catch (error: any) {
    console.error('❌ Ошибка при создании VideoAnalysis:')
    console.error('  Сообщение:', error.message)
    console.error('  Стек:', error.stack)
    if (error.name === 'SequelizeValidationError') {
      console.error(
        '  Детали валидации:',
        error.errors.map((e: any) => e.message)
      )
    }
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      console.error('  Ошибка внешнего ключа:', error.message)
    }
    res.status(500).json({ error: 'Internal server error' })
  }
}

// ============================================================
// 2. ВНУТРЕННИЙ ЭНДПОИНТ ДЛЯ FASTAPI (без auth, userId из тела)
// ============================================================
export const createVideoAnalysisInternal = async (
  req: Request,
  res: Response
) => {
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
      primary_risk,
      userId,
      uploader,
    } = req.body

    if (
      !video_url ||
      safety_percent === undefined ||
      !verdict_text ||
      is_dangerous === undefined ||
      !duration_seconds
    ) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    if (!Object.values(DangerStatus).includes(verdict_text)) {
      return res.status(400).json({ error: 'Invalid verdict_text' })
    }

    console.log('Внутреннее создание записи для userId:', userId)

    // 1. Создаём запись о видеоанализе
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
      primary_risk: primary_risk || null,
      userId: userId || null,
      uploader: uploader || null,
    })

    // 2. Автоматическое добавление в реестр мошеннических ресурсов
    if (analysis.is_dangerous && analysis.uploader) {
      try {
        await autoAddResourceFromAnalysis(analysis)
      } catch (err) {
        console.error('Ошибка при авто-добавлении в реестр:', err)
      }
    }

    res.status(201).json(analysis)
  } catch (error: any) {
    console.error('❌ Ошибка при создании VideoAnalysis (internal):')
    console.error('  Сообщение:', error.message)
    console.error('  Стек:', error.stack)
    if (error.name === 'SequelizeValidationError') {
      console.error(
        '  Детали валидации:',
        error.errors.map((e: any) => e.message)
      )
    }
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      console.error('  Ошибка внешнего ключа:', error.message)
    }
    res.status(500).json({ error: 'Internal server error' })
  }
}

// ============================================================
// 3. ПОЛУЧИТЬ ВСЕ ЗАПИСИ (с фильтром по userId)
// ============================================================
export const getAllVideoAnalyses = async (req: Request, res: Response) => {
  try {
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

// ============================================================
// 4. ПОЛУЧИТЬ ОДНУ ЗАПИСЬ ПО ID
// ============================================================
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

// ============================================================
// 5. ПОЛУЧИТЬ ЗАПИСИ ПО ID ПОЛЬЗОВАТЕЛЯ
// ============================================================
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

// ============================================================
// 6. ЭНДПОИНТ ДЛЯ СКРАПИНГА (оставлен без изменений)
// ============================================================
export const scrapVideo = async (req: Request, res: Response) => {
  const run = await client.actor('clockworks/tiktok-scraper').call(input)

  console.log('Results from dataset')
  console.log(
    `Check your data here: https://console.apify.com/storage/datasets/${run.defaultDatasetId}`
  )
  const { items } = await client.dataset(run.defaultDatasetId).listItems()
  items.forEach((item) => {
    console.dir(item)
  })
}
