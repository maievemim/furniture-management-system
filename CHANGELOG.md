# CHANGELOG

## week-01 (30 พ.ย. – 6 ธ.ค. 2569)

### เพิ่ม
- ตั้งโปรเจกต์ React + Vite, react-router, Supabase client
- `supabase/schema.sql`: ตาราง products / rooms / room_items, view product_popularity, function match_products, RLS และ bucket `models`
- `supabase/seed.sql`: สินค้าตัวอย่าง 5 ชิ้น (ข้อมูลสมมติ รอข้อมูลจริงจากร้าน)
- หน้าแคตตาล็อก: รูป ชื่อ รหัส ราคา (บาท) ขนาด ก×ล×ส ซม. และช่องค้นหา รองรับจอ 360px
- `vercel.json` rewrite ทุก path ไป `/`
- Playwright smoke test หน้าแคตตาล็อก + GitHub Actions รันเมื่อ push เข้า `staging`

### แก้
- -

### ปัญหาที่ยังค้าง
- ราคา/ขนาดสินค้ายังเป็นค่าสมมติ รอข้อมูลจริงจากร้าน
- ยังไม่มีไฟล์โมเดล .glb และรูปสินค้า 5 ชิ้นแรก
