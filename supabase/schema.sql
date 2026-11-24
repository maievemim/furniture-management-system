-- =========================================================
-- schema.sql : ฐานข้อมูลทั้งหมดของระบบจัดวางเฟอร์นิเจอร์เสมือนจริง
-- วิธีใช้: Supabase Dashboard → SQL Editor → วางทั้งไฟล์ → Run
-- รันซ้ำได้ (ใช้ if not exists / or replace / drop policy if exists)
-- ทุกการเปลี่ยน schema ต้องแก้ในไฟล์นี้ด้วย
-- =========================================================

create extension if not exists vector;

-- ---------- products : ข้อมูลสินค้าและขนาดจริง (ซม.) ----------
create table if not exists public.products (
  id            bigint generated always as identity primary key,
  sku           text not null unique,
  name          text not null,
  price         numeric(10,2) not null check (price >= 0),
  width_cm      numeric(7,1) not null check (width_cm  > 0),
  depth_cm      numeric(7,1) not null check (depth_cm  > 0),
  height_cm     numeric(7,1) not null check (height_cm > 0),
  model_path    text,          -- path ใน bucket models เช่น 'glb/sofa-01.glb'
  thumbnail_url text,
  embedding     vector(512),   -- CLIP สำหรับค้นหาด้วยรูป (ฟีเจอร์เสริม)
  created_at    timestamptz not null default now()
);

-- ---------- rooms : ห้องที่บันทึก id ใช้เป็นลิงก์แชร์ ----------
create table if not exists public.rooms (
  id         uuid primary key default gen_random_uuid(),
  name       text not null default 'ห้องของฉัน',
  width_m    numeric(5,2) not null check (width_m  between 1 and 30),
  length_m   numeric(5,2) not null check (length_m between 1 and 30),
  height_m   numeric(5,2) not null check (height_m between 2 and 6),
  created_at timestamptz not null default now()
);

-- ---------- room_items : ตำแหน่งเฟอร์นิเจอร์แต่ละชิ้น (ไม่เก็บราคา) ----------
create table if not exists public.room_items (
  id         bigint generated always as identity primary key,
  room_id    uuid   not null references public.rooms(id) on delete cascade,
  product_id bigint not null references public.products(id) on delete restrict,
  x          numeric(6,3) not null default 0,   -- เมตร
  z          numeric(6,3) not null default 0,   -- เมตร
  rotation_y smallint not null default 0 check (rotation_y in (0, 90, 180, 270)),
  created_at timestamptz not null default now()
);
create index if not exists room_items_room_id_idx    on public.room_items(room_id);
create index if not exists room_items_product_id_idx on public.room_items(product_id);

-- ---------- view : ความนิยมสินค้า ----------
create or replace view public.product_popularity
with (security_invoker = true) as
select p.id, p.sku, p.name, count(ri.id)::int as placed_count
from public.products p
left join public.room_items ri on ri.product_id = p.id
group by p.id, p.sku, p.name
order by placed_count desc;

-- ---------- function : ค้นหาสินค้าที่รูปคล้ายที่สุด ----------
create or replace function public.match_products(query_embedding vector(512), match_count int default 5)
returns table (id bigint, sku text, name text, price numeric, thumbnail_url text, similarity float)
language sql stable
as $$
  select p.id, p.sku, p.name, p.price, p.thumbnail_url,
         1 - (p.embedding <=> query_embedding) as similarity
  from public.products p
  where p.embedding is not null
  order by p.embedding <=> query_embedding
  limit match_count;
$$;

-- ---------- สิทธิ์ระดับตาราง (GRANT) ----------
-- โปรเจกต์ Supabase รุ่นใหม่ไม่ให้สิทธิ์ anon/authenticated กับตารางใหม่อัตโนมัติ
-- ต้อง GRANT เองก่อน แล้ว RLS ด้านล่างจะคุมอีกชั้นว่าแถวไหนทำอะไรได้
grant usage on schema public to anon, authenticated;
grant select on public.products, public.rooms, public.room_items, public.product_popularity to anon, authenticated;
grant insert on public.rooms, public.room_items to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
grant execute on function public.match_products(vector, int) to anon, authenticated;

-- ---------- Row Level Security ----------
alter table public.products   enable row level security;
alter table public.rooms      enable row level security;
alter table public.room_items enable row level security;

-- products: ทุกคนอ่าน, เฉพาะผู้ที่ล็อกอิน (แอดมิน) เขียน
drop policy if exists "products_read_all"    on public.products;
drop policy if exists "products_write_admin" on public.products;
create policy "products_read_all"    on public.products for select using (true);
create policy "products_write_admin" on public.products for all
  to authenticated using (true) with check (true);

-- rooms / room_items: ทุกคนสร้างและอ่านได้ (เปิดไว้สำหรับเดโม)
drop policy if exists "rooms_read_all"   on public.rooms;
drop policy if exists "rooms_insert_all" on public.rooms;
create policy "rooms_read_all"   on public.rooms for select using (true);
create policy "rooms_insert_all" on public.rooms for insert with check (true);

drop policy if exists "room_items_read_all"   on public.room_items;
drop policy if exists "room_items_insert_all" on public.room_items;
create policy "room_items_read_all"   on public.room_items for select using (true);
create policy "room_items_insert_all" on public.room_items for insert with check (true);

-- ---------- Storage bucket models (public) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('models', 'models', true, 5242880,
        array['model/gltf-binary', 'application/octet-stream', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880;

drop policy if exists "models_read_all"     on storage.objects;
drop policy if exists "models_write_admin"  on storage.objects;
drop policy if exists "models_update_admin" on storage.objects;
drop policy if exists "models_delete_admin" on storage.objects;
create policy "models_read_all"     on storage.objects for select using (bucket_id = 'models');
create policy "models_write_admin"  on storage.objects for insert to authenticated with check (bucket_id = 'models');
create policy "models_update_admin" on storage.objects for update to authenticated using (bucket_id = 'models');
create policy "models_delete_admin" on storage.objects for delete to authenticated using (bucket_id = 'models');

-- ---------- survey_responses : แบบประเมินความพึงพอใจ (วัตถุประสงค์ข้อ 2.3) ----------
-- ไม่เก็บชื่อหรือข้อมูลติดต่อ scores = คะแนน 1–5 เรียงตามข้อใน src/lib/survey.js (12 ข้อ)
create table if not exists public.survey_responses (
  id         bigint generated always as identity primary key,
  gender     text not null check (gender in ('ชาย', 'หญิง', 'ไม่ระบุ')),
  age_range  text not null check (age_range in ('ต่ำกว่า 20 ปี', '20–29 ปี', '30–39 ปี', '40–49 ปี', '50 ปีขึ้นไป')),
  device     text not null check (device in ('มือถือ', 'แท็บเล็ต', 'คอมพิวเตอร์')),
  scores     smallint[] not null
             check (array_length(scores, 1) = 12 and 1 <= all(scores) and 5 >= all(scores)),
  comment    text check (char_length(comment) <= 1000),
  created_at timestamptz not null default now()
);

grant insert on public.survey_responses to anon, authenticated;
grant select on public.survey_responses to authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

alter table public.survey_responses enable row level security;

-- ทุกคนส่งแบบประเมินได้ แต่เฉพาะแอดมิน (ล็อกอิน) อ่านผลได้
drop policy if exists "survey_insert_all"  on public.survey_responses;
drop policy if exists "survey_read_admin"  on public.survey_responses;
create policy "survey_insert_all" on public.survey_responses for insert with check (true);
create policy "survey_read_admin" on public.survey_responses for select to authenticated using (true);

-- ---------- expert_reviews : แบบประเมินประสิทธิภาพของระบบโดยผู้เชี่ยวชาญ (วัตถุประสงค์ข้อ 2.1) ----------
-- scores = คะแนน 1–5 เรียงตามข้อใน EXPERT ของ src/lib/survey.js (19 ข้อ) ชื่อ/ตำแหน่งไม่บังคับ
create table if not exists public.expert_reviews (
  id            bigint generated always as identity primary key,
  reviewer_name text check (char_length(reviewer_name) <= 100),
  position      text check (char_length(position) <= 150),
  scores        smallint[] not null
                check (array_length(scores, 1) = 19 and 1 <= all(scores) and 5 >= all(scores)),
  comment       text check (char_length(comment) <= 2000),
  created_at    timestamptz not null default now()
);

grant insert on public.expert_reviews to anon, authenticated;
grant select on public.expert_reviews to authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

alter table public.expert_reviews enable row level security;

-- ผู้เชี่ยวชาญส่งได้โดยไม่ต้องล็อกอิน แต่เฉพาะแอดมินอ่านผลได้
drop policy if exists "expert_insert_all" on public.expert_reviews;
drop policy if exists "expert_read_admin" on public.expert_reviews;
create policy "expert_insert_all" on public.expert_reviews for insert with check (true);
create policy "expert_read_admin" on public.expert_reviews for select to authenticated using (true);
