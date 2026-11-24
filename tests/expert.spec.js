import { test, expect } from '@playwright/test'
import { existsSync } from 'node:fs'

const hasBackend =
  Boolean(process.env.BASE_URL) || Boolean(process.env.VITE_SUPABASE_URL) || existsSync('.env.local')

// ดักคำขอไปที่ตาราง expert_reviews แล้วตอบกลับเอง ไม่ให้ E2E ใส่ผลประเมินปลอมลงฐานข้อมูลจริง
test('แบบประเมินผู้เชี่ยวชาญ: 19 ข้อ 4 ด้าน ตอบไม่ครบแล้วเตือน ตอบครบแล้วส่งได้', async ({ page }) => {
  test.skip(!hasBackend, 'ยังไม่ได้ตั้งค่า Supabase')
  let sent = null
  await page.route('**/rest/v1/expert_reviews*', async (route) => {
    sent = route.request().postDataJSON()
    await route.fulfill({ status: 201, body: '' })
  })

  await page.goto('/expert')
  await expect(page.getByRole('heading', { name: 'แบบประเมินประสิทธิภาพของระบบ' })).toBeVisible()
  await expect(page.locator('.survey-group-title')).toHaveCount(4)
  await expect(page.getByTestId('expert-form')).toContainText('5 = ดีมาก')

  const questions = page.getByTestId('survey-q')
  const total = await questions.count()
  expect(total).toBe(19)

  await page.getByTestId('survey-submit').click()
  await expect(page.getByTestId('survey-error')).toContainText('ยังไม่ได้ประเมินข้อ 1')

  for (let i = 0; i < total; i++) await questions.nth(i).getByText(i % 2 ? '4' : '5', { exact: true }).click()
  await expect(page.getByTestId('survey-progress')).toHaveText(`ประเมินแล้ว ${total} / ${total} ข้อ`)
  await page.getByTestId('expert-position').fill('อาจารย์ทดสอบ')
  await page.getByTestId('survey-submit').click()

  await expect(page.getByTestId('expert-done')).toBeVisible()
  expect(sent).toMatchObject({ reviewer_name: null, position: 'อาจารย์ทดสอบ', comment: null })
  expect(sent.scores).toEqual(Array.from({ length: 19 }, (_, i) => (i % 2 ? 4 : 5)))

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(overflow).toBe(false)
})

test('หน้าแบบประเมินผู้เชี่ยวชาญไม่อยู่ในเมนูหลัก', async ({ page }) => {
  await page.goto('/catalog')
  await expect(page.locator('.nav a[href="/expert"]')).toHaveCount(0)
})
