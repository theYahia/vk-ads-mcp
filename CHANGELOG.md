# Changelog

## 2.0.0 — переработка под VK Ads API v2 (breaking)

Версия 1.x обращалась к легаси-эндпоинтам (`api.vk.com` / myTarget v1) и не работала против реального
`ads.vk.com/api/v2`. В 2.0 переписан весь API-слой по официальной документации `target.vk.ru` и сверен
с 5 независимыми рабочими клиентами.

### Breaking
- Удалён параметр `account_id` из всех инструментов — кабинет определяется OAuth-токеном.
- `list_campaigns`/`create_campaign`/`update_campaign` → `/ad_plans.json` (раньше `/campaigns.json`).
  Update теперь `POST /ad_plans/{id}.json` (id в пути).
- Статусы кампании: `1/0` → `action: activate|stop|delete` (строковые `active/blocked/deleted`).
- Бюджет: `all_limit` → `budget_limit` / `budget_limit_day` (валюта кабинета, не копейки).
- Цель кампании: `type` → `objective`.
- `list_ads`/`create_ad` → `/banners.json`; тело создания `{ad_group_id, textblocks, urls, content}`.
- `get_statistics` → `GET /statistics/{object_type}/{period}.json` (path-сегменты; `period` = day/summary).
- `list_targeting_groups` → `list_ad_groups` (`/ad_groups.json`).
- `get_budget` → `get_account` (`/user.json`).

### Added
- Авто-обновление токена через `refresh_token` (опц. `VK_ADS_CLIENT_ID/SECRET/REFRESH_TOKEN`).
- Обработка `429` с экспоненциальным backoff (учёт `Retry-After`).
- Авто-пагинация списков (`limit`/`offset`, до 200 объектов, флаг `truncated`).
- Защитный парсинг трёх форматов ошибок API → понятный `isError`.
- Миграция на `registerTool` с аннотациями (`readOnly`/`destructive`/`idempotent`/`openWorld`)
  и `outputSchema` + `structuredContent` для read-инструментов.
- Валидация ввода (даты `YYYY-MM-DD`, диапазон ≤92 дней, ≤200 объектов статистики).
- `dotenv` для локального запуска, CI (GitHub Actions, Node 18/20/22), `docs/VERIFICATION.md`.

### Fixed
- Не-идемпотентные `create` POST-запросы больше не ретраятся на 5xx/таймаут (риск дублей).
- Версия сервера читается из `package.json` (был рассинхрон `index.ts` 1.0.0 ↔ package.json 1.0.1).

## 1.0.1
- Первоначальный релиз (легаси API; см. миграцию выше).
