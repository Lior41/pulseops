import { test, expect } from "@playwright/test";
test("recruiter journey: sign in, investigate, analyze and create an incident", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Try demo account" }).click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByRole("heading", { name: "Your environment. In focus." })).toBeVisible();
  await page.goto("/alerts?severity=CRITICAL&status=OPEN");
  const alertLink = page.locator("tbody a[href^='/alerts/']").first();
  await expect(alertLink).toBeVisible();
  await alertLink.click();
  await expect(page.getByRole("heading", { name: "Detection summary" })).toBeVisible();
  await page.getByRole("button", { name: "Mark investigating", exact: true }).click();
  await expect(page.getByRole("button", { name: "Mark investigating", exact: true })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "Analyze with AI", exact: true }).click();
  await expect(page.getByText("Deterministic demo analysis; no model was called.")).toBeVisible();
  await page.getByRole("button", { name: "Create incident", exact: true }).click();
  await expect(page).toHaveURL(/incidents\//);
  await expect(page.getByRole("heading", { name: "Investigation brief" })).toBeVisible();
  await page
    .getByLabel("Investigation note")
    .fill("Reviewed the synthetic evidence during the automated recruiter journey.");
  await page.getByRole("button", { name: "Add note", exact: true }).click();
  await expect(
    page.getByText("Reviewed the synthetic evidence during the automated recruiter journey.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Reviewed the synthetic evidence during the automated recruiter journey.", {
      exact: true,
    }),
  ).toBeVisible();
});
test("a viewer cannot access mutation controls", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Work email").fill("viewer@pulseops.dev");
  await page
    .getByLabel("Password", { exact: true })
    .fill(process.env.DEMO_PASSWORD ?? "PulseOps-Demo-2026!");
  await page.getByRole("button", { name: "Sign in to PulseOps", exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
  await page.goto("/alerts");
  await page.locator("tbody a[href^='/alerts/']").first().click();
  await expect(page.getByText("Read-only access", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create incident", exact: true })).toHaveCount(0);
});
test("anonymous API requests are rejected", async ({ request }) => {
  expect((await request.get("/api/notifications")).status()).toBe(401);
  expect((await request.get("/api/events/stream")).status()).toBe(401);
});
