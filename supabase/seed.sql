-- =========================================================
-- seed.sql : ข้อมูลสินค้าตัวอย่าง 5 ชิ้นแรก (สัปดาห์ที่ 1)
-- *** ราคาและขนาดเป็นค่าสมมติ ให้แทนด้วยข้อมูลจริงจากร้าน ***
-- model_path / thumbnail_url ใส่ทีหลังเมื่ออัปโหลดไฟล์ขึ้น bucket models แล้ว
-- รันหลัง schema.sql (รันซ้ำได้ จะอัปเดตตาม sku)
-- =========================================================
insert into public.products (sku, name, price, width_cm, depth_cm, height_cm) values
  ('SF-001', 'โซฟา 3 ที่นั่ง',        12900, 200, 85,  80),
  ('TB-001', 'โต๊ะกลางรับแขก',         2900, 110, 55,  45),
  ('BD-001', 'เตียงนอน 5 ฟุต',         8500, 160, 210, 100),
  ('WD-001', 'ตู้เสื้อผ้า 2 บาน',       6900, 100, 60,  200),
  ('CH-001', 'เก้าอี้ทานอาหาร',        1290, 45,  50,  85)
on conflict (sku) do update set
  name = excluded.name, price = excluded.price,
  width_cm = excluded.width_cm, depth_cm = excluded.depth_cm, height_cm = excluded.height_cm;
