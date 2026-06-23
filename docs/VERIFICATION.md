# Verification checklist (живой токен)

Этот сервер переписан под **VK Ads API v2** (`ads.vk.com/api/v2`, модель `ad_plans → ad_groups → banners`).
Эндпоинты, строковые статусы, `budget_limit`, path-сегментированная статистика и `account_id`-removal
подтверждены **официальными доками `target.vk.ru` + 5 независимыми рабочими клиентами**.

Несколько деталей **нельзя было подтвердить без живого токена** (официальные schema-страницы
`ads.vk.com/doc/api` рендерятся JS / отдают редирект). Они помечены в коде комментарием `// VERIFY:`.
Прогоните пункты ниже на реальном токене (или песочнице `target-sandbox.my.com`) за ~10 минут и,
если что-то расходится, поправьте указанную константу/поле.

> Подставьте свой токен: `export VK_ADS_TOKEN="..."` (PowerShell: `$env:VK_ADS_TOKEN="..."`).
> Базовый хост: `https://ads.vk.com/api/v2`.

---

## 1. Единицы бюджета — рубли или копейки? (medium)

**Допущение в коде:** `budget_limit` / `budget_limit_day` — в валюте кабинета (рубли для RUB), без ×100.
Файл: `src/tools/ad_plans.ts` (поля `budget_limit*`).

```bash
# Прочитать существующую кампанию с бюджетом и сверить число с тем, что видно в веб-кабинете.
curl -s -H "Authorization: Bearer $VK_ADS_TOKEN" \
  "https://ads.vk.com/api/v2/ad_plans.json?fields=id,name,budget_limit,budget_limit_day&limit=5" | jq
```

- Если `budget_limit` совпадает с рублёвой суммой из кабинета → **всё верно, менять нечего**.
- Если значение ×100 (копейки) → добавить конверсию ₽→копейки в `handleCreateCampaign`/`handleUpdateCampaign`
  и обновить `.describe()`.

## 2. Поле баланса в `user.json` (low)

**Допущение:** возвращаем весь объект `user`; точный путь поля баланса не зафиксирован.
Файл: `src/tools/account.ts`.

```bash
curl -s -H "Authorization: Bearer $VK_ADS_TOKEN" \
  "https://ads.vk.com/api/v2/user.json" | jq
```

- Найдите поле баланса (вероятно `account.balance` / `account.amount`). Если нужно — добавьте проекцию
  `fields=` по умолчанию или трим в `handleGetAccount`.
- Если ответ 403 → нужен OAuth scope **`read_payments`** у токена (это не баг кода).

## 3. Полный enum `objective` (medium)

**Допущение:** `objective` принимается как свободная строка с примерами (`traffic`, `reach`,
`site_conversions`, `leadads`, `playersengagement`). Файл: `src/tools/ad_plans.ts`.

```bash
# Посмотреть, какие objective реально стоят на ваших кампаниях:
curl -s -H "Authorization: Bearer $VK_ADS_TOKEN" \
  "https://ads.vk.com/api/v2/ad_plans.json?fields=id,name,objective&limit=20" | jq '.items[].objective' | sort -u
```

- Если хотите жёсткий enum — впишите полученные значения в `z.enum([...])` вместо `z.string()`.
- Для `create_campaign` проверьте, не требует ли API дополнительно `package_id`/promoted-object —
  если создание падает с ошибкой про обязательное поле, добавьте его в схему.

## 4. Путь обновления: `ad_plans/{id}` plural (medium)

**Допущение:** `POST /ad_plans/{id}.json` (plural). Файл: `src/tools/ad_plans.ts` (`handleUpdateCampaign`).

```bash
# Безопасная проверка: переименовать кампанию (подставьте реальный <ID>).
curl -s -X POST -H "Authorization: Bearer $VK_ADS_TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"verify-rename-test"}' \
  "https://ads.vk.com/api/v2/ad_plans/<ID>.json" -w '\nHTTP %{http_code}\n'
```

- `HTTP 200/204` → plural верный.
- `HTTP 404` → попробуйте singular `/ad_plan/<ID>.json` и поменяйте путь в `handleUpdateCampaign`.

## 5. Статистика: `campaigns` vs `ad_plans` в пути (medium)

**Допущение:** `object_type=campaigns` для статистики уровня кампаний (оф. stat-v2 doc). Файл: `src/tools/statistics.ts`.

```bash
curl -s -H "Authorization: Bearer $VK_ADS_TOKEN" \
  "https://ads.vk.com/api/v2/statistics/campaigns/summary.json?id=<ID>&metrics=all" -w '\nHTTP %{http_code}\n' | jq
```

- `HTTP 200` с `items[].rows` → верно.
- Если 404 — проверьте `ad_plans` в пути; поправьте enum `object_type` и описание.

## 6. Создание баннера: `/banners.json` vs nested (medium)

**Допущение:** `POST /banners.json` с `ad_group_id` в теле. Файл: `src/tools/banners.ts` (`handleCreateAd`).
Создание требует УЖЕ загруженных медиа-id в `content{}` (загрузка креативов в этот сервер не входит).

```bash
# Сначала прочитать существующий баннер, чтобы увидеть реальную форму textblocks/urls/content:
curl -s -H "Authorization: Bearer $VK_ADS_TOKEN" \
  "https://ads.vk.com/api/v2/banners.json?fields=id,ad_group_id,textblocks,urls,content&limit=3" | jq
```

- Сверьте имена слотов (`title_40_vkads`, `text_90`, `primary.url`, `image_600x600.id`) с вашим кабинетом.
- Если создание идёт только через nested-путь — поменяйте на `POST /ad_groups/{ad_group_id}/banners.json`.

## 7. OAuth token endpoint / refresh (опционально)

**Допущение:** `POST /api/v2/oauth2/token.json`, `grant_type=refresh_token` (form-urlencoded). Файл: `src/client.ts`.
Проверять только если используете авто-refresh (`VK_ADS_CLIENT_ID/SECRET/REFRESH_TOKEN`).

```bash
curl -s -X POST "https://ads.vk.com/api/v2/oauth2/token.json" \
  -d "grant_type=refresh_token&refresh_token=$VK_ADS_REFRESH_TOKEN&client_id=$VK_ADS_CLIENT_ID&client_secret=$VK_ADS_CLIENT_SECRET" \
  -w '\nHTTP %{http_code}\n' | jq
```

- Ответ с `access_token` → ок.

---

## Итог

После прогонки отметьте пункты. Изменения, если нужны, локальны: имена полей в `*_FIELDS` константах,
enum `objective`, путь update/banner, конверсия бюджета. Высокоуверенные части (`/ad_plans.json`,
`/banners.json`, `/statistics/{type}/{period}.json`, строковые статусы, отсутствие `account_id`)
проверять не обязательно, но один сквозной `list_campaigns` на живом токене подтвердит связку целиком.
