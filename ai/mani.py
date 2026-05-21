# Главные функции AI-модуля для Backend.
# Backend вызывает: analyze_file() и ask_question()

from dotenv import load_dotenv
load_dotenv()

import os
from parser import parse_file
from analyzer import calculate_stats
from gemini_client import get_complex_advice, answer_question


# ФУНКЦИЯ 1 - анализ выписки (вызывается при загрузке файла)

def analyze_file(file_bytes: bytes, filename: str) -> dict:
    """
    Полный анализ выписки + комплексный разбор от Gemini.

    Вход:  байты файла + имя
    Выход: статистика, категории, комплексный совет
    """
    print(f"\n[main] Анализ файла: {filename}")

    parsed = parse_file(file_bytes, filename)
    transactions = parsed["transactions"]

    if not transactions:
        return {
            "error": "Не удалось извлечь транзакции. Проверьте файл.",
            "bank": parsed["bank"],
        }

    stats = calculate_stats(transactions)

    # Комплексный разбор от Gemini
    try:
        advice = get_complex_advice(stats, parsed["bank"])
    except Exception as e:
        print(f"[main] Gemini недоступен: {e}")
        advice = {"summary": "AI-разбор временно недоступен", "tips": []}

    return {
        "bank":               parsed["bank"],
        "file_type":          parsed["file_type"],
        "total_expenses":     stats["total_expenses"],
        "total_income":       stats["total_income"],
        "transactions_count": stats["transactions_count"],
        "categories":         stats["categories"],
        "top_expenses":       stats["top_expenses"],
        # Комплексный разбор:
        "summary":            advice.get("summary", ""),
        "main_problem":       advice.get("main_problem", ""),
        "tips":               advice.get("tips", []),
        "positive":           advice.get("positive", ""),
    }

# ФУНКЦИЯ 2 - ответ на вопрос (вызывается при вопросе в чате)

def ask_question(stats: dict, question: str, history: list = None) -> dict:
    """
    Отвечает на вопрос пользователя про его финансы.

    Вход:
        stats    - статистика (Backend хранит её после анализа файла)
        question - текст вопроса
        history  - предыдущие вопросы-ответы [{"question","answer"}]

    Выход: {"answer": "текст ответа"}

    Примечание: лимит на 3 вопроса проверяет BACKEND, не этот код.
    """
    answer = answer_question(stats, question, history)
    return {"answer": answer}


# ТЕСТ

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Использование: python main.py <файл выписки>")
        sys.exit(1)

    with open(sys.argv[1], "rb") as f:
        result = analyze_file(f.read(), os.path.basename(sys.argv[1]))

    print("\n═══ РЕЗУЛЬТАТ ДЛЯ BACKEND ═══")
    print(f"Банк:    {result.get('bank')}")
    print(f"Расходы: {result.get('total_expenses')} сом")
    print(f"\nОценка: {result.get('summary')}")
    print(f"Проблема: {result.get('main_problem')}")
    print(f"\nСоветы:")
    for i, tip in enumerate(result.get("tips", []), 1):
        print(f"  {i}. {tip}")
