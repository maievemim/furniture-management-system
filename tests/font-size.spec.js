import { test, expect } from '@playwright/test'

// ข้อกำหนดจากอาจารย์: ตัวอักษรบนเว็บต้องไม่เล็กกว่า 16px
const PAGES = ['/', '/catalog', '/search', '/planner', '/survey', '/expert', '/admin/login']

for (const path of PAGES) {
  test(`ตัวอักษรทุกจุดไม่เล็กกว่า 16px: ${path}`, async ({ page }) => {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    const small = await page.evaluate(() =>
      [...document.querySelectorAll('body *')]
        .filter((el) => [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim()))
        .filter((el) => el.getClientRects().length > 0)
        .filter((el) => parseFloat(getComputedStyle(el).fontSize) < 16)
        .map((el) => `${el.tagName.toLowerCase()}.${el.className} (${getComputedStyle(el).fontSize}): ${el.textContent.trim().slice(0, 30)}`),
    )
    expect(small).toEqual([])
  })
}
