import { Request, Response } from 'express'
import { SystemSettings } from '../db/models/SystemSettings'
import unexpectedError from '../helpers/unexpectedError'

export const getSettings = async (req: Request, res: Response) => {
  try {
    let settings = await SystemSettings.findOne()
    if (!settings) {
      settings = await SystemSettings.create({
        scanInterval: 5,
        autoRefreshNews: true,
        newsParseInterval: 60,
        newsSources: JSON.stringify([
          'https://time.kz/rss',
          'https://sadaq.kz/ru/rss/latest-posts',
          'https://newtimes.kz/rss',
          'https://egemen.kz/rss',
        ]),
      })
    }
    res.json({
      scanInterval: settings.scanInterval,
      autoRefreshNews: settings.autoRefreshNews,
      newsParseInterval: settings.newsParseInterval,
      newsSources: JSON.parse(settings.newsSources || '[]'),
    })
  } catch (e) {
    unexpectedError(res, e)
  }
}

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const { scanInterval, autoRefreshNews, newsParseInterval, newsSources } =
      req.body

    let settings = await SystemSettings.findOne()
    if (!settings) {
      settings = await SystemSettings.create({})
    }

    if (scanInterval !== undefined) settings.scanInterval = scanInterval
    if (autoRefreshNews !== undefined)
      settings.autoRefreshNews = autoRefreshNews
    if (newsParseInterval !== undefined && newsParseInterval > 0) {
      settings.newsParseInterval = newsParseInterval
    }
    if (newsSources && Array.isArray(newsSources)) {
      settings.newsSources = JSON.stringify(newsSources)
    }

    await settings.save()

    res.json({
      message: 'Настройки обновлены',
      settings: {
        scanInterval: settings.scanInterval,
        autoRefreshNews: settings.autoRefreshNews,
        newsParseInterval: settings.newsParseInterval,
        newsSources: JSON.parse(settings.newsSources || '[]'),
      },
    })
  } catch (e) {
    unexpectedError(res, e)
  }
}
