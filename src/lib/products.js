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
