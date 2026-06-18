// cron/analysisQueueProcessor.ts
import cron from 'node-cron'
import { AnalysisQueue, QueueStatus, VideoAnalysis } from '../../db'

let isRunning = false

cron.schedule('* * * * *', async () => {
  if (isRunning) {
    console.info('⏳ Анализ уже запущен, пропускаем')
    return
  }

  console.info('🔄 Запущен анализ видео в очереди')

  isRunning = true

  try {
    while (true) {
      const job = await AnalysisQueue.findOne({
        where: { status: QueueStatus.PENDING },
        order: [
          ['priority', 'DESC'],
          ['createdAt', 'ASC'],
        ],
      })

      if (!job) {
        console.info('✅ Очередь пуста')
        break
      }

      // Проверяем, не было ли уже проанализировано это видео
      const exists = await VideoAnalysis.count({
        where: { video_url: job.url },
      })

      if (exists > 0) {
        console.warn(
          `⚠️ Видео ${job.url} уже проанализировано, удаляем из очереди`
        )
        await job.destroy()
        continue
      }

      await job.update({ status: QueueStatus.PROCESSING })

      try {
        const fastApiUrl = process.env.FASTAPI_URL
        if (!fastApiUrl) {
          throw new Error('FASTAPI_URL не задан в переменных окружения')
        }

        const analyzeUrl = new URL(fastApiUrl + 'analyze')
        analyzeUrl.searchParams.set('url', job.url)

        console.log(`📹 Обработка видео: ${job.url}`)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 120000)

        const response = await fetch(analyzeUrl.toString(), {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        console.log(
          '📦 Получен ответ от Python:',
          JSON.stringify(data, null, 2)
        )

        // Маппинг полей из Python-ответа в модель VideoAnalysis
        const videoData = {
          video_url: job.url,
          title: data.title || null,
          safety_percent: data.safety_percent ?? 0,
          verdict_text: data.verdict_text || 'uncertain',
          reason: data.reason || null,
          is_dangerous: data.is_dangerous ?? false,
          duration_seconds: data.duration_seconds ?? 0,
          preview_image_url: data.preview_image_url || null,
          checked_at: data.checked_at ? new Date(data.checked_at) : new Date(),
          userId: job.userId,
        }

        console.log('📝 Сохраняемые данные:', videoData)

        await VideoAnalysis.create(videoData)

        await job.update({
          status: QueueStatus.COMPLETED,
          processed_at: new Date(),
        })
        await job.destroy()

        console.log(`✅ Видео ${job.url} успешно обработано и сохранено`)
      } catch (fetchError: any) {
        console.error(
          `❌ Ошибка при обработке видео ${job.url}:`,
          fetchError.message
        )
        await job.update({
          status: QueueStatus.FAILED,
          error_message: fetchError.message || 'Unknown error',
        })
      }
    }
  } catch (error) {
    console.error('❌ Критическая ошибка в воркере очереди:', error)
  } finally {
    isRunning = false
  }
})

console.log('🕒 Воркер очереди запущен (каждую минуту)')
