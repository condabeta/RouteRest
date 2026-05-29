import { chromium } from "playwright";
const URL = process.env.SMOKE_URL || "http://127.0.0.1:5173";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1200 } });
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
await page.goto(URL, { waitUntil: "networkidle" });

// Type into the Current location field and wait for the dropdown.
const input = page.locator(".field", { hasText: "Current location" }).locator("input");
await input.click();
await input.type("Phoenix", { delay: 60 });
await page.locator(".suggestions li").first().waitFor({ timeout: 15000 });
await page.waitForTimeout(400);
await page.screenshot({ path: "shot-autocomplete.png" });

const count = await page.locator(".suggestions li").count();
const first = await page.locator(".suggestions li").first().innerText();
console.log("suggestion count:", count);
console.log("first suggestion:", first.replace(/\n/g, " | "));

// Select first and confirm it fills the input.
await page.locator(".suggestions li").first().click();
await page.waitForTimeout(300);
console.log("input value after select:", await input.inputValue());
console.log("CONSOLE ERRORS:", errors.length ? errors : "none");
await browser.close();
