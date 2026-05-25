# Security Audit Report

## npm audit — 2026-05-24

### Уязвимость: xlsx (high severity)
- **CVE**: GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9
- **Тип**: Prototype Pollution, ReDoS
- **Статус**: No fix available (upstream issue)

### Принятые меры:
1. Загрузка файлов ограничена только авторизованными пользователями (authMiddleware)
2. Проверка типа файла на уровне multer — принимаем только .xlsx, .csv, .pdf
3. Размер файла ограничен
4. Файлы обрабатываются на стороне AI-сервиса изолированно

### Рекомендация:
Заменить xlsx на альтернативу (exceljs) после появления патча.
