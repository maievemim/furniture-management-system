import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AGE_RANGES, DEVICES, GENDERS, SATISFACTION, flattenQuestions, submitSurvey } from '../lib/survey.js'
import RatingQuestions, { firstUnanswered } from '../components/RatingQuestions.jsx'

const QUESTION_COUNT = flattenQuestions(SATISFACTION.groups).length

// แบบประเมินความพึงพอใจของผู้ใช้งาน (ไม่ต้องล็อกอิน ไม่เก็บข้อมูลส่วนตัว)
export default function Survey() {
  const [gender, setGender] = useState('')
  const [ageRange, setAgeRange] = useState('')
  const [device, setDevice] = useState('')
  const [scores, setScores] = useState(() => Array(QUESTION_COUNT).fill(0))
  const [comment, setComment] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | done
  const [error, setError] = useState('')

  const answered = scores.filter(Boolean).length

  function setScore(i, v) {
    setScores((s) => s.map((x, j) => (j === i ? v : x)))
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (!gender || !ageRange || !device) {
      setError('กรุณากรอกข้อมูลทั่วไปให้ครบ (เพศ อายุ และอุปกรณ์ที่ใช้)')
      return
    }
    const missing = firstUnanswered(scores)
    if (missing) {
      setError(`กรุณาให้คะแนนให้ครบทุกข้อ (ยังไม่ได้ตอบข้อ ${missing})`)
      return
    }
    setError('')
    setStatus('sending')
    try {
      await submitSurvey({ gender, ageRange, device, scores, comment })
      setStatus('done')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err.message)
      setStatus('idle')
    }
  }

  if (status === 'done') {
    return (
      <section className="survey-done panel" data-testid="survey-done">
        <p className="eyebrow">ส่งเรียบร้อยแล้ว</p>
        <h1>ขอบคุณที่ร่วมประเมิน</h1>
        <p className="muted">ความคิดเห็นของคุณจะถูกนำไปปรับปรุงระบบให้ดียิ่งขึ้น</p>
        <div className="btn-row center">
          <Link to="/" className="btn btn-pill">กลับหน้าแรก</Link>
        </div>
      </section>
    )
  }

  return (
    <section className="survey">
      <div className="page-intro">
        <p className="eyebrow">สำหรับผู้ทดลองใช้งาน</p>
        <h1>แบบประเมินความพึงพอใจ</h1>
        <p className="muted">
          ต่อระบบการจัดการการวางเฟอร์นิเจอร์เสมือนจริงผ่านเว็บไซต์ · ใช้เวลาประมาณ 3 นาที · ไม่เก็บชื่อหรือข้อมูลติดต่อ
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate data-testid="survey-form">
        <fieldset className="panel survey-section">
          <legend className="panel-title">ตอนที่ 1 ข้อมูลทั่วไป</legend>
          <ChoiceGroup label="เพศ" name="gender" options={GENDERS} value={gender} onChange={setGender} />
          <ChoiceGroup label="อายุ" name="age" options={AGE_RANGES} value={ageRange} onChange={setAgeRange} />
          <ChoiceGroup label="อุปกรณ์ที่ใช้ทดลอง" name="device" options={DEVICES} value={device} onChange={setDevice} />
        </fieldset>

        <div className="panel survey-section">
          <h2 className="panel-title">ตอนที่ 2 ความพึงพอใจต่อระบบ</h2>
          <RatingQuestions form={SATISFACTION} scores={scores} onChange={setScore} />
        </div>

        <div className="panel survey-section">
          <label className="field">
            <span className="panel-title">ตอนที่ 3 ข้อเสนอแนะเพิ่มเติม (ไม่บังคับ)</span>
            <textarea
              rows={4}
              maxLength={1000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              data-testid="survey-comment"
            />
          </label>
        </div>

        <div className="survey-submit">
          <p className="muted small" data-testid="survey-progress">
            ตอบแล้ว {answered} / {QUESTION_COUNT} ข้อ
          </p>
          {error && <p className="form-error" role="alert" data-testid="survey-error">{error}</p>}
          <button type="submit" className="btn btn-pill" disabled={status === 'sending'} data-testid="survey-submit">
            {status === 'sending' ? 'กำลังส่ง...' : 'ส่งแบบประเมิน'}
          </button>
        </div>
      </form>
    </section>
  )
}

function ChoiceGroup({ label, name, options, value, onChange }) {
  return (
    <div className="choice-group" role="radiogroup" aria-label={label}>
      <span className="choice-label">{label}</span>
      <div className="choices">
        {options.map((opt) => (
          <label key={opt} className={`chip${value === opt ? ' is-on' : ''}`}>
            <input type="radio" name={name} value={opt} checked={value === opt} onChange={() => onChange(opt)} />
            {opt}
          </label>
        ))}
      </div>
    </div>
  )
}
