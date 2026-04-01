import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

process.env.VK_ADS_TOKEN = "test-vk-token-123";

function mockOk(data: unknown) {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  };
}

function mockError(status: number, body = "") {
  return {
    ok: false,
    status,
    statusText: "Error",
    text: () => Promise.resolve(body),
  };
}

// ─── list_campaigns ───

describe("list_campaigns", () => {
  beforeEach(() => mockFetch.mockReset());

  it("returns campaigns for account", async () => {
    const { handleListCampaigns } = await import("../tools/campaigns.js");
    const payload = { items: [{ id: 1, name: "Test Campaign", status: "active" }], count: 1 };
    mockFetch.mockResolvedValueOnce(mockOk(payload));

    const result = JSON.parse(await handleListCampaigns({ account_id: 100 }));
    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe("Test Campaign");

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/campaigns.json");
    expect(url).toContain("account_id=100");
  });

  it("passes status filter", async () => {
    const { handleListCampaigns } = await import("../tools/campaigns.js");
    mockFetch.mockResolvedValueOnce(mockOk({ items: [], count: 0 }));

    await handleListCampaigns({ account_id: 100, status: "active" });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("status=active");
  });
});

// ─── create_campaign ───

describe("create_campaign", () => {
  beforeEach(() => mockFetch.mockReset());

  it("sends create request with name and budget", async () => {
    const { handleCreateCampaign } = await import("../tools/campaigns.js");
    mockFetch.mockResolvedValueOnce(mockOk({ id: 200 }));

    await handleCreateCampaign({
      account_id: 100,
      name: "Summer Sale",
      type: "normal",
      budget: 500000,
    });

    const [, opts] = mockFetch.mock.calls[0];
    const body = JSON.parse(opts.body);
    expect(body.name).toBe("Summer Sale");
    expect(body.all_limit).toBe(500000);
  });
});

// ─── list_ads ───

describe("list_ads", () => {
  beforeEach(() => mockFetch.mockReset());

  it("fetches ads by campaign IDs", async () => {
    const { handleListAds } = await import("../tools/ads.js");
    mockFetch.mockResolvedValueOnce(mockOk({ items: [{ id: 10, campaign_id: 1 }] }));

    const result = JSON.parse(await handleListAds({ campaign_ids: [1, 2] }));
    expect(result.items).toHaveLength(1);

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("campaign_ids=1%2C2");
  });
});

// ─── get_statistics ───

describe("get_statistics", () => {
  beforeEach(() => mockFetch.mockReset());

  it("sends statistics request with date range", async () => {
    const { handleGetStatistics } = await import("../tools/statistics.js");
    mockFetch.mockResolvedValueOnce(mockOk({ items: [{ impressions: 1000, clicks: 50 }] }));

    await handleGetStatistics({
      account_id: 100,
      ids_type: "campaign",
      ids: [1],
      period: "day",
      date_from: "2026-01-01",
      date_to: "2026-01-31",
    });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/statistics.json");
    expect(url).toContain("date_from=2026-01-01");
  });
});

// ─── get_budget ───

describe("get_budget", () => {
  beforeEach(() => mockFetch.mockReset());

  it("fetches account budget", async () => {
    const { handleGetBudget } = await import("../tools/budget.js");
    mockFetch.mockResolvedValueOnce(mockOk({ balance: 50000, limit: 100000 }));

    const result = JSON.parse(await handleGetBudget({ account_id: 100 }));
    expect(result.balance).toBe(50000);

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("account_id=100");
  });
});

// ─── Error handling ───

describe("error handling", () => {
  beforeEach(() => mockFetch.mockReset());

  it("throws on missing token", async () => {
    const saved = process.env.VK_ADS_TOKEN;
    delete process.env.VK_ADS_TOKEN;

    const { apiGet } = await import("../client.js");
    await expect(apiGet("/test")).rejects.toThrow("VK_ADS_TOKEN");

    process.env.VK_ADS_TOKEN = saved;
  });

  it("throws on HTTP 4xx errors", async () => {
    const { handleListCampaigns } = await import("../tools/campaigns.js");
    mockFetch.mockResolvedValueOnce(mockError(401, "Unauthorized"));

    await expect(handleListCampaigns({ account_id: 1 })).rejects.toThrow("HTTP 401");
  });
});

// ─── Auth header ───

describe("auth header", () => {
  beforeEach(() => mockFetch.mockReset());

  it("sends Bearer token", async () => {
    const { handleGetBudget } = await import("../tools/budget.js");
    mockFetch.mockResolvedValueOnce(mockOk({ balance: 0 }));

    await handleGetBudget({ account_id: 1 });

    const opts = mockFetch.mock.calls[0][1];
    expect(opts.headers.Authorization).toBe("Bearer test-vk-token-123");
  });
});
