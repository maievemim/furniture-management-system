import { AGE_RANGES, DEVICES, GENDERS, SATISFACTION, fetchSurveyResponses } from '../../lib/survey.js'
import EvaluationReport from './EvaluationReport.jsx'

const nf = new Intl.NumberFormat('th-TH')
const INFO = [
  { label: 'เพศ', field: 'gender' },
  { label: 'อายุ', field: 'age_range' },
  { label: 'อุปกรณ์', field: 'device' },
]

// /admin/survey ผลประเมินความพึงพอใจของผู้ใช้งาน (วัตถุประสงค์ข้อ 2.3 กลุ่มตัวอย่าง 30 คน)
export default function SurveyReport() {
  return (
    <EvaluationReport
      title="ผลประเมินความพึงพอใจ"
      form={SATISFACTION}
      fetchRows={fetchSurveyResponses}
      infoColumns={INFO}
      unit="คน"
      target={30}
      emptyText="ยังไม่มีผู้ตอบแบบประเมิน ส่งลิงก์ /survey ให้กลุ่มตัวอย่างหลังทดลองใช้ระบบ"
      extra={(responses) => (
        <div className="survey-demo">
          <Breakdown title="เพศ" field="gender" options={GENDERS} responses={responses} />
          <Breakdown title="อายุ" field="age_range" options={AGE_RANGES} responses={responses} />
          <Breakdown title="อุปกรณ์" field="device" options={DEVICES} responses={responses} />
        </div>
      )}
    />
  )
}

function Breakdown({ title, field, options, responses }) {
  const total = responses.length || 1
  return (
    <div className="panel">
      <h2 className="panel-title">{title}</h2>
      <ul className="breakdown">
        {options.map((opt) => {
          const n = responses.filter((r) => r[field] === opt).length
          const pct = (n / total) * 100
          return (
            <li key={opt}>
              <span>{opt}</span>
              <span className="muted small">{nf.format(n)} คน ({pct.toFixed(1)}%)</span>
              <span className="meter"><span style={{ width: `${pct}%` }} /></span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
