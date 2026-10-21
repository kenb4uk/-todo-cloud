# To-Do Cloud App

**Тема проекта:** «Список задач (To-Do) с облачным хранением файлов-вложений»

Учебный проект по курсу **«Технологии облачных вычислений»**.

## О проекте

Веб-приложение для ведения списка задач с возможностью прикреплять к задачам
файлы-вложения. Сами файлы хранятся в облачном сервисе **Dropbox**, метаданные
задач — в **MongoDB**. Приложение контейнеризировано через **Docker** и
разворачивается на облачной платформе (**Heroku / Render**).

## Стек

- **Backend:** Python 3.11, Flask
- **База данных:** MongoDB (локально в Docker, в проде — MongoDB Atlas)
- **Файловое хранилище:** Dropbox API
- **Контейнеризация:** Docker, docker-compose
- **Деплой:** Heroku / Render
- **Фронтенд:** HTML + Vanilla JS

## Реализованные лабораторные работы

| № | Лаба | Как реализовано в проекте |
|---|------|---------------------------|
| 1 | Git | Репозиторий, ветки, PR, осмысленные коммиты |
| 2 | Docker | `Dockerfile` + `docker-compose.yml` (web + mongo) |
| 3 | Контейнерная виртуализация | Volume, `docker exec`, `docker history`, изоляция |
| 4 | Dropbox | Загрузка/удаление вложений через Dropbox SDK |
| 5 | Heroku | `Procfile`, `runtime.txt`, деплой на Render/Heroku |

## Структура

todo-cloud/
├── app.py
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── Procfile
├── templates/index.html
└── static/{app.js, style.css}

## Локальный запуск

```bash
docker compose up --build