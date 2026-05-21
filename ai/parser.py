# Парсер выписок: Bakai (xlsx), Optima (pdf), MBank (pdf, xls), Simbank (pdf).

import io
import os
import re
import pandas as pd
import pdfplumber
from bank_configs import BANK_CONFIGS, TAIL_LINES


def detect_file_type(filename: str, file_bytes: bytes) -> str:
    if file_bytes[:4] == b"%PDF":
        return "pdf"
    # Старый xls - бинарный формат
    if file_bytes[:8] == b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1":
        return "xls"
    name = filename.lower()
    if name.endswith(".xlsx"):
        return "xlsx"
    if name.endswith(".xls"):
        return "xls"
    if name.endswith(".csv"):
        return "csv"
    return "unknown"


def read_file(file_bytes: bytes, filename: str):
    ftype = detect_file_type(filename, file_bytes)
    if ftype == "csv":
        try:
            df = pd.read_csv(io.BytesIO(file_bytes), encoding="utf-8", header=None)
        except UnicodeDecodeError:
            df = pd.read_csv(io.BytesIO(file_bytes), encoding="cp1251", header=None)
        return df, "csv"
    elif ftype == "xlsx":
        df = pd.read_excel(io.BytesIO(file_bytes), header=None)
        return df, "xlsx"
    elif ftype == "xls":
        # Старый бинарный xls - нужен xlrd
        df = pd.read_excel(io.BytesIO(file_bytes), header=None, engine="xlrd")
        return df, "xls"
    elif ftype == "pdf":
        text = ""
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    text += t + "\n"
        return text, "pdf"
    raise ValueError(f"Неподдерживаемый файл: {filename}")


def detect_bank(data, file_type: str):
    tail_text = _extract_tail_text(data, file_type)
    tail_lower = tail_text.lower()

    # Для xls также проверяем шапку (там название банка)
    head_text = ""
    if file_type == "xls" and hasattr(data, 'head'):
        head = data.head(15)
        head_text = " ".join(str(v) for v in head.values.flatten() if pd.notna(v))
    search_text = (tail_text + " " + head_text).lower()

    for bank_name, config in BANK_CONFIGS.items():
        bank_format = config.get("file_format", "")
        if file_type == "pdf" and "pdf" not in bank_format:
            continue
        if file_type == "xlsx" and "xlsx" not in bank_format:
            continue
        if file_type == "xls" and "xls_" not in bank_format:
            continue
        if file_type == "csv" and "csv" not in bank_format:
            continue
        for keyword in config["keywords"]:
            if keyword.lower() in search_text:
                print(f"[parser] Банк: {bank_name} (по '{keyword}')")
                return bank_name, config

    print("[parser] Банк не определён")
    return "unknown", None


def _extract_tail_text(data, file_type: str) -> str:
    if file_type in ("csv", "xlsx", "xls"):
        tail = data.tail(TAIL_LINES)
        return " ".join(str(v) for v in tail.values.flatten() if pd.notna(v))
    elif file_type == "pdf":
        lines = data.strip().split("\n")
        return " ".join(lines[-TAIL_LINES:])
    return ""


def parse_transactions(data, file_type: str, bank_config: dict) -> list:
    if not bank_config:
        return []
    fmt = bank_config.get("file_format")
    if fmt == "xlsx_bakai":
        return _parse_bakai_xlsx(data, bank_config)
    elif fmt == "xls_mbank":
        return _parse_mbank_xls(data, bank_config)
    elif fmt == "pdf_optima":
        return _parse_optima_pdf(data, bank_config)
    elif fmt == "pdf_mbank":
        return _parse_mbank_pdf(data, bank_config)
    elif fmt == "pdf_simbank":
        return _parse_simbank_pdf(data, bank_config)
    return []

# MBANK XLS - старый бинарный xls (табличный)
# Структура: дата | получатель | дебет | кредит | описание

def _parse_mbank_xls(df: pd.DataFrame, config: dict) -> list:
    skip = config.get("skip_rows", 13)
    df = df.iloc[skip:].reset_index(drop=True)
    df = df.dropna(how="all")

    transactions = []
    for _, row in df.iterrows():
        try:
            date      = _safe_get(row, config["date_col"])
            recipient = _safe_get(row, config["recipient_col"])
            debet     = _parse_amount(_safe_get(row, config["debet_col"]))
            credit    = _parse_amount(_safe_get(row, config["credit_col"]))
            desc      = _safe_get(row, config["description_col"])

            # Пропускаем итоговые строки
            date_str = str(date) if date else ""
            if any(s in date_str for s in [
                "Средства на начало", "Средства на конец", "Зачисления за период",
                "Списания за период", "Дата:", "Итого", "Сальдо"
            ]):
                continue

            # Нет даты - служебная строка
            if not date or not date_str.strip():
                continue

            amount = None
            if debet and debet > 0:
                amount = -debet
            elif credit and credit > 0:
                amount = credit

            if amount is None or amount == 0:
                continue

            # Собираем описание: получатель + детали операции
            desc_str = str(desc).strip() if desc else ""
            recipient_str = str(recipient).strip() if recipient else ""

            # Чистим описание от технического шума
            desc_str = re.sub(r"\s+019[a-f0-9-]{30,}", "", desc_str)
            desc_str = re.sub(r"\s+Сумма [\d.,]+ KGS.*$", "", desc_str)
            desc_str = re.sub(r"Оплата услуг\.\s*Получатель:\s*", "", desc_str)
            desc_str = re.sub(r"Перевод по номеру телефона qr\.\s*", "Перевод: ", desc_str)
            desc_str = re.sub(r"Перевод по номеру телефона\.\s*", "Перевод: ", desc_str)
            desc_str = re.sub(r"Счет корреспондента \d+-\d+-\d+-\d+\s*\([^)]*\)\.", "", desc_str)
            desc_str = re.sub(r"\s+", " ", desc_str).strip()

            # Финальное описание: получатель + краткое описание
            if recipient_str and recipient_str not in ('ОАО "МБАНК"', 'ОАО "Мбанк"'):
                full_desc = f"{recipient_str}: {desc_str}"
            else:
                full_desc = desc_str

            full_desc = full_desc[:150] or "Без описания"

            transactions.append({
                "date":        date_str.strip(),
                "amount":      amount,
                "description": full_desc,
            })
        except Exception:
            continue

    print(f"[parser] MBank xls: {len(transactions)} транзакций")
    return transactions

# BAKAI - xlsx (табличный формат)

def _parse_bakai_xlsx(df: pd.DataFrame, config: dict) -> list:
    skip = config.get("skip_rows", 17)
    df = df.iloc[skip:].reset_index(drop=True)
    df = df.dropna(how="all")

    transactions = []
    for _, row in df.iterrows():
        try:
            date  = _safe_get(row, config["date_col"])
            debet = _parse_amount(_safe_get(row, config["debet_col"]))
            credit = _parse_amount(_safe_get(row, config["credit_col"]))
            desc  = _safe_get(row, config["description_col"])

            desc_str = str(desc) if desc else ""
            if any(s in desc_str for s in ["Итого", "Сальдо", "Эквивалент"]):
                continue

            # Также проверяем колонку счёт-корреспондент (col 2)
            account_col_val = str(_safe_get(row, 2) or "")
            if any(s in account_col_val for s in ["Итого", "Сальдо", "Эквивалент"]):
                continue

            # Нет даты - это служебная строка
            if not date or str(date).strip() == "":
                continue

            amount = None
            if debet and debet > 0:
                amount = -debet
            elif credit and credit > 0:
                amount = credit

            if amount is None or amount == 0:
                continue

            transactions.append({
                "date":        str(date).strip() if date else "",
                "amount":      amount,
                "description": desc_str.strip() or "Без описания",
            })
        except Exception:
            continue

    print(f"[parser] Bakai xlsx: {len(transactions)} транзакций")
    return transactions


# OPTIMA - pdf (дата + описание + сумма в одной строке)
# Пример: Формат: "19.05.2026 Платеж по QR: Banda Panda -120 KGS 0.00 KGS"


OPTIMA_DATE_RE = re.compile(r"^(\d{2}\.\d{2}\.\d{4})\s+(.+)$")
OPTIMA_AMOUNT_RE = re.compile(r"(-?\d+(?:[.,]\d+)?)\s+KGS\s+[\d.,]+\s+KGS\s*$")


def _parse_optima_pdf(text: str, config: dict) -> list:
    footer_keywords = config.get("footer_keywords", [])
    lines = text.split("\n")
    transactions = []

    for line in lines:
        line = line.strip()
        if not line:
            continue
        if any(fk in line for fk in footer_keywords):
            break

        m_date = OPTIMA_DATE_RE.match(line)
        if not m_date:
            continue

        date_str = m_date.group(1)
        rest = m_date.group(2)

        m_amount = OPTIMA_AMOUNT_RE.search(rest)
        if not m_amount:
            continue

        amount = _parse_amount(m_amount.group(1))
        if amount is None:
            continue

        description = rest[:m_amount.start()].strip()
        description = re.sub(
            r"-?\d+(?:[.,]\d+)?\s+(CNY|USD|EUR|RUB|KZT)\s*$", "", description
        ).strip()

        if not description:
            description = "Без описания"

        transactions.append({
            "date":        date_str,
            "amount":      amount,
            "description": description,
        })

    print(f"[parser] Optima pdf: {len(transactions)} транзакций")
    return transactions



# MBANK - pdf (многострочный)
# Пример: Формат: "20.02.2026 11:38 Оплата по QR Тулпар: - 17,00"
#         "Оплата услуг. Получатель: ..." (доп строки описания)


# Строка с датой+временем+первой строкой описания+суммой
MBANK_LINE_RE = re.compile(
    r"^(\d{2}\.\d{2}\.\d{4})\s+\d{2}:\d{2}\s+(.+?)\s+([+-]?\s*\d+(?:[\s.,]\d+)*)\s*$"
)


def _parse_mbank_pdf(text: str, config: dict) -> list:
    footer_keywords = config.get("footer_keywords", [])
    lines = text.split("\n")
    transactions = []

    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if any(fk in line for fk in footer_keywords):
            break

        m = MBANK_LINE_RE.match(line)
        if not m:
            i += 1
            continue

        date_str = m.group(1)
        first_desc = m.group(2).strip()
        amount_str = m.group(3).replace(" ", "")
        amount = _parse_amount(amount_str)

        if amount is None or amount == 0:
            i += 1
            continue

        # Собираем дополнительные строки описания пока не дойдём до следующей транзакции
        desc_parts = [first_desc]
        j = i + 1
        while j < len(lines):
            next_line = lines[j].strip()
            if not next_line:
                break
            if MBANK_LINE_RE.match(next_line):
                break
            if any(fk in next_line for fk in footer_keywords):
                break
            # Пропускаем шапку таблицы которая повторяется на каждой странице
            if "Дата операции" in next_line or "Описание операции" in next_line:
                break
            desc_parts.append(next_line)
            j += 1

        # Чистим описание от двоеточия в конце первой части
        description = " ".join(desc_parts).strip()
        description = description.rstrip(":").strip()

        # Убираем технический шум из описания
        description = re.sub(r"\s+019[a-f0-9-]{30,}", "", description)
        description = re.sub(r"\s+Сумма [\d.,]+ KGS.*$", "", description)
        # Убираем повтор "Оплата услуг. Получатель: ..."
        description = re.sub(r"\s*Оплата услуг\.\s*Получатель:\s*", " ", description)
        # Убираем "Перевод по номеру телефона qr. 99670..."
        description = re.sub(r"Перевод по номеру телефона qr\.\s*", "Перевод: ", description)
        description = re.sub(r"Перевод по номеру телефона\.\s*", "Перевод: ", description)
        # Убираем номера счетов корреспондентов
        description = re.sub(r"Счет корреспондента \d+-\d+-\d+-\d+\s*\([^)]*\)\.", "", description)
        description = re.sub(r"Сумма [\d,.\s]+KGS", "", description)
        # Чистим множественные пробелы
        description = re.sub(r"\s+", " ", description).strip()
        description = description[:150]

        transactions.append({
            "date":        date_str,
            "amount":      amount,
            "description": description or "Без описания",
        })

        i = j

    print(f"[parser] MBank pdf: {len(transactions)} транзакций")
    return transactions


# SIMBANK - pdf (дата на одной строке, описание+сумма на следующей)
# Пример :Формат: "28-11-2025"
#         "KAMPA.KG TUNGUCH -30,00 - 1 880,39"
#         "11:35:58"

SIMBANK_DATE_RE = re.compile(r"^(\d{2}-\d{2}-\d{4})$")
SIMBANK_TIME_RE = re.compile(r"^\d{2}:\d{2}:\d{2}$")
# Формат суммы: "-30,00" или "+6,68" в конце есть баланс
SIMBANK_DATA_RE = re.compile(
    r"^(.+?)\s+([+-]\s*\d+(?:[.,]\d+)?)\s+-\s+[\d\s,.]+\s*$"
)


def _parse_simbank_pdf(text: str, config: dict) -> list:
    footer_keywords = config.get("footer_keywords", [])
    lines = text.split("\n")
    transactions = []

    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if any(fk in line for fk in footer_keywords):
            break

        # Ищем строку с датой
        if not SIMBANK_DATE_RE.match(line):
            i += 1
            continue

        date_str = line
        # Дальше идёт строка с описанием+суммой, потом строка со временем
        # Иногда описание длинное и разбито на 2 строки

        if i + 1 >= len(lines):
            break

        # Может быть описание+сумма сразу, или строка описания, потом сумма
        desc_parts = []
        amount = None
        j = i + 1

        while j < len(lines) and j < i + 4:
            cur = lines[j].strip()

            # Время - пропускаем (конец транзакции)
            if SIMBANK_TIME_RE.match(cur):
                j += 1
                break

            # Сумма в этой строке?
            m_data = SIMBANK_DATA_RE.match(cur)
            if m_data:
                desc_parts.append(m_data.group(1).strip())
                amount_str = m_data.group(2).replace(" ", "")
                amount = _parse_amount(amount_str)
                j += 1
            elif cur and not SIMBANK_DATE_RE.match(cur):
                # это часть описания
                desc_parts.append(cur)
                j += 1
            else:
                break

        if amount is None or amount == 0:
            i = j if j > i else i + 1
            continue

        description = " ".join(desc_parts).strip()
        if not description:
            description = "Без описания"

        transactions.append({
            "date":        date_str,
            "amount":      amount,
            "description": description,
        })
        i = j

    print(f"[parser] Simbank pdf: {len(transactions)} транзакций")
    return transactions


# Вспомогательные

def _safe_get(row, col):
    try:
        val = row.iloc[col] if isinstance(col, int) else row[col]
        return None if pd.isna(val) else val
    except (IndexError, KeyError):
        return None


def _parse_amount(value):
    if value is None:
        return None
    try:
        s = str(value).strip()
        s = s.replace("KGS", "").replace("KZT", "").replace("USD", "").replace("CNY", "")
        s = s.replace(" ", "").replace(",", ".")
        clean = "".join(ch for ch in s if ch.isdigit() or ch in (".", "-", "+"))
        clean = clean.lstrip("+")
        if not clean or clean in ("-", "+"):
            return None
        return float(clean)
    except (ValueError, TypeError):
        return None


def parse_file(file_bytes: bytes, filename: str) -> dict:
    print(f"\n[parser] Файл: {filename}")
    data, file_type = read_file(file_bytes, filename)
    print(f"[parser] Тип: {file_type}")
    bank_name, config = detect_bank(data, file_type)
    transactions = parse_transactions(data, file_type, config) if config else []
    return {
        "bank":         bank_name,
        "file_type":    file_type,
        "transactions": transactions,
    }


if __name__ == "__main__":
    import sys
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

    if len(sys.argv) > 1:
        test_file = sys.argv[1]
        filename = os.path.basename(test_file)
    else:
        test_file = os.path.join(BASE_DIR, "testexm.xls")
        filename = "testexm.xls"

    if not os.path.exists(test_file):
        print(f"Файл не найден: {test_file}")
    else:
        with open(test_file, "rb") as f:
            file_bytes = f.read()
        result = parse_file(file_bytes, filename)
        print(f"\n─── РЕЗУЛЬТАТ ───")
        print(f"Банк:       {result['bank']}")
        print(f"Тип:        {result['file_type']}")
        print(f"Транзакций: {len(result['transactions'])}")
        print(f"\nПервые 8 транзакций:")
        for t in result["transactions"][:8]:
            desc = t['description'][:60]
            print(f"  {t['date']:<12} {t['amount']:>10.2f}  {desc}")
        if len(result["transactions"]) > 8:
            print(f"\nПоследние 5 транзакций:")
            for t in result["transactions"][-5:]:
                desc = t['description'][:60]
                print(f"  {t['date']:<12} {t['amount']:>10.2f}  {desc}")
