# Survey Backend

Бэкенд модуля опросов и анкетирования.  
Стек: **Node.js + Express.js + SQLite3**

---

## Установка и запуск

```bash
npm install
node index.js
# Сервер доступен на http://localhost:3000
```

---

## Структура проекта

```
survey-backend/
├── index.js                  # Точка входа, запуск сервера
├── db.js                     # Подключение к SQLite, инициализация таблиц,
│                             #   промис-обёртки (getAsync/allAsync/runAsync)
├── routes/
│   ├── surveys.js            # CRUD опросов
│   ├── answers.js            # Сохранение ответов
│   └── stats.js              # Статистика и CSV-экспорт
├── middleware/
│   └── errorHandler.js       # Централизованная обработка ошибок
├── survey.db                 # Файл базы данных (создаётся автоматически)
└── package.json
```

---

## Схема базы данных

```
surveys        questions           options         answers
─────────      ─────────────       ───────────     ───────────────────
id PK          id PK               id PK           id PK
title          survey_id FK        question_id FK  question_id FK
description    text                text            option_id FK (null)
is_active      type                                answer_text (null)
starts_at      is_required                         session_id
ends_at        order_num                           answered_at
max_responses
created_at
```

**Типы вопросов:** `radio` | `checkbox` | `text` | `scale`

---

## API Reference

### Опросы

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/surveys` | Все опросы |
| GET | `/api/surveys/active` | Только активные (с учётом дат и лимита) |
| GET | `/api/surveys/:id` | Опрос + вопросы + варианты |
| POST | `/api/surveys` | Создать опрос |
| PUT | `/api/surveys/:id` | Обновить опрос |
| DELETE | `/api/surveys/:id` | Удалить опрос |

### Ответы и статистика

| Метод | URL | Описание |
|-------|-----|----------|
| POST | `/api/surveys/:id/answers` | Сохранить ответы пользователя |
| GET | `/api/surveys/:id/stats` | Статистика ответов |
| GET | `/api/surveys/:id/export` | Экспорт в CSV |

---

## Примеры запросов

### Создать опрос
```json
POST /api/surveys
{
  "title": "Оценка качества обслуживания",
  "description": "Займёт 1 минуту",
  "starts_at": "2026-04-01T00:00:00Z",
  "ends_at": "2026-05-01T00:00:00Z",
  "max_responses": 500,
  "questions": [
    {
      "text": "Насколько вы довольны нашим сервисом?",
      "type": "scale",
      "is_required": true
    },
    {
      "text": "Что вам понравилось больше всего?",
      "type": "radio",
      "is_required": true,
      "options": ["Скорость", "Качество", "Цена", "Поддержка"]
    },
    {
      "text": "Ваши пожелания:",
      "type": "text",
      "is_required": false
    }
  ]
}
```

### Отправить ответы
```json
POST /api/surveys/1/answers
{
  "session_id": "user-unique-token-abc123",
  "answers": [
    { "question_id": 1, "answer_text": "9" },
    { "question_id": 2, "option_id": 3 },
    { "question_id": 3, "answer_text": "Всё отлично!" }
  ]
}
```

### Ответ статистики (scale-вопрос)
```json
{
  "question_id": 1,
  "type": "scale",
  "total": 120,
  "average": 7.4,
  "nps": 32,
  "nps_breakdown": {
    "promoters":  { "count": 55, "percent": 46 },
    "neutrals":   { "count": 27, "percent": 22 },
    "detractors": { "count": 38, "percent": 32 }
  }
}
```

---

## Коды ответов

| Код | Ситуация |
|-----|----------|
| 200 | Успешный GET |
| 201 | Успешный POST (создание) |
| 400 | Ошибка валидации входных данных |
| 403 | Опрос неактивен / истёк / лимит достигнут |
| 404 | Ресурс не найден |
| 409 | Пользователь уже проходил этот опрос |
| 500 | Внутренняя ошибка сервера |
