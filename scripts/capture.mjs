import "dotenv/config";
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  });
  await page.goto("http://localhost:3000/login");
  await page.getByRole("button", { name: "Try demo account", exact: true }).click();
  await page.waitForURL("**/dashboard");
  await mkdir("public/screenshots", { recursive: true });
  await page.screenshot({ path: "public/screenshots/dashboard.jpg", fullPage: false, quality: 90 });
  await page.locator("a[aria-label^='Investigate ALT-']").first().click();
  await page.getByRole("heading", { name: "Detection summary", exact: true }).waitFor();
  if (await page.getByRole("button", { name: "Analyze with AI", exact: true }).isVisible()) {
    await page.getByRole("button", { name: "Analyze with AI", exact: true }).click();
  }
  await page.getByText("Demo analysis", { exact: true }).waitFor();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: "public/screenshots/alert.jpg", fullPage: false, quality: 90 });
  await page.goto("http://localhost:3000/threat-map");
  await page.getByRole("heading", { name: "Signal origins", exact: true }).waitFor();
  await page.screenshot({ path: "public/screenshots/map.jpg", fullPage: false, quality: 90 });
  await page.goto("http://localhost:3000/incidents");
  await page.locator("tbody a[href^='/incidents/']").first().click();
  await page.getByRole("heading", { name: "Investigation brief", exact: true }).waitFor();
  await page.screenshot({ path: "public/screenshots/incident.jpg", fullPage: false, quality: 90 });
  console.log("Saved four real application screenshots to public/screenshots.");
} finally {
  await browser.close();
}
