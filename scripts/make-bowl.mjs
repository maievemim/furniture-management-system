// สร้างโมเดลชามซุปเซรามิก 2 หู (BW-001) เป็นไฟล์ .glb และรูปสินค้า .webp
// วิธีรัน (ที่โฟลเดอร์โปรเจกต์):  node scripts/make-bowl.mjs
// ได้ไฟล์:
//   assets/custom/bw-001.glb          ชามขาวเรียบ (ไม่มีลายแบรนด์ เหมาะขึ้นเว็บสาธารณะ)
//   assets/custom/bw-001-decal.glb    ชามมีลายตามของจริง (ลายคลี่จากรูปถ่าย assets/custom/decals/)
//   assets/custom/bw-001(-decal).png  รูปสินค้าพื้นหลังโปร่งใส (ทีมครอปและแปลงเป็น .webp 800×800 ก่อนอัปโหลด)
// ใช้ vite + Playwright เปิด scripts/bowl/export.html เพราะการฝังรูปลายใน .glb ต้องใช้ canvas ของเบราว์เซอร์
import { writeFileSync } from 'node:fs'
import { createServer } from 'vite'
import { chromium } from '@playwright/test'

const PORT = 5198
const server = await createServer({ server: { port: PORT, strictPort: true }, logLevel: 'error' })
await server.listen()
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })

try {
  for (const [suffix, decal] of [['', false], ['-decal', true]]) {
    const page = await browser.newPage({ viewport: { width: 600, height: 600 } })
    page.on('pageerror', (e) => console.error('ผิดพลาดในหน้าเว็บ:', e.message))
    const base = `http://localhost:${PORT}/scripts/bowl/export.html?${decal ? 'decal=1&' : ''}`

    await page.goto(base)
    await page.waitForSelector('body[data-ready]', { state: 'attached', timeout: 60_000 })
    const glb = Buffer.from(await page.evaluate(() => window.glbBase64), 'base64')
    writeFileSync(`assets/custom/bw-001${suffix}.glb`, glb)
    console.log(`assets/custom/bw-001${suffix}.glb`, (glb.length / 1024).toFixed(0), 'KB')

    await page.goto(`${base}preview=30,20`)
    await page.waitForSelector('body[data-ready]', { state: 'attached', timeout: 60_000 })
    await page.screenshot({ path: `assets/custom/bw-001${suffix}.png`, omitBackground: true })
    await page.close()
  }
} finally {
  await browser.close()
  await server.close()
}
