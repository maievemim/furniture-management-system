import { test, expect } from '@playwright/test'
import { existsSync } from 'node:fs'

// มี Supabase ให้ต่อหรือไม่ (env ใน CI หรือไฟล์ .env.local บนเครื่อง หรือยิงไป staging)
const hasBackend =
  Boolean(process.env.BASE_URL) ||
  Boolean(process.env.VITE_SUPABASE_URL) ||
  existsSync('.env.local')

test('เปิดหน้าแคตตาล็อกได้ และไม่มี scroll แนวนอน', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'แคตตาล็อกสินค้า' })).toBeVisible()
  // ต้องแสดงรายการสินค้า หรือข้อความ error ภาษาไทย ห้ามค้างที่ "กำลังโหลด..."
  await expect(page.getByTestId('product-list').or(page.getByTestId('catalog-error')).or(page.getByTestId('catalog-empty'))).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(overflow).toBe(false)
})

test('แคตตาล็อกแสดงชื่อ ราคา (บาทมีคอมมา) และขนาดสินค้า', async ({ page }) => {
  test.skip(!hasBackend, 'ยังไม่ได้ตั้งค่า Supabase')
  await page.goto('/')
  const cards = page.getByTestId('product-card')
  await expect(cards.first()).toBeVisible()
  expect(await cards.count()).toBeGreaterThanOrEqual(1)
  await expect(cards.first().getByTestId('product-price')).toHaveText(/^[\d,]+(\.\d+)? บาท$/)
  await expect(cards.first()).toContainText('ซม.')
})

test('ค้นหาสินค้าด้วยคำที่ไม่มีอยู่ แล้วขึ้นว่าไม่พบ', async ({ page }) => {
  test.skip(!hasBackend, 'ยังไม่ได้ตั้งค่า Supabase')
  await page.goto('/')
  await expect(page.getByTestId('product-card').first()).toBeVisible()
  await page.getByTestId('catalog-search').fill('zzzz-ไม่มีสินค้านี้')
  await expect(page.getByTestId('catalog-empty')).toHaveText('ไม่พบสินค้าที่ค้นหา')
})

test('รีเฟรชหน้าที่ไม่ใช่หน้าแรกแล้วไม่เจอ 404', async ({ page }) => {
  await page.goto('/planner')
  await expect(page.getByRole('heading', { name: 'จัดห้อง 3D' })).toBeVisible()
})
