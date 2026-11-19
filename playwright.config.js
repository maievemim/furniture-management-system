import { defineConfig, devices } from '@playwright/test'

// ตั้ง BASE_URL เพื่อยิงไปที่ลิงก์ staging ได้ เช่น
// BASE_URL=https://xxx-git-staging.vercel.app npx playwright test
const baseURL = process.env.BASE_URL || 'http://localhost:4173'

export default defineConfig({
  testDir: './tests',
  timeout: 45_000,
  expect: { timeout: 10_000 }, // หน้า 3D โหลดไลบรารีหนัก บางครั้งเกิน 5 วินาที
  use: { baseURL, locale: 'th-TH' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-360', use: { ...devices['Desktop Chrome'], viewport: { width: 360, height: 740 } } },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : { command: 'npm run build && npm run preview -- --port 4173', port: 4173, reuseExistingServer: true, timeout: 120_000 },
})
