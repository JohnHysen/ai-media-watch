import { Router } from 'express'
import Parser from 'rss-parser'

const router = Router()
const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; AI-Media-Watch/1.0)',
  },
})

// Только рабочие RSS-ленты Казахстана
const RSS_FEEDS = [
  'https://time.kz/rss', // Time.kz
  'https://sadaq.kz/ru/rss/latest-posts', // Sadaq.kz
  'https://newtimes.kz/rss', // Newtimes.kz
  'https://egemen.kz/rss', // Egemen Qazaqstan
  'https://tengrinews.kz/rss/', // Tengrinews (иногда работает)
  // Официальные (если будут работать)
  'https://www.gov.kz/memleket/entities/afm/press/news/rss', // АФМ (может не работать)
  'https://fingramota.kz/ru/news/rss', // FinGramota (может не работать)
]

// Ключевые слова для фильтрации (широкие, чтобы ловить максимум)
const KEYWORDS = [
  'мошенничеств',
  'обман',
  'афера',
  'скам',
  'пирамид',
  'казино',
  'онлайн-казино',
  'азарт',
  'ставки',
  'букмекер',
  'tiktok',
  'тикток',
  'instagram',
  'инстаграм',
  'youtube',
  'ютуб',
  'соцсети',
  'социальные сети',
  'блогер',
  'реклама',
  'блокировка',
  'АФМ',
  'финмониторинг',
  'финансовый мониторинг',
]

// Проверка, содержит ли текст одно из ключевых слов
const matchesKeywords = (text: string): boolean => {
  const lower = text.toLowerCase()
  return KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()))
}

router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10

    const allArticles: any[] = []

    // Парсим все ленты параллельно
    await Promise.all(
      RSS_FEEDS.map(async (feedUrl) => {
        try {
          const feed = await parser.parseURL(feedUrl)
          const items = feed.items
            .filter((item) => {
              const text =
                (item.title || '') + ' ' + (item.contentSnippet || '')
              return matchesKeywords(text)
            })
            .map((item) => ({
              title: item.title || 'Без названия',
              description: item.contentSnippet || item.description || '',
              url: item.link || '#',
              source: feed.title || new URL(feedUrl).hostname,
              publishedAt:
                item.pubDate || item.isoDate || new Date().toISOString(),
              urlToImage: null,
            }))
          allArticles.push(...items)
        } catch (err) {
          console.error(`Ошибка парсинга ${feedUrl}:`, err.message)
        }
      })
    )

    // Сортируем по дате (новые сверху)
    allArticles.sort((a, b) => {
      const dateA = new Date(a.publishedAt).getTime()
      const dateB = new Date(b.publishedAt).getTime()
      return dateB - dateA
    })

    const articles = allArticles.slice(0, limit)

    console.log(
      `📰 Найдено новостей после фильтрации: ${allArticles.length}, возвращено: ${articles.length}`
    )

    res.json({ articles })
  } catch (error) {
    console.error('News API error:', error)
    res.status(500).json({ error: 'Failed to fetch news' })
  }
})

export default router
