import { create } from 'zustand'
import { clampToRoom, findFreeSpot, nextRotation } from '../lib/geometry.js'

export const DEFAULT_ROOM = { name: 'ห้องของฉัน', width: 4, length: 5, height: 2.7 }
export const ROOM_LIMITS = {
  width: { min: 1, max: 30 },
  length: { min: 1, max: 30 },
  height: { min: 2, max: 6 },
}

let uidCounter = 0
const newUid = () => `item-${Date.now().toString(36)}-${(uidCounter++).toString(36)}`

// products: แคชข้อมูลสินค้าจากฐานข้อมูล (id → product) ใช้ทั้งขนาดและราคา
// items: เก็บเฉพาะ productId + ตำแหน่ง ห้ามเก็บราคา (ราคาดึงจาก products เสมอ)
export const useRoomStore = create((set, get) => ({
  room: { ...DEFAULT_ROOM },
  items: [],
  selectedUid: null,
  products: {},
  dragging: false,
  savedRoomId: null, // id ของห้องที่บันทึกล่าสุด (ถ้ายังไม่แก้ไขอะไรหลังบันทึก)

  setProducts: (list) =>
    set((s) => ({ products: { ...s.products, ...Object.fromEntries(list.map((p) => [p.id, p])) } })),

  setRoom: (patch) =>
    set((s) => {
      const room = { ...s.room, ...patch }
      // ห้องเล็กลง: ดันเฟอร์นิเจอร์ทุกชิ้นกลับเข้ามาในห้อง
      const items = s.items.map((it) => {
        const product = s.products[it.productId]
        return product ? { ...it, ...clampToRoom(it, product, room) } : it
      })
      return { room, items, savedRoomId: null }
    }),

  addItem: (productId) => {
    const product = get().products[productId]
    if (!product) return
    const uid = newUid()
    set((s) => ({
      items: [
        ...s.items,
        {
          uid,
          productId,
          ...findFreeSpot(
            product,
            s.room,
            s.items.map((item) => ({ item, product: s.products[item.productId] })).filter((x) => x.product),
          ),
          rotationY: 0,
        },
      ],
      selectedUid: uid,
      savedRoomId: null,
    }))
  },

  // ระหว่างลาก: ขยับตามเมาส์ (ยังกันไม่ให้หลุดนอกห้อง)
  moveItem: (uid, x, z) =>
    set((s) => ({
      items: s.items.map((it) => {
        if (it.uid !== uid) return it
        const product = s.products[it.productId]
        return { ...it, ...clampToRoom({ ...it, x, z }, product, s.room) }
      }),
      savedRoomId: null,
    })),

  // ปล่อยเมาส์: clamp อีกครั้งเพื่อยืนยันตำแหน่งสุดท้าย
  commitItem: (uid) =>
    set((s) => ({
      items: s.items.map((it) =>
        it.uid === uid ? { ...it, ...clampToRoom(it, s.products[it.productId], s.room) } : it,
      ),
    })),

  rotateItem: (uid) =>
    set((s) => ({
      items: s.items.map((it) => {
        if (it.uid !== uid) return it
        const rotationY = nextRotation(it.rotationY)
        return { ...it, rotationY, ...clampToRoom({ ...it, rotationY }, s.products[it.productId], s.room) }
      }),
      savedRoomId: null,
    })),

  removeItem: (uid) =>
    set((s) => ({
      items: s.items.filter((it) => it.uid !== uid),
      selectedUid: s.selectedUid === uid ? null : s.selectedUid,
      savedRoomId: null,
    })),

  select: (uid) => set({ selectedUid: uid }),
  setDragging: (dragging) => set({ dragging }),
  markSaved: (id) => set({ savedRoomId: id }),

  // โหลดห้องที่บันทึกไว้ (จากลิงก์แชร์)
  loadRoom: (room, roomItems, products) => {
    get().setProducts(products)
    set({
      room: { name: room.name, width: Number(room.width_m), length: Number(room.length_m), height: Number(room.height_m) },
      items: roomItems.map((ri) => ({
        uid: newUid(),
        productId: ri.product_id,
        x: Number(ri.x),
        z: Number(ri.z),
        rotationY: Number(ri.rotation_y),
      })),
      selectedUid: null,
      savedRoomId: room.id,
    })
  },

  reset: () => set({ room: { ...DEFAULT_ROOM }, items: [], selectedUid: null, savedRoomId: null }),
}))

// สรุปราคารวม (BOM): จัดกลุ่มตามสินค้า × ราคาในฐานข้อมูล
// ใช้กับ useMemo (ห้ามใช้เป็น selector ของ zustand โดยตรง เพราะคืน object ใหม่ทุกครั้ง)
export function computeBom(items, products) {
  const rows = new Map()
  for (const it of items) {
    const p = products[it.productId]
    if (!p) continue
    const row = rows.get(p.id) ?? { id: p.id, sku: p.sku, name: p.name, price: Number(p.price), qty: 0 }
    row.qty += 1
    rows.set(p.id, row)
  }
  const list = [...rows.values()].map((r) => ({ ...r, subtotal: r.price * r.qty }))
  return { rows: list, total: list.reduce((sum, r) => sum + r.subtotal, 0), count: items.length }
}
