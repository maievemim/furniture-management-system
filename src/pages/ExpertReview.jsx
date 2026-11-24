import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EXPERT, flattenQuestions, submitExpertReview } from '../lib/survey.js'
import RatingQuestions, { firstUnanswered } from '../components/RatingQuestions.jsx'

const QUESTION_COUNT = flattenQuestions(EXPERT.groups).length

// /expert แบบประเมินประสิทธิภาพของระบบสำหรับผู้เชี่ยวชาญ (วัตถุประสงค์ข้อ 2.1)
// ไม่อยู่ในเมนูหลัก ทีมส่งลิงก์ให้ผู้เชี่ยวชาญ 3 ท่านโดยตรง (ลิงก์อยู่ในหน้าแอดมิน /admin/expert)
export default function ExpertReview() {
  const [reviewerName, setReviewerName] = useState('')
  const [position, setPosition] = useState('')
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
    const missing = firstUnanswered(scores)
    if (missing) {
      setError(`กรุณาให้คะแนนให้ครบทุกข้อ (ยังไม่ได้ประเมินข้อ ${missing})`)
      return
    }
    setError('')
    setStatus('sending')
    try {
      await submitExpertReview({ reviewerName, position, scores, comment })
      setStatus('done')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err.message)
      setStatus('idle')
    }
  }

  if (status === 'done') {
    return (
      <section className="survey-done panel" data-testid="expert-done">
        <p className="eyebrow">ส่งเรียบร้อยแล้ว</p>
        <h1>ขอบพระคุณที่สละเวลาประเมิน</h1>
        <p className="muted">ข้อเสนอแนะของท่านจะถูกนำไปปรับปรุงระบบก่อนนำไปใช้งานจริง</p>
        <div className="btn-row center">
          <Link to="/" className="btn btn-pill">กลับหน้าแรก</Link>
        </div>
      </section>
    )
  }

  return (
    <section className="survey">
      <div className="page-intro">
        <p className="eyebrow">สำหรับผู้เชี่ยวชาญ</p>
        <h1>แบบประเมินประสิทธิภาพของระบบ</h1>
        <p className="muted">
          ระบบการจัดการการวางเฟอร์นิเจอร์เสมือนจริงผ่านเว็บไซต์ · กรุณาทดลองใช้ทุกส่วนของระบบ
          (รวมหน้าผู้ดูแลระบบ) ก่อนประเมิน
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate data-testid="expert-form">
        <div className="panel survey-section">
          <h2 className="panel-title">ตอนที่ 1 ข้อมูลผู้ประเมิน (ไม่บังคับ)</h2>
          <div className="field-row field-row-2">
            <label className="field">
              <span>ชื่อ-นามสกุล</span>
              <input value={reviewerName} maxLength={100} onChange={(e) => setReviewerName(e.target.value)} data-testid="expert-name" />
            </label>
            <label className="field">
              <span>ตำแหน่ง / สังกัด</span>
              <input value={position} maxLength={150} onChange={(e) => setPosition(e.target.value)} data-testid="expert-position" />
            </label>
          </div>
          <p className="muted small">ข้อมูลนี้เห็นได้เฉพาะผู้ดูแลระบบ ใช้สำหรับอ้างอิงในรายงานโครงงาน</p>
        </div>

        <div className="panel survey-section">
          <h2 className="panel-title">ตอนที่ 2 ประสิทธิภาพของระบบ</h2>
          <RatingQuestions form={EXPERT} scores={scores} onChange={setScore} />
        </div>

        <div className="panel survey-section">
          <label className="field">
            <span className="panel-title">ตอนที่ 3 ข้อเสนอแนะสำหรับปรับปรุงระบบ (ไม่บังคับ)</span>
            <textarea rows={5} maxLength={2000} value={comment} onChange={(e) => setComment(e.target.value)} data-testid="survey-comment" />
          </label>
        </div>

        <div className="survey-submit">
          <p className="muted small" data-testid="survey-progress">
            ประเมินแล้ว {answered} / {QUESTION_COUNT} ข้อ
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
