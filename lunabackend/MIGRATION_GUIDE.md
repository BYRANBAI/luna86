# Миграция на PostgreSQL

## Установка PostgreSQL (если не установлен)

### Windows:
1. Скачайте PostgreSQL 16: https://www.postgresql.org/download/windows/
2. Установите с параметрами по умолчанию
3. Запомните пароль для пользователя postgres

### После установки:

```bash
# Создайте базу данных
psql -U postgres
CREATE DATABASE luna_db;
CREATE USER luna WITH PASSWORD 'luna123';
GRANT ALL PRIVILEGES ON DATABASE luna_db TO luna;
\q
```

## Миграция данных

```bash
cd luna

# Создать миграцию для PostgreSQL
npm run db:push

# Заполнить данными
npm run db:seed
```

## Если PostgreSQL уже запущен на другом порту

Измените в `.env`:
```
DATABASE_URL=postgresql://luna:luna123@localhost:YOUR_PORT/luna_db
```
