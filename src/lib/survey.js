import { supabase, isSupabaseConfigured } from './supabase.js'

// แบบประเมิน 2 ชุด มาตราส่วนประมาณค่า 5 ระดับ
//  - SATISFACTION: ความพึงพอใจของผู้ใช้งาน (วัตถุประสงค์ข้อ 2.3) กลุ่มตัวอย่าง 30 คน
//  - EXPERT: ประสิทธิภาพของระบบโดยผู้เชี่ยวชาญ 3 ท่าน (วัตถุประสงค์ข้อ 2.1 / สมมติฐาน "อยู่ในเกณฑ์ดี")
// ถ้าแก้จำนวนข้อ ต้องแก้ check ของคอลัมน์ scores ใน supabase/schema.sql ด้วย

export const SATISFACTION = {
  key: 'satisfaction',
  table: 'survey_responses',
  // ระดับ 5 → 1
  levels: ['มากที่สุด', 'มาก', 'ปานกลาง', 'น้อย', 'น้อยที่สุด'],
  groups: [
    {
      title: 'ด้านการออกแบบและการแสดงผล',
      questions: [
        'หน้าเว็บไซต์มีความสวยงาม น่าใช้งาน',
        'ตัวอักษร สี และรูปภาพ อ่านง่าย ชัดเจน',
        'แสดงผลได้เหมาะสมบนมือถือ แท็บเล็ต และคอมพิวเตอร์',
      ],
    },
    {
      title: 'ด้านการใช้งานระบบ',
      questions: [
        'ใช้งานง่าย ไม่ซับซ้อน',
        'สร้างห้องตามขนาดจริงได้สะดวก',
        'ย้ายและหมุนเฟอร์นิเจอร์ในห้อง 3D ได้สะดวก',
        'ดูสินค้าแบบ AR ผ่านกล้องมือถือได้สะดวกโดยไม่ต้องติดตั้งแอป',
        'ระบบทำงานรวดเร็ว โหลดหน้าและโมเดลได้ในเวลาที่เหมาะสม',
      ],
    },
    {
      title: 'ด้านประโยชน์ที่ได้รับ',
      questions: [
        'ช่วยให้ประเมินขนาดและสัดส่วนของเฟอร์นิเจอร์ในห้องได้ถูกต้อง',
        'สรุปราคารวม (BOM) ถูกต้องและช่วยวางแผนงบประมาณได้',
        'บันทึกและแชร์แบบห้องให้ผู้อื่นดูได้สะดวก',
        'ช่วยเพิ่มความมั่นใจก่อนตัดสินใจซื้อสินค้า',
      ],
    },
  ],
}

export const EXPERT = {
  key: 'expert',
  table: 'expert_reviews',
  levels: ['ดีมาก', 'ดี', 'ปานกลาง', 'พอใช้', 'ต้องปรับปรุง'],
  groups: [
    {
      title: 'ด้านความต้องการของผู้ใช้ระบบ (Functional Requirement Test)',
      questions: [
        'ระบบสร้างห้อง 3 มิติตามขนาดกว้าง ยาว สูง ที่กำหนดได้ถูกต้อง',
        'ระบบแสดงโมเดลเฟอร์นิเจอร์ในขนาดเท่าของจริงตามข้อมูลสินค้า',
        'ระบบแสดงสินค้าแบบ AR ผ่านกล้องมือถือได้โดยไม่ต้องติดตั้งแอปพลิเคชัน',
        'ระบบคำนวณราคารวม (BOM) ได้ถูกต้อง',
        'ระบบบันทึกแบบห้องและสร้างลิงก์แชร์ได้',
        'ระบบค้นหาสินค้าด้วยรูปภาพได้',
        'ผู้ดูแลระบบจัดการข้อมูลสินค้าและอัปโหลดโมเดล 3 มิติได้',
        'ระบบแสดงรายงานความนิยมสินค้าได้',
      ],
    },
    {
      title: 'ด้านการทำงานตามฟังก์ชันของระบบ (Functional Test)',
      questions: [
        'การย้ายและหมุนเฟอร์นิเจอร์ทำงานถูกต้อง และไม่หลุดออกนอกห้อง',
        'การแสดงระยะห่างจากผนังและการเตือนเมื่อวางทับกันทำงานถูกต้อง',
        'การเพิ่ม แก้ไข และลบข้อมูลสินค้าทำงานถูกต้อง',
        'ระบบตรวจสอบข้อมูลนำเข้าและแสดงข้อความแจ้งเตือนได้ถูกต้อง',
      ],
    },
    {
      title: 'ด้านความง่ายต่อการใช้งานระบบ (Usability Test)',
      questions: [
        'ความง่ายต่อการใช้งานระบบ',
        'ความเหมาะสมของการออกแบบหน้าจอ สี และตัวอักษร',
        'ความเหมาะสมของการแสดงผลบนอุปกรณ์ต่างๆ (Responsive)',
        'ความรวดเร็วในการตอบสนองของระบบ',
      ],
    },
    {
      title: 'ด้านการรักษาความปลอดภัยของระบบ (Security Test)',
      questions: [
        'การกำหนดสิทธิ์ผู้ดูแลระบบด้วยการเข้าสู่ระบบ',
        'การป้องกันไม่ให้ผู้ที่ไม่ได้รับสิทธิ์แก้ไขข้อมูลสินค้า',
        'ระบบไม่เก็บข้อมูลส่วนบุคคลของผู้ใช้ทั่วไปเกินความจำเป็น',
      ],
    },
  ],
}

// รายการคำถามเรียงต่อกัน พร้อมเลขข้อ (no) และลำดับกลุ่ม (group)
export function flattenQuestions(groups) {
  return groups
    .flatMap((g, gi) => g.questions.map((text) => ({ text, group: gi })))
    .map((q, i) => ({ ...q, no: i + 1 }))
}

export function scaleOf(form) {
  return form.levels.map((label, i) => ({ value: 5 - i, label }))
}

// ข้อมูลทั่วไปของแบบประเมินความพึงพอใจ
export const GENDERS = ['ชาย', 'หญิง', 'ไม่ระบุ']
export const AGE_RANGES = ['ต่ำกว่า 20 ปี', '20–29 ปี', '30–39 ปี', '40–49 ปี', '50 ปีขึ้นไป']
export const DEVICES = ['มือถือ', 'แท็บเล็ต', 'คอมพิวเตอร์']

// เกณฑ์แปลความหมายค่าเฉลี่ย (บุญชม ศรีสะอาด) levels = ชื่อระดับ 5 → 1 ของแบบประเมินนั้น
export function interpretMean(mean, levels = SATISFACTION.levels) {
  if (!Number.isFinite(mean)) return '—'
  if (mean >= 4.51) return levels[0]
  if (mean >= 3.51) return levels[1]
  if (mean >= 2.51) return levels[2]
  if (mean >= 1.51) return levels[3]
  return levels[4]
}

// ค่าเฉลี่ย (x̄) และส่วนเบี่ยงเบนมาตรฐานของกลุ่มตัวอย่าง (S.D., หารด้วย n − 1)
export function meanSd(values) {
  const n = values.length
  if (n === 0) return { n, mean: NaN, sd: NaN }
  const mean = values.reduce((a, b) => a + b, 0) / n
  const sd = n > 1 ? Math.sqrt(values.reduce((a, v) => a + (v - mean) ** 2, 0) / (n - 1)) : 0
  return { n, mean, sd }
}

// สรุปผลรายข้อ รายด้าน และภาพรวม
export function summarize(responses, groups) {
  const questions = flattenQuestions(groups)
  const valid = responses.filter((r) => Array.isArray(r.scores) && r.scores.length === questions.length)
  const perQuestion = questions.map((q, i) => ({ ...q, ...meanSd(valid.map((r) => r.scores[i])) }))
  // รายด้าน/ภาพรวม: ใช้ค่าเฉลี่ยของแต่ละคนในด้านนั้น แล้วหา x̄ และ S.D.
  const avgOf = (r, idx) => idx.reduce((a, i) => a + r.scores[i], 0) / idx.length
  const perGroup = groups.map((g, gi) => {
    const idx = questions.filter((q) => q.group === gi).map((q) => q.no - 1)
    return { title: g.title, ...meanSd(valid.map((r) => avgOf(r, idx))) }
  })
  const allIdx = questions.map((q) => q.no - 1)
  const overall = meanSd(valid.map((r) => avgOf(r, allIdx)))
  return { count: valid.length, perQuestion, perGroup, overall }
}

async function insertRow(table, row) {
  if (!isSupabaseConfigured) throw new Error('ยังไม่ได้ตั้งค่าการเชื่อมต่อฐานข้อมูล')
  const { error } = await supabase.from(table).insert(row)
  if (error) {
    console.error(error)
    throw new Error('ส่งแบบประเมินไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
  }
}

// แอดมินเท่านั้น (RLS อนุญาตให้ผู้ที่ล็อกอินอ่าน)
async function fetchRows(table, columns) {
  const { data, error } = await supabase.from(table).select(columns).order('created_at', { ascending: false })
  if (error) {
    console.error(error)
    throw new Error('โหลดผลประเมินไม่สำเร็จ กรุณาลองใหม่อีกครั้ง (ตรวจว่ารัน supabase/schema.sql ล่าสุดแล้ว)')
  }
  return data ?? []
}

export function submitSurvey({ gender, ageRange, device, scores, comment }) {
  return insertRow(SATISFACTION.table, {
    gender,
    age_range: ageRange,
    device,
    scores,
    comment: comment.trim() || null,
  })
}

export function fetchSurveyResponses() {
  return fetchRows(SATISFACTION.table, 'id, gender, age_range, device, scores, comment, created_at')
}

export function submitExpertReview({ reviewerName, position, scores, comment }) {
  return insertRow(EXPERT.table, {
    reviewer_name: reviewerName.trim() || null,
    position: position.trim() || null,
    scores,
    comment: comment.trim() || null,
  })
}

export function fetchExpertReviews() {
  return fetchRows(EXPERT.table, 'id, reviewer_name, position, scores, comment, created_at')
}
