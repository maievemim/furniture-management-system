import { test, expect } from '@playwright/test'
import * as THREE from 'three'
import { TEMPLATES, buildTemplate } from '../src/lib/modelTemplates.js'

// กฎหลักของโครงงาน: ขนาดต้องเท่าของจริง → กรอบของโมเดลจากแม่แบบต้องเท่ากับ กว้าง × ลึก × สูง พอดี
// (ถ้าไม่เท่า Furniture.jsx จะยืดโมเดลให้พอดีจนสัดส่วนเพี้ยน) และก้นต้องแตะพื้น กึ่งกลางอยู่ที่ 0,0
test.describe.configure({ mode: 'parallel' })

const ODD_SIZES = [
  { width_cm: 40, depth_cm: 40, height_cm: 45 },
  { width_cm: 240, depth_cm: 60, height_cm: 200 },
]

function measure(group) {
  const box = new THREE.Box3().setFromObject(group)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  return { w: size.x * 100, h: size.y * 100, d: size.z * 100, minY: box.min.y * 100, cx: center.x * 100, cz: center.z * 100 }
}

for (const tpl of TEMPLATES) {
  test(`แม่แบบ "${tpl.label}" ได้ขนาดตรงกับที่กรอก`, () => {
    const variants = [{}]
    for (const o of tpl.options) {
      if (o.type === 'count') variants.push({ [o.key]: o.min }, { [o.key]: o.max })
      else for (const [v] of o.choices) variants.push({ [o.key]: v })
    }
    for (const dims of [tpl.sample, ...(tpl.id === 'bed' ? [] : ODD_SIZES)]) {
      for (const opts of variants) {
        const m = measure(buildTemplate(tpl.id, dims, opts))
        const label = `${tpl.id} ${JSON.stringify(dims)} ${JSON.stringify(opts)}`
        expect(Math.abs(m.w - dims.width_cm), `${label} กว้าง`).toBeLessThan(0.1)
        expect(Math.abs(m.d - dims.depth_cm), `${label} ลึก`).toBeLessThan(0.1)
        expect(Math.abs(m.h - dims.height_cm), `${label} สูง`).toBeLessThan(0.1)
        expect(Math.abs(m.minY), `${label} ก้นแตะพื้น`).toBeLessThan(0.1)
        expect(Math.abs(m.cx), `${label} กึ่งกลาง X`).toBeLessThan(0.1)
        expect(Math.abs(m.cz), `${label} กึ่งกลาง Z`).toBeLessThan(0.1)
      }
    }
  })
}

test('เตียงขนาดทั่วไป (3.5–6 ฟุต) ได้ขนาดตรง', () => {
  for (const dims of [
    { width_cm: 105, depth_cm: 200, height_cm: 90 },
    { width_cm: 180, depth_cm: 200, height_cm: 110 },
  ]) {
    const m = measure(buildTemplate('bed', dims))
    expect(Math.abs(m.w - dims.width_cm)).toBeLessThan(0.1)
    expect(Math.abs(m.d - dims.depth_cm)).toBeLessThan(0.1)
    expect(Math.abs(m.h - dims.height_cm)).toBeLessThan(0.1)
  }
})
