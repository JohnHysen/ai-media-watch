import cron from 'node-cron'
import { AnalysisQueue, VideoAnalysis } from '../../db'

let isRunning = false
// Каждая минута - убрал для экономии памяти
cron.schedule('* * * * *', async () => {
  if (isRunning) {
    console.info('Анализ уже запущен')
    return
  }

  console.info('Запущен анализ видео в очереди')

  isRunning = true

  try {
    while (true) {
      const job = await AnalysisQueue.findOne({
        order: [
          ['priority', 'DESC'],
          ['createdAt', 'ASC'],
        ],
      })

      if (!job) {
        console.info('Очередь для анализа пуста')
        break
      }

      const exists = await VideoAnalysis.count({
        where: { video_url: job.url },
      })

      if (exists > 0) {
        console.warn('Видео уже было проанализировано')
        job.destroy()
        continue
      }

      const analyzeUrl = new URL(process.env.FASTAPI_URL + 'analyze')

      analyzeUrl.searchParams.set('url', job.url)

      const response = await fetch(analyzeUrl)
      const responseData = await response.json()

      await VideoAnalysis.create({
        video_url: responseData.video_url,
        title: responseData.title,
        safety_percent: responseData.safety_percent,
        verdict_text: responseData.verdict_text,
        reason: responseData.reason,
        is_dangerous: responseData.is_dangerous,
        duration_seconds: responseData.duration_seconds,
        preview_image_url: responseData.preview_image_url,
        checked_at: responseData.checked_at,
        userId: job.userId,
      })

      job.destroy()
    }
  } finally {
    isRunning = false
  }
})
// Или в каждой минуте десятая секунда: 10 * * * * *

// Каждая секунда
// cron.schedule('* * * * * *', () => {
//   console.log('running a task every second')
// })

// Каждый день в 9:30
// cron.schedule('30 9 * * *', () => {
//   console.log('running at 9:30')
// })
// cron.schedule('30 9 * * *', async () => {
//   const users = await User.findAll()
//   const date = new Date()
//   const dow = date.getDay()
//   users.forEach((u) => {
//     if (u.balance < 100 && u.tg_id && u.notification_preferences[dow]) {
//       bot.telegram.sendMessage(u.tg_id, 'У вас заканчиваются деньги!')
//     }
//   })
// })

// 25-ое число каждого месяца в 9:30
// cron.schedule('30 9 25 * *', () => {
//   console.log('running a task every 25.x at 9:30')
// })
