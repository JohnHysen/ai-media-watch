import { Response, Request } from 'express'

import { generateJwt } from '../helpers/generateJwt'
import unexpectedError from '../helpers/unexpectedError'
import { VideoAnalysis } from '../db/models/VideoAnalysis'
import sequelize from '../db/db'
import { User } from '../db/models/user'

export const verify = async (req: Request, res: Response) => {
  try {
    const user = req.user

    if (!user) {
      return res.status(401).json({ message: 'User not found' })
    }
    return res.json({
      user: req.user,
      token: generateJwt(user.id, user.role),
    })
  } catch (e) {
    return unexpectedError(res, e)
  }
}

export const getUserStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id
    const totalChecks = await VideoAnalysis.count({ where: { userId } })
    const threatsFound = await VideoAnalysis.count({
      where: { userId, is_dangerous: true },
    })

    const avgResult = await VideoAnalysis.findOne({
      where: { userId },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('safety_percent')), 'avgSafety'],
      ],
      raw: true,
    })
    const avgSafety = avgResult?.avgSafety || 100
    const averageRisk = Math.round(100 - avgSafety)
    const reputation = Math.min(
      100,
      Math.round(totalChecks * 1.2 + (100 - averageRisk) * 0.6)
    )

    res.json({ totalChecks, threatsFound, averageRisk, reputation })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
}

export const updateAvatar = async (req: Request, res: Response) => {
  try {
    console.log('📸 updateAvatar вызван')
    console.log('🔍 req.body:', req.body)

    const { avatarUrl } = req.body

    if (!avatarUrl || typeof avatarUrl !== 'string') {
      return res
        .status(400)
        .json({ error: 'avatarUrl is required and must be a string' })
    }

    const trimmed = avatarUrl.trim()
    if (!trimmed) {
      return res.status(400).json({ error: 'avatarUrl cannot be empty' })
    }

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return res.status(400).json({
        error: 'Invalid URL format. Must start with http:// or https://',
      })
    }

    const userId = req.user.id
    await User.update({ photoURL: trimmed }, { where: { id: userId } })
    const updatedUser = await User.findByPk(userId)
    res.json({ avatarUrl: trimmed, user: updatedUser })
  } catch (error) {
    console.error('❌ Error updating avatar:', error)
    res.status(500).json({ error: 'Server error' })
  }
}
export const getUserActivity = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id
    const days = parseInt(req.query.days as string) || 7
    const dates = Array.from({ length: days }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (days - 1 - i))
      return d.toISOString().split('T')[0]
    })

    const results = await VideoAnalysis.findAll({
      where: { userId },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('checked_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: [sequelize.fn('DATE', sequelize.col('checked_at'))],
      raw: true,
    })

    const map: Record<string, number> = {}
    results.forEach((r: any) => {
      map[r.date] = parseInt(r.count)
    })

    const data = dates.map((date) => ({
      date,
      count: map[date] || 0,
    }))

    res.json({ labels: dates, data })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
}

export const getVerdictDistribution = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id
    const results = await VideoAnalysis.findAll({
      where: { userId },
      attributes: [
        'verdict_text',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['verdict_text'],
      raw: true,
    })

    const map = { safe: 0, dangerous: 0, uncertain: 0 }
    results.forEach((r: any) => {
      if (r.verdict_text === 'safe') map.safe = parseInt(r.count)
      else if (r.verdict_text === 'dangerous') map.dangerous = parseInt(r.count)
      else if (r.verdict_text === 'uncertain') map.uncertain = parseInt(r.count)
    })

    res.json(map)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
}

export const getRecentChecks = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id
    const limit = parseInt(req.query.limit as string) || 5
    const checks = await VideoAnalysis.findAll({
      where: { userId },
      order: [['checked_at', 'DESC']],
      limit,
      attributes: [
        'id',
        'title',
        'video_url',
        'verdict_text',
        'safety_percent',
        'checked_at',
      ],
    })
    res.json(checks)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
}
