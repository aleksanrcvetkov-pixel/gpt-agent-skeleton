from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

# ------ Базовые маршруты ------
@app.get("/")
def read_root():
    return {"message": "Hello, world!"}

@app.get("/about")
def about():
    return {"info": "Это мой первый FastAPI проект на GitHub!"}

@app.get("/contact")
def contact():
    return {"email": "example@mail.com", "phone": "+1234567890"}

# ------ Модель запроса для чата ------
class ChatRequest(BaseModel):
    message: str
    history: list[dict[str, str]] = []  # опционально: [{ "role": "user"|"assistant", "content": "..." }]

# ------ Мини-ChatGPT ------
@app.post("/chat")
def chat(req: ChatRequest):
    user = req.message.strip().lower()

    # примитивная "логика"
    if not user:
        reply = "Скажи что-нибудь 🙂"
    elif "привет" in user or "здрав" in user:
        reply = "Привет! Я мини-ChatGPT на FastAPI. Чем помочь?"
    elif "как дела" in user:
        reply = "Отлично! Запущен в Codespaces и готов отвечать."
    else:
        reply = f"Ты сказал: {req.message}"

    # можно использовать history в будущем для контекста
    return {
        "reply": reply,
        "tokens_used": len(req.message.split()),
        "history_len": len(req.history)
    }

# (по желанию) healthcheck
@app.get("/health")
def health():
    return {"status": "ok"}@app.post("/chat")
def chat(req: ChatRequest):
    user = req.message.strip().lower()

    # Простая имитация "бота"
    if "привет" in user:
        answer = "Привет! Чем могу помочь?"
    elif "как дела" in user:
        answer = "У меня всё отлично, спасибо что спросил!"
    else:
        answer = f"Ты сказал: {req.message}"

    # Ответ сервера
    return {
        "user": req.message,
        "bot": answer,
        "history": req.history + [{"user": req.message, "bot": answer}]
    }
