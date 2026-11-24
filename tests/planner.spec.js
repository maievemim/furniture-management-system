import { test, expect } from '@playwright/test'
import { existsSync } from 'node:fs'

const hasBackend =
  Boolean(process.env.BASE_URL) || Boolean(process.env.VITE_SUPABASE_URL) || existsSync('.env.local')

const items = async (page) => JSON.parse(await page.getByTestId('room-scene').getAttribute('data-items'))
const bahtToNumber = (text) => Number(text.replace(/[^\d.]/g, ''))

test.describe('หน้าจัดห้อง 3D', () => {
  test.skip(!hasBackend, 'ยังไม่ได้ตั้งค่า Supabase')

  test('Smoke: แคตตาล็อก → สร้างห้อง → วาง 1 ชิ้น → ราคารวมถูก → บันทึก → เปิดลิงก์แชร์ได้ห้องเดิม', async ({ page }) => {
    await page.goto('/catalog')
    const firstCard = page.getByTestId('product-card').first()
    const price = bahtToNumber(await firstCard.getByTestId('product-price').textContent())

    await page.getByRole('link', { name: 'จัดห้อง 3D' }).click()
    await page.getByTestId('room-name').fill('ห้องทดสอบ E2E')
    await page.getByTestId('room-width').fill('3.5')
    await page.getByTestId('room-length').fill('4')
    await page.getByTestId('room-height').fill('2.6')
    await page.getByTestId('room-apply').click()
    await expect(page.getByTestId('room-caption')).toContainText('3.5 × 4 ม.')

    // วางสินค้าชิ้นแรกในแคตตาล็อก (เรียงตามชื่อเหมือนกัน)
    await page.getByTestId('picker').getByRole('button', { name: 'วาง' }).first().click()
    await expect(page.getByTestId('bom-row')).toHaveCount(1)
    expect(bahtToNumber(await page.getByTestId('bom-total').textContent())).toBe(price)

    await page.getByTestId('rotate').click()
    await expect(page.getByTestId('selected-rotation')).toHaveText('90')
    const before = await items(page)

    await page.getByTestId('save-room').click()
    await expect(page.getByTestId('share-url')).toHaveValue(/\/room\/[0-9a-f-]{36}$/)
    const url = await page.getByTestId('share-url').inputValue()

    // เปิดลิงก์แชร์ในแท็บใหม่ (ไม่มี state เดิม)
    const shared = await page.context().newPage()
    await shared.goto(new URL(url).pathname)
    await expect(shared.getByTestId('shared-name')).toHaveText('ห้องทดสอบ E2E')
    await expect(shared.getByTestId('room-caption')).toContainText('3.5 × 4 ม. สูง 2.6 ม.')
    expect(bahtToNumber(await shared.getByTestId('bom-total').textContent())).toBe(price)
    const after = await items(shared)
    expect(after.map(({ sku, x, z, r }) => ({ sku, x, z, r }))).toEqual(before)
  })

  test('ลากเฟอร์นิเจอร์ออกนอกห้องไม่ได้ และราคารวมถูกเมื่อวางซ้ำ/ลบ', async ({ page }) => {
    await page.goto('/planner')
    await page.getByTestId('room-width').fill('3')
    await page.getByTestId('room-length').fill('3')
    await page.getByTestId('room-apply').click()

    await page.getByTestId('add-CH-001').click()

    // เครื่องมือช่วยประเมินขนาด: พื้นที่ห้อง และระยะห่างจากผนัง (ซ้าย + ขวา + กว้างเก้าอี้ = กว้างห้อง)
    await expect(page.getByTestId('room-area')).toHaveText('9 ตร.ม.')
    await expect(page.getByTestId('overlap-ok')).toBeVisible()
    const cm = async (id) => {
      const t = await page.getByTestId(id).textContent()
      if (t === 'ชิดผนัง') return 0
      const n = parseFloat(t.match(/[\d.]+/)[0])
      return t.endsWith('ซม.') ? n : n * 100
    }
    expect(Math.abs((await cm('gap-left')) + (await cm('gap-right')) + 43 - 300)).toBeLessThanOrEqual(1)

    await page.getByTestId('add-CH-001').click()
    await expect(page.getByTestId('bom-qty')).toHaveText('2')
    expect(bahtToNumber(await page.getByTestId('bom-total').textContent())).toBe(1290 * 2)
    await page.getByTestId('remove').click()
    await expect(page.getByTestId('bom-qty')).toHaveText('1')
    expect(bahtToNumber(await page.getByTestId('bom-total').textContent())).toBe(1290)

    // ชิ้นแรกอยู่กลางห้อง ซึ่งตรงกับกลางจอ: ลากไปขอบขวาสุดของ canvas
    await expect(page.getByTestId('scene-loading')).toHaveCount(0, { timeout: 20_000 })
    await page.getByTestId('room-scene').scrollIntoViewIfNeeded()
    const box = await page.getByTestId('room-scene').boundingBox()
    const cx = box.x + box.width / 2
    const cy = box.y + box.height / 2
    // โมเดลอาจยังไม่ขึ้นจอทันทีตอนเครื่องทำงานหนัก (รันหลายเทสพร้อมกัน): ลองลากซ้ำจนเก้าอี้ขยับจริง
    // ถ้าครั้งแรกลากไม่โดน เก้าอี้ยังอยู่กลางห้อง จึงลากจากกลางจอซ้ำได้
    await expect(async () => {
      await page.mouse.move(cx, cy)
      await page.mouse.down()
      for (let i = 1; i <= 10; i++) await page.mouse.move(cx + (box.width / 2 - 5) * (i / 10), cy, { steps: 2 })
      await page.mouse.up()
      const [moved] = await items(page)
      expect(Math.abs(moved.x) + Math.abs(moved.z)).toBeGreaterThan(0) // ลากได้จริง
    }).toPass({ timeout: 20_000 })

    const [chair] = await items(page)
    const halfW = 0.43 / 2
    const halfD = 0.58 / 2
    expect(Math.abs(chair.x)).toBeLessThanOrEqual(1.5 - halfW + 1e-6)
    expect(Math.abs(chair.z)).toBeLessThanOrEqual(1.5 - halfD + 1e-6)

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
    expect(overflow).toBe(false) // ไม่มี scroll แนวนอน (จอ 360px)
  })

  test('ลิงก์ห้องที่ไม่มีอยู่ แสดงข้อความภาษาไทย', async ({ page }) => {
    await page.goto('/room/00000000-0000-0000-0000-000000000000')
    await expect(page.getByTestId('shared-error')).toHaveText('ไม่พบห้องนี้ ลิงก์อาจไม่ถูกต้อง')
  })
})
