# Настройки для банков КР.
# Ключевые слова ищутся в конце документа (последние строки).

BANK_CONFIGS = {
    #BAKAI BANK xlsx табличный
    "Bakai": {
        "keywords": [
            "Бакай Банк", "BAKAI BANK", "Бакай24", "ОАО \"Бакай Банк\"",
        ],
        "file_format": "xlsx_bakai",
        "skip_rows": 17,
        "date_col": 1,
        "debet_col": 3,
        "credit_col": 4,
        "description_col": 5,
    },
    #MBANK xls cтарый-бинарный формат
    "MbankXls": {
        "keywords": [
            "ОАО \"Мбанк\"", "ОАО \"МБАНК\"", "Лицевой счет",
            "Выписка из лицевого счета",
        ],
        "file_format": "xls_mbank",
        "skip_rows": 13,
        "date_col": 0,
        "recipient_col": 1,
        "debet_col": 2,
        "credit_col": 3,
        "description_col": 4,
    },

    #OPTIMA BANK pdf однострочный
    "Optima": {
        "keywords": [
            "ОАО \"Оптима Банк\"", "Оптима Банк", "optimabank.kg", "Optima Bank",
        ],
        "file_format": "pdf_optima",
        "footer_keywords": [
            "Остаток на начало", "Остаток на конец",
            "Дата создания документа", "Итоговые суммы",
            "ОАО \"Оптима Банк\"", "optimabank.kg",
        ],
    },

    #SIMBANK (Дос-Кредобанк) pdf ПРОВЕРЯЕМ ПЕРВЫМ
    # (в хвосте есть simbank.kg, но также может быть mbank.kg в виде QR-кодов)
    "Simbank": {
        "keywords": [
            "Дос-Кредобанк", "simbank.kg", "Dos-Credobank",
        ],
        "file_format": "pdf_simbank",
        "footer_keywords": [
            "Дос-Кредобанк", "simbank.kg", "БИК: 121001", "Dos-Credobank",
        ],
    },

    #MBANK pdf многострочный
    "Mbank": {
        "keywords": [
            "ОАО \"МБАНК\"", "www.mbank.kg", "MBANK",
        ],
        "file_format": "pdf_mbank",
        "footer_keywords": [
            "Всего списаний", "Всего пополнений",
            "Для проверки достоверности",
        ],
    },
}

TAIL_LINES = 50
