# Salary — трекер личных финансов

Next.js 15 (App Router) · TypeScript · Tailwind v4 · shadcn/ui · Turso (LibSQL) + Drizzle ORM · Auth.js v5.

## Запуск локально

```powershell
npm install
copy .env.example .env.local   # затем впишите значения (см. ниже)
npm run db:push                # создать таблицы в Turso
npm run db:seed                # системные категории
npm run dev                    # http://localhost:3000
```

### Переменные окружения

| Переменная | Что это |
| --- | --- |
| `TURSO_DATABASE_URL` | URL базы, `libsql://имя-логин.turso.io` |
| `TURSO_AUTH_TOKEN` | токен доступа к базе |
| `AUTH_SECRET` | секрет подписи сессий, любая случайная строка от 32 байт |

Сгенерировать секрет: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.
Файл `.env.local` в git не попадает.

## Команды

| Команда | Назначение |
| --- | --- |
| `npm run dev` | разработка (Turbopack) |
| `npm run build` / `npm start` | продакшн-сборка и запуск |
| `npm run lint` | ESLint |
| `npm run db:push` | применить схему `src/db/schema.ts` к Turso |
| `npm run db:seed` | добавить системные категории (идемпотентно) |
| `npm run db:studio` | просмотр данных в браузере |
| `npm run db:check-isolation` | тест изоляции данных между пользователями (создаёт и удаляет временных пользователей) |

## Деплой на Vercel

1. Загрузите проект в GitHub-репозиторий (корень репозитория — эта папка `salary`).
2. На vercel.com: **Add New → Project**, выберите репозиторий. Framework определится как Next.js.
3. В **Settings → Environment Variables** добавьте для Production (и Preview):
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
   - `AUTH_SECRET` — **новая** случайная строка, не копируйте из локального файла.
4. Нажмите **Deploy**. Сборка идёт командой `npm run build` (без Turbopack — он не дружит с libsql).
5. Схема уже применена к вашей базе через `db:push`. Если для боевого сайта заведена отдельная база Turso,
   выполните для неё `db:push` и `db:seed`, подставив её переменные в `.env.local`.

Секреты Turso доступны только серверному коду и не попадают в браузер.

## Устройство

- `src/db/queries.ts` — единственный слой доступа к данным; каждая функция принимает `userId` и фильтрует по нему.
- `src/actions/*` — Server Actions: берут `userId` из сессии, валидируют ввод через Zod, вызывают `queries`.
- Часовой пояс пользователя клиент кладёт в cookie `tz`; «сегодня» и «месяц» сервер считает в нём.
- Демо-данных в интерфейсе больше нет: всё читается из Turso.
