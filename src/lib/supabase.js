import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

// ถ้ายังไม่ได้ตั้ง env ให้ client เป็น null แล้วหน้าเว็บแสดงข้อความแจ้ง แทนที่จะพังทั้งแอป
export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null

// แปลง model_path ใน bucket "models" เป็น URL สาธารณะ
export function publicModelUrl(path) {
  if (!path || !supabase) return null
  if (/^https?:\/\//.test(path)) return path
  return supabase.storage.from('models').getPublicUrl(path).data.publicUrl
}
