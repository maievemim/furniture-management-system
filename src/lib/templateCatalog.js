// รายการแม่แบบเฟอร์นิเจอร์และสีวัสดุ (ข้อมูลล้วน ไม่มี three.js จึง import จากฟอร์มได้โดยไม่ทำให้หน้าโหลดช้า)
// รูปทรงจริงสร้างใน src/lib/modelTemplates.js

export const COLORS = {
  oak: { label: 'ไม้อ่อน', hex: '#c9a37b', kind: 'wood' },
  walnut: { label: 'ไม้เข้ม', hex: '#6e4b33', kind: 'wood' },
  white: { label: 'ขาว', hex: '#f1ede6', kind: 'paint' },
  black: { label: 'ดำ', hex: '#2e2a27', kind: 'paint' },
  grey: { label: 'เทา', hex: '#9b968f', kind: 'paint' },
  beige: { label: 'ผ้าเบจ', hex: '#d9ccb7', kind: 'fabric' },
  stone: { label: 'ผ้าเทา', hex: '#8e8a85', kind: 'fabric' },
  navy: { label: 'ผ้ากรมท่า', hex: '#3d4d68', kind: 'fabric' },
  green: { label: 'ผ้าเขียว', hex: '#6f7b5c', kind: 'fabric' },
}

// option ของแต่ละแม่แบบ: type = 'count' (ตัวเลข) หรือ 'choice' (ตัวเลือก)
export const TEMPLATES = [
  {
    id: 'cabinet',
    label: 'ตู้ / ลิ้นชัก',
    hint: 'ตู้เสื้อผ้า ตู้ลิ้นชัก ตู้วางทีวี ตู้ข้างเตียง',
    sample: { width_cm: 80, depth_cm: 45, height_cm: 120 },
    colors: { body: 'oak', accent: 'black' },
    options: [
      { key: 'front', label: 'หน้าตู้', type: 'choice', choices: [['doors', 'บานเปิด'], ['drawers', 'ลิ้นชัก']], default: 'doors' },
      { key: 'count', label: 'จำนวนบาน/ลิ้นชัก', type: 'count', min: 1, max: 6, default: 2 },
    ],
    frontImage: true,
  },
  {
    id: 'shelf',
    label: 'ชั้นวาง',
    hint: 'ชั้นหนังสือ ชั้นโชว์ ชั้นวางของ',
    sample: { width_cm: 80, depth_cm: 30, height_cm: 180 },
    colors: { body: 'oak', accent: 'oak' },
    options: [
      { key: 'count', label: 'จำนวนชั้น', type: 'count', min: 2, max: 8, default: 5 },
      { key: 'back', label: 'แผ่นหลัง', type: 'choice', choices: [['yes', 'มี'], ['no', 'ไม่มี']], default: 'yes' },
    ],
  },
  {
    id: 'table',
    label: 'โต๊ะ 4 ขา',
    hint: 'โต๊ะกลาง โต๊ะทำงาน โต๊ะอาหาร',
    sample: { width_cm: 120, depth_cm: 60, height_cm: 75 },
    colors: { body: 'oak', accent: 'black' },
    options: [
      { key: 'apron', label: 'คานใต้โต๊ะ', type: 'choice', choices: [['yes', 'มี'], ['no', 'ไม่มี']], default: 'yes' },
    ],
  },
  {
    id: 'round',
    label: 'โต๊ะกลม / สตูล',
    hint: 'โต๊ะกลม โต๊ะข้าง สตูล (กว้างกับลึกต่างกันได้ จะเป็นวงรี)',
    sample: { width_cm: 80, depth_cm: 80, height_cm: 74 },
    colors: { body: 'white', accent: 'oak' },
    options: [
      { key: 'base', label: 'ขา', type: 'choice', choices: [['pedestal', 'เสาเดี่ยว'], ['legs', '4 ขา']], default: 'pedestal' },
    ],
  },
  {
    id: 'chair',
    label: 'เก้าอี้',
    hint: 'เก้าอี้ทานอาหาร เก้าอี้ทำงานแบบมีพนัก',
    sample: { width_cm: 45, depth_cm: 52, height_cm: 90 },
    colors: { body: 'beige', accent: 'walnut' },
    options: [],
  },
  {
    id: 'sofa',
    label: 'โซฟา',
    hint: 'โซฟาทรงเหลี่ยม 1–4 ที่นั่ง',
    sample: { width_cm: 200, depth_cm: 90, height_cm: 80 },
    colors: { body: 'beige', accent: 'walnut' },
    options: [{ key: 'count', label: 'จำนวนที่นั่ง', type: 'count', min: 1, max: 4, default: 3 }],
  },
  {
    id: 'bed',
    label: 'เตียง',
    hint: 'เตียงมีหัวเตียง (หัวเตียงอยู่ด้านหลัง)',
    sample: { width_cm: 160, depth_cm: 210, height_cm: 100 },
    colors: { body: 'oak', accent: 'beige' },
    options: [],
  },
]

export const templateById = (id) => TEMPLATES.find((t) => t.id === id)

export function defaultOptions(templateId) {
  return Object.fromEntries(templateById(templateId).options.map((o) => [o.key, o.default]))
}


// ค่าเริ่มต้นของตัวสร้างโมเดล (ใช้ใน ProductForm)
export function initialTemplateValue(templateId = 'cabinet') {
  const tpl = templateById(templateId)
  return { templateId, options: defaultOptions(templateId), colors: { ...tpl.colors }, frontFile: null }
}

export function dimsReady(dims) {
  return ['width_cm', 'depth_cm', 'height_cm'].every((k) => {
    const v = Number(dims[k])
    return Number.isFinite(v) && v > 0 && v <= 1000
  })
}
