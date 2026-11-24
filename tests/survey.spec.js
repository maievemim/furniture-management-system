import { test, expect } from '@playwright/test'
import { existsSync } from 'node:fs'

const hasBackend =
  Boolean(process.env.BASE_URL) || Boolean(process.env.VITE_SUPABASE_URL) || existsSync('.env.local')

// หมายเหตุ: test นี้ดักคำขอไปที่ตาราง survey_responses แล้วตอบกลับเอง
// เพื่อไม่ให้ E2E ใส่คำตอบปลอมลงฐานข้อมูลจริง (ผลประเมินใช้ทำรายงานโครงงาน)

test('แบบประเมิน: ตอบไม่ครบแล้วเตือน ตอบครบแล้วส่งได้', async ({ page }) => {
  test.skip(!hasBackend, 'ยังไม่ได้ตั้งค่า Supabase')
  let sent = null
  await page.route('**/rest/v1/survey_responses*', async (route) => {
    sent = route.request().postDataJSON()
    await route.fulfill({ status: 201, body: '' })
  })

  await page.goto('/survey')
  await expect(page.getByRole('heading', { name: 'แบบประเมินความพึงพอใจ' })).toBeVisible()

  // ยังไม่กรอกอะไร
  await page.getByTestId('survey-submit').click()
  await expect(page.getByTestId('survey-error')).toContainText('กรุณากรอกข้อมูลทั่วไปให้ครบ')

  await page.getByText('หญิง', { exact: true }).click()
  await page.getByText('20–29 ปี', { exact: true }).click()
  await page.getByText('มือถือ', { exact: true }).click()

  // ตอบข้อเดียวแล้วส่ง: ต้องบอกข้อที่ยังไม่ได้ตอบ
  const questions = page.getByTestId('survey-q')
  const total = await questions.count()
  expect(total).toBe(12)
  await questions.nth(0).getByText('5', { exact: true }).click()
  await page.getByTestId('survey-submit').click()
  await expect(page.getByTestId('survey-error')).toContainText('ยังไม่ได้ตอบข้อ 2')

  for (let i = 1; i < total; i++) await questions.nth(i).getByText('4', { exact: true }).click()
  await expect(page.getByTestId('survey-progress')).toHaveText(`ตอบแล้ว ${total} / ${total} ข้อ`)
  await page.getByTestId('survey-comment').fill('ทดสอบ')
  await page.getByTestId('survey-submit').click()

  await expect(page.getByTestId('survey-done')).toBeVisible()
  expect(sent).toMatchObject({ gender: 'หญิง', age_range: '20–29 ปี', device: 'มือถือ', comment: 'ทดสอบ' })
  expect(sent.scores).toEqual([5, ...Array(11).fill(4)])

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(overflow).toBe(false)
})
