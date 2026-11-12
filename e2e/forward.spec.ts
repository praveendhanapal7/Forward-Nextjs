import { test, expect, type Page, type APIRequestContext } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL ?? "https://forwardagency.in";

// Staff account for Real Value Promoters — set via env vars for CI
const STAFF_EMAIL = process.env.E2E_STAFF_EMAIL ?? "";
const STAFF_PASSWORD = process.env.E2E_STAFF_PASSWORD ?? "";

// ─── Helpers ────────────────────────────────────────────────────────────────

async function loginViaAPI(request: APIRequestContext, email: string, password: string) {
  const res = await request.post(`${BASE_URL}/api/auth/login`, {
    data: { email, password },
  });
  return res;
}

async function loginInBrowser(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/signin`);
  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"], input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 15000 });
}

// ─── Auth ────────────────────────────────────────────────────────────────────

test.describe("Authentication", () => {
  test("login succeeds with correct credentials", async ({ request }) => {
    const res = await loginViaAPI(request, STAFF_EMAIL, STAFF_PASSWORD);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.user).toBeDefined();
    expect(body.user.email).toBe(STAFF_EMAIL);
  });

  test("login fails with wrong password", async ({ request }) => {
    const res = await loginViaAPI(request, STAFF_EMAIL, "wrongpassword");
    expect(res.status()).toBe(401);
  });

  test("login fails with unknown email", async ({ request }) => {
    const res = await loginViaAPI(request, "nobody@example.com", "anypassword");
    expect(res.status()).toBe(401);
  });

  test("sign-in page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/signin`);
    await expect(page.locator("form")).toBeVisible();
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
  });

  test("dashboard redirects to sign-in when not logged in", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page).toHaveURL(/\/signin/);
  });
});

// ─── Dashboard APIs (requires auth cookie) ──────────────────────────────────

test.describe("Dashboard API endpoints", () => {
  let cookies: string;

  test.beforeAll(async ({ request }) => {
    const res = await loginViaAPI(request, STAFF_EMAIL, STAFF_PASSWORD);
    expect(res.status()).toBe(200);
    // Capture set-cookie header for subsequent requests
    const setCookie = res.headers()["set-cookie"] ?? "";
    cookies = setCookie.split(";")[0]; // just the name=value part
  });

  test("GET /api/leads returns 200 with array", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/leads`, {
      headers: { Cookie: cookies },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("GET /api/projects returns 200 with array", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/projects`, {
      headers: { Cookie: cookies },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("GET /api/integrations/sheets returns 200", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/integrations/sheets`, {
      headers: { Cookie: cookies },
    });
    expect(res.status()).toBe(200);
  });

  test("GET /api/integrations/meta returns 200", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/integrations/meta`, {
      headers: { Cookie: cookies },
    });
    expect(res.status()).toBe(200);
  });

  test("GET /api/brands returns 403 for staff (agency-only endpoint)", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/brands`, {
      headers: { Cookie: cookies },
    });
    expect(res.status()).toBe(403);
  });

  test("GET /api/status returns 200", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/status`);
    expect(res.status()).toBe(200);
  });

  test("unauthenticated /api/leads returns 401", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/leads`);
    expect(res.status()).toBe(401);
  });

  test("unauthenticated /api/projects returns 401", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/projects`);
    expect(res.status()).toBe(401);
  });
});

// ─── Dashboard UI ────────────────────────────────────────────────────────────

test.describe("Dashboard UI (staff account)", () => {
  let authCookies: string;

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/auth/login`, {
      data: { email: STAFF_EMAIL, password: STAFF_PASSWORD },
    });
    expect(res.status()).toBe(200);
    authCookies = (res.headers()["set-cookie"] ?? "").split(";")[0];
  });

  test("dashboard page loads without errors", async ({ page }) => {
    await page.goto(`${BASE_URL}/signin`);
    await page.evaluate((cookies) => {
      const [name, value] = cookies.split("=");
      document.cookie = `${name}=${value}; path=/`;
    }, authCookies);
    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page).not.toHaveURL(/\/signin/);
    await expect(page.locator("text=Something went wrong")).not.toBeVisible();
    await expect(page.locator("text=500")).not.toBeVisible();
  });

  test("leads section loads data or empty state", async ({ page }) => {
    await page.goto(`${BASE_URL}/signin`);
    await page.evaluate((cookies) => {
      const [name, value] = cookies.split("=");
      document.cookie = `${name}=${value}; path=/`;
    }, authCookies);
    await page.goto(`${BASE_URL}/dashboard/leads`);
    await page.waitForTimeout(3000);
    await expect(page.locator("text=Something went wrong")).not.toBeVisible();
    await expect(page.locator("text=Unable to load")).not.toBeVisible();
  });
});

// ─── Webhook ─────────────────────────────────────────────────────────────────

test.describe("Meta webhook", () => {
  test("GET verification challenge responds correctly", async ({ request }) => {
    const token = process.env.META_VERIFY_TOKEN;
    if (!token) {
      test.skip(true, "META_VERIFY_TOKEN env var not set — set it to run this test");
      return;
    }
    const challenge = "test_challenge_123";
    const res = await request.get(`${BASE_URL}/api/webhooks/meta`, {
      params: {
        "hub.mode": "subscribe",
        "hub.verify_token": token,
        "hub.challenge": challenge,
      },
    });
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text).toBe(challenge);
  });

  test("GET with wrong verify_token returns 403", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/webhooks/meta`, {
      params: {
        "hub.mode": "subscribe",
        "hub.verify_token": "wrong_token",
        "hub.challenge": "abc",
      },
    });
    expect(res.status()).toBe(403);
  });
});

// ─── Public pages ────────────────────────────────────────────────────────────

test.describe("Public pages", () => {
  test("home page loads", async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveURL(BASE_URL + "/");
    await expect(page.locator("body")).toBeVisible();
  });

  test("sign-up page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`);
    await expect(page.locator("form")).toBeVisible();
  });
});
