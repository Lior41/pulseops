import "dotenv/config";
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  });
  await page.goto("http://localhost:3000/login");
  await page.getByRole("button", { name: "Try demo account", exact: true }).click();
  await page.waitForURL("**/dashboard");
  await mkdir("public/screenshots", { recursive: true });
  await page.screenshot({ path: "public/screenshots/dashboard.png", fullPage: true });
  await page.locator("a[aria-label^='Investigate ALT-']").first().click();
  await page.getByRole("heading", { name: "Detection summary", exact: true }).waitFor();
  await page.screenshot({ path: "public/screenshots/alert.png", fullPage: true });
  await page.goto("http://localhost:3000/threat-map");
  await page.getByRole("heading", { name: "Signal origins", exact: true }).waitFor();
  await page.screenshot({ path: "public/screenshots/map.png", fullPage: true });
  await page.goto("http://localhost:3000/incidents");
  await page.locator("tbody a[href^='/incidents/']").first().click();
  await page.getByRole("heading", { name: "Investigation brief", exact: true }).waitFor();
  await page.screenshot({ path: "public/screenshots/incident.png", fullPage: true });
  console.log("Saved four real application screenshots to public/screenshots.");
} finally {
  await browser.close();
}
