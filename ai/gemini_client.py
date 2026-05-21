# Подключение к Gemini API (новый SDK google-genai).
# Комплексный разбор + ответы на вопросы.

import os
import json
import time
from google import genai
from prompts import get_complex_advice_prompt, get_chat_prompt


# Модель: gemini-2.5-flash-lite - самый высокий бесплатный лимит (1000/день)
MODEL_NAME = "gemini-2.5-flash-lite"

_client = None


def get_client():
    """Создаёт клиент Gemini."""
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError(
                "GEMINI_API_KEY не найден. Создайте .env и добавьте: "
                "GEMINI_API_KEY=ваш_ключ"
            )
        _client = genai.Client(api_key=api_key)
    return _client


def _generate_with_retry(prompt: str, max_retries: int = 3) -> str:
    """
    Отправляет запрос к Gemini с автоповтором при ошибке 503.
    Между попытками ждёт: 2с, 4с, 8с (exponential backoff).
    """
    client = get_client()
    last_error = None

    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=prompt,
            )
            return response.text.strip()
        except Exception as e:
            last_error = e
            error_str = str(e)
            # 503 / overloaded / UNAVAILABLE - временная перегрузка, повторяем
            if "503" in error_str or "UNAVAILABLE" in error_str or "overloaded" in error_str.lower():
                wait = 2 ** (attempt + 1)  # 2, 4, 8 секунд
                print(f"[gemini] Сервер перегружен, повтор через {wait}с (попытка {attempt + 1}/{max_retries})")
                time.sleep(wait)
                continue
            # 429 - превышен лимит запросов. Дальше повторять бесполезно.
            elif "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                print("[gemini] Превышен дневной лимит бесплатного тарифа (попробуйте позже или смените модель)")
                raise
            else:
                # Другая ошибка - не повторяем, сразу выходим
                raise

    # Все попытки исчерпаны
    raise last_error


def _ask_gemini_json(prompt: str) -> dict:
    """Отправляет промпт, парсит JSON-ответ."""
    try:
        text = _generate_with_retry(prompt)
        if text.startswith("```"):
            lines = text.split("\n")
            text = "\n".join(lines[1:-1])
        return json.loads(text)
    except json.JSONDecodeError as e:
        print(f"[gemini] Ошибка парсинга JSON: {e}")
        return {}
    except Exception as e:
        print(f"[gemini] Ошибка запроса: {e}")
        return {}


def _ask_gemini_text(prompt: str) -> str:
    """Отправляет промпт, возвращает текстовый ответ."""
    try:
        return _generate_with_retry(prompt)
    except Exception as e:
        print(f"[gemini] Ошибка запроса: {e}")
        return "Не удалось получить ответ от AI. Попробуйте позже."


# ФУНКЦИЯ 1 - комплексный разбор финансов

def get_complex_advice(stats: dict, bank: str = "") -> dict:
    """
    Возвращает комплексный разбор:
    {"summary", "main_problem", "tips": [...], "positive"}
    """
    print("[gemini] Запрашиваем комплексный разбор...")
    prompt = get_complex_advice_prompt(stats, bank)
    result = _ask_gemini_json(prompt)

    if not result:
        return {
            "summary": "Не удалось получить разбор от AI.",
            "main_problem": "",
            "tips": [],
            "positive": "",
        }
    return result


# ФУНКЦИЯ 2 - ответ на вопрос пользователя

def answer_question(stats: dict, question: str, history: list = None) -> str:
    """
    Отвечает на вопрос пользователя про его финансы.
    history - [{"question": "...", "answer": "..."}, ...]
    """
    print(f"[gemini] Вопрос: {question[:50]}...")
    prompt = get_chat_prompt(stats, question, history)
    return _ask_gemini_text(prompt)


# ТЕСТ

if __name__ == "__main__":
    import sys
    from dotenv import load_dotenv
    load_dotenv()

    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from parser import parse_file
    from analyzer import calculate_stats

    if len(sys.argv) < 2:
        print("Использование: python gemini_client.py <файл выписки>")
        sys.exit(1)

    with open(sys.argv[1], "rb") as f:
        result = parse_file(f.read(), os.path.basename(sys.argv[1]))

    stats = calculate_stats(result["transactions"])

    print("\n═══ КОМПЛЕКСНЫЙ РАЗБОР ═══")
    advice = get_complex_advice(stats, result["bank"])
    print(f"\nОценка: {advice.get('summary')}")
    print(f"\nГлавная проблема: {advice.get('main_problem')}")
    print(f"\nСоветы:")
    for i, tip in enumerate(advice.get("tips", []), 1):
        print(f"  {i}. {tip}")
    print(f"\nПлюс: {advice.get('positive')}")

    print("\n═══ ТЕСТ ВОПРОСА ═══")
    answer = answer_question(stats, "Сколько я трачу на еду и как это сократить?")
    print(f"Ответ: {answer}")
