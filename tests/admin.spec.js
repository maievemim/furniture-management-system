import { test, expect } from '@playwright/test'
import { existsSync, readFileSync } from 'node:fs'

// อ่าน ADMIN_EMAIL / ADMIN_PASSWORD จาก env หรือ .env.local (ไม่ commit)
function adminCreds() {
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    return { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }
  }
  if (!existsSync('.env.local')) return null
  const env = Object.fromEntries(
    readFileSync('.env.local', 'utf8')
      .split(/\r?\n/)
      .filter((l) => /^[A-Z_]+=/.test(l))
      .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]),
  )
  return env.ADMIN_EMAIL && env.ADMIN_PASSWORD ? { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD } : null
}
const creds = adminCreds()

async function login(page) {
  // หน้าจัดการสินค้าสร้างข้อมูล AI อัตโนมัติ: บล็อกการดาวน์โหลดโมเดล AI ในเทสแอดมิน (ทดสอบ AI แยกใน search.spec.js)
  await page.route(/huggingface\.co|\.hf\.co/, (route) => route.abort())
  await page.goto('/admin')
  await page.getByTestId('login-email').fill(creds.email)
  await page.getByTestId('login-password').fill(creds.password)
  await page.getByTestId('login-submit').click()
  await expect(page.getByTestId('admin-products')).toBeVisible()
}

test('คนที่ไม่ได้ล็อกอินเข้าหน้าแอดมินไม่ได้ (ถูกส่งไปหน้าล็อกอิน)', async ({ page }) => {
  await page.goto('/admin/products')
  await expect(page).toHaveURL(/\/admin\/login$/)
  await expect(page.getByTestId('login-form')).toBeVisible()
})

test('รหัสผ่านผิดขึ้นข้อความภาษาไทย', async ({ page }) => {
  test.skip(!creds, 'ไม่มี ADMIN_EMAIL/ADMIN_PASSWORD')
  await page.goto('/admin/login')
  await page.getByTestId('login-email').fill(creds.email)
  await page.getByTestId('login-password').fill('wrong-password-123')
  await page.getByTestId('login-submit').click()
  await expect(page.getByTestId('login-error')).toHaveText('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
})

test.describe('หลังล็อกอิน', () => {
  test.skip(!creds, 'ไม่มี ADMIN_EMAIL/ADMIN_PASSWORD')

  test('เห็นรายการสินค้า และอัปโหลดไฟล์ที่ไม่ใช่ .glb หรือใหญ่เกินจะขึ้นคำเตือน', async ({ page }) => {
    await login(page)
    expect(await page.getByTestId('admin-product-row').count()).toBeGreaterThan(0)

    await page.getByTestId('add-product').click()
    const glbInput = page.getByTestId('pf-glb')
    await glbInput.setInputFiles({ name: 'sofa.obj', mimeType: 'text/plain', buffer: Buffer.from('not a glb') })
    await expect(page.getByTestId('product-form')).toContainText('ไฟล์โมเดลต้องเป็นนามสกุล .glb เท่านั้น')

    const big = Buffer.alloc(5 * 1024 * 1024 + 1)
    big.write('glTF')
    await glbInput.setInputFiles({ name: 'big.glb', mimeType: 'model/gltf-binary', buffer: big })
    await expect(page.getByTestId('product-form')).toContainText('ไฟล์โมเดลใหญ่เกิน 5 MB')

    await glbInput.setInputFiles({ name: 'fake.glb', mimeType: 'model/gltf-binary', buffer: Buffer.from('hello world') })
    await expect(page.getByTestId('product-form')).toContainText('ไฟล์นี้ไม่ใช่ไฟล์ .glb ที่ถูกต้อง')

    // ฟอร์มว่าง: ต้องเตือนทุกช่อง และไม่บันทึก
    await page.getByTestId('pf-save').click()
    await expect(page.getByTestId('product-form')).toContainText('กรุณากรอกชื่อสินค้า')
  })

  test('เพิ่ม แก้ไข และลบสินค้า พร้อมอัปโหลดโมเดล .glb', async ({ page }) => {
    await login(page)
    const sku = `T-${Date.now().toString(36).toUpperCase()}`
    await page.getByTestId('add-product').click()
    await page.getByTestId('pf-sku').fill(sku)
    await page.getByTestId('pf-name').fill('สินค้าทดสอบ E2E')
    await page.getByTestId('pf-price').fill('1234')
    await page.getByTestId('pf-width').fill('50')
    await page.getByTestId('pf-depth').fill('50')
    await page.getByTestId('pf-height').fill('80')
    await page.getByTestId('pf-glb').setInputFiles('assets/samples/ch-001.glb')
    await page.getByTestId('pf-image').setInputFiles('assets/samples/ch-001.webp')
    await page.getByTestId('pf-save').click()
    await expect(page.getByTestId('admin-notice')).toHaveText('เพิ่มสินค้าแล้ว')
    const row = page.getByTestId('admin-product-row').filter({ hasText: sku })
    await expect(row).toContainText('1,234 บาท')

    await row.getByRole('button', { name: 'แก้ไข' }).click()
    await page.getByTestId('pf-price').fill('2500')
    await page.getByTestId('pf-save').click()
    await expect(row).toContainText('2,500 บาท')

    page.once('dialog', (d) => d.accept())
    await row.getByRole('button', { name: 'ลบ' }).click()
    await expect(page.getByTestId('admin-notice')).toHaveText(`ลบ ${sku} แล้ว`)
    await expect(row).toHaveCount(0)
  })

  test('เพิ่มสินค้าโดยไม่อัปโหลดโมเดล 3D ได้ และวางในห้องเป็นกล่องขนาดจริง', async ({ page }) => {
    await login(page)
    const sku = `N-${Date.now().toString(36).toUpperCase()}`
    await page.getByTestId('add-product').click()
    await page.getByTestId('pf-sku').fill(sku)
    await page.getByTestId('pf-name').fill('สินค้าทดสอบไม่มีโมเดล')
    await page.getByTestId('pf-price').fill('990')
    await page.getByTestId('pf-width').fill('40')
    await page.getByTestId('pf-depth').fill('40')
    await page.getByTestId('pf-height').fill('45')
    await page.getByTestId('pf-save').click()
    await expect(page.getByTestId('admin-notice')).toHaveText('เพิ่มสินค้าแล้ว')
    const row = page.getByTestId('admin-product-row').filter({ hasText: sku })
    await expect(row.getByTestId('admin-model-status')).toContainText('ไม่มี')

    // หน้าจัดห้องวางได้ และไม่มีปุ่ม AR
    await page.goto('/planner')
    await page.getByTestId(`add-${sku}`).click()
    await expect(page.getByTestId('selected-name')).toHaveText('สินค้าทดสอบไม่มีโมเดล')
    await expect(page.getByTestId('view-ar')).toHaveCount(0)
    await expect(page.getByTestId('bom-total')).toHaveText('990 บาท')

    await page.goto('/admin/products')
    page.once('dialog', (d) => d.accept())
    await page.getByTestId('admin-product-row').filter({ hasText: sku }).getByRole('button', { name: 'ลบ' }).click()
    await expect(page.getByTestId('admin-notice')).toHaveText(`ลบ ${sku} แล้ว`)
  })

  test('เพิ่มสินค้าโดยสร้างโมเดล 3D จากแม่แบบ แล้ววางในห้องได้ และมีปุ่มดู AR', async ({ page }) => {
    await login(page)
    const sku = `TP-${Date.now().toString(36).toUpperCase()}`
    await page.getByTestId('add-product').click()
    await page.getByTestId('pf-sku').fill(sku)
    await page.getByTestId('pf-name').fill('ชั้นวางทดสอบจากแม่แบบ')
    await page.getByTestId('pf-price').fill('1590')
    await page.getByText('สร้างจากแม่แบบ', { exact: true }).click()
    await page.getByTestId('tpl-shelf').locator('..').click()
    await page.getByTestId('tpl-sample').click() // 80 × 30 × 180 ซม.
    await expect(page.getByTestId('pf-width')).toHaveValue('80')
    await page.getByRole('button', { name: 'เพิ่มจำนวนชั้น' }).click()
    await expect(page.getByTestId('tpl-opt-count')).toHaveText('6')
    await expect(page.getByTestId('tpl-preview')).toHaveAttribute('data-ready', '1')
    await page.getByTestId('pf-save').click()
    await expect(page.getByTestId('admin-notice')).toHaveText('เพิ่มสินค้าแล้ว', { timeout: 30_000 })

    const row = page.getByTestId('admin-product-row').filter({ hasText: sku })
    await expect(row.getByTestId('admin-model-status')).toContainText('มีโมเดล')
    await expect(row.locator('img.admin-thumb')).toBeVisible() // รูปสินค้าสร้างจากโมเดลให้อัตโนมัติ

    await page.goto('/planner')
    await page.getByTestId(`add-${sku}`).click()
    await expect(page.getByTestId('selected-name')).toHaveText('ชั้นวางทดสอบจากแม่แบบ')
    await expect(page.getByTestId('view-ar')).toBeVisible()
    await expect(page.getByTestId('scene-loading')).toHaveCount(0, { timeout: 20_000 })

    await page.goto('/admin/products')
    page.once('dialog', (d) => d.accept())
    await page.getByTestId('admin-product-row').filter({ hasText: sku }).getByRole('button', { name: 'ลบ' }).click()
    await expect(page.getByTestId('admin-notice')).toHaveText(`ลบ ${sku} แล้ว`)
  })

  test('หน้าผลประเมินความพึงพอใจเปิดได้', async ({ page }) => {
    await login(page)
    await page.getByTestId('admin-nav-survey').click()
    await expect(page.getByRole('heading', { name: 'ผลประเมินความพึงพอใจ' })).toBeVisible()
    await expect(page.getByTestId('survey-count').or(page.getByRole('alert'))).toBeVisible()
  })

  test('หน้าผลประเมินผู้เชี่ยวชาญเปิดได้ และมีลิงก์ /expert ให้คัดลอก', async ({ page }) => {
    await login(page)
    await page.getByTestId('admin-nav-expert').click()
    await expect(page.getByRole('heading', { name: 'ผลประเมินประสิทธิภาพโดยผู้เชี่ยวชาญ' })).toBeVisible()
    await expect(page.getByTestId('expert-link').locator('input')).toHaveValue(/\/expert$/)
    await expect(page.getByTestId('survey-count').or(page.getByRole('alert'))).toBeVisible()
  })

  test('หน้ารายงานแสดงสถิติ กราฟ และตาราง', async ({ page }) => {
    await login(page)
    await page.getByTestId('admin-nav-report').click()
    await expect(page.getByTestId('stat-rooms')).toBeVisible()
    await expect(page.getByTestId('popularity-table')).toBeVisible()
  })
})

test('แก้ไขสินค้าผ่าน API โดยไม่ล็อกอินไม่ได้', async ({ request }) => {
  const env = existsSync('.env.local')
    ? Object.fromEntries(readFileSync('.env.local', 'utf8').split(/\r?\n/).filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
    : process.env
  test.skip(!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY, 'ไม่มีค่า Supabase')
  const headers = { apikey: env.VITE_SUPABASE_ANON_KEY, 'Content-Type': 'application/json', Prefer: 'return=representation' }
  const res = await request.patch(`${env.VITE_SUPABASE_URL}/rest/v1/products?sku=eq.CH-001`, { headers, data: { price: 1 } })
  expect([401, 403]).toContain(res.status())
})
