# GPT Agent Skeleton (FastAPI · OpenAI · Telegram · Google Sheets)

Проект-скелет для варианта B: продуктовый GPT-агент с интеграциями.

## Возможности
- Диалоговый маршрут `/chat` на FastAPI.
- Интеграция с OpenAI (чат с инструментами).
- Функции-интеграции:
  - `plan_content`: формирует контент-план (локальная функция).
  - `create_lead`: записывает лид в Google Sheets.
- Телеграм-бот (поллинг или вебхук) для общения с пользователем.
- .env-конфигурация, структурированные логи.

## Структура
```
app/
  agent.py         # работа с OpenAI, разбор tool-calls
  tools.py         # реализация функций (Google Sheets, контент-план)
  main.py          # FastAPI-приложение (эндпоинты /health, /chat, /telegram/webhook)
  config.py        # конфигурация и .env
  schemas.py       # pydantic-схемы
  logging_conf.py  # настройка логов
scripts/
  run_dev.sh
.env.example
requirements.txt
Dockerfile
docker-compose.yml
README.md
```

## Быстрый старт (локально)
1) Установите Python 3.10+ и Poetry или venv.  
2) Скопируйте `.env.example` в `.env` и заполните ключи.
3) Установите зависимости:  
```
pip install -r requirements.txt
```
4) Запуск dev-сервера:
```
bash scripts/run_dev.sh
# или:
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
5) Проверка:
```
curl -X POST http://localhost:8000/chat   -H "Content-Type: application/json"   -d '{"text":"Сделай контент-план на 7 дней для Instagram"}'
```

## Переменные окружения (.env)
```
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini
TELEGRAM_BOT_TOKEN=...          # необязательно, если не используете Telegram
TELEGRAM_WEBHOOK_URL=...        # если используете вебхук
GOOGLE_SERVICE_ACCOUNT_JSON=... # JSON строкой; либо путь, см. комментарии в tools.py
GOOGLE_SHEET_NAME=Leads
```
> Для Google Sheets используйте сервисный аккаунт и выдайте ему доступ (share) к нужной таблице.

## Telegram
- Поллинг: запустите `python -m app.telegram_bot` (добавьте при необходимости).
- Вебхук: укажите `TELEGRAM_WEBHOOK_URL` и подайте маршрут `/telegram/webhook` (см. `main.py`).

## Docker
```
docker build -t gpt-agent .
docker run --env-file .env -p 8000:8000 gpt-agent
```

## Правила эксплуатации
- Храните логи без персональных данных.
- Валидируйте входы (Pydantic), ограничивайте длину сообщений.
- Для функций с записью в внешние системы добавляйте очереди/ретраи.

## Лицензия
MIT
