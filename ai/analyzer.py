# analyzer.py
# Считает статистику по транзакциям из всех 4 банков КР.

import re
from collections import defaultdict


CATEGORY_KEYWORDS = {
    #Продукты и супермаркеты
    "Супермаркеты": [
        "spar", "globus", "глобус", "гипермаркет", "наш маркет",
        "маркет каймак", "market kaymak", "kolmo store", "magazin korea",
        "korovka", "magazinkorovka", "globus 7", "globus 21", "globus 15",
        "globus 34", "магазин токоч", "magazin", "mag eliza",
        "магазин dastem", "магазин керемет", "маркет керемет", "asia mall",
        "fresh box", "shoro", "магазин эльдорадо", "magazin eldorado",
        "арча", "ади мега", "ади ", "ади ",
        "magnat", "магнат", "vts magnat", "vts asia", "vts gipermarket",
        "gipermarket", "narodnyy", "народный", "duo маркет", "дуо маркет",
        "дордой", "drippa",
        "million gum", "алма гум", "гум", "тез ж", "umai групп",
        "умай групп", "ryskulova", "di store",
    ],

    #Кафе и столовые
    "Столовые и фастфуд": [
        "cantin stolovaya", "stolovaya", "cantin a", "cantin",
        "banda panda", "вок лагман", "вок ", "domino pizza", "dodo pizza",
        "bimar", "snack time", "k beauty", "kalyk akieva",
        "казына", "лагман", "kfc", "burger", "mcdonalds",
        "ques lavka", "shao-lin", "cooksoo", "mr.bbq", "vasabisushi",
        "kinobar",
        "buffet", "буфет", "vts buffet", "mr ping", "карлсон", "karlson",
        "onzha", "ionzha", "vendingovyy apparat snack", "snack",
    ],

    # Кофейни
    "Кофе": [
        "giraffe coffe", "куликовский", "куликовский фм", "coffee",
        "starbucks", "кофейня", "espresso", "капучино",
    ],

    #Транспорт
    "Транспорт (такси)": [
        "yandex.go", "yandex go", "yandexgo", "такси", "taxi", "uber", "bolt",
    ],
    "Транспорт (автобус Тулпар)": [
        "tulpar", "тулпар", "qr.tulpar.kg", "оплата за проезд",
        "код транспорта", "покупка по qr - ",  # SimBank автобусные оплаты
    ],

    # Доставка
    "Доставка еды": [
        "yandex.delivery", "yandex delivery", "glovo", "доставка еды",
    ],

    # АЗС / Топливо
    "АЗС / топливо": [
        "мунай пром", "мунай ", "азс ", "fuel", "газпром",
        "лукойл", "shell", "petrol", "топливо", "бензин",
    ],

    #Мобильная связь и подписки
    "Мобильная связь MegaCom/Beeline/O!": [
        "мобильная связь", "sky mobile", "skymobile", "мегаком",
        "beeline", "билайн", "о! связь","o!", "o!bank", "o!den'gi", "o!:",
    ],
    "Подписки": [
        "spotify", "netflix", "youtube", "apple", "google", "icloud",
        "patreon", "twitch", "steam",
    ],

    #Аптеки и здоровье
    "Аптеки и здоровье": [
        "аптека", "pharmacy", "lekar", "11 lekar", "apteka",
        "аптечный пункт", "ляпис", "neoclinic", "clinic", "клиника",
        "эрайфарм", "лекарство",
    ],

    #Онлайн покупки
    "Онлайн шопинг": [
        "pinduoduo", "fft*pinduoduo", "aliexpress", "wildberries",
        "ozon", "amazon", "ebay", "asos",
    ],

    # Красота / салоны
    "Красота и салоны": [
        "k beauty", "salon", "салон", "barber", "kampa.kg",
    ],

    # Финансы (терминалы пополнения)
    "Пополнения наличными": [
        "cash-in", "cash in", "оплата по единому qr", "кэшин",
        "umai", "осмп", "оной", "пэй 24", "pay24",
        "гринтелеком", "оптима банк терминал", "bakai_",
        "nurterm", "оптима_",
    ],

    # Переводы между банками
    "Бакай Банк (переводы)": [
        "бакай банк пополнение", "пополнение с бакай",
        "по номеру телефона bakai", "bakai 778", "бакай24",
        "cash in оао \"бакай банк\"", "пополнение по qr",
    ],
    "Оптима (через Оптима)": [
        "qr.optima", "optima bank", "optima c2b", "optima c2c",
        "cash in оптима", "пополнение с оптима",
    ],
    "Mbank QR-платежи": [
        "c2b.mbank.kg", "c2c.mbank.kg", "mb qr pay", "mbank по номеру",
    ],
    "Переводы Dengi": [
        "qr.dengi.kg", "p2p.dengi.kg", "dengi.kg",
    ],

    # Переводы людям
    "Переводы по QR (людям)": [
        "перевод по qr", "перевод по номеру телефона qr",
    ],
    "Переводы людям (по телефону)": [
        "перевод по номеру телефона", "перевод от", "перевод по mpay",
    ],
    "Переводы между картами": [
        "перевод с карты", "перевод на карту visa",
    ],

    #Доходы / поступления
    "Зарплата": [
        "заработная плата", "зарплата",
    ],
    "Кэшбэк / бонусы": [
        "cashback", "кэшбэк", "выплата бонусов", "процент на остаток",
        "кешбэк",
    ],

    # QR-сервисы / ElQR / Finik
    "ElQR / Finik": [
        "elqr", "finik-qr", "finik", "elqr ",
    ],

    # NambaPay
    "NambaPay": [
        "nambaone.app", "namba",
    ],

    # Игры
    "Игры": [
        "steam", "playstation", "xbox", "epic games", "blizzard",
    ],

    # Развлечения / кино
    "Развлечения / кино": [
        "cinematica", "синематика", "kinobar", "hobby park", "хобби парк",
        "cinema", "кино", "concert", "концерт", "theatre", "театр",
        "mega.", "mega ",  # MEGA — игровой/развлекательный сервис
    ],

    # Спорт и бассейн
    "Спорт / бассейн": [
        "basein", "бассейн", "deniz", "gym", "фитнес", "fitness",
        "sport", "спорт", "бассейн дениз",
    ],

    # Госуслуги
    "Госуслуги": [
        "госуслуги", "оплата по qr госуслуги", "infocom", "тестирование",
        "library", "библиотека", "rbdyu",
    ],

    # Сервисы доставки (платформы)
    "Сервисы доставки": [
        "lalafo", "яндекс еда", "yandex eda", "wolt",
    ],
}


def categorize(description: str) -> str:
    """Определяет категорию транзакции по описанию."""
    desc_lower = description.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            if kw in desc_lower:
                return category

    # Если не нашли по ключевым словам — проверяем паттерны

    # ИП и ОсОО = оплата предпринимателю/компании (покупки)
    if any(s in desc_lower for s in ["ип ", "осоо", "оао", "зао", "ооо",
                                      "ип.", "abdyramanov", "казакбаев",
                                      "умай групп", "borubaev", "jumashov"]):
        return "Оплата ИП / магазины"

    # Перевод физлицу по номеру телефона
    if "перевод" in desc_lower and re.search(r"99\d{9}", description):
        return "Переводы людям (по телефону)"

    # "Имя Фам.:" или "Имя Фам." в начале (получатель-человек, MBank/Optima формат)
    if re.match(r"^[А-ЯЁ][а-яёА-ЯЁ]+\s+[А-ЯЁ]\.", description):
        return "Переводы людям (по телефону)"

    # Короткое имя без пробелов ("Аза", "Узан") или ИМЯ З. (Simbank формат)
    # Только буквы, 1-2 слова, до 20 символов = вероятно имя человека
    stripped = description.strip()
    if re.match(r"^[А-ЯЁ][а-яё]+(\s+[А-ЯЁ]\.?)?$", stripped) and len(stripped) <= 20:
        return "Переводы людям (по имени)"

    return "Другое"


def calculate_stats(transactions: list) -> dict:
    """Считает статистику по списку транзакций."""
    if not transactions:
        return _empty_stats()

    expenses = [t for t in transactions if t["amount"] < 0]
    income   = [t for t in transactions if t["amount"] > 0]

    total_expenses = sum(abs(t["amount"]) for t in expenses)
    total_income   = sum(t["amount"] for t in income)

    cat_totals = defaultdict(lambda: {"total": 0.0, "count": 0})
    for t in expenses:
        cat = categorize(t["description"])
        cat_totals[cat]["total"] += abs(t["amount"])
        cat_totals[cat]["count"] += 1

    categories = {}
    for cat, data in cat_totals.items():
        percent = round((data["total"] / total_expenses * 100), 1) if total_expenses > 0 else 0
        categories[cat] = {
            "total":   round(data["total"], 2),
            "percent": percent,
            "count":   data["count"],
        }
    categories = dict(sorted(categories.items(), key=lambda x: x[1]["total"], reverse=True))

    top_expenses = sorted(expenses, key=lambda t: t["amount"])[:5]

    return {
        "total_expenses":     round(total_expenses, 2),
        "total_income":       round(total_income, 2),
        "categories":         categories,
        "transactions_count": len(transactions),
        "expenses_count":     len(expenses),
        "income_count":       len(income),
        "top_expenses":       top_expenses,
    }


def _empty_stats() -> dict:
    return {
        "total_expenses": 0.0, "total_income": 0.0,
        "categories": {}, "transactions_count": 0,
        "expenses_count": 0, "income_count": 0, "top_expenses": [],
    }


if __name__ == "__main__":
    import sys, os
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from parser import parse_file

    if len(sys.argv) < 2:
        print("Использование: python analyzer.py <путь к файлу>")
        sys.exit(1)

    test_file = sys.argv[1]
    with open(test_file, "rb") as f:
        result = parse_file(f.read(), os.path.basename(test_file))

    stats = calculate_stats(result["transactions"])

    print(f"\n═══ СТАТИСТИКА ═══")
    print(f"Банк:        {result['bank']}")
    print(f"Транзакций:  {stats['transactions_count']} (расходов {stats['expenses_count']}, доходов {stats['income_count']})")
    print(f"Расходы:     {stats['total_expenses']:>12,.2f} KGS")
    print(f"Доходы:      {stats['total_income']:>12,.2f} KGS")
    print(f"Баланс:      {stats['total_income'] - stats['total_expenses']:>12,.2f} KGS")
    print(f"\nКатегории расходов:")
    for cat, data in stats["categories"].items():
        bar = "█" * int(data["percent"] / 2)
        print(f"  {cat:<32} {data['total']:>10,.0f}  {data['percent']:>5.1f}%  ({data['count']} шт)  {bar}")

    print(f"\nТоп-5 крупных расходов:")
    for t in stats["top_expenses"]:
        desc = t['description'][:55]
        print(f"  {t['date']:<14} {abs(t['amount']):>10,.2f}  {desc}")
