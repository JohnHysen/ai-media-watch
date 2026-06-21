import { Request, Response } from 'express'
import { FraudResource, ResourceStatus } from '../db/models/FraudResource'
import { User } from '../db/models/user'
import { Op } from 'sequelize'
import unexpectedError from '../helpers/unexpectedError.js'

// ============================================================
// ПОЛУЧИТЬ ВСЕ РЕСУРСЫ (с фильтрацией и пагинацией)
// ============================================================
export const getResources = async (req: Request, res: Response) => {
  try {
    const { status, platform, search, limit = 50, offset = 0 } = req.query
    const where: any = {}

    if (status) where.status = status
    if (platform) where.platform = platform
    if (search) {
      where[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { display_name: { [Op.iLike]: `%${search}%` } },
        { channel_url: { [Op.iLike]: `%${search}%` } },
      ]
    }

    const resources = await FraudResource.findAndCountAll({
      where,
      limit: Number(limit),
      offset: Number(offset),
      order: [
        ['dangerous_videos_count', 'DESC'],
        ['createdAt', 'DESC'],
      ],
      include: [
        {
          model: User,
          as: 'addedByUser',
          attributes: ['id', 'email', 'first_name', 'last_name'],
        },
        {
          model: User,
          as: 'verifiedByUser',
          attributes: ['id', 'email', 'first_name', 'last_name'],
        },
      ],
    })

    res.json({
      total: resources.count,
      limit: Number(limit),
      offset: Number(offset),
      data: resources.rows,
    })
  } catch (e) {
    unexpectedError(res, e)
  }
}

// ============================================================
// ПОЛУЧИТЬ ОДИН РЕСУРС
// ============================================================
export const getResourceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const resource = await FraudResource.findByPk(id, {
      include: [
        {
          model: User,
          as: 'addedByUser',
          attributes: ['id', 'email', 'first_name', 'last_name'],
        },
        {
          model: User,
          as: 'verifiedByUser',
          attributes: ['id', 'email', 'first_name', 'last_name'],
        },
      ],
    })
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' })
    }
    res.json(resource)
  } catch (e) {
    unexpectedError(res, e)
  }
}

// ============================================================
// СОЗДАТЬ РЕСУРС (вручную)
// ============================================================
export const createResource = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id
    const {
      platform,
      username,
      channel_url,
      display_name,
      description,
      status,
      tags,
    } = req.body

    if (!platform || !username) {
      return res
        .status(400)
        .json({ error: 'platform and username are required' })
    }

    const existing = await FraudResource.findOne({
      where: { platform, username },
    })
    if (existing) {
      return res.status(409).json({ error: 'Resource already exists' })
    }

    const resource = await FraudResource.create({
      platform,
      username,
      channel_url: channel_url || null,
      display_name: display_name || null,
      description: description || null,
      tags: tags ? JSON.stringify(tags) : null,
      status: status || ResourceStatus.PENDING,
      added_by: userId,
      dangerous_videos_count: 0,
    })

    res.status(201).json(resource)
  } catch (e) {
    unexpectedError(res, e)
  }
}

// ============================================================
// ОБНОВИТЬ РЕСУРС
// ============================================================
export const updateResource = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const {
      platform,
      username,
      channel_url,
      display_name,
      status,
      description,
      moderator_comment,
      tags,
    } = req.body

    const resource = await FraudResource.findByPk(id)
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' })
    }

    if (platform) resource.platform = platform
    if (username) resource.username = username
    if (channel_url !== undefined) resource.channel_url = channel_url
    if (display_name !== undefined) resource.display_name = display_name
    if (status && Object.values(ResourceStatus).includes(status)) {
      resource.status = status
      if (status === ResourceStatus.CONFIRMED) {
        resource.verified_by = req.user.id
        resource.verified_at = new Date()
      }
    }
    if (description !== undefined) resource.description = description
    if (moderator_comment !== undefined)
      resource.moderator_comment = moderator_comment
    if (tags) resource.tags = JSON.stringify(tags)

    await resource.save()
    res.json(resource)
  } catch (e) {
    unexpectedError(res, e)
  }
}

// ============================================================
// УДАЛИТЬ РЕСУРС (только ADMIN)
// ============================================================
export const deleteResource = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const resource = await FraudResource.findByPk(id)
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' })
    }
    await resource.destroy()
    res.status(204).send()
  } catch (e) {
    unexpectedError(res, e)
  }
}

// ============================================================
// АВТОМАТИЧЕСКОЕ ДОБАВЛЕНИЕ (вызывается из воркера очереди)
// ============================================================
export const autoAddResourceFromAnalysis = async (analysis: any) => {
  try {
    const { video_url, uploader } = analysis
    if (!uploader) return

    const platform = detectPlatform(video_url)
    const username = extractUsername(video_url, platform) || uploader

    const existing = await FraudResource.findOne({
      where: { platform, username },
    })

    if (existing) {
      existing.dangerous_videos_count += 1
      await existing.save()
    } else {
      await FraudResource.create({
        platform,
        username,
        display_name: uploader,
        channel_url: video_url,
        status: ResourceStatus.PENDING,
        dangerous_videos_count: 1,
        description: 'Автоматически добавлен из анализа опасного видео',
      })
    }
  } catch (e) {
    console.error('❌ Ошибка автоматического добавления в реестр:', e)
  }
}

function detectPlatform(url: string): string {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  if (url.includes('tiktok.com')) return 'tiktok'
  if (url.includes('instagram.com')) return 'instagram'
  return 'unknown'
}

function extractUsername(url: string, platform: string): string | null {
  try {
    if (platform === 'youtube') {
      const match =
        url.match(/\/@([^/?]+)/) ||
        url.match(/\/c\/([^/?]+)/) ||
        url.match(/\/user\/([^/?]+)/)
      return match ? match[1] : null
    }
    if (platform === 'tiktok') {
      const match = url.match(/@([^/?]+)/)
      return match ? match[1] : null
    }
    if (platform === 'instagram') {
      const match = url.match(/instagram\.com\/([^/?]+)/)
      return match ? match[1] : null
    }
    return null
  } catch {
    return null
  }
}
