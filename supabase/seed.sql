-- =========================================================
-- seed.sql : สินค้าตัวอย่าง 5 ชิ้น (สัปดาห์ที่ 1)
-- *** ชื่อและราคาเป็นค่าตัวอย่าง ไม่ใช่สินค้าจริงของร้าน ***
-- ขนาด (ซม.) วัดจาก bounding box ของโมเดลแต่ละชิ้น จึงตรงกับไฟล์ .glb
--   width = แกน X, depth = แกน Z, height = แกน Y ของโมเดล
-- โมเดลและรูปจาก Poly Haven (CC0) ดู docs/model-credits.md
-- ไฟล์อยู่ใน assets/samples/ อัปโหลดขึ้น Storage ด้วย scripts/upload-samples.mjs
-- รันหลัง schema.sql (รันซ้ำได้ จะอัปเดตตาม sku)
-- =========================================================

-- ลบตัวอย่างชุดแรกที่ไม่มีโมเดล (WD-001 ถูกแทนด้วย SH-001)
delete from public.products where sku = 'WD-001'
  and not exists (select 1 from public.room_items ri where ri.product_id = products.id);

insert into public.products (sku, name, price, width_cm, depth_cm, height_cm, model_path, thumbnail_url) values
  ('SF-001', 'โซฟาหนังดึงกระดุม 2 ที่นั่ง',     15900, 181, 82,  71,  'glb/sf-001.glb', 'thumbs/sf-001.webp'),
  ('TB-001', 'โต๊ะกลางโมเดิร์น',               2900,  60, 120, 39,  'glb/tb-001.glb', 'thumbs/tb-001.webp'),
  ('BD-001', 'เตียงไม้สไตล์โกธิค 5 ฟุต',        24900, 149, 204, 153, 'glb/bd-001.glb', 'thumbs/bd-001.webp'),
  ('SH-001', 'ชั้นวางของพร้อมลิ้นชัก 4 ช่อง',     5900, 114, 49,  188, 'glb/sh-001.glb', 'thumbs/sh-001.webp'),
  ('CH-001', 'เก้าอี้ทานอาหารหุ้มหนัง',              1290,  43, 58,  97,  'glb/ch-001.glb', 'thumbs/ch-001.webp')
on conflict (sku) do update set
  name = excluded.name, price = excluded.price,
  width_cm = excluded.width_cm, depth_cm = excluded.depth_cm, height_cm = excluded.height_cm,
  model_path = excluded.model_path, thumbnail_url = excluded.thumbnail_url;
