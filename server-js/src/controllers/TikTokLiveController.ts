import { Request, Response } from 'express'
import { AnalysisQueue, QueueStatus, SystemSettings } from '../db/index.js'
import { exec, spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import unexpectedError from '../helpers/unexpectedError.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const getPythonPath = (): string => {
  if (process.env.PYTHON_EXECUTABLE) {
    return process.env.PYTHON_EXECUTABLE
  }
  const venvPaths = [
    path.join(__dirname, '../../../server/.venv/Scripts/python.exe'),
    path.join(__dirname, '../../../server/.venv/bin/python'),
  ]
  for (const p of venvPaths) {
    if (fs.existsSync(p)) {
      console.log(`✅ Найден Python: ${p}`)
      return p
    }
  }
  return 'python'
}

const getTiktokLiveScriptPath = (): string => {
  if (process.env.TIKTOK_LIVE_SCRAPER_PATH) {
    const envPath = process.env.TIKTOK_LIVE_SCRAPER_PATH
    if (fs.existsSync(envPath)) {
      console.log(`Используем путь из TIKTOK_LIVE_SCRAPER_PATH: ${envPath}`)
      return envPath
    }
  }
  const possiblePaths = [
    path.join(
      __dirname,
      '../../../server/python_scrapers/tiktok_live_parser.py'
    ),
    path.join(__dirname, '../../server/python_scrapers/tiktok_live_parser.py'),
    path.join(__dirname, '../python_scrapers/tiktok_live_parser.py'),
    path.join(process.cwd(), 'python_scrapers/tiktok_live_parser.py'),
  ]
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      console.log(`Найден скрипт TikTok Live: ${p}`)
      return p
    }
  }
  const defaultPath = path.join(
    __dirname,
    '../../../server/python_scrapers/tiktok_live_parser.py'
  )
  console.warn(`Скрипт не найден, используем: ${defaultPath}`)
  return defaultPath
}

const PYTHON_EXECUTABLE = getPythonPath()
const TIKTOK_LIVE_SCRIPT_PATH = getTiktokLiveScriptPath()

let tiktokLiveProcess: any = null
const lastTiktokLiveResult: {
  timestamp: Date | null
  addedCount: number
  error: string | null
} = {
  timestamp: null,
  addedCount: 0,
  error: null,
}

export const startTiktokLiveProcess = async (req: Request, res: Response) => {
  try {
    if (tiktokLiveProcess) {
      return res.status(400).json({ error: 'TikTok Live парсинг уже запущен' })
    }

    const scriptPath = TIKTOK_LIVE_SCRIPT_PATH
    const pythonCmd = PYTHON_EXECUTABLE

    if (!fs.existsSync(scriptPath)) {
      return res.status(404).json({ error: `Файл не найден: ${scriptPath}` })
    }

    console.log('Запуск TikTok Live парсинга в фоне...')

    const child = spawn(pythonCmd, [scriptPath, '--limit', '5', '--json'], {
      detached: true,
      stdio: 'ignore',
    })
    child.unref()
    tiktokLiveProcess = child

    res.json({
      success: true,
      message: `TikTok Live парсинг запущен в фоне (PID: ${child.pid})`,
      pid: child.pid,
    })
  } catch (e) {
    unexpectedError(res, e)
  }
}

export const stopTiktokLiveProcess = async (req: Request, res: Response) => {
  try {
    if (!tiktokLiveProcess) {
      return res.status(400).json({ error: 'TikTok Live парсинг не запущен' })
    }

    console.log(
      `Остановка TikTok Live процесса (PID: ${tiktokLiveProcess.pid})`
    )

    if (process.platform === 'win32') {
      const { exec } = await import('child_process')
      exec(`taskkill /F /T /PID ${tiktokLiveProcess.pid}`)
    } else {
      tiktokLiveProcess.kill('SIGTERM')
    }

    tiktokLiveProcess = null
    res.json({ success: true, message: 'TikTok Live парсинг остановлен' })
  } catch (e) {
    unexpectedError(res, e)
  }
}

// ⚠️ ВНИМАНИЕ: ЭТА ФУНКЦИЯ ОБЪЯВЛЕНА ТОЛЬКО ОДИН РАЗ
export const getTiktokLiveStatus = async (req: Request, res: Response) => {
  try {
    const settings = await SystemSettings.findOne()
    const queueCount = await AnalysisQueue.count({
      where: {
        platform: 'tiktok_live',
        status: [QueueStatus.PENDING, QueueStatus.PROCESSING],
      },
    })
    const totalAnalyzed = await AnalysisQueue.count({
      where: { platform: 'tiktok_live', status: QueueStatus.COMPLETED },
    })

    let processRunning = false
    const pid = null
    if (tiktokLiveProcess && tiktokLiveProcess.pid) {
      try {
        if (process.platform === 'win32') {
          const { exec } = await import('child_process')
          const { stdout } = await new Promise((resolve, reject) => {
            exec(
              `tasklist /FI "PID eq ${tiktokLiveProcess.pid}"`,
              (err, stdout) => {
                if (err) reject(err)
                else resolve({ stdout })
              }
            )
          })
          processRunning = (stdout as string).includes(
            tiktokLiveProcess.pid.toString()
          )
        } else {
          process.kill(tiktokLiveProcess.pid, 0)
          processRunning = true
        }
      } catch {
        processRunning = false
        tiktokLiveProcess = null
      }
    }

    res.json({
      enabled: settings?.tiktokLiveEnabled || false,
      lastRun: lastTiktokLiveResult.timestamp,
      addedCount: lastTiktokLiveResult.addedCount,
      error: lastTiktokLiveResult.error,
      queueCount,
      totalAnalyzed,
      processRunning,
      pid: processRunning ? tiktokLiveProcess?.pid : null,
    })
  } catch (e) {
    unexpectedError(res, e)
  }
}

import { TikTokLive } from '../db/index.js'

export const getTiktokLiveData = async (req: Request, res: Response) => {
  try {
    const {
      limit = 50,
      offset = 0,
      search = '',
      status,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = req.query

    // Строим WHERE условия
    const where: any = {}

    // Фильтр по статусу (verdict_text)
    if (status) {
      where.verdict_text = status
    }

    // Поиск по автору или URL
    if (search) {
      where[Op.or] = [
        { authorName: { [Op.like]: `%${search}%` } },
        { video_url: { [Op.like]: `%${search}%` } },
      ]
    }

    // Получаем общее количество
    const total = await TikTokLive.count({ where })

    // Получаем данные с пагинацией
    const data = await TikTokLive.findAll({
      where,
      limit: Number(limit),
      offset: Number(offset),
      order: [[sortBy, sortOrder]],
    })

    res.json({
      success: true,
      data,
      total,
      limit: Number(limit),
      offset: Number(offset),
    })
  } catch (e) {
    unexpectedError(res, e)
  }
}

// ==================== ПОЛУЧЕНИЕ ОДНОГО ЗАПИСИ ПО ID ====================

export const getTiktokLiveById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const record = await TikTokLive.findByPk(id)

    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Запись не найдена',
      })
    }

    res.json({
      success: true,
      data: record,
    })
  } catch (e) {
    unexpectedError(res, e)
  }
}
