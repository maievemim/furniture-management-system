import { test, expect } from '@playwright/test'
import { existsSync } from 'node:fs'

// มี Supabase ให้ต่อหรือไม่ (env ใน CI หรือไฟล์ .env.local บนเครื่อง หรือยิงไป staging)
const hasBackend =
  Boolean(process.env.BASE_URL) ||
  Boolean(process.env.VITE_SUPABASE_URL) ||
  existsSync('.env.local')

test('หน้าแรก: ชื่อระบบ ภาพใหญ่ และ 3 ฟีเจอร์พร้อมขั้นตอน ไม่มีรายการสินค้า', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('ระบบการจัดการการวางเฟอร์นิเจอร์เสมือนจริง')
  await expect(page.getByTestId('brand')).toContainText('เฟอร์นิเจอร์เสมือนจริง')
  await expect(page.getByTestId('hero-start')).toBeVisible()
  await expect(page.getByTestId('feature')).toHaveCount(3)
  for (const f of await page.getByTestId('feature').all()) {
    expect(await f.locator('.feature-steps li').count()).toBeGreaterThanOrEqual(3)
  }
  await expect(page.getByTestId('product-card')).toHaveCount(0)
  await page.getByTestId('feature-cta-search').click()
  await expect(page).toHaveURL(/\/search$/)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(overflow).toBe(false)
})

test('เปิดหน้าแคตตาล็อกได้ และไม่มี scroll แนวนอน', async ({ page }) => {
  await page.goto('/catalog')
  await expect(page.getByRole('heading', { name: 'แคตตาล็อกสินค้า' })).toBeVisible()
  // ต้องแสดงรายการสินค้า หรือข้อความ error ภาษาไทย ห้ามค้างที่ "กำลังโหลด..."
  await expect(page.getByTestId('product-list').or(page.getByTestId('catalog-error')).or(page.getByTestId('catalog-empty'))).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(overflow).toBe(false)
})

test('แคตตาล็อกแสดงชื่อ ราคา (บาทมีคอมมา) และขนาดสินค้า', async ({ page }) => {
  test.skip(!hasBackend, 'ยังไม่ได้ตั้งค่า Supabase')
  await page.goto('/catalog')
  const cards = page.getByTestId('product-card')
  await expect(cards.first()).toBeVisible()
  expect(await cards.count()).toBeGreaterThanOrEqual(1)
  await expect(cards.first().getByTestId('product-price')).toHaveText(/^[\d,]+(\.\d+)? บาท$/)
  await expect(cards.first()).toContainText('ซม.')
})

test('ค้นหาสินค้าด้วยคำที่ไม่มีอยู่ แล้วขึ้นว่าไม่พบ', async ({ page }) => {
  test.skip(!hasBackend, 'ยังไม่ได้ตั้งค่า Supabase')
  await page.goto('/catalog')
  await expect(page.getByTestId('product-card').first()).toBeVisible()
  await page.getByTestId('catalog-search').fill('zzzz-ไม่มีสินค้านี้')
  await expect(page.getByTestId('catalog-empty')).toHaveText('ไม่พบสินค้าที่ค้นหา')
})

test('รีเฟรชหน้าที่ไม่ใช่หน้าแรกแล้วไม่เจอ 404', async ({ page }) => {
  await page.goto('/planner')
  await expect(page.getByRole('heading', { name: 'จัดห้อง 3D' })).toBeVisible()
})

test('กดดูแบบ 3D แล้วโหลดโมเดล .glb ได้ และตั้ง AR เป็นขนาดคงที่', async ({ page }) => {
  test.skip(!hasBackend, 'ยังไม่ได้ตั้งค่า Supabase')
  await page.goto('/catalog')
  await page.getByTestId('view-3d').first().click()
  const dialog = page.getByTestId('model-dialog')
  await expect(dialog).toBeVisible()
  const viewer = dialog.getByTestId('model-viewer')
  // React ตั้ง src เป็น property ของ custom element ไม่ใช่ attribute
  expect(await viewer.evaluate((el) => el.src)).toMatch(/\.glb$/)
  await expect(viewer).toHaveAttribute('ar-scale', 'fixed')
  await expect(viewer).toHaveAttribute('data-status', 'ready', { timeout: 20_000 })
  await dialog.getByRole('button', { name: 'ปิด' }).click()
  await expect(dialog).toBeHidden()
})
