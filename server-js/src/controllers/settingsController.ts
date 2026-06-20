import { Request, Response } from 'express'
import { SystemSettings } from '../db/models/SystemSettings'
import { AnalysisQueue, QueueStatus } from '../db/models/AnalysisQueue'
import { VideoAnalysis } from '../db/models/VideoAnalysis'
import { Op } from 'sequelize'
import unexpectedError from '../helpers/unexpectedError.js'
import { exec, spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

// Для получения __dirname в ES-модулях
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Переменная для хранения последнего результата парсинга
let lastScrapeResult: {
  timestamp: Date | null
  addedCount: number
  totalFound: number
  error: string | null
} = {
  timestamp: null,
  addedCount: 0,
  totalFound: 0,
  error: null,
}

// Хранилище запущенного процесса парсинга (для отдельного окна)
let scrapeProcess: any = null

// ============================================================
// ОПРЕДЕЛЕНИЕ ПУТИ К PYTHON-СКРИПТУ И ВИРТУАЛЬНОМУ ОКРУЖЕНИЮ
// ============================================================
const getPythonPath = (): string => {
  // 1. Если задано через переменную окружения
  if (process.env.PYTHON_EXECUTABLE) {
    return process.env.PYTHON_EXECUTABLE
  }

  // 2. Проверяем стандартные пути для виртуального окружения
  const venvPaths = [
    path.join(__dirname, '../../../server/.venv/Scripts/python.exe'), // Windows
    path.join(__dirname, '../../../server/.venv/bin/python'), // Linux/Mac
  ]
  for (const p of venvPaths) {
    if (fs.existsSync(p)) {
      console.log(`✅ Найден Python в виртуальном окружении: ${p}`)
      return p
    }
  }

  // 3. Fallback: просто 'python'
  console.warn(
    '⚠️ Виртуальное окружение не найдено, используем "python" из PATH'
  )
  return 'python'
}

const getPythonScriptPath = (): string => {
  // Приоритет: переменная окружения
  if (process.env.PYTHON_SCRAPER_PATH) {
    const envPath = process.env.PYTHON_SCRAPER_PATH
    if (fs.existsSync(envPath)) {
      console.log(`✅ Используем путь из PYTHON_SCRAPER_PATH: ${envPath}`)
      return envPath
    }
    console.warn(`⚠️ Путь из PYTHON_SCRAPER_PATH не существует: ${envPath}`)
  }

  // Возможные пути (относительно текущего файла: server-js/src/controllers)
  const possiblePaths = [
    path.join(__dirname, '../../../server/python_scrapers/main_parser.py'),
    path.join(__dirname, '../../server/python_scrapers/main_parser.py'),
    path.join(__dirname, '../python_scrapers/main_parser.py'),
    path.join(__dirname, 'python_scrapers/main_parser.py'),
    path.join(process.cwd(), 'server/python_scrapers/main_parser.py'),
  ]

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      console.log(`✅ Найден Python-скрипт: ${p}`)
      return p
    }
  }

  // Если не найден, возвращаем путь по умолчанию для ошибки
  const defaultPath = path.join(
    __dirname,
    '../../../server/python_scrapers/main_parser.py'
  )
  console.warn(`⚠️ Python-скрипт не найден. Используем: ${defaultPath}`)
  return defaultPath
}

const PYTHON_EXECUTABLE = getPythonPath()
const PYTHON_SCRIPT_PATH = getPythonScriptPath()

// ============================================================
// ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ: ЗАПУСК ПАРСИНГА (возвращает JSON)
// ============================================================
const runPythonScraper = (): Promise<{
  success: boolean
  addedCount: number
  totalFound: number
  message?: string
}> => {
  return new Promise((resolve) => {
    if (!fs.existsSync(PYTHON_SCRIPT_PATH)) {
      console.error(`❌ Файл не найден: ${PYTHON_SCRIPT_PATH}`)
      return resolve({
        success: false,
        addedCount: 0,
        totalFound: 0,
        message: `Файл не найден: ${PYTHON_SCRIPT_PATH}`,
      })
    }

    // Получаем директорию, где находится скрипт, чтобы добавить в PYTHONPATH
    const scriptDir = path.dirname(PYTHON_SCRIPT_PATH)
    const pythonPathEnv = process.env.PYTHONPATH || ''
    const newPythonPath =
      scriptDir + (pythonPathEnv ? path.delimiter + pythonPathEnv : '')

    const cmd = `"${PYTHON_EXECUTABLE}" "${PYTHON_SCRIPT_PATH}" --json`
    console.log('🔄 Запуск Python-скрапера:', cmd)
    console.log(`   PYTHONPATH=${newPythonPath}`)

    const env = { ...process.env, PYTHONPATH: newPythonPath }

    exec(cmd, { timeout: 300000, env }, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Ошибка выполнения Python-скрипта:', error.message)
        console.error('stderr:', stderr)
        return resolve({
          success: false,
          addedCount: 0,
          totalFound: 0,
          message: stderr || error.message,
        })
      }

      try {
        const result = JSON.parse(stdout)
        console.log('✅ Python-скрипт выполнен:', result)
        resolve({
          success: true,
          addedCount: result.total_added || 0,
          totalFound: result.total_found || 0,
          message: 'Сбор выполнен успешно',
        })
      } catch (e) {
        console.error('❌ Ошибка парсинга JSON из stdout:', stdout)
        resolve({
          success: false,
          addedCount: 0,
          totalFound: 0,
          message: 'Ошибка парсинга JSON из вывода Python',
        })
      }
    })
  })
}

// ============================================================
// ПОЛУЧИТЬ ВСЕ НАСТРОЙКИ
// ============================================================
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
        videoScrapeInterval: 60,
        scrapeLimitPerPlatform: 5,
        scrapeTimeoutSeconds: 30,
        enableYouTube: true,
        enableTikTok: true,
        enableInstagram: true,
        scrapingEnabled: false,
      })
    }
    res.json({
      scanInterval: settings.scanInterval,
      autoRefreshNews: settings.autoRefreshNews,
      newsParseInterval: settings.newsParseInterval,
      newsSources: JSON.parse(settings.newsSources || '[]'),
      videoScrapeInterval: settings.videoScrapeInterval || 60,
      scrapeLimitPerPlatform: settings.scrapeLimitPerPlatform || 5,
      scrapeTimeoutSeconds: settings.scrapeTimeoutSeconds || 30,
      enableYouTube: settings.enableYouTube ?? true,
      enableTikTok: settings.enableTikTok ?? true,
      enableInstagram: settings.enableInstagram ?? true,
      scrapingEnabled: settings.scrapingEnabled ?? false,
    })
  } catch (e) {
    unexpectedError(res, e)
  }
}

// ============================================================
// ОБНОВИТЬ НАСТРОЙКИ
// ============================================================
export const updateSettings = async (req: Request, res: Response) => {
  try {
    const {
      scanInterval,
      autoRefreshNews,
      newsParseInterval,
      newsSources,
      videoScrapeInterval,
      scrapeLimitPerPlatform,
      scrapeTimeoutSeconds,
      enableYouTube,
      enableTikTok,
      enableInstagram,
    } = req.body

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
    if (videoScrapeInterval !== undefined && videoScrapeInterval > 0) {
      settings.videoScrapeInterval = videoScrapeInterval
    }
    if (scrapeLimitPerPlatform !== undefined && scrapeLimitPerPlatform > 0) {
      settings.scrapeLimitPerPlatform = scrapeLimitPerPlatform
    }
    if (scrapeTimeoutSeconds !== undefined && scrapeTimeoutSeconds > 0) {
      settings.scrapeTimeoutSeconds = scrapeTimeoutSeconds
    }
    if (enableYouTube !== undefined) settings.enableYouTube = enableYouTube
    if (enableTikTok !== undefined) settings.enableTikTok = enableTikTok
    if (enableInstagram !== undefined)
      settings.enableInstagram = enableInstagram

    await settings.save()

    res.json({
      message: 'Настройки обновлены',
      settings: {
        scanInterval: settings.scanInterval,
        autoRefreshNews: settings.autoRefreshNews,
        newsParseInterval: settings.newsParseInterval,
        newsSources: JSON.parse(settings.newsSources || '[]'),
        videoScrapeInterval: settings.videoScrapeInterval,
        scrapeLimitPerPlatform: settings.scrapeLimitPerPlatform,
        scrapeTimeoutSeconds: settings.scrapeTimeoutSeconds,
        enableYouTube: settings.enableYouTube,
        enableTikTok: settings.enableTikTok,
        enableInstagram: settings.enableInstagram,
        scrapingEnabled: settings.scrapingEnabled,
      },
    })
  } catch (e) {
    unexpectedError(res, e)
  }
}

// ============================================================
// ВКЛЮЧИТЬ/ВЫКЛЮЧИТЬ ЦИКЛИЧЕСКИЙ ПАРСИНГ
// ============================================================
export const toggleScraping = async (req: Request, res: Response) => {
  try {
    let settings = await SystemSettings.findOne()
    if (!settings) {
      settings = await SystemSettings.create({})
    }
    settings.scrapingEnabled = !settings.scrapingEnabled
    await settings.save()

    if (settings.scrapingEnabled) {
      console.log('🔄 Парсинг включён, запускаем первый сбор...')
      const result = await runPythonScraper()
      if (result.success) {
        lastScrapeResult = {
          timestamp: new Date(),
          addedCount: result.addedCount,
          totalFound: result.totalFound,
          error: null,
        }
      } else {
        lastScrapeResult = {
          timestamp: new Date(),
          addedCount: 0,
          totalFound: 0,
          error: result.message || 'Ошибка запуска Python-скрапера',
        }
      }
    }

    res.json({
      message: settings.scrapingEnabled
        ? 'Парсинг запущен'
        : 'Парсинг остановлен',
      scrapingEnabled: settings.scrapingEnabled,
    })
  } catch (e) {
    unexpectedError(res, e)
  }
}

// ============================================================
// РУЧНОЙ ЗАПУСК СБОРА ВИДЕО (ОДНОРАЗОВЫЙ)
// ============================================================
export const triggerVideoScrape = async (req: Request, res: Response) => {
  try {
    const result = await runPythonScraper()
    if (result.success) {
      lastScrapeResult = {
        timestamp: new Date(),
        addedCount: result.addedCount,
        totalFound: result.totalFound,
        error: null,
      }
      res.json({
        message: `Сбор видео завершён. Добавлено ${result.addedCount} новых видео из ${result.totalFound} найденных.`,
        addedCount: result.addedCount,
        totalFound: result.totalFound,
      })
    } else {
      lastScrapeResult = {
        timestamp: new Date(),
        addedCount: 0,
        totalFound: 0,
        error: result.message || 'Ошибка при сборе видео',
      }
      res
        .status(500)
        .json({ error: result.message || 'Ошибка при сборе видео' })
    }
  } catch (e) {
    lastScrapeResult = {
      timestamp: new Date(),
      addedCount: 0,
      totalFound: 0,
      error: (e as Error).message,
    }
    unexpectedError(res, e)
  }
}

// ============================================================
// ЗАПУСК ПАРСИНГА В ОТДЕЛЬНОМ ОКНЕ ТЕРМИНАЛА
// ============================================================
export const startScrapingProcess = async (req: Request, res: Response) => {
  try {
    if (scrapeProcess) {
      return res.status(400).json({ error: 'Парсинг уже запущен' })
    }

    const scriptPath = PYTHON_SCRIPT_PATH
    const pythonCmd = PYTHON_EXECUTABLE

    if (!fs.existsSync(scriptPath)) {
      return res.status(404).json({ error: `Файл не найден: ${scriptPath}` })
    }

    console.log('🚀 Запуск парсинга в отдельном окне...')

    // Для Windows используем команду start
    if (process.platform === 'win32') {
      scrapeProcess = spawn('start', ['cmd', '/k', pythonCmd, scriptPath], {
        shell: true,
        stdio: 'ignore',
        detached: true,
      })
    } else {
      // Для Linux/macOS пробуем xterm, иначе в фоне
      try {
        scrapeProcess = spawn('xterm', ['-e', pythonCmd, scriptPath], {
          stdio: 'ignore',
          detached: true,
        })
      } catch {
        scrapeProcess = spawn(pythonCmd, [scriptPath], {
          stdio: 'ignore',
          detached: true,
        })
      }
    }

    scrapeProcess.unref()
    const pid = scrapeProcess.pid

    res.json({
      success: true,
      message: `Парсинг запущен в отдельном окне (PID: ${pid})`,
      pid,
    })
  } catch (e) {
    unexpectedError(res, e)
  }
}

// ============================================================
// ОСТАНОВКА ПАРСИНГА В ОТДЕЛЬНОМ ОКНЕ
// ============================================================
export const stopScrapingProcess = async (req: Request, res: Response) => {
  try {
    if (!scrapeProcess) {
      return res.status(400).json({ error: 'Парсинг не запущен' })
    }

    console.log(`🛑 Остановка процесса парсинга (PID: ${scrapeProcess.pid})`)

    if (process.platform === 'win32') {
      const { exec } = await import('child_process')
      exec(`taskkill /F /T /PID ${scrapeProcess.pid}`)
    } else {
      scrapeProcess.kill('SIGTERM')
    }

    scrapeProcess = null
    res.json({ success: true, message: 'Парсинг остановлен' })
  } catch (e) {
    unexpectedError(res, e)
  }
}

// ============================================================
// ПОЛУЧИТЬ СТАТУС ПАРСИНГА (включая состояние процесса)
// ============================================================
export const getScrapeStatus = async (req: Request, res: Response) => {
  try {
    const settings = await SystemSettings.findOne()
    const queueCount = await AnalysisQueue.count({
      where: { status: [QueueStatus.PENDING, QueueStatus.PROCESSING] },
    })
    const totalAnalyzed = await VideoAnalysis.count()

    let processRunning = false
    const pid = null
    if (scrapeProcess && scrapeProcess.pid) {
      try {
        if (process.platform === 'win32') {
          const { exec } = await import('child_process')
          const { stdout } = await new Promise((resolve, reject) => {
            exec(
              `tasklist /FI "PID eq ${scrapeProcess.pid}"`,
              (err, stdout) => {
                if (err) reject(err)
                else resolve({ stdout })
              }
            )
          })
          processRunning = (stdout as string).includes(
            scrapeProcess.pid.toString()
          )
        } else {
          process.kill(scrapeProcess.pid, 0)
          processRunning = true
        }
      } catch {
        processRunning = false
        scrapeProcess = null
      }
    }

    res.json({
      scrapingEnabled: settings?.scrapingEnabled || false,
      lastRun: lastScrapeResult.timestamp,
      addedCount: lastScrapeResult.addedCount,
      totalFound: lastScrapeResult.totalFound,
      error: lastScrapeResult.error,
      queueCount,
      totalAnalyzed,
      processRunning,
      pid: processRunning ? scrapeProcess?.pid : null,
    })
  } catch (e) {
    unexpectedError(res, e)
  }
}
