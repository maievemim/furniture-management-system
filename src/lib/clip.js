// AI ค้นหาด้วยรูป: แปลงรูปเป็นเวกเตอร์ 512 มิติด้วย CLIP (รันใน browser ไม่มีค่าใช้จ่าย)
// ใช้ทั้งหน้าแอดมิน (สร้าง embedding ของสินค้า) และหน้าค้นหาของลูกค้า
// ทั้งสองฝั่งต้องใช้โมเดลและ dtype เดียวกัน ไม่อย่างนั้นค่าความคล้ายจะเพี้ยน
// ไลบรารีถูกโหลดแบบ dynamic import เฉพาะตอนเรียกใช้ครั้งแรก (ไม่ทำให้หน้าอื่นช้า)

export const CLIP_MODEL = 'Xenova/clip-vit-base-patch32'
const DTYPE = 'q8' // ไฟล์โมเดลราว 90 MB โหลดครั้งแรกครั้งเดียว แล้ว browser เก็บแคชไว้

let loading = null
const listeners = new Set()
const files = {}

function report() {
  const list = Object.values(files)
  const loaded = list.reduce((a, f) => a + f.loaded, 0)
  const total = list.reduce((a, f) => a + f.total, 0)
  const percent = total > 0 ? Math.min(100, (loaded / total) * 100) : 0
  for (const fn of listeners) fn(percent)
}

// โหลดโมเดล (เรียกซ้ำได้ จะโหลดจริงแค่ครั้งเดียว) onProgress(0–100) ใช้แสดงแถบ "กำลังโหลด AI..."
export function loadClip(onProgress) {
  if (onProgress) listeners.add(onProgress)
  if (!loading) {
    loading = (async () => {
      const { AutoProcessor, CLIPVisionModelWithProjection, RawImage } = await import('@huggingface/transformers')
      const progress_callback = (info) => {
        if (info.status === 'progress' && info.total) {
          files[info.file] = { loaded: info.loaded, total: info.total }
          report()
        }
      }
      const [processor, model] = await Promise.all([
        AutoProcessor.from_pretrained(CLIP_MODEL, { progress_callback }),
        CLIPVisionModelWithProjection.from_pretrained(CLIP_MODEL, { dtype: DTYPE, progress_callback }),
      ])
      for (const fn of listeners) fn(100)
      return { processor, model, RawImage }
    })().catch((err) => {
      loading = null // ให้กดลองใหม่ได้
      throw err
    })
  }
  return loading.finally(() => onProgress && listeners.delete(onProgress))
}

// รูป (File/Blob หรือ URL) → array ตัวเลข 512 ค่า ที่ normalize แล้ว (ใช้ cosine similarity ได้ตรงๆ)
export async function imageToEmbedding(source, onProgress) {
  const { processor, model, RawImage } = await loadClip(onProgress)
  const image = typeof source === 'string' ? await RawImage.fromURL(source) : await RawImage.fromBlob(source)
  const inputs = await processor(await flattenOnWhite(image))
  const { image_embeds } = await model(inputs)
  const v = Array.from(image_embeds.data)
  const norm = Math.hypot(...v) || 1
  return v.map((x) => x / norm)
}

// รูปสินค้าเป็น .webp/.png พื้นโปร่งใส: วางบนพื้นขาวก่อน ให้ใกล้เคียงรูปถ่ายของลูกค้า
async function flattenOnWhite(image) {
  if (image.channels !== 4) return image
  const canvas = image.toCanvas()
  const out = document.createElement('canvas')
  out.width = canvas.width
  out.height = canvas.height
  const ctx = out.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, out.width, out.height)
  ctx.drawImage(canvas, 0, 0)
  const { RawImage } = await import('@huggingface/transformers')
  return RawImage.fromCanvas(out).rgb()
}
