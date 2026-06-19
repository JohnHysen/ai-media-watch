import { Router } from 'express'
import Parser from 'rss-parser'
import { SystemSettings } from '../db/models/SystemSettings'

const router = Router()

const parser = new Parser({
  timeout: 20000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'application/rss+xml, application/xml, text/xml; q=0.9, */*; q=0.8',
    'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
  },
})

// Получение списка RSS-источников из БД или fallback
const getNewsSources = async (): Promise<string[]> => {
  try {
    const settings = await SystemSettings.findOne()
    if (settings && settings.newsSources) {
      const parsed = JSON.parse(settings.newsSources)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (error) {
    console.warn(
      '⚠️ Не удалось получить источники новостей из БД, используем fallback'
    )
  }
  return [
    'https://time.kz/rss',
    'https://sadaq.kz/ru/rss/latest-posts',
    'https://newtimes.kz/rss',
    'https://egemen.kz/rss',
  ]
}

// ----- Инстансы RSSHub для Telegram -----
const RSSHUB_INSTANCES = [
  'https://rsshub.rssforever.com',
  'https://rsshub.app',
  'https://rsshub.epub.works',
  'https://rsshub.1329.workers.dev',
]

const SOCIAL_FEEDS = [{ path: '/telegram/channel/afm_rk', type: 'telegram' }]

// ----- Статический список ключевых слов для фильтрации (не изменяется админом) -----
const KEYWORDS = [
  'мошенничеств',
  'обман',
  'афера',
  'скам',
  'пирамид',
  'хайп',
  'инвестиции',
  'казино',
  'онлайн-казино',
  'игровые автомат',
  'рулетк',
  'ставки',
  'букмекер',
  'азарт',
  'АФМ',
  'финмониторинг',
  'блокировка',
  'соцсети',
  'социальные сети',
  'tiktok',
  'тикток',
  'youtube',
  'ютуб',
  'реферальн',
  'партнерская',
]

const matchesKeywords = (text: string): boolean => {
  const lower = text.toLowerCase()
  return KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()))
}

const getImageUrl = (item: any): string | null => {
  if (item.enclosure?.url) return item.enclosure.url
  if (item.media?.content?.url) return item.media.content.url
  if (item['media:content']?.$?.url) return item['media:content'].$.url
  if (item.content && item.content.includes('<img')) {
    const match = item.content.match(/<img.*?src="(.*?)"/)
    if (match) return match[1]
  }
  return null
}

const getDescription = (item: any): string => {
  return item.contentSnippet || item.description || item.content || ''
}

const parseWithRSSHub = async (path: string): Promise<any> => {
  let lastError: Error | null = null
  for (const instance of RSSHUB_INSTANCES) {
    try {
      const url = `${instance}${path}`
      console.log(`🔍 Пробуем RSSHub: ${url}`)
      const feed = await parser.parseURL(url)
      console.log(`✅ RSSHub ${instance} ответил успешно`)
      return feed
    } catch (err) {
      console.warn(`⚠️ RSSHub ${instance} не работает:`, (err as Error).message)
      lastError = err as Error
    }
  }
  throw new Error(`Все инстансы RSSHub недоступны: ${lastError?.message}`)
}

router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50
    const allArticles: any[] = []

    // 1. СМИ (источники из настроек, фильтрация по ключевым словам)
    console.log('📰 Парсинг СМИ...')
    const sources = await getNewsSources()
    await Promise.all(
      sources.map(async (feedUrl) => {
        try {
          const feed = await parser.parseURL(feedUrl)
          const items = feed.items
            .filter((item) => {
              const text = (item.title || '') + ' ' + getDescription(item)
              return matchesKeywords(text)
            })
            .map((item) => ({
              title: item.title || 'Без названия',
              description: getDescription(item),
              url: item.link || '#',
              source: feed.title || new URL(feedUrl).hostname,
              publishedAt:
                item.pubDate || item.isoDate || new Date().toISOString(),
              urlToImage: getImageUrl(item),
            }))
          allArticles.push(...items)
          console.log(`✅ СМИ ${feedUrl}: ${items.length} новостей`)
        } catch (err) {
          console.error(`❌ Ошибка СМИ ${feedUrl}:`, (err as Error).message)
        }
      })
    )

    // 2. Telegram (фильтрация по ключевым словам)
    console.log('📱 Парсинг Telegram через RSSHub...')
    await Promise.all(
      SOCIAL_FEEDS.map(async (feedConfig) => {
        try {
          const feed = await parseWithRSSHub(feedConfig.path)
          const items = feed.items
            .filter((item) => {
              const text = (item.title || '') + ' ' + getDescription(item)
              return matchesKeywords(text)
            })
            .map((item) => ({
              title: item.title || 'Без названия',
              description: getDescription(item),
              url: item.link || '#',
              source: 'Telegram',
              publishedAt:
                item.pubDate || item.isoDate || new Date().toISOString(),
              urlToImage: getImageUrl(item),
            }))
          allArticles.push(...items)
          console.log(`✅ Telegram: ${items.length} новостей`)
        } catch (err) {
          console.error(`❌ Ошибка Telegram:`, (err as Error).message)
        }
      })
    )

    allArticles.sort((a, b) => {
      return (
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      )
    })

    const articles = allArticles.slice(0, limit)

    console.log(
      `📊 ИТОГО: найдено ${allArticles.length}, возвращено ${articles.length}`
    )

    res.json({ articles })
  } catch (error) {
    console.error('❌ News API fatal error:', error)
    res.status(500).json({ error: 'Failed to fetch news' })
  }
})

export default router
