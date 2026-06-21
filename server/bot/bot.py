# bot/bot.py
import os
import logging
import telebot
from telebot import types
import requests
import time
from dotenv import load_dotenv

from .handlers import handle_video_analysis, start_command, help_command

load_dotenv()

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Инициализация бота
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
if not BOT_TOKEN:
    raise ValueError("TELEGRAM_BOT_TOKEN не задан в переменных окружения")

bot = telebot.TeleBot(BOT_TOKEN)
FASTAPI_URL = os.getenv("FASTAPI_URL", "http://localhost:8000")


# Обработчик команды /start
@bot.message_handler(commands=['start'])
def start(message):
    start_command(bot, message)


# Обработчик команды /help
@bot.message_handler(commands=['help'])
def help(message):
    help_command(bot, message)


# Обработчик текстовых сообщений (ссылок)
@bot.message_handler(func=lambda message: True)
def handle_message(message):
    text = message.text or ""
    
    # Проверяем, является ли сообщение ссылкой
    if "http" in text and ("youtube.com" in text or "youtu.be" in text or 
                           "tiktok.com" in text or "instagram.com" in text):
        handle_video_analysis(bot, message)
    else:
        bot.reply_to(
            message,
            "🤖 Пришлите ссылку на видео с YouTube, TikTok или Instagram.\n\n"
            "Пример:\n"
            "https://www.youtube.com/watch?v=...\n"
            "https://www.tiktok.com/@user/video/...\n"
            "https://www.instagram.com/reel/..."
        )


# Обработчик callback-запросов (кнопки)
@bot.callback_query_handler(func=lambda call: True)
def callback_query(call):
    if call.data == "new_check":
        bot.answer_callback_query(call.id)
        bot.send_message(call.message.chat.id, "📎 Отправь мне новую ссылку на видео для проверки.")
    elif call.data == "my_stats":
        bot.answer_callback_query(call.id)
        bot.send_message(
            call.message.chat.id,
            "📊 *Статистика будет доступна позже*\n\n"
            "Скоро здесь появится информация о твоих проверках.",
            parse_mode='Markdown'
        )


def main():
    """Запуск бота"""
    print("🤖 Запуск Telegram бота...")
    print("   Убедитесь, что FastAPI сервер запущен!")
    
    # Запуск бота
    bot.infinity_polling()


if __name__ == "__main__":
    main()