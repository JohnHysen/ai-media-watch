// src/services/llmService.ts

import axios from 'axios'

interface GenerateDirectionParams {
  name: string
  description: string
}

interface LLMConfig {
  host: string
  port: number
  model: string
  temperature?: number
  maxTokens?: number
  timeout?: number
}

export class LLMService {
  private static config: LLMConfig = {
    host: process.env.LLM_HOST || '127.0.0.1',
    port: parseInt(process.env.LLM_PORT || '8080'),
    model: process.env.LLM_MODEL || 'gemma-4-E2B-it-Q3_K_M',
    temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.05'),
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '2048'),
    timeout: parseInt(process.env.LLM_TIMEOUT || '60000'),
  }

  static initialize(config: Partial<LLMConfig>) {
    this.config = {
      ...this.config,
      ...config,
    }

    console.log('🔧 LLM initialized')
    console.log(`🌐 Host: ${this.config.host}:${this.config.port}`)
    console.log(`📦 Model: ${this.config.model}`)
  }

  /**
   * Проверка доступности LLM
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(
        `http://${this.config.host}:${this.config.port}/health`,
        {
          timeout: 3000,
        }
      )

      return response.status === 200
    } catch {
      try {
        const response = await axios.get(
          `http://${this.config.host}:${this.config.port}/`,
          {
            timeout: 3000,
          }
        )

        return response.status === 200
      } catch {
        console.warn('⚠️ LLM server unavailable')
        return false
      }
    }
  }

  /**
   * Генерация структуры направления
   */
  static async generateDirectionStructure(
    params: GenerateDirectionParams
  ): Promise<any> {
    const { name, description } = params

    const available = await this.healthCheck()

    if (!available) {
      throw new Error('LLM server unavailable')
    }

    const prompt = `
Создай JSON структуру для направления анализа вредоносного или рискованного контента.

Название:
"${name}"

Описание:
"${description || 'Описание отсутствует'}"

Верни ТОЛЬКО валидный JSON.

{
  "name": "",
  "name_kk": "",
  "name_en": "",
  "description": "",
  "severity": "",
  "risk_threshold": 0,
  "visual_markers": [],
  "negative_markers": [],
  "color": "",
  "icon": "",
  "keywords": []
}

Правила:

name_kk:
- только казахский язык

name_en:
- только английский язык

description:
- кратко объяснить:
  - что это
  - где встречается
  - какие риски несет

severity:
- low
- medium
- high
- critical

risk_threshold:
- число от 0 до 10

visual_markers:
- минимум 5 элементов
- реальные визуальные признаки
- массив строк

negative_markers:
- минимум 3 элемента
- массив строк

keywords:
- минимум 8 элементов
- без дублей
- массив строк

color:
- HEX формат

icon:
- FontAwesome icon

ВАЖНО:
- JSON должен быть валидным
- все элементы массива через запятую
- без markdown
- без пояснений
- без комментариев
- без текста вне JSON
`

    try {
      console.log(`📤 Sending request to LLM: "${name}"`)

      let content = ''

      /**
       * CHAT COMPLETION
       */
      try {
        const payload: any = {
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content:
                'Ты API генерации JSON. Отвечай только валидным JSON без markdown и пояснений. Все массивы с запятыми.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
          stream: false,
        }

        // Пробуем добавить response_format, но если не поддерживается - игнорируем
        try {
          payload.response_format = { type: 'json_object' }
        } catch {
          // Не все модели поддерживают response_format
        }

        const response = await axios.post(
          `http://${this.config.host}:${this.config.port}/v1/chat/completions`,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: this.config.timeout,
          }
        )

        content =
          response.data?.choices?.[0]?.message?.content?.trim() || ''

        console.log('✅ Using chat completion endpoint')
      } catch (chatError) {
        console.warn(
          '⚠️ Chat completion failed, fallback to completion endpoint'
        )

        const response = await axios.post(
          `http://${this.config.host}:${this.config.port}/completion`,
          {
            prompt: prompt,
            temperature: this.config.temperature,
            n_predict: this.config.maxTokens,
            stream: false,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: this.config.timeout,
          }
        )

        content = response.data.content || response.data.text || ''

        console.log('✅ Using completion endpoint')
      }

      console.log(`📄 Response length: ${content.length}`)

      console.log('========================================')
      console.log(content)
      console.log('========================================')

      if (!content?.trim()) {
        throw new Error('LLM returned empty response')
      }

      const parsed = this.extractJSON(content)

      const validated = this.validateStructure(parsed)

      console.log(
        `✅ Structure generated: ${validated.name}`
      )

      return validated
    } catch (error) {
      console.error('❌ LLM generation failed')

      if (axios.isAxiosError(error)) {
        console.error({
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        })
      } else {
        console.error(error)
      }

      throw error
    }
  }

  /**
   * Извлечение и repair JSON
   */
  private static extractJSON(text: string): any {
    try {
      // 1. Удаляем markdown
      let cleaned = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim()

      // 2. Находим JSON объект
      const start = cleaned.indexOf('{')
      const end = cleaned.lastIndexOf('}')

      if (start === -1 || end === -1) {
        throw new Error('JSON object not found')
      }

      let jsonText = cleaned.slice(start, end + 1)

      // 3. FIX MISSING COMMAS - построчный анализ
      const lines = jsonText.split('\n')
      const fixedLines: string[] = []

      for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trimRight()
        const nextLine = lines[i + 1]?.trim() || ''

        // Проверяем, заканчивается ли строка на кавычку и не имеет запятой
        const endsWithQuote = line.endsWith('"')
        const endsWithComma = line.endsWith(',')
        const endsWithOpenBrace = line.endsWith('{')
        const endsWithOpenBracket = line.endsWith('[')
        const endsWithCloseObject = line.endsWith('},')
        const endsWithCloseArray = line.endsWith('],')
        const endsWithCloseObjectNoComma = line.endsWith('}')
        const endsWithCloseArrayNoComma = line.endsWith(']')

        // Следующая строка начинается с кавычки или поля
        const nextStartsWithQuote = nextLine.startsWith('"')
        const nextStartsWithClose = nextLine.startsWith('}') || nextLine.startsWith(']')

        // Добавляем запятую если:
        // 1. Строка заканчивается на кавычку и нет запятой
        // 2. Следующая строка начинается с кавычки или закрывающей скобки
        // 3. Строка не заканчивается на открывающую или закрывающую скобку
        if (
          endsWithQuote &&
          !endsWithComma &&
          !endsWithOpenBrace &&
          !endsWithOpenBracket &&
          !endsWithCloseObjectNoComma &&
          !endsWithCloseArrayNoComma &&
          nextStartsWithQuote
        ) {
          line += ','
        }

        // Если строка заканчивается на } или ] без запятой, а следующая строка начинается с кавычки
        if (
          (endsWithCloseObjectNoComma || endsWithCloseArrayNoComma) &&
          nextStartsWithQuote
        ) {
          line += ','
        }

        fixedLines.push(line)
      }

      jsonText = fixedLines.join('\n')

      // 4. REMOVE TRAILING COMMAS
      jsonText = jsonText.replace(/,\s*}/g, '}')
      jsonText = jsonText.replace(/,\s*]/g, ']')

      // 5. REMOVE DOUBLE COMMAS
      jsonText = jsonText.replace(/,,+/g, ',')

      // 6. FIX: [\n    "item1",\n    "item2"\n  ] -> [\n    "item1",\n    "item2"\n  ]
      jsonText = jsonText.replace(/\[\s*,/g, '[')

      console.log('🔧 Repaired JSON preview:')
      console.log(jsonText.substring(0, 1500) + (jsonText.length > 1500 ? '...' : ''))

      return JSON.parse(jsonText)
    } catch (error) {
      console.error('❌ Failed to parse JSON')
      console.error('Raw text preview:', text.substring(0, 2000))
      throw new Error('Invalid JSON from LLM')
    }
  }

  /**
   * Валидация структуры
   */
  private static validateStructure(data: any) {
    const requiredFields = [
      'name',
      'severity',
      'visual_markers',
    ]

    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`Missing field: ${field}`)
      }
    }

    /**
     * VALIDATE SEVERITY
     */
    const severityList = [
      'low',
      'medium',
      'high',
      'critical',
    ]

    if (!severityList.includes(data.severity)) {
      throw new Error(`Invalid severity: ${data.severity}`)
    }

    /**
     * THRESHOLD
     */
    const threshold = Number(data.risk_threshold || 6)

    /**
     * MARKERS - теперь просто массив строк
     */
    const normalizeMarkers = (arr: any[]) => {
      if (!Array.isArray(arr)) return []

      return arr
        .filter(
          (x) =>
            typeof x === 'string' &&
            x.trim().length > 0
        )
        .map((x) => ({
          text: x.trim(),
          weight: 1,
        }))
    }

    /**
     * KEYWORDS - удаляем дубли
     */
    const keywords = Array.isArray(data.keywords)
      ? [
          ...new Set(
            data.keywords
              .filter(
                (x: any) =>
                  typeof x === 'string' &&
                  x.trim().length > 0
              )
              .map((x: string) => x.trim())
          ),
        ]
      : []

    return {
      name: data.name || '',
      name_kk: data.name_kk || '',
      name_en: data.name_en || '',
      description: data.description || '',
      severity: data.severity,
      risk_threshold: threshold,
      visual_markers: normalizeMarkers(
        data.visual_markers
      ),
      negative_markers: normalizeMarkers(
        data.negative_markers || []
      ),
      color: data.color || '#6c757d',
      icon: data.icon || 'fa-triangle-exclamation',
      keywords: keywords.join(', '),
    }
  }
}

export default LLMService