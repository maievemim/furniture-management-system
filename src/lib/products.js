import { supabase, isSupabaseConfigured } from './supabase.js'

export const PRODUCT_COLUMNS = 'id, sku, name, price, width_cm, depth_cm, height_cm, model_path, thumbnail_url'

// ดึงสินค้าทั้งหมด (โยน Error พร้อมข้อความภาษาไทยเมื่อไม่สำเร็จ)
export async function fetchProducts() {
  if (!isSupabaseConfigured) {
    throw new Error('ยังไม่ได้ตั้งค่าการเชื่อมต่อฐานข้อมูล (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)')
  }
  const { data, error } = await supabase.from('products').select(PRODUCT_COLUMNS).order('name')
  if (error) {
    console.error(error)
    throw new Error('โหลดรายการสินค้าไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่อีกครั้ง')
  }
  return data ?? []
}

// ค้นหาสินค้าที่รูปคล้ายที่สุด (ใช้ function match_products ในฐานข้อมูล) คืนสินค้าพร้อม similarity 0–1
export async function searchByEmbedding(embedding, count = 6) {
  if (!isSupabaseConfigured) {
    throw new Error('ยังไม่ได้ตั้งค่าการเชื่อมต่อฐานข้อมูล (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)')
  }
  const { data: matches, error } = await supabase.rpc('match_products', {
    query_embedding: JSON.stringify(embedding),
    match_count: count,
  })
  if (error) {
    console.error(error)
    throw new Error('ค้นหาไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
  }
  if (!matches?.length) return []
  // ดึงข้อมูลเต็ม (ขนาด/โมเดล) เพื่อใช้ปุ่มดู AR และวางในห้อง
  const { data: rows, error: rowsError } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .in('id', matches.map((m) => m.id))
  if (rowsError) {
    console.error(rowsError)
    throw new Error('โหลดข้อมูลสินค้าไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
  }
  const byId = new Map(rows.map((r) => [r.id, r]))
  return matches.filter((m) => byId.has(m.id)).map((m) => ({ ...byId.get(m.id), similarity: m.similarity }))
}

// แอดมิน: บันทึก embedding ของรูปสินค้า
export async function saveEmbedding(productId, embedding) {
  const { error } = await supabase
    .from('products')
    .update({ embedding: JSON.stringify(embedding) })
    .eq('id', productId)
  if (error) {
    console.error(error)
    throw new Error('บันทึกข้อมูล AI ของสินค้าไม่สำเร็จ')
  }
}

// แอดมิน: รายการสินค้าที่ยังไม่มี embedding (แต่มีรูป)
export async function fetchProductsMissingEmbedding() {
  const { data, error } = await supabase
    .from('products')
    .select('id, sku, thumbnail_url')
    .is('embedding', null)
    .not('thumbnail_url', 'is', null)
  if (error) {
    console.error(error)
    throw new Error('โหลดรายการสินค้าไม่สำเร็จ')
  }
  return data ?? []
}
