import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'

puppeteer.use(StealthPlugin())

import {
  startTiktokLiveProcess,
  stopTiktokLiveProcess,
  getTiktokLiveStatus,
  getTiktokLiveData,
  getTiktokLiveById,
} from '../controllers/tiktokLiveController.js'
import authMiddleware from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/checkRoleMiddleware.js'
import { TikTokLive } from '../db/db.js'
import { VerdictText } from '../db/models/TikTokLive.js'

const router = Router()

router.get(
  '/status',
  authMiddleware,
  requireRole(['ADMIN']),
  getTiktokLiveStatus
)
router.post(
  '/start',
  authMiddleware,
  requireRole(['ADMIN']),
  startTiktokLiveProcess
)
router.post(
  '/stop',
  authMiddleware,
  requireRole(['ADMIN']),
  stopTiktokLiveProcess
)

// Маршруты для получения данных из TikTokLive
router.get('/tiktok-live/data', getTiktokLiveData)
router.get('/tiktok-live/data/:id', getTiktokLiveById)

router.get('/tiktoklive', async (req, res) => {
  let browser

  try {
    browser = await puppeteer.launch({
      headless: false,

      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
      ],

      defaultViewport: {
        width: 1400,
        height: 900,
      },
    })

    const page = await browser.newPage()

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36'
    )

    await page.goto('https://www.tiktok.com/live', {
      waitUntil: 'networkidle2',
      timeout: 60000,
    })

    await new Promise((resolve) => setTimeout(resolve, 8000))

    const links = await page.$$eval('a[href*="/live"]', (elements) =>
      elements.map((el) => el.getAttribute('href'))
    )

    const uniqueLinks = [...new Set(links)]
      .filter((link) => link && /^\/@[^/]+\/live$/.test(link))
      .map((link) => `https://www.tiktok.com${link}`)

    console.log('FOUND STREAMS:')
    console.log(uniqueLinks)

    const clipsDir = path.join(process.cwd(), '..', 'storage')

    if (!fs.existsSync(clipsDir)) {
      fs.mkdirSync(clipsDir)
    }

    const results = []

    for (let i = 0; i < uniqueLinks.length; i++) {
      const streamUrl = uniqueLinks[i]

      console.log(`OPEN STREAM: ${streamUrl}`)

      let foundM3u8 = null

      const streamPage = await browser.newPage()

      await streamPage.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36'
      )

      streamPage.on('response', async (response) => {
        try {
          const url = response.url()

          if (url.includes('.m3u8') || url.includes('pull-flv')) {
            console.log('FOUND M3U8:')
            console.log(url)

            foundM3u8 = url
          }
        } catch (e) {
          console.log(e)
        }
      })

      try {
        await streamPage.goto(streamUrl, {
          waitUntil: 'networkidle2',
          timeout: 60000,
        })

        await new Promise((resolve) => setTimeout(resolve, 10000))

        if (foundM3u8) {
          const username = streamUrl.match(/@([^/]+)/)?.[1] || 'unknown'

          const timestamp = new Date()
            .toISOString()
            .replace(/:/g, '-')
            .replace(/\..+/, '')

          const fileName = `${username}_${timestamp}.mp4`

          const outputPath = path.join(clipsDir, fileName)

          console.log('START FFMPEG')

          await new Promise<void>((resolve, reject) => {
            exec(
              `ffmpeg -y -i "${foundM3u8}" -t 30 -c copy "${outputPath}"`,
              (err) => {
                if (err) {
                  console.log(err)
                  reject(err)
                } else {
                  console.log(`SAVED: ${outputPath}`)

                  resolve()
                }
              }
            )
          })

          results.push({
            stream: streamUrl,
            saved_to: outputPath,
            m3u8: foundM3u8,
          })

          const fastApiUrl = process.env.FASTAPI_URL
          if (!fastApiUrl) {
            throw new Error('FASTAPI_URL не задан в переменных окружения')
          }

          const analyzeUrl = new URL(fastApiUrl + 'analyzeLocal')
          analyzeUrl.searchParams.set('fileName', fileName)
          analyzeUrl.searchParams.set('userName', username)

          const analyzeResponse = await fetch(analyzeUrl.toString())

          const analyzeData = await analyzeResponse.json()

          await TikTokLive.create({
            authorName: analyzeData.authorName,
            video_url: analyzeData.video_url,
            safety_percent: analyzeData.safety_percent || 0,
            verdict_text: analyzeData.verdict_text || VerdictText.UNCERTAIN,
            reason_ru: analyzeData.reason_ru || null,
            reason_en: analyzeData.reason_en || null,
            reason_kz: analyzeData.reason_kz || null,
            is_dangerous: analyzeData.is_dangerous || false,
            duration_seconds: analyzeData.duration_seconds || 0,
            checked_at: analyzeData.checked_at
              ? new Date(analyzeData.checked_at)
              : new Date(),
            primary_risk: analyzeData.primary_risk || null,
          })

          console.log('я тут')
        } else {
          console.log('M3U8 NOT FOUND')
        }
      } catch (e) {
        console.log(e)
      }

      await streamPage.close()

      await new Promise((resolve) => setTimeout(resolve, 3000))
    }

    res.json({
      success: true,
      total_streams: uniqueLinks.length,
      downloaded: results.length,
      results,
    })
  } catch (err) {
    console.error(err)

    res.status(500).json({
      success: false,
      error: err.message,
    })
  } finally {
    if (browser) {
      await browser.close()
    }
  }
})

export default router
