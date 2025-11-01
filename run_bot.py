import os, requests
from telegram import Update
from telegram.ext import ApplicationBuilder, MessageHandler, ContextTypes, filters

TG_TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]
OR_KEY   = os.environ["OPENROUTER_API_KEY"]
MODEL    = "openai/gpt-4o-mini"  # можно поменять на любой из OpenRouter

HEADERS = {
    "Authorization": f"Bearer {OR_KEY}",
    "Content-Type": "application/json",
}

async def on_msg(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_text = (update.message.text or "")[:4000]

    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": "Ты вежливый русскоязычный помощник. Отвечай кратко и по делу."},
            {"role": "user", "content": user_text}
        ]
    }

    resp = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers=HEADERS, json=payload, timeout=60
    )
    resp.raise_for_status()
    reply = resp.json()["choices"][0]["message"]["content"]
    await update.message.reply_text(reply)

if __name__ == "__main__":
    app = ApplicationBuilder().token(TG_TOKEN).build()
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, on_msg))
    app.run_polling()

