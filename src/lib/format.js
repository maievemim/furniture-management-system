const bahtFormatter = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 })

// 12900 → "12,900 บาท"
export function formatBaht(value) {
  return `${bahtFormatter.format(Number(value) || 0)} บาท`
}

// 0.355 (เมตร) → "36 ซม.", 1.2 → "1.20 ม."
export function formatLength(meters) {
  const m = Number(meters) || 0
  if (m < 1) return `${Math.round(m * 100)} ซม.`
  return `${m.toFixed(2)} ม.`
}

// ขนาด ก×ล×ส ซม. เช่น "200 × 85 × 80 ซม."
export function formatDimensions({ width_cm, depth_cm, height_cm }) {
  const n = (v) => bahtFormatter.format(Number(v))
  // ใช้ non-breaking space ระหว่างตัวเลขกับหน่วย ไม่ให้ "ซม." ตกบรรทัดเดี่ยว
  return `${n(width_cm)} × ${n(depth_cm)} × ${n(height_cm)} ซม.`
}
