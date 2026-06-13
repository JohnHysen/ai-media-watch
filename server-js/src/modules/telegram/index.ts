import { readFileSync } from 'fs'
import { Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'
import { io } from '../..'
import cfg from '../../config'
import { User } from '../../db/models'
import { system_message } from '../gpt/system_message'
import { sendLLM } from '../gpt/index'
import { SocketU } from '../sio'
import type { Message } from 'ollama'

const bot = new Telegraf(cfg.TG_KEY)

// --- Команды /start, /help ---
bot.start(async (ctx) => {
  const ch = ctx.chat
  if (ch.type === 'private') {
    const userId = ctx.from.id
    const fullName =
      `${ctx.from.first_name || ''} ${ctx.from.last_name || ''}`.trim()
    const link = cfg.CLIENT + `/1-telegram/?tg=${userId}`

    await ctx.reply(
      `Здравствуйте, ${fullName || 'пользователь'}! 👋\n\nНажмите кнопку ниже, чтобы добавить ваш Telegram к аккаунту. \n\nВыберите /help для примеров команд. \n\n(Ссылка не работает по HTTP - вы сможете поставить сюда настоящую ссылку в вашем готовом приложении)`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Привязать!',
                url: link,
              },
            ],
          ],
        },
      }
    )
  }
})

bot.help((ctx) =>
  ctx.reply(
    `
  *Команды*

  - /start - Запуск бота
  - /help - Список команд
  - /id - Показать ваш ID
  - /dice - Кинуть кость
  - /image - Картинка
  - /actions - Действия
  - /code - Код
  - /react - Реакция
  - /reply - Ответ
  - /delete - Удалить сообщение
  - /edit - Редактировать сообщение
  - /gpt \\[сообщение] - Отправить сообщение DeepSeek
  `,
    {
      parse_mode: 'Markdown', // ("Markdown" | "MarkdownV2" | "HTML")
    }
  )
)

// Свои команды
const messages: Record<number, Message[]> = {}

bot.command('gpt', async (ctx) => {
  if (!messages[ctx.chat.id]) {
    messages[ctx.chat.id] = [
      {
        role: 'system',
        content: system_message,
      },
    ]
  }

  const sent = await ctx.reply('…')
  const chatId = ctx.chat.id
  const messageId = sent.message_id

  const text = ctx.message.text.split('/gpt ')[1]
  messages[ctx.chat.id].push({
    role: 'user',
    content: text,
  })
  ctx.sendChatAction('typing')
  try {
    let fullText = ''
    await sendLLM(messages[ctx.chat.id], async (chunk) => {
      fullText += chunk
      await ctx.telegram.editMessageText(chatId, messageId, undefined, fullText)
    })
  } catch (err) {
    console.error('GPT command error:', err)
    await ctx.telegram.editMessageText(
      chatId,
      messageId,
      undefined,
      'Произошла ошибка при генерации ответа.'
    )
  }
})
bot.command('id', (ctx) => {
  ctx.reply(String(ctx.chat.id))
})
bot.command('dice', (ctx) => {
  ctx.sendDice()
})
bot.command('delete', (ctx) => {
  ctx.deleteMessage(ctx.message.message_id)
})
bot.command('edit', async (ctx) => {
  const res = await ctx.reply('5...')

  for (let i = 4; i > 0; i--) {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    ctx.telegram.editMessageText(
      ctx.chat.id,
      res.message_id,
      undefined,
      `${i}...`
    )
  }
  ctx.telegram.editMessageText(ctx.chat.id, res.message_id, undefined, 'Все!')
})
bot.command('actions', async (ctx) => {
  const actions = [
    'typing',
    'upload_photo',
    'record_video',
    'upload_video',
    'record_voice',
    'upload_voice',
    'upload_document',
    'choose_sticker',
    'find_location',
    'record_video_note',
    'upload_video_note',
  ] as const

  ctx.reply('Подожди...')
  for (const a of actions) {
    await ctx.sendChatAction(a)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    await ctx.reply(a)
  }
})
bot.command('code', async (ctx) => {
  ctx.reply(
    `
    \`\`\`ts
bot.command('actions', async (ctx) => {
  const actions = [
    'typing',
    'upload_photo',
    'record_video',
    'upload_video',
    'record_voice',
    'upload_voice',
    'upload_document',
    'choose_sticker',
    'find_location',
    'record_video_note',
    'upload_video_note',
  ] as const

  ctx.reply('Подожди...')
  for (const a of actions) {
    await ctx.sendChatAction(a)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    await ctx.reply(a)
  }
})
    \`\`\`
    
    `,

    {
      parse_mode: 'Markdown', // ("Markdown" | "MarkdownV2" | "HTML")
    }
  )
})

bot.command('react', (ctx) => {
  ctx.react('❤')
})

bot.command('image', (ctx) => {
  const file = readFileSync('./static/vasya.png')
  ctx.replyWithPhoto({ source: file })
})

// --- Text ---
bot.hears('hi', (ctx) => ctx.reply('Hey there!'))
bot.hears(/hello/i, (ctx) => ctx.reply('Hi, you said hello!'))

// --- Stickers ---
bot.on(message('sticker'), (ctx) => {
  console.log('Sticker received:', ctx.message.sticker)
  ctx.reply(ctx.message.sticker.emoji || '👍')
})

// --- Photos / Images ---
bot.on(message('photo'), (ctx) => {
  console.log('Photo received:', ctx.message.photo)
  ctx.reply('Вы отправили изображение!')
})

// --- Audio ---
bot.on(message('audio'), (ctx) => {
  console.log('Audio received:', ctx.message.audio)
  ctx.reply('Вы отправили аудио!')
})

// --- Voice messages ---
bot.on(message('voice'), (ctx) => {
  console.log('Voice message received:', ctx.message.voice)
  ctx.reply('Вы отправили голосовое сообщение!')
})

// --- Video ---
bot.on(message('video'), (ctx) => {
  console.log('Video received:', ctx.message.video)
  ctx.reply('Вы отправили видео!')
})

// --- Document / File ---
bot.on(message('document'), (ctx) => {
  console.log('Document received:', ctx.message.document)
  ctx.reply('Вы отправили файл!')
})

// --- Location ---
bot.on(message('location'), (ctx) => {
  console.log('Location received:', ctx.message.location)
  ctx.reply(
    `Вы отправили локацию: lat ${ctx.message.location.latitude}, lon ${ctx.message.location.longitude}`
  )
})

// --- Contact ---
bot.on(message('contact'), (ctx) => {
  console.log('Contact received:', ctx.message.contact)
  ctx.reply(`Вы отправили контакт: ${ctx.message.contact.first_name}`)
})

bot.on(message('text'), async (ctx) => {
  const reply = ctx.message.reply_to_message

  // @ts-expect-error Text существует
  const text = reply?.text

  if (reply && reply.from?.is_bot && text.startsWith('📡 ')) {
    const user = await User.findOne({ where: { tg_id: String(ctx.chat.id) } })
    if (!user) return
    const sockets = Array.from(io.sockets.sockets.values())
    const target = sockets.find((s) => (s as SocketU).user_id === user.id)
    const message = ctx.update.message.text
    if (target) {
      target.emit('tg_message', message)
      ctx.react('💯')
    } else {
      ctx.react('💔')
      ctx.reply('Клиент не подключен!')
    }
  }
})

bot.on('message_reaction', (ctx) => {
  ctx.reply('Спасибо за реакцию!')
})

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

bot.catch((err, ctx) => {
  console.error('Bot error', err)
  if (ctx && ctx.reply) {
    ctx.reply('Произошла ошибка, попробуйте ещё раз.')
  }
})

export default bot
