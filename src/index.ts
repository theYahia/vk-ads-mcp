#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { listCampaignsSchema, handleListCampaigns, createCampaignSchema, handleCreateCampaign, updateCampaignSchema, handleUpdateCampaign } from "./tools/campaigns.js";
import { listAdsSchema, handleListAds, createAdSchema, handleCreateAd } from "./tools/ads.js";
import { getStatisticsSchema, handleGetStatistics } from "./tools/statistics.js";
import { listTargetingGroupsSchema, handleListTargetingGroups } from "./tools/targeting.js";
import { getBudgetSchema, handleGetBudget } from "./tools/budget.js";

const server = new McpServer({
  name: "vk-ads-mcp",
  version: "1.0.0",
});

server.tool(
  "list_campaigns",
  "Список рекламных кампаний VK Ads по кабинету с фильтрацией по статусу.",
  listCampaignsSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await handleListCampaigns(params) }],
  }),
);

server.tool(
  "create_campaign",
  "Создать рекламную кампанию VK Ads: название, тип, бюджет.",
  createCampaignSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await handleCreateCampaign(params) }],
  }),
);

server.tool(
  "update_campaign",
  "Обновить кампанию VK Ads: название, бюджет, статус (start/stop).",
  updateCampaignSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await handleUpdateCampaign(params) }],
  }),
);

server.tool(
  "list_ads",
  "Объявления VK Ads по кампаниям: формат, статус, данные.",
  listAdsSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await handleListAds(params) }],
  }),
);

server.tool(
  "create_ad",
  "Создать объявление VK Ads: формат, заголовок, описание, ссылка.",
  createAdSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await handleCreateAd(params) }],
  }),
);

server.tool(
  "get_statistics",
  "Статистика VK Ads: показы, клики, расход за период по кампаниям/объявлениям.",
  getStatisticsSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await handleGetStatistics(params) }],
  }),
);

server.tool(
  "list_targeting_groups",
  "Группы таргетинга кампании VK Ads.",
  listTargetingGroupsSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await handleListTargetingGroups(params) }],
  }),
);

server.tool(
  "get_budget",
  "Бюджет рекламного кабинета VK Ads: остаток, лимиты.",
  getBudgetSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: await handleGetBudget(params) }],
  }),
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[vk-ads-mcp] Сервер запущен. 8 инструментов. Требуется VK_ADS_TOKEN.");
}

main().catch((error) => {
  console.error("[vk-ads-mcp] Ошибка запуска:", error);
  process.exit(1);
});
