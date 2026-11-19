# CHANGELOG

## week-01 (30 พ.ย. – 6 ธ.ค. 2569)

### เพิ่ม
- ตั้งโปรเจกต์ React + Vite, react-router, Supabase client
- `supabase/schema.sql`: ตาราง products / rooms / room_items, view product_popularity, function match_products, RLS และ bucket `models`
- `supabase/seed.sql`: สินค้าตัวอย่าง 5 ชิ้น (ข้อมูลสมมติ รอข้อมูลจริงจากร้าน)
- หน้าแคตตาล็อก: รูป ชื่อ รหัส ราคา (บาท) ขนาด ก×ล×ส ซม. และช่องค้นหา รองรับจอ 360px
- `vercel.json` rewrite ทุก path ไป `/`
- Playwright smoke test หน้าแคตตาล็อก + GitHub Actions รันเมื่อ push เข้า `staging`
- โมเดล .glb 5 ชิ้นแรก + รูปสินค้า (Poly Haven, CC0) ใน `assets/samples/` และสคริปต์ `scripts/upload-samples.mjs`

### แก้
- -

### ปัญหาที่ยังค้าง
- ชื่อและราคาสินค้ายังเป็นค่าตัวอย่าง รอข้อมูลจริงจากร้าน (ขนาดตรงกับโมเดลตัวอย่าง)
