import { supabase } from './supabase.js'

export const MAX_GLB_BYTES = 5 * 1024 * 1024
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const mb = (bytes) => (bytes / 1024 / 1024).toFixed(1)

// ตรวจไฟล์โมเดลก่อนอัปโหลด: นามสกุล .glb, ขนาดไม่เกิน 5 MB และ 4 ไบต์แรกต้องเป็น "glTF"
export async function validateGlb(file) {
  if (!file) return null
  if (!/\.glb$/i.test(file.name)) return 'ไฟล์โมเดลต้องเป็นนามสกุล .glb เท่านั้น'
  if (file.size > MAX_GLB_BYTES) return `ไฟล์โมเดลใหญ่เกิน 5 MB (ไฟล์นี้ ${mb(file.size)} MB) กรุณาบีบไฟล์ด้วย gltf-transform ก่อน`
  const head = new Uint8Array(await file.slice(0, 4).arrayBuffer())
  if (String.fromCharCode(...head) !== 'glTF') return 'ไฟล์นี้ไม่ใช่ไฟล์ .glb ที่ถูกต้อง'
  return null
}

export function validateImage(file) {
  if (!file) return null
  if (!IMAGE_TYPES.includes(file.type)) return 'รูปสินค้าต้องเป็น .jpg, .png หรือ .webp'
  if (file.size > MAX_IMAGE_BYTES) return `รูปสินค้าใหญ่เกิน 2 MB (ไฟล์นี้ ${mb(file.size)} MB)`
  return null
}

// อัปโหลดขึ้น bucket models โดยตั้งชื่อไฟล์ใหม่ทุกครั้ง (กัน browser แคชไฟล์เก่า)
export async function uploadToModels(folder, sku, file) {
  const ext = file.name.split('.').pop().toLowerCase()
  const path = `${folder}/${sku.toLowerCase().replace(/[^a-z0-9-]/g, '-')}-${Date.now()}.${ext}`
  const contentType = ext === 'glb' ? 'model/gltf-binary' : file.type
  const { error } = await supabase.storage.from('models').upload(path, file, { contentType, upsert: false })
  if (error) {
    console.error(error)
    throw new Error('อัปโหลดไฟล์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
  }
  return path
}

// ลบไฟล์เก่าแบบไม่บังคับ (ถ้าลบไม่ได้ก็ไม่ทำให้การบันทึกล้มเหลว)
export async function removeFromModels(paths) {
  const list = paths.filter((p) => p && !/^https?:\/\//.test(p))
  if (list.length === 0) return
  const { error } = await supabase.storage.from('models').remove(list)
  if (error) console.warn('ลบไฟล์เก่าไม่สำเร็จ', error)
}
