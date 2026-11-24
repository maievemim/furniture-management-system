// แม่แบบเฟอร์นิเจอร์พื้นฐาน: สร้างโมเดล 3D จากขนาดจริง (ซม.) โดยไม่ต้องมีไฟล์ .glb
// - หน่วยในฉาก = เมตร, ก้นโมเดลอยู่ที่ y = 0, กึ่งกลางอยู่ที่ x = z = 0
// - ด้านหน้าของเฟอร์นิเจอร์หันไปทาง +Z (ตรงกับที่ Furniture.jsx และ AR ใช้)
// - กรอบรอบโมเดล (bounding box) ต้องเท่ากับ กว้าง × สูง × ลึก พอดี เพื่อไม่ให้ถูกยืดตอนวางในห้อง
// ใช้ได้ทั้งในเบราว์เซอร์ (หน้าแอดมิน) และใน Node (test) ลายไม้จะสร้างเฉพาะเมื่อมี document
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

import { COLORS, TEMPLATES, defaultOptions, templateById } from './templateCatalog.js'

export { COLORS, TEMPLATES, defaultOptions, templateById }

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

// ---------- วัสดุ ----------
let woodCache = {}
function woodTexture(hex) {
  if (typeof document === 'undefined') return null
  if (woodCache[hex]) return woodCache[hex]
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')
  const base = new THREE.Color(hex)
  g.fillStyle = `#${base.getHexString()}`
  g.fillRect(0, 0, 256, 256)
  // ลายเสี้ยนไม้แนวนอนแบบสุ่มแต่คงที่ (seed) ให้ทุกครั้งได้หน้าตาเดิม
  let seed = 7
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  for (let i = 0; i < 70; i++) {
    const y = rnd() * 256
    const dark = rnd() < 0.6
    g.strokeStyle = dark ? 'rgba(60,35,15,0.10)' : 'rgba(255,240,220,0.08)'
    g.lineWidth = 0.6 + rnd() * 2.2
    g.beginPath()
    g.moveTo(0, y)
    for (let x = 0; x <= 256; x += 16) g.lineTo(x, y + Math.sin((x / 256) * Math.PI * (1 + rnd())) * 3)
    g.stroke()
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  woodCache[hex] = t
  return t
}

function material(colorKey, name) {
  const c = COLORS[colorKey] ?? COLORS.oak
  const roughness = c.kind === 'fabric' ? 0.95 : c.kind === 'wood' ? 0.6 : 0.45
  const map = c.kind === 'wood' ? woodTexture(c.hex) : null
  return new THREE.MeshStandardMaterial({
    name: `${name} (${c.label})`,
    color: map ? 0xffffff : c.hex,
    map,
    roughness,
    metalness: 0,
  })
}

// ---------- ชิ้นส่วน ----------
// กล่องจากมุมต่ำสุด (x0,y0,z0) ถึงมุมสูงสุด (x1,y1,z1) หน่วยเมตร
function box(mat, x0, y0, z0, x1, y1, z1, { radius = 0, name } = {}) {
  const w = Math.max(x1 - x0, 0.001)
  const h = Math.max(y1 - y0, 0.001)
  const d = Math.max(z1 - z0, 0.001)
  const r = Math.min(radius, w / 2, h / 2, d / 2)
  const geo = r > 0.002 ? new RoundedBoxGeometry(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d)
  const m = new THREE.Mesh(geo, mat)
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)
  if (name) m.name = name
  m.castShadow = true
  m.receiveShadow = true
  return m
}

function cylinder(mat, rx, rz, y0, y1, x = 0, z = 0, name) {
  const g = new THREE.CylinderGeometry(1, 1, Math.max(y1 - y0, 0.001), 48)
  const m = new THREE.Mesh(g, mat)
  m.scale.set(rx, 1, rz)
  m.position.set(x, (y0 + y1) / 2, z)
  if (name) m.name = name
  m.castShadow = true
  return m
}

// ขา 4 ขา (สี่เหลี่ยม) ชิดมุมด้านใน inset
function fourLegs(mat, W, D, h, size, inset, top = 0) {
  const xs = [-W / 2 + inset, W / 2 - inset - size]
  const zs = [-D / 2 + inset, D / 2 - inset - size]
  const legs = []
  for (const x of xs) for (const z of zs) legs.push(box(mat, x, top, z, x + size, top + h, z + size, { name: 'ขา' }))
  return legs
}

// ---------- แม่แบบ ----------
function cabinet(W, D, H, o, mats, frontTexture) {
  const g = []
  const legH = clamp(H * 0.08, 0.04, 0.12)
  const legS = clamp(Math.min(W, D) * 0.06, 0.025, 0.05)
  const handleD = 0.02 // มือจับยื่นออกมา 2 ซม. → ตัวตู้ลึก D - 2 ซม.
  const zFront = D / 2 - handleD
  g.push(...fourLegs(mats.accent, W, D - handleD, legH, legS, 0.02).map((m) => (m.position.z -= handleD / 2, m)))
  g.push(box(mats.body, -W / 2, legH, -D / 2, W / 2, H, zFront, { name: 'ตัวตู้' }))
  const gap = 0.004
  const inner = { x0: -W / 2 + 0.015, x1: W / 2 - 0.015, y0: legH + 0.015, y1: H - 0.015 }

  if (frontTexture) {
    // ใช้รูปถ่ายหน้าตู้แทนบาน/ลิ้นชัก
    frontTexture.colorSpace = THREE.SRGBColorSpace
    const mat = new THREE.MeshStandardMaterial({ name: 'หน้าตู้ (รูปถ่าย)', map: frontTexture, roughness: 0.6 })
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(W, H - legH), mat)
    plane.position.set(0, (H + legH) / 2, zFront + 0.001)
    plane.name = 'หน้าตู้'
    g.push(plane)
    // มือจับบางๆ กลางตู้ให้กรอบลึกครบ D และให้รู้ว่าเป็นตู้เปิดได้
    g.push(box(mats.accent, -0.01, (H + legH) / 2 - 0.06, zFront, 0.01, (H + legH) / 2 + 0.06, D / 2, { name: 'มือจับ' }))
    return g
  }

  const n = clamp(Math.round(o.count ?? 2), 1, 6)
  const panelT = 0.012
  for (let i = 0; i < n; i++) {
    let x0 = inner.x0, x1 = inner.x1, y0 = inner.y0, y1 = inner.y1
    let hx, hy, hw, hh
    if (o.front === 'drawers') {
      const step = (inner.y1 - inner.y0) / n
      y0 = inner.y0 + step * i + gap / 2
      y1 = y0 + step - gap
      hw = clamp((x1 - x0) * 0.25, 0.06, 0.2); hh = 0.02
      hx = -hw / 2; hy = (y0 + y1) / 2 - hh / 2
    } else {
      const step = (inner.x1 - inner.x0) / n
      x0 = inner.x0 + step * i + gap / 2
      x1 = x0 + step - gap
      hw = 0.02; hh = clamp((y1 - y0) * 0.18, 0.06, 0.25)
      // มือจับอยู่ฝั่งที่ชิดบานข้างเคียง (บานซ้ายจับขวา บานขวาจับซ้าย)
      const leftSide = n > 1 && i >= n / 2
      hx = leftSide ? x0 + 0.03 : x1 - 0.03 - hw
      hy = (y0 + y1) / 2 - hh / 2
    }
    g.push(box(mats.body, x0, y0, zFront - 0.001, x1, y1, zFront + panelT - 0.001, { name: o.front === 'drawers' ? 'ลิ้นชัก' : 'บานตู้' }))
    g.push(box(mats.accent, hx, hy, zFront + panelT - 0.002, hx + hw, hy + hh, D / 2, { name: 'มือจับ' }))
  }
  return g
}

function shelf(W, D, H, o, mats) {
  const g = []
  const t = clamp(Math.min(W, H) * 0.02, 0.015, 0.025)
  const n = clamp(Math.round(o.count ?? 5), 2, 8)
  g.push(box(mats.accent, -W / 2, 0, -D / 2, -W / 2 + t, H, D / 2, { name: 'แผ่นข้าง' }))
  g.push(box(mats.accent, W / 2 - t, 0, -D / 2, W / 2, H, D / 2, { name: 'แผ่นข้าง' }))
  const kick = 0.04 // ชั้นล่างสุดยกจากพื้นเล็กน้อย
  for (let i = 0; i < n; i++) {
    const y = kick + ((H - kick - t) * i) / (n - 1)
    g.push(box(mats.body, -W / 2 + t, y, -D / 2, W / 2 - t, y + t, D / 2 - 0.005, { name: 'ชั้น' }))
  }
  if (o.back !== 'no') g.push(box(mats.body, -W / 2 + t, kick, -D / 2, W / 2 - t, H - 0.002, -D / 2 + 0.006, { name: 'แผ่นหลัง' }))
  return g
}

function table(W, D, H, o, mats) {
  const g = []
  const topT = clamp(H * 0.045, 0.02, 0.05)
  const legS = clamp(Math.min(W, D) * 0.06, 0.035, 0.07)
  const inset = clamp(Math.min(W, D) * 0.05, 0.02, 0.06)
  g.push(box(mats.body, -W / 2, H - topT, -D / 2, W / 2, H, D / 2, { radius: 0.006, name: 'ท็อปโต๊ะ' }))
  g.push(...fourLegs(mats.accent, W, D, H - topT, legS, inset))
  if (o.apron !== 'no') {
    const a = clamp(H * 0.1, 0.05, 0.1)
    const ax0 = -W / 2 + inset + legS * 0.3, ax1 = W / 2 - inset - legS * 0.3
    const az0 = -D / 2 + inset + legS * 0.3, az1 = D / 2 - inset - legS * 0.3
    const th = 0.02
    g.push(box(mats.accent, ax0, H - topT - a, az1 - th, ax1, H - topT, az1, { name: 'คาน' }))
    g.push(box(mats.accent, ax0, H - topT - a, az0, ax1, H - topT, az0 + th, { name: 'คาน' }))
    g.push(box(mats.accent, ax0, H - topT - a, az0, ax0 + th, H - topT, az1, { name: 'คาน' }))
    g.push(box(mats.accent, ax1 - th, H - topT - a, az0, ax1, H - topT, az1, { name: 'คาน' }))
  }
  return g
}

function round(W, D, H, o, mats) {
  const g = []
  const rx = W / 2
  const rz = D / 2
  const topT = clamp(H * 0.045, 0.02, 0.045)
  g.push(cylinder(mats.body, rx, rz, H - topT, H, 0, 0, 'ท็อปกลม'))
  if (o.base === 'legs') {
    const s = clamp(Math.min(W, D) * 0.06, 0.025, 0.05)
    for (const a of [45, 135, 225, 315]) {
      const r = THREE.MathUtils.degToRad(a)
      const x = Math.cos(r) * rx * 0.62
      const z = Math.sin(r) * rz * 0.62
      g.push(box(mats.accent, x - s / 2, 0, z - s / 2, x + s / 2, H - topT, z + s / 2, { name: 'ขา' }))
    }
  } else {
    const post = Math.min(rx, rz) * 0.12
    const baseR = 0.55
    g.push(cylinder(mats.accent, rx * baseR, rz * baseR, 0, 0.025, 0, 0, 'ฐาน'))
    g.push(cylinder(mats.accent, post, post, 0.025, H - topT, 0, 0, 'เสา'))
  }
  return g
}

function chair(W, D, H, o, mats) {
  const g = []
  const seatH = clamp(H * 0.5, 0.3, 0.5)
  const seatT = clamp(H * 0.06, 0.04, 0.07)
  const legS = clamp(W * 0.08, 0.025, 0.045)
  const backT = clamp(D * 0.08, 0.03, 0.05)
  // ขาหน้า 2 ขา + เสาหลัง 2 ต้นสูงถึงพนัก
  g.push(box(mats.accent, -W / 2, 0, D / 2 - legS, -W / 2 + legS, seatH - seatT, D / 2, { name: 'ขา' }))
  g.push(box(mats.accent, W / 2 - legS, 0, D / 2 - legS, W / 2, seatH - seatT, D / 2, { name: 'ขา' }))
  g.push(box(mats.accent, -W / 2, 0, -D / 2, -W / 2 + legS, H, -D / 2 + legS, { name: 'เสาพนัก' }))
  g.push(box(mats.accent, W / 2 - legS, 0, -D / 2, W / 2, H, -D / 2 + legS, { name: 'เสาพนัก' }))
  g.push(box(mats.body, -W / 2, seatH - seatT, -D / 2 + legS * 0.5, W / 2, seatH, D / 2, { radius: 0.012, name: 'เบาะนั่ง' }))
  g.push(box(mats.body, -W / 2 + legS, seatH + 0.06, -D / 2, W / 2 - legS, H - 0.01, -D / 2 + backT, { radius: 0.01, name: 'พนักพิง' }))
  return g
}

function sofa(W, D, H, o, mats) {
  const g = []
  const n = clamp(Math.round(o.count ?? 3), 1, 4)
  const legH = clamp(H * 0.1, 0.04, 0.12)
  const legS = 0.04
  const armW = clamp(W * 0.09, 0.1, 0.2)
  const backT = clamp(D * 0.22, 0.15, 0.25)
  const baseTop = clamp(H * 0.38, 0.2, 0.36)
  const cushionT = clamp(H * 0.12, 0.08, 0.14)
  const armH = clamp(H * 0.75, baseTop + cushionT + 0.05, H - 0.05)
  g.push(...fourLegs(mats.accent, W, D, legH, legS, 0.05))
  g.push(box(mats.body, -W / 2, legH, -D / 2, W / 2, baseTop, D / 2, { radius: 0.02, name: 'ฐานโซฟา' }))
  g.push(box(mats.body, -W / 2, legH, -D / 2, -W / 2 + armW, armH, D / 2, { radius: 0.035, name: 'ที่วางแขน' }))
  g.push(box(mats.body, W / 2 - armW, legH, -D / 2, W / 2, armH, D / 2, { radius: 0.035, name: 'ที่วางแขน' }))
  g.push(box(mats.body, -W / 2 + armW, baseTop, -D / 2, W / 2 - armW, H, -D / 2 + backT, { radius: 0.04, name: 'พนักพิง' }))
  // เบาะนั่งแยกตามจำนวนที่นั่ง
  const x0 = -W / 2 + armW
  const step = (W - armW * 2) / n
  for (let i = 0; i < n; i++) {
    g.push(
      box(mats.body, x0 + step * i + 0.004, baseTop, -D / 2 + backT, x0 + step * (i + 1) - 0.004, baseTop + cushionT, D / 2 - 0.01, {
        radius: 0.035,
        name: 'เบาะ',
      }),
    )
  }
  return g
}

function bed(W, D, H, o, mats) {
  const g = []
  const legH = clamp(H * 0.08, 0.05, 0.1)
  const frameTop = clamp(H * 0.3, 0.22, 0.35)
  const headT = clamp(D * 0.035, 0.05, 0.08)
  const mattressT = clamp(H * 0.22, 0.15, 0.25)
  g.push(...fourLegs(mats.body, W, D, legH, 0.05, 0.04))
  g.push(box(mats.body, -W / 2, legH, -D / 2 + headT, W / 2, frameTop, D / 2, { radius: 0.01, name: 'โครงเตียง' }))
  g.push(box(mats.body, -W / 2, 0, -D / 2, W / 2, H, -D / 2 + headT, { radius: 0.015, name: 'หัวเตียง' }))
  const fabric = new THREE.MeshStandardMaterial({ name: 'ที่นอน', color: '#f4f1ec', roughness: 0.95 })
  g.push(box(fabric, -W / 2 + 0.03, frameTop, -D / 2 + headT, W / 2 - 0.03, frameTop + mattressT, D / 2 - 0.03, { radius: 0.04, name: 'ที่นอน' }))
  // ผ้าห่มคลุมครึ่งล่าง + หมอน 1–2 ใบตามความกว้าง
  g.push(box(mats.accent, -W / 2 + 0.02, frameTop + mattressT * 0.5, -D / 2 + headT + D * 0.42, W / 2 - 0.02, frameTop + mattressT + 0.02, D / 2 - 0.02, { radius: 0.03, name: 'ผ้าห่ม' }))
  const pillows = W >= 1.2 ? 2 : 1
  const pw = (W - 0.16) / pillows
  for (let i = 0; i < pillows; i++) {
    const px = -W / 2 + 0.08 + pw * i
    g.push(box(fabric, px + 0.02, frameTop + mattressT, -D / 2 + headT + 0.06, px + pw - 0.02, frameTop + mattressT + 0.12, -D / 2 + headT + 0.06 + 0.4, { radius: 0.05, name: 'หมอน' }))
  }
  return g
}

const BUILDERS = { cabinet, shelf, table, round, chair, sofa, bed }

// สร้าง THREE.Group ตามแม่แบบ · dims เป็น ซม. · colors = { body, accent } (คีย์ใน COLORS)
export function buildTemplate(templateId, dims, options = {}, colors = {}, frontTexture = null) {
  const tpl = templateById(templateId)
  if (!tpl) throw new Error('ไม่พบแม่แบบนี้')
  const W = Number(dims.width_cm) / 100
  const D = Number(dims.depth_cm) / 100
  const H = Number(dims.height_cm) / 100
  const opts = { ...defaultOptions(templateId), ...options }
  const mats = {
    body: material(colors.body ?? tpl.colors.body, 'วัสดุหลัก'),
    accent: material(colors.accent ?? tpl.colors.accent, 'วัสดุรอง'),
  }
  const group = new THREE.Group()
  group.name = tpl.label
  for (const part of BUILDERS[templateId](W, D, H, opts, mats, frontTexture)) group.add(part)
  return group
}

// ---------- ส่งออกเป็นไฟล์ (เบราว์เซอร์เท่านั้น) ----------

// สร้างไฟล์ทั้งหมดจากค่าที่เลือกในหน้าแอดมิน: { glb: File, thumbnail: File }
// value = { templateId, options, colors, frontFile } · dims เป็น ซม.
export async function createTemplateAssets(value, dims, baseName = 'model') {
  let frontTexture = null
  if (value.templateId === 'cabinet' && value.frontFile) {
    const url = URL.createObjectURL(value.frontFile)
    try {
      frontTexture = await new THREE.TextureLoader().loadAsync(url)
    } finally {
      URL.revokeObjectURL(url)
    }
  }
  const group = buildTemplate(value.templateId, dims, value.options, value.colors, frontTexture)
  const glb = await exportGlb(group, `${baseName}.glb`)
  const thumbnail = await renderThumbnail(group)
  return { glb, thumbnail }
}

// โมเดล → ไฟล์ .glb (File) สำหรับอัปโหลดเหมือนไฟล์ที่แอดมินเลือกเอง
export async function exportGlb(group, filename = 'model.glb') {
  const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js')
  const scene = new THREE.Scene()
  scene.add(group.clone(true))
  const glb = await new GLTFExporter().parseAsync(scene, { binary: true })
  return new File([glb], filename, { type: 'model/gltf-binary' })
}

// โมเดล → รูปสินค้าพื้นหลังโปร่งใส (File .webp หรือ .png ถ้าเบราว์เซอร์ไม่รองรับ webp)
export async function renderThumbnail(group, size = 800) {
  const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js')
  const canvas = document.createElement('canvas')
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true })
  try {
    renderer.setSize(size, size, false)
    renderer.setClearColor(0x000000, 0)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.85 // ให้สีในรูปใกล้สีที่เลือก (แสงห้องจำลองค่อนข้างสว่าง)
    const scene = new THREE.Scene()
    const pmrem = new THREE.PMREMGenerator(renderer)
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    const sun = new THREE.DirectionalLight(0xffffff, 1.2)
    sun.position.set(2, 4, 3)
    scene.add(sun)
    const model = group.clone(true)
    scene.add(model)
    const camera = fitCamera(model, 1)
    renderer.render(scene, camera)
    pmrem.dispose()
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/webp', 0.9))
    const type = blob?.type === 'image/webp' ? 'image/webp' : 'image/png'
    const finalBlob = type === 'image/webp' ? blob : await new Promise((r) => canvas.toBlob(r, 'image/png'))
    return new File([finalBlob], type === 'image/webp' ? 'thumb.webp' : 'thumb.png', { type })
  } finally {
    renderer.dispose()
  }
}

// กล้องมุมเฉียงหน้า-ขวา มองลงเล็กน้อย ให้เห็นโมเดลเต็มเฟรม
export function fitCamera(object, aspect) {
  const box = new THREE.Box3().setFromObject(object)
  const sphere = box.getBoundingSphere(new THREE.Sphere())
  const camera = new THREE.PerspectiveCamera(30, aspect, 0.01, 100)
  const dist = (sphere.radius / Math.sin(THREE.MathUtils.degToRad(15))) * 1.02
  const az = THREE.MathUtils.degToRad(32)
  const el = THREE.MathUtils.degToRad(18)
  camera.position.set(
    sphere.center.x + dist * Math.sin(az) * Math.cos(el),
    sphere.center.y + dist * Math.sin(el),
    sphere.center.z + dist * Math.cos(az) * Math.cos(el),
  )
  camera.lookAt(sphere.center)
  return camera
}
