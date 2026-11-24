// โมเดลชามซุปเซรามิก 2 หู (BW-001) ขนาดจริง หน่วยเมตร
// ใช้ร่วมกันโดย scripts/bowl/export.html (สร้างไฟล์ .glb ผ่าน scripts/make-bowl.mjs)
import * as THREE from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

const cm = (v) => v / 100

// เส้นขอบด้านข้าง (รัศมี, ความสูง) ซม. วัดจากรูปถ่ายและตลับเมตร: ตัวชามกว้าง ~14 ซม. สูง ~8 ซม.
// ไล่จากก้นนอก → ผนังนอก → ขอบปาก → ผนังใน → พื้นใน
export const OUTER_WALL = [
  [5.35, 0.0],
  [5.7, 0.35],
  [6.45, 1.4],
  [6.85, 2.8],
  [6.95, 4.4],
  [6.85, 6.3],
  [6.72, 7.5],
  [6.68, 7.82],
]
const RIM_AND_INNER = [
  [6.55, 8.0],
  [6.38, 8.0],
  [6.28, 7.82],
  [6.26, 7.0],
  [6.38, 4.6],
  [6.12, 2.7],
  [5.3, 1.45],
  [3.6, 0.95],
  [0.0, 0.85],
]
// ก้นชาม: วงขอบไม่เคลือบ (สีเนื้อดิน)
const FOOT_RING = [
  [0.0, 0.28],
  [4.45, 0.28],
  [4.62, 0.0],
  [5.35, 0.0],
]

// รัศมีผนังนอกที่ความสูง h (ซม.)
function outerRadiusAt(h) {
  for (let i = 1; i < OUTER_WALL.length; i++) {
    const [r0, h0] = OUTER_WALL[i - 1]
    const [r1, h1] = OUTER_WALL[i]
    if (h <= h1) return r0 + ((r1 - r0) * (h - h0)) / (h1 - h0 || 1)
  }
  return OUTER_WALL[OUTER_WALL.length - 1][0]
}

function lathe(points, segments = 96) {
  return mergeVertices(new THREE.LatheGeometry(points.map(([r, h]) => new THREE.Vector2(cm(r), cm(h))), segments))
}

function handle(material, side) {
  const center = 6.7
  const radius = 1.85
  const tube = 0.48
  const arcDeg = 200
  const g = new THREE.TorusGeometry(cm(radius), cm(tube), 20, 48, THREE.MathUtils.degToRad(arcDeg))
  g.rotateZ(THREE.MathUtils.degToRad(-arcDeg / 2)) // ส่วนโค้งหันออกด้าน +X
  g.scale(1, 1, 1.35) // หูจับแบน กว้างกว่าหนา
  const m = new THREE.Mesh(g, material)
  m.name = side > 0 ? 'หูจับขวา' : 'หูจับซ้าย'
  m.position.set(side * cm(center), cm(4.5), 0)
  if (side < 0) m.rotation.y = Math.PI
  return m
}

// แผ่นลายที่ห่อตามผิวชาม (ลอยจากผิว 0.25 มม.) ครอบมุม tRange (องศา) และความสูง hRange (ซม.)
// facing = 0 คือด้านหน้า (+Z) · 180 คือด้านหลัง · ภาพลายแนวนอนไล่ตามมุม แนวตั้งไล่ตามความสูง
function decalBand(texture, facing, tRange, hRange, name) {
  const cols = 72
  const rows = 40
  const pos = []
  const uv = []
  const idx = []
  for (let j = 0; j <= rows; j++) {
    const h = hRange[0] + ((hRange[1] - hRange[0]) * j) / rows
    const r = cm(outerRadiusAt(h) + 0.025)
    for (let i = 0; i <= cols; i++) {
      const t = tRange[0] + ((tRange[1] - tRange[0]) * i) / cols
      const phi = THREE.MathUtils.degToRad(facing + t)
      pos.push(r * Math.sin(phi), cm(h), r * Math.cos(phi))
      uv.push(i / cols, j / rows)
    }
  }
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const a = j * (cols + 1) + i
      const b = a + 1
      const c = a + cols + 1
      const d = c + 1
      idx.push(a, b, d, a, d, c)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  const mat = new THREE.MeshStandardMaterial({
    name: `ลาย${name}`,
    map: texture,
    transparent: true,
    depthWrite: false,
    roughness: 0.3,
    metalness: 0,
  })
  const mesh = new THREE.Mesh(g, mat)
  mesh.name = `ลาย${name}`
  return mesh
}

// คืน THREE.Group ของชาม · decals = { front, back } เป็น THREE.Texture (ไม่ใส่ = ชามขาวเรียบ)
// มุมและความสูงของลายต้องตรงกับค่าที่ใช้คลี่ลายจากรูปถ่าย (assets/custom/decals/)
export function buildBowl({ decals } = {}) {
  const glaze = new THREE.MeshStandardMaterial({ name: 'เซรามิกเคลือบขาว', color: 0xf3efe7, roughness: 0.22, metalness: 0, side: THREE.DoubleSide })
  const bisque = new THREE.MeshStandardMaterial({ name: 'ขอบก้นไม่เคลือบ', color: 0xd6c6a8, roughness: 0.9, metalness: 0, side: THREE.DoubleSide })

  const bowl = new THREE.Group()
  bowl.name = 'ชามซุป 2 หู'
  const body = new THREE.Mesh(lathe([...OUTER_WALL, ...RIM_AND_INNER]), glaze)
  body.name = 'ตัวชาม'
  const foot = new THREE.Mesh(lathe(FOOT_RING), bisque)
  foot.name = 'ขอบก้น'
  bowl.add(body, foot, handle(glaze, 1), handle(glaze, -1))

  if (decals?.front) bowl.add(decalBand(decals.front, 0, [-74, 46], [0.5, 7.3], 'ด้านหน้า'))
  if (decals?.back) bowl.add(decalBand(decals.back, 180, [-28, 44], [0.2, 6.5], 'ด้านหลัง'))
  return bowl
}
