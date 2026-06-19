import cron from 'node-cron'
import {
  AnalysisQueue,
  QueueStatus,
  VideoAnalysis,
  SystemSettings,
} from '../../db'

let isRunning = false
let lastRunTime: Date | null = null
let currentIntervalMinutes = 1

const getScanInterval = async (): Promise<number> => {
  try {
    const settings = await SystemSettings.findOne()
    return settings?.scanInterval || 5
  } catch (error) {
    console.warn(
      '⚠️ Не удалось получить настройки, используем интервал 5 минут'
    )
    return 5
  }
}

const processQueue = async () => {
  if (isRunning) {
    console.info('⏳ Анализ уже запущен, пропускаем')
    return
  }

  const now = new Date()
  if (lastRunTime) {
    const diffMinutes = (now.getTime() - lastRunTime.getTime()) / 60000
    if (diffMinutes < currentIntervalMinutes) {
      console.info(
        `⏳ Интервал ${currentIntervalMinutes} мин. ещё не истёк (прошло ${diffMinutes.toFixed(1)} мин.), пропускаем`
      )
      return
    }
  }

  console.info('🔄 Запущен анализ видео в очереди')
  isRunning = true
  lastRunTime = now

  try {
    while (true) {
      const job = await AnalysisQueue.findOne({
        where: { status: QueueStatus.PENDING },
        order: [['createdAt', 'ASC']], // FIFO: сначала старые
      })

      if (!job) {
        console.info('✅ Очередь пуста')
        break
      }

      const existingAnalysis = await VideoAnalysis.findOne({
        where: { video_url: job.url },
      })
      if (existingAnalysis) {
        console.warn(
          `⏩ Видео ${job.url} уже проанализировано, удаляем из очереди`
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

        await VideoAnalysis.create(videoData)
        await job.destroy()
        console.log(
          `✅ Видео ${job.url} успешно обработано и удалено из очереди`
        )
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
}

const startWorker = async () => {
  currentIntervalMinutes = await getScanInterval()
  console.log(
    `🕒 Воркер очереди запущен с интервалом ${currentIntervalMinutes} мин. (проверка каждую минуту)`
  )

  cron.schedule('*/1 * * * *', async () => {
    const newInterval = await getScanInterval()
    if (newInterval !== currentIntervalMinutes) {
      console.log(
        `🔄 Интервал обновлён: ${currentIntervalMinutes} → ${newInterval} мин.`
      )
      currentIntervalMinutes = newInterval
    }
    await processQueue()
  })

  setTimeout(processQueue, 1000)
}

startWorker()
console.log('✅ Воркер очереди инициализирован')
