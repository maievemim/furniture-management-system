import { test, expect } from '@playwright/test'
import { existsSync } from 'node:fs'

const hasBackend =
  Boolean(process.env.BASE_URL) || Boolean(process.env.VITE_SUPABASE_URL) || existsSync('.env.local')

test.describe('ค้นหาด้วยรูป', () => {
  test.skip(!hasBackend, 'ยังไม่ได้ตั้งค่า Supabase')

  test('เลือกไฟล์ที่ไม่ใช่รูปแล้วขึ้นคำเตือนภาษาไทย', async ({ page }) => {
    await page.goto('/search')
    await expect(page.getByRole('heading', { name: 'ค้นหาด้วยรูปภาพ' })).toBeVisible()
    await expect(page.getByTestId('ai-status')).toContainText(/กำลังโหลด AI|พร้อมค้นหา/)
    await page.getByTestId('search-file').setInputFiles({ name: 'note.txt', mimeType: 'text/plain', buffer: Buffer.from('x') })
    await expect(page.getByTestId('search-error')).toHaveText('รองรับเฉพาะรูป .jpg, .png หรือ .webp')
  })

  // โหลดโมเดล CLIP จริง (~90 MB ครั้งแรก) และต้องสร้างข้อมูล AI ให้สินค้าในหน้าแอดมินแล้ว
  test('อัปโหลดรูปเก้าอี้ แล้วเจอเก้าอี้เป็นอันดับแรก พร้อมปุ่มดู AR และวางในห้อง', async ({ page }) => {
    test.slow()
    await page.goto('/search')
    await page.getByTestId('search-file').setInputFiles('public/home/ar-room.jpg')
    await expect(page.getByTestId('search-preview')).toBeVisible()
    const first = page.getByTestId('product-card').first()
    await expect(first).toBeVisible({ timeout: 120_000 })
    await expect(first).toContainText('CH-001')
    await expect(first.getByTestId('similarity')).toHaveText(/^คล้าย \d+%$/)
    await expect(first.getByTestId('view-3d')).toBeVisible()
    await first.getByTestId('place-in-room').click()
    await expect(page).toHaveURL(/\/planner$/)
    await expect(page.getByTestId('bom-row')).toHaveCount(1)
  })
})
