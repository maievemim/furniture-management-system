// คำนวณเรื่องตำแหน่งในห้อง หน่วยเป็นเมตร ห้องมีจุดศูนย์กลางที่ (0, 0) พื้นอยู่ที่ y = 0
// แกน X = ความกว้างห้อง, แกน Z = ความยาวห้อง

export const ROTATIONS = [0, 90, 180, 270]

// ขนาดฐาน (กว้าง, ลึก) ของสินค้าเป็นเมตร หลังหมุนแล้ว
export function footprint(product, rotationY = 0) {
  const w = Number(product.width_cm) / 100
  const d = Number(product.depth_cm) / 100
  return rotationY % 180 === 0 ? { w, d } : { w: d, d: w }
}

function clampAxis(value, roomSize, itemSize) {
  const limit = (roomSize - itemSize) / 2
  if (limit <= 0) return 0 // ชิ้นใหญ่กว่าห้อง: วางกลางห้อง
  return Math.min(limit, Math.max(-limit, value))
}

// บังคับให้เฟอร์นิเจอร์ทั้งชิ้นอยู่ในห้อง
export function clampToRoom({ x, z, rotationY }, product, room) {
  const { w, d } = footprint(product, rotationY)
  return {
    x: round(clampAxis(x, Number(room.width), w)),
    z: round(clampAxis(z, Number(room.length), d)),
  }
}

// หาตำแหน่งว่างสำหรับชิ้นใหม่ (ไล่จากกลางห้องออกไปทีละ 25 ซม.) ถ้าไม่มีที่ว่างก็วางกลางห้อง
export function findFreeSpot(product, room, placed) {
  const { w, d } = footprint(product, 0)
  const boxes = placed.map(({ item, product: p }) => {
    const f = footprint(p, item.rotationY)
    return { x: item.x, z: item.z, w: f.w, d: f.d }
  })
  const overlaps = (x, z) =>
    boxes.some((b) => Math.abs(b.x - x) < (b.w + w) / 2 && Math.abs(b.z - z) < (b.d + d) / 2)
  const step = 0.25
  const maxR = Math.ceil(Math.max(Number(room.width), Number(room.length)) / step)
  for (let r = 0; r <= maxR; r++) {
    for (let i = -r; i <= r; i++) {
      for (const [dx, dz] of [[i, -r], [i, r], [-r, i], [r, i]]) {
        const pos = clampToRoom({ x: dx * step, z: dz * step, rotationY: 0 }, product, room)
        if (!overlaps(pos.x, pos.z)) return pos
      }
    }
  }
  return clampToRoom({ x: 0, z: 0, rotationY: 0 }, product, room)
}

export function nextRotation(rotationY) {
  return (rotationY + 90) % 360
}

export function fitsInRoom(product, rotationY, room) {
  const { w, d } = footprint(product, rotationY)
  return w <= Number(room.width) && d <= Number(room.length) && Number(product.height_cm) / 100 <= Number(room.height)
}

// ปัดเป็นมิลลิเมตร เพื่อให้ตรงกับคอลัมน์ numeric(6,3)
function round(v) {
  return Math.round(v * 1000) / 1000
}
