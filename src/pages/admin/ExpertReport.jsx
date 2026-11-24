import { useState } from 'react'
import { EXPERT, fetchExpertReviews } from '../../lib/survey.js'
import EvaluationReport from './EvaluationReport.jsx'

const INFO = [
  { label: 'ชื่อผู้ประเมิน', field: 'reviewer_name' },
  { label: 'ตำแหน่ง/สังกัด', field: 'position' },
]

// /admin/expert ผลประเมินประสิทธิภาพของระบบโดยผู้เชี่ยวชาญ 3 ท่าน (วัตถุประสงค์ข้อ 2.1)
export default function ExpertReport() {
  return (
    <EvaluationReport
      title="ผลประเมินประสิทธิภาพโดยผู้เชี่ยวชาญ"
      form={EXPERT}
      fetchRows={fetchExpertReviews}
      infoColumns={INFO}
      unit="ท่าน"
      target={3}
      emptyText="ยังไม่มีผู้เชี่ยวชาญส่งแบบประเมิน"
      testid="expert-report"
      intro={<ShareLink />}
      extra={(responses) => (
        <div className="panel table-scroll">
          <h2 className="panel-title">รายชื่อผู้ประเมิน</h2>
          <table className="table">
            <thead>
              <tr>
                <th>ลำดับ</th>
                <th>ชื่อ-นามสกุล</th>
                <th>ตำแหน่ง / สังกัด</th>
                <th>วันที่ประเมิน</th>
              </tr>
            </thead>
            <tbody>
              {[...responses].reverse().map((r, i) => (
                <tr key={r.id}>
                  <td>{i + 1}</td>
                  <td>{r.reviewer_name ?? <span className="muted">ไม่ระบุ</span>}</td>
                  <td>{r.position ?? <span className="muted">ไม่ระบุ</span>}</td>
                  <td>{new Date(r.created_at).toLocaleDateString('th-TH', { dateStyle: 'medium' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    />
  )
}

// ลิงก์แบบประเมินสำหรับส่งให้ผู้เชี่ยวชาญ (หน้า /expert ไม่อยู่ในเมนูหลัก)
function ShareLink() {
  const url = `${window.location.origin}/expert`
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }
  return (
    <div className="panel share-box" data-testid="expert-link">
      <p className="small">ส่งลิงก์นี้ให้ผู้เชี่ยวชาญด้านเทคโนโลยีสารสนเทศ 3 ท่าน ประเมินหลังทดลองใช้ระบบครบทุกส่วน</p>
      <input readOnly value={url} onFocus={(e) => e.target.select()} />
      <div className="btn-row">
        <button type="button" className="btn btn-sm" onClick={copy}>{copied ? 'คัดลอกแล้ว ✓' : 'คัดลอกลิงก์'}</button>
        <a className="btn btn-sm btn-outline" href="/expert" target="_blank" rel="noreferrer">เปิดแบบประเมิน</a>
      </div>
    </div>
  )
}
