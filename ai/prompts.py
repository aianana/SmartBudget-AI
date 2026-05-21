# Промпты для Gemini API.

def get_complex_advice_prompt(stats: dict, bank: str) -> str:
    """
    Промпт для КОМПЛЕКСНОГО разбора финансов.
    Даёт развёрнутый анализ + конкретные советы.
    """
    categories_text = "\n".join(
        f"- {cat}: {data['total']:.0f} сом ({data['percent']:.1f}%, {data['count']} операций)"
        for cat, data in stats["categories"].items()
    )

    top_text = "\n".join(
        f"- {t['description'][:60]}: {abs(t['amount']):.0f} сом"
        for t in stats["top_expenses"]
    )

    return f"""Ты опытный личный финансовый консультант. Проанализируй финансы человека и дай развёрнутый, но конкретный разбор.

ДАННЫЕ (банк: {bank}):
Всего расходов: {stats['total_expenses']:.0f} сом
Всего доходов: {stats['total_income']:.0f} сом
Количество операций: {stats['transactions_count']}

РАСХОДЫ ПО КАТЕГОРИЯМ:
{categories_text}

САМЫЕ КРУПНЫЕ РАСХОДЫ:
{top_text}

Дай комплексный разбор в таком формате (верни ТОЛЬКО валидный JSON, без markdown, без ```):
{{
  "summary": "2-3 предложения общей оценки финансового поведения человека",
  "main_problem": "Главная проблема в тратах одним предложением с цифрами",
  "tips": [
    "Конкретный совет 1 с цифрами и суммой экономии",
    "Конкретный совет 2",
    "Конкретный совет 3",
    "Конкретный совет 4"
  ],
  "positive": "Что человек делает хорошо (одно предложение)"
}}

Советы должны быть конкретными, с цифрами, реалистичными для Кыргызстана. На русском языке."""


def get_chat_prompt(stats: dict, question: str, history: list = None) -> str:
    """
    Промпт для ОТВЕТА НА ВОПРОС пользователя про его финансы.
    history - список предыдущих вопросов-ответов для контекста.
    """
    categories_text = "\n".join(
        f"- {cat}: {data['total']:.0f} сом ({data['percent']:.1f}%)"
        for cat, data in stats["categories"].items()
    )

    history_text = ""
    if history:
        history_text = "\nПРЕДЫДУЩИЙ ДИАЛОГ:\n" + "\n".join(
            f"Вопрос: {h['question']}\nОтвет: {h['answer']}"
            for h in history
        )

    return f"""Ты личный финансовый консультант. У тебя есть данные о расходах человека. Ответь на его вопрос конкретно и по делу.

РАСХОДЫ ЧЕЛОВЕКА:
Всего расходов: {stats['total_expenses']:.0f} сом
Всего доходов: {stats['total_income']:.0f} сом
По категориям:
{categories_text}
{history_text}

ВОПРОС ПОЛЬЗОВАТЕЛЯ: {question}

Ответь на русском языке, конкретно, с цифрами из его данных. Не используй markdown разметку. Ответ - обычный текст, 2-4 предложения."""
