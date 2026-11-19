# ขั้นตอนตั้งค่าสัปดาห์ที่ 1 (ทำครั้งเดียว)

ผู้รับผิดชอบหลัก: บทบาท "ฝั่งแอดมิน & QA (หัวหน้าทีม)"

## 1. Supabase
1. สร้างโปรเจกต์ใหม่ที่ https://supabase.com (แผน Free, Region: Southeast Asia (Singapore))
2. SQL Editor → วางทั้งไฟล์ `supabase/schema.sql` → Run
3. SQL Editor → วาง `supabase/seed.sql` → Run (ข้อมูลตัวอย่าง 5 ชิ้น)
4. คัดลอกค่า 2 ตัวไปใส่ `.env.local`
   - `VITE_SUPABASE_URL` = **Project URL** (`https://<project-id>.supabase.co`)
     ดูได้จากปุ่ม **Connect** ด้านบน หรือ Project Settings → Data API
   - `VITE_SUPABASE_ANON_KEY` = **Publishable key** (`sb_publishable_...`)
     อยู่ที่ Project Settings → API Keys (ใช้แทน anon key แบบเก่าได้เลย)
   - **ห้ามใช้ Secret key (`sb_secret_...`) หรือ service_role key เด็ดขาด**
5. Authentication → Users → Add user สร้างบัญชีแอดมิน 1 บัญชี (ใช้ในสัปดาห์ที่ 4)

## 2. บนเครื่อง
```bash
cp .env.example .env.local   # แล้วใส่ค่าจากข้อ 1.4
npm install
npm run dev                  # เปิด http://localhost:5173 ต้องเห็นสินค้า 5 ชิ้น
npx playwright install chromium
npx playwright test
```

## 3. GitHub
1. สร้าง repository (Private ได้) แล้ว push branch `main` และ `staging`
2. Settings → Branches → เพิ่ม rule ให้ `main` และ `staging`: Require a pull request + 1 approval
3. Settings → Secrets and variables → Actions → เพิ่ม `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## 4. Vercel
1. Add New → Project → import repo จาก GitHub (Framework: Vite)
2. Environment Variables: ใส่ `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` ติ๊กทั้ง Production และ Preview
3. Settings → Deployment Protection → ปิด Vercel Authentication
4. ลิงก์ staging คงที่: `https://<ชื่อโปรเจกต์>-git-staging-<ทีม>.vercel.app`

## 5. ส่งงาน week-01
1. Merge PR เข้า `staging` → รอ Vercel deploy เสร็จ
2. `BASE_URL=<ลิงก์ staging> npx playwright test`
3. `git tag week-01 && git push origin week-01`
4. ส่งลิงก์ staging + สรุปจาก `CHANGELOG.md` ให้อาจารย์
