# CLAUDE.md

ไฟล์นี้บอก Claude (และสมาชิกทีม) ว่าโปรเจกต์นี้คืออะไร ใช้อะไร และต้องทำงานแบบไหน อ่านให้จบก่อนแก้โค้ดทุกครั้ง

## โปรเจกต์

**ระบบการจัดการการวางเฟอร์นิเจอร์เสมือนจริงผ่านเว็บไซต์** (Web-based Virtual Furniture Placement Management System)
โครงงาน ปวช.3/3 ธด. วิทยาลัยอาชีวศึกษานครปฐม สำหรับบริษัท เรืองศิลป์เฟอร์นิแลนด์ จำกัด

ผู้ใช้สร้างห้อง 3D ตามขนาดจริง วางเฟอร์นิเจอร์ของร้าน ดูราคารวม บันทึกและแชร์ห้อง และดูสินค้าแบบ AR ผ่านกล้องมือถือโดยไม่ต้องติดตั้งแอป แอดมินจัดการสินค้า อัปโหลดโมเดล 3D และดูรายงานความนิยมสินค้า

- เป็นงานเดโม ค่าใช้จ่ายระบบต้องเป็น **0 บาท** ห้ามเพิ่มบริการที่ต้องผูกบัตรหรือเสียเงิน
- ช่วงพัฒนา: 30 พ.ย. 2569 – 1 ม.ค. 2570 ฟีเจอร์หลักต้องครบก่อน 21 ธ.ค. 2569
- แผนฉบับเต็ม: https://claude.ai/artifact/5JxMMK5CrgZv2yDY4S6nDH

## Tech stack

| ส่วน | ใช้ |
| --- | --- |
| Frontend | React + Vite (JavaScript, ไม่ใช้ TypeScript) |
| 3D | three, @react-three/fiber, @react-three/drei |
| AR | @google/model-viewer |
| State | zustand |
| Routing | react-router-dom |
| Backend | Supabase (Postgres + pgvector, Auth, Storage) ผ่าน @supabase/supabase-js |
| AI ค้นหาด้วยรูป | @huggingface/transformers (CLIP `Xenova/clip-vit-base-patch32`) รันใน browser |
| กราฟ | recharts |
| Hosting | Vercel (Hobby) + GitHub |
| E2E test | Playwright |

ไม่มี backend server ของตัวเอง ทุกหน้าคุยกับ Supabase โดยตรง และใช้ Row Level Security คุมสิทธิ์ อย่าเพิ่ม Express/Next API route ถ้าไม่จำเป็นจริงๆ

## คำสั่ง

```bash
npm install          # ติดตั้ง dependency
npm run dev          # รันบนเครื่อง http://localhost:5173
npm run build        # build production
npm run preview      # ดูผล build
npx playwright test  # รัน E2E test (ตั้ง BASE_URL เพื่อยิงไปที่ staging ได้)
```

ทดสอบ AR บนมือถือจากเครื่องตัวเองไม่ได้ เพราะกล้องต้องใช้ HTTPS ให้ push ขึ้น branch แล้วเทสบนลิงก์ preview ของ Vercel แทน

## โครงสร้างโฟลเดอร์

```
src/
  lib/supabase.js          # สร้าง client จาก env
  lib/clip.js              # imageToEmbedding() ใช้ทั้งหน้าแอดมินและหน้าลูกค้า
  store/roomStore.js       # zustand: ขนาดห้อง, รายการเฟอร์นิเจอร์, ชิ้นที่เลือก
  pages/
    Catalog.jsx            # รายการสินค้า + ปุ่มดู AR
    RoomPlanner.jsx        # หน้าจัดห้อง 3D + BOM
    SharedRoom.jsx         # /room/:id
    VisualSearch.jsx       # ค้นหาสินค้าด้วยรูป (ฟีเจอร์เสริม)
    admin/Login.jsx
    admin/Products.jsx     # CRUD + อัปโหลด .glb
    admin/Report.jsx       # กราฟความนิยม
  components/3d/
    Room.jsx               # พื้น + ผนังตามขนาดห้อง
    Furniture.jsx          # โหลด GLB แล้วบังคับขนาดตามฐานข้อมูล
tests/                     # Playwright
supabase/schema.sql        # SQL ทั้งหมด (ตาราง, view, function, policy)
```

## ฐานข้อมูล (Supabase)

- `products`: sku, name, price, width_cm, depth_cm, height_cm, model_path, thumbnail_url, embedding vector(512)
- `rooms`: id uuid (ใช้เป็นลิงก์แชร์), name, width_m, length_m, height_m
- `room_items`: room_id, product_id, x, z, rotation_y
- view `product_popularity`: นับจำนวนครั้งที่สินค้าถูกวางในห้อง
- function `match_products(query_embedding, match_count)`: คืนสินค้าที่รูปคล้ายที่สุด
- Storage bucket `models` (public): ไฟล์ .glb และรูปสินค้า

ทุกการเปลี่ยน schema ต้องแก้ใน `supabase/schema.sql` ด้วย เพื่อให้สร้างฐานข้อมูลใหม่ได้จากไฟล์เดียว

สิทธิ์: `products` ทุกคนอ่านได้ เขียนได้เฉพาะผู้ใช้ที่ล็อกอิน (แอดมิน) ส่วน `rooms` และ `room_items` ทุกคนสร้างและอ่านได้ (เปิดไว้สำหรับเดโม)

## กฎสำคัญของโดเมน

1. **ขนาดต้องเท่าของจริงเสมอ** นี่คือหัวใจของโครงงาน
   - หน่วยในฉาก 3D = เมตร ส่วนฐานข้อมูลเก็บสินค้าเป็น ซม. ให้หาร 100 ก่อนใช้
   - `Furniture.jsx` ต้องวัด bounding box ของโมเดลแล้วปรับ scale ให้ตรง width/height/depth ในฐานข้อมูล
   - **ห้ามมีฟีเจอร์ให้ผู้ใช้ย่อ/ขยายเฟอร์นิเจอร์** และใน `<model-viewer>` ต้องตั้ง `ar-scale="fixed"`
2. เฟอร์นิเจอร์ลากได้เฉพาะบนพื้น (แกน X/Z) หมุนทีละ 90° และต้องไม่หลุดออกนอกห้อง (clamp ค่าตอนปล่อยเมาส์)
3. ราคารวม (BOM) คำนวณจากรายการใน store × ราคาในฐานข้อมูลเท่านั้น ห้ามเก็บราคาไว้ใน `room_items`
4. AR แสดงทีละชิ้น ส่วนการจัดทั้งห้องทำในโหมด 3D เท่านั้น
5. ข้อความบนหน้าเว็บทั้งหมดเป็นภาษาไทย แสดงราคาเป็นบาทแบบมีคอมมา (เช่น 12,900 บาท)

## โมเดล 3D

- ใช้ไฟล์ `.glb` เท่านั้น บีบด้วย gltf-transform ให้แต่ละไฟล์ไม่เกิน 5 MB
- ใช้โมเดลฟรีที่ไลเซนส์เป็น CC0/CC-BY และบันทึกแหล่งที่มาไว้ใน `docs/model-credits.md`
- หน้าอัปโหลดในแอดมินต้องตรวจนามสกุลและขนาดไฟล์ก่อนส่งขึ้น Storage

## Environment variables

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

- เก็บใน `.env.local` (อยู่ใน `.gitignore` แล้ว) **ห้าม commit**
- **ห้ามใช้ service_role key ในโค้ดฝั่ง frontend เด็ดขาด**
- บน Vercel ต้องใส่ทั้ง Production และ Preview

## Git และการส่งงานรายสัปดาห์

| Branch | ใช้ทำอะไร |
| --- | --- |
| `feature/<ชื่องาน>` | งานแต่ละชิ้น |
| `staging` | ลิงก์ที่ส่งอาจารย์ทุกสัปดาห์ |
| `main` | เวอร์ชันที่อาจารย์อนุมัติแล้ว |

- ห้าม push ตรงเข้า `staging` หรือ `main` ให้เปิด Pull Request และให้เพื่อนในทีม approve ก่อน
- ส่งงานทุกสัปดาห์: ติด tag `week-01`, `week-02`, … และเพิ่มรายการใน `CHANGELOG.md` (เพิ่มอะไร / แก้อะไร / ปัญหาที่ยังค้าง)
- ข้อความ commit ใช้รูปแบบ `feat: ...`, `fix: ...`, `docs: ...`, `test: ...` เขียนภาษาไทยหรืออังกฤษก็ได้
- `vercel.json` ต้องมี rewrite ทุก path ไป `/` เพื่อไม่ให้ react-router เจอ 404

## การทดสอบ

ก่อนเปิด PR เข้า `staging` ต้องผ่าน:

- `npm run build` ไม่มี error
- Playwright smoke test: เปิดแคตตาล็อก → สร้างห้อง → วาง 1 ชิ้น → ราคารวมถูก → บันทึก → เปิดลิงก์แชร์แล้วได้ห้องเดิม
- เทสด้วยมือบนมือถือจริงเมื่อแก้ส่วน 3D หรือ AR (Android Chrome + iPhone Safari)

เมื่อเพิ่มฟีเจอร์ใหม่ ให้เพิ่ม test case ใน `tests/` ด้วย ใช้ `data-testid` สำหรับ element ที่ test ต้องหา

## แนวทางเขียนโค้ด

- ใช้ function component + hooks เท่านั้น
- ชื่อไฟล์ component เป็น PascalCase ฟังก์ชันและตัวแปรเป็น camelCase
- ห่อการเรียก Supabase ด้วย try/catch แล้วแสดงข้อความ error ภาษาไทยให้ผู้ใช้เห็น ห้ามปล่อยให้หน้าค้าง
- โหลดโมเดลด้วย `useGLTF` ภายใต้ `<Suspense>` และแสดงสถานะ "กำลังโหลด..." เสมอ
- โมเดล CLIP โหลดช้าครั้งแรก ต้องมีข้อความ "กำลังโหลด AI..." และโหลดเฉพาะตอนผู้ใช้เปิดหน้าค้นหาด้วยรูป
- ทุกหน้าต้องใช้งานได้บนจอมือถือกว้าง 360px

## ขอบเขต

ทำ: ฟีเจอร์ 10 ข้อในแผน + AI ค้นหาด้วยรูป (ฟีเจอร์เสริม ทำเมื่อฟีเจอร์หลักครบแล้ว)

ไม่ทำ (ถ้าถูกขอ ให้เตือนว่านอกขอบเขตก่อน): วาดผนังรูปทรงอิสระ, AR วางทั้งห้อง, ตะกร้าสินค้าหรือการชำระเงิน, ระบบสมาชิกสำหรับลูกค้า, การปรับขนาดเฟอร์นิเจอร์โดยผู้ใช้

## ข้อจำกัดของแผนฟรี

- Supabase จะพักโปรเจกต์ถ้าไม่มีการใช้งานครบ 7 วัน ก่อนส่งงานให้เข้าไปเช็กว่ายังทำงานอยู่ ถ้าถูกพักให้กด Restore
- Storage ฟรีมี 1 GB จึงต้องบีบไฟล์โมเดลเสมอ
- ปิด Deployment Protection ใน Vercel ไว้ เพื่อให้อาจารย์เปิดลิงก์ preview ได้โดยไม่ต้องล็อกอิน
