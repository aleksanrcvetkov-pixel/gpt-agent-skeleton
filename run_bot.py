import os
import requests
from telegram import Update
from telegram.ext import ApplicationBuilder, MessageHandler, ContextTypes, filters

# 🔹 Твой Telegram токен
TG_TOKEN = "8529221403:AAEbzItivP4UrEYfhXxlSK7iZ1DuYwnEVZA"

# 🔹 Модель и ключ OpenRouter (если используешь)
MODEL = "openai/gpt-4o-mini"
OR_KEY = os.environ.get("OPENROUTER_API_KEY")

HEADERS = {
    "Authorization": f"Bearer {OR_KEY}" if OR_KEY else "",
    "Content-Type": "application/json"
}


# 🔹 Функция обработки входящих сообщений
async def on_msg(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_text = (update.message.text or "").strip()
    print(f"Сообщение от пользователя: {user_text}")  # просто лог в консоль

    reply = f"Привет, {update.effective_user.first_name}! Ты написал: {user_text}"
    await update.message.reply_text(reply)


# 🔹 Запуск бота
if __name__ == "__main__":
    app = ApplicationBuilder().token(TG_TOKEN).build()
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, on_msg))
    print("✅ Бот запущен. Ждёт сообщений...")
    app.run_polling()
