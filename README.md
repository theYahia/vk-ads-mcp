# @theyahia/vk-ads-mcp

MCP-сервер для VK Ads API — кампании, объявления, статистика, таргетинг, бюджеты. 8 инструментов.

[![npm](https://img.shields.io/npm/v/@theyahia/vk-ads-mcp)](https://www.npmjs.com/package/@theyahia/vk-ads-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Установка

### Claude Desktop

```json
{
  "mcpServers": {
    "vk-ads": {
      "command": "npx",
      "args": ["-y", "@theyahia/vk-ads-mcp"],
      "env": {
        "VK_ADS_TOKEN": "ваш_токен"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add vk-ads -e VK_ADS_TOKEN=ваш_токен -- npx -y @theyahia/vk-ads-mcp
```

## Авторизация

`VK_ADS_TOKEN` — Bearer-токен VK Ads API.

## Инструменты (8)

| Инструмент | Описание |
|------------|----------|
| `list_campaigns` | Список кампаний рекламного кабинета |
| `create_campaign` | Создать кампанию |
| `update_campaign` | Обновить кампанию (название, бюджет, статус) |
| `list_ads` | Объявления по кампаниям |
| `create_ad` | Создать объявление |
| `get_statistics` | Статистика за период |
| `list_targeting_groups` | Группы таргетинга кампании |
| `get_budget` | Бюджет рекламного кабинета |

## Примеры запросов

```
Покажи все кампании в кабинете 12345
Создай кампанию "Осенняя акция" с бюджетом 50000 руб
Какая статистика у кампании за последний месяц?
Покажи остаток бюджета в кабинете
Какие группы таргетинга в кампании 67890?
```

## Лицензия

MIT
