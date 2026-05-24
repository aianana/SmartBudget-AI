# AI-микросервис для SmartBudget AI.
# Backend обращается к этому серверу по HTTP.
# ЗАПУСК:
#   uvicorn server:app --host 0.0.0.0 --port 8000

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from main import analyze_file, ask_question


app = FastAPI(title="SmartBudget AI Service", version="1.0")

# Разрешаем обращения от Backend и Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Максимальный размер файла - 10 МБ (защита от перегрузки)
MAX_FILE_SIZE = 10 * 1024 * 1024

# Разрешённые форматы выписок
ALLOWED_EXTENSIONS = (".pdf", ".xls", ".xlsx", ".csv")


# Проверка что сервер жив

@app.get("/")
def health_check():
    return {
        "status": "ok",
        "service": "SmartBudget AI",
        "endpoints": {
            "POST /analyze": "загрузка выписки → разбор",
            "POST /ask": "вопрос про финансы → ответ",
        },
    }


# Эндпоинт 1 - анализ выписки

@app.post("/api/upload")
async def analyze(file: UploadFile):
    """
    Принимает файл выписки, возвращает разбор + советы.

    Backend вызывает так:
        requests.post("http://AI_IP:8000/analyze", files={"file": ...})
    """
    # Проверка расширения
    filename = (file.filename or "").lower()
    if not filename.endswith(ALLOWED_EXTENSIONS):
        raise HTTPException(
            status_code=400,
            detail=f"Неподдерживаемый формат. Разрешены: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Читаем файл
    contents = await file.read()

    # Проверка размера
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"Файл слишком большой. Максимум {MAX_FILE_SIZE // 1024 // 1024} МБ"
        )

    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Файл пустой")

    # Анализируем
    try:
        result = analyze_file(contents, file.filename)
    except Exception as e:
        print(f"[server] Ошибка анализа: {e}")
        raise HTTPException(status_code=500, detail="Ошибка при обработке файла")

    # Если парсер не смог извлечь транзакции
    if "error" in result:
        raise HTTPException(status_code=422, detail=result["error"])

    return result

# Эндпоинт 2 - вопрос про финансы

class AskRequest(BaseModel):
    """
    Backend присылает статистику + вопрос + историю.
    stats   - статистика из прошлого /analyze (Backend хранит её в БД)
    question - текст вопроса
    history - список прошлых вопросов-ответов (или пустой список)
    """
    stats: dict
    question: str
    history: list = []


@app.post("/api/ask")
async def ask(req: AskRequest):
    """
    Отвечает на вопрос пользователя про его финансы.

    Backend вызывает так:
        requests.post("http://AI_IP:8000/ask", json={
            "stats": {...},
            "question": "Сколько я трачу на еду?",
            "history": []
        })
    """
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Вопрос пустой")

    try:
        result = ask_question(req.stats, req.question, req.history)
    except Exception as e:
        print(f"[server] Ошибка ответа: {e}")
        raise HTTPException(status_code=500, detail="Ошибка при генерации ответа")

    return result
