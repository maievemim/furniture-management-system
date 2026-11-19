// อัปโหลดโมเดลและรูปตัวอย่างใน assets/samples/ ขึ้น bucket "models" แล้วอัปเดตตาราง products
// วิธีรัน:  node --env-file=.env.local scripts/upload-samples.mjs
// ต้องมีใน .env.local: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, ADMIN_EMAIL, ADMIN_PASSWORD
// (ADMIN_* ไม่มี VITE_ นำหน้า จึงไม่ถูกฝังลงในหน้าเว็บ)
// ข้อมูลสินค้าต้องตรงกับ supabase/seed.sql
import { readFileSync, statSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env
if (!VITE_SUPABASE_URL || !VITE_SUPABASE_ANON_KEY || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('ขาดค่าใน .env.local: ต้องมี VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, ADMIN_EMAIL, ADMIN_PASSWORD')
  process.exit(1)
}

const MAX_GLB_BYTES = 5 * 1024 * 1024
const products = [
  { sku: 'SF-001', name: 'โซฟาหนังดึงกระดุม 2 ที่นั่ง', price: 15900, width_cm: 181, depth_cm: 82, height_cm: 71 },
  { sku: 'TB-001', name: 'โต๊ะกลางโมเดิร์น', price: 2900, width_cm: 60, depth_cm: 120, height_cm: 39 },
  { sku: 'BD-001', name: 'เตียงไม้สไตล์โกธิค 5 ฟุต', price: 24900, width_cm: 149, depth_cm: 204, height_cm: 153 },
  { sku: 'SH-001', name: 'ชั้นวางของพร้อมลิ้นชัก 4 ช่อง', price: 5900, width_cm: 114, depth_cm: 49, height_cm: 188 },
  { sku: 'CH-001', name: 'เก้าอี้ทานอาหารหุ้มหนัง', price: 1290, width_cm: 43, depth_cm: 58, height_cm: 97 },
]

const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
const { error: loginError } = await supabase.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
if (loginError) {
  console.error('ล็อกอินแอดมินไม่สำเร็จ:', loginError.message)
  process.exit(1)
}

async function upload(localPath, storagePath, contentType) {
  const { error } = await supabase.storage
    .from('models')
    .upload(storagePath, readFileSync(localPath), { contentType, upsert: true })
  if (error) throw new Error(`อัปโหลด ${storagePath} ไม่สำเร็จ: ${error.message}`)
}

for (const p of products) {
  const key = p.sku.toLowerCase()
  const glb = `assets/samples/${key}.glb`
  const size = statSync(glb).size
  if (size > MAX_GLB_BYTES) throw new Error(`${glb} ใหญ่เกิน 5 MB`)

  await upload(glb, `glb/${key}.glb`, 'model/gltf-binary')
  await upload(`assets/samples/${key}.webp`, `thumbs/${key}.webp`, 'image/webp')

  const { error } = await supabase
    .from('products')
    .upsert({ ...p, model_path: `glb/${key}.glb`, thumbnail_url: `thumbs/${key}.webp` }, { onConflict: 'sku' })
  if (error) throw new Error(`บันทึก ${p.sku} ไม่สำเร็จ: ${error.message}`)
  console.log(`✓ ${p.sku} ${p.name} (${(size / 1024).toFixed(0)} KB)`)
}

// ตัวอย่างชุดแรก WD-001 ไม่มีโมเดลแล้ว
await supabase.from('products').delete().eq('sku', 'WD-001')
await supabase.auth.signOut()
console.log('เสร็จแล้ว')
