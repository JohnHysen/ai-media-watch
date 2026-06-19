import { Router } from 'express'
import Parser from 'rss-parser'

const router = Router()

// ----- Парсер для RSS (СМИ и Telegram) -----
const parser = new Parser({
  timeout: 20000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'application/rss+xml, application/xml, text/xml; q=0.9, */*; q=0.8',
    'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
  },
})

// ----- Список RSS-лент СМИ (проверенные) -----
const RSS_FEEDS = [
  'https://time.kz/rss', // Time.kz
  'https://sadaq.kz/ru/rss/latest-posts', // Sadaq.kz
  'https://newtimes.kz/rss', // Newtimes.kz
  'https://egemen.kz/rss', // Egemen Qazaqstan
  'https://tengrinews.kz/rss/', // Tengrinews (иногда работает)
  // Официальные (если будут работать)
  'https://www.gov.kz/memleket/entities/afm/press/news/rss', // АФМ (может не работать)
  'https://fingramota.kz/ru/news/rss',
]

// ----- Инстансы RSSHub для Telegram (с резервированием) -----
const RSSHUB_INSTANCES = [
  'https://rsshub.rssforever.com',
  'https://rsshub.app',
  'https://rsshub.epub.works',
  'https://rsshub.1329.workers.dev',
]

const SOCIAL_FEEDS = [{ path: '/telegram/channel/afm_rk', type: 'telegram' }]

// ----- Вспомогательные функции для RSS -----
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

// ----- Основной эндпоинт -----
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50
    const allArticles: any[] = []

    // 1. СМИ
    console.log('📰 Парсинг СМИ...')
    await Promise.all(
      RSS_FEEDS.map(async (feedUrl) => {
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

    // 2. Telegram
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

    // 3. Instagram удалён из-за проблем с парсингом

    // Сортировка по дате (новые сверху)
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
