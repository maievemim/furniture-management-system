import { supabase, isSupabaseConfigured } from './supabase.js'
import { PRODUCT_COLUMNS } from './products.js'

// บันทึกห้องใหม่ (ห้องที่บันทึกแล้วแก้ไม่ได้ ถ้าแก้ต่อจะได้ลิงก์ใหม่) คืน id ของห้อง
export async function saveRoom(room, items) {
  if (!isSupabaseConfigured) throw new Error('ยังไม่ได้ตั้งค่าการเชื่อมต่อฐานข้อมูล')
  // สร้าง id ฝั่ง browser เพราะ anon อ่านกลับหลัง insert ไม่ได้ทุกกรณี
  const id = crypto.randomUUID()
  const { error: roomError } = await supabase.from('rooms').insert({
    id,
    name: room.name,
    width_m: room.width,
    length_m: room.length,
    height_m: room.height,
  })
  if (roomError) {
    console.error(roomError)
    throw new Error('บันทึกห้องไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
  }
  if (items.length > 0) {
    const { error: itemsError } = await supabase.from('room_items').insert(
      items.map((it) => ({ room_id: id, product_id: it.productId, x: it.x, z: it.z, rotation_y: it.rotationY })),
    )
    if (itemsError) {
      console.error(itemsError)
      throw new Error('บันทึกเฟอร์นิเจอร์ในห้องไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
    }
  }
  return id
}

// โหลดห้องจากลิงก์แชร์ พร้อมข้อมูลสินค้าที่อยู่ในห้อง
export async function loadRoom(id) {
  if (!isSupabaseConfigured) throw new Error('ยังไม่ได้ตั้งค่าการเชื่อมต่อฐานข้อมูล')
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error('ลิงก์ห้องไม่ถูกต้อง')

  const { data: room, error } = await supabase
    .from('rooms')
    .select('id, name, width_m, length_m, height_m, created_at')
    .eq('id', id)
    .maybeSingle()
  if (error) {
    console.error(error)
    throw new Error('โหลดห้องไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
  }
  if (!room) throw new Error('ไม่พบห้องนี้ ลิงก์อาจไม่ถูกต้อง')

  const { data: items, error: itemsError } = await supabase
    .from('room_items')
    .select(`id, product_id, x, z, rotation_y, products (${PRODUCT_COLUMNS})`)
    .eq('room_id', id)
    .order('id')
  if (itemsError) {
    console.error(itemsError)
    throw new Error('โหลดเฟอร์นิเจอร์ในห้องไม่สำเร็จ')
  }
  const products = items.map((it) => it.products).filter(Boolean)
  return { room, items, products }
}

export function shareUrl(id) {
  return `${window.location.origin}/room/${id}`
}
