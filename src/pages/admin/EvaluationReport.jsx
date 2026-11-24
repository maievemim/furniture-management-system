import { useEffect, useMemo, useState } from 'react'
import { flattenQuestions, interpretMean, summarize } from '../../lib/survey.js'

const f2 = (v) => (Number.isFinite(v) ? v.toFixed(2) : '—')
const nf = new Intl.NumberFormat('th-TH')

// รายงานผลแบบประเมิน: x̄, S.D. และระดับ รายข้อ รายด้าน ภาพรวม + ดาวน์โหลด CSV
// ใช้ทั้งผลประเมินความพึงพอใจ (2.3) และผลประเมินผู้เชี่ยวชาญ (2.1)
//   form       SATISFACTION | EXPERT จาก lib/survey.js
//   fetchRows  ฟังก์ชันโหลดคำตอบ
//   infoColumns [{ label, field }] ข้อมูลผู้ตอบที่ใส่ใน CSV
//   unit       หน่วยนับผู้ตอบ เช่น "คน" / "ท่าน"
//   intro      ส่วนบนเพิ่มเติม (เช่นลิงก์สำหรับส่งให้ผู้ประเมิน)
//   extra      (responses) => ส่วนท้ายเพิ่มเติม (เช่นสัดส่วนเพศ/อายุ)
export default function EvaluationReport({ title, form, fetchRows, infoColumns, unit, target, emptyText, intro, extra, testid }) {
  const [responses, setResponses] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchRows()
      .then((rows) => {
        if (cancelled) return
        setResponses(rows)
        setStatus('ready')
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message)
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [fetchRows])

  const summary = useMemo(() => summarize(responses, form.groups), [responses, form])
  const level = (m) => interpretMean(m, form.levels)
  const comments = responses.filter((r) => r.comment)

  function downloadCsv() {
    const questions = flattenQuestions(form.groups)
    const header = ['วันที่', ...infoColumns.map((c) => c.label), ...questions.map((q) => `ข้อ ${q.no}`), 'ข้อเสนอแนะ']
    const rows = responses.map((r) => [
      new Date(r.created_at).toLocaleString('th-TH'),
      ...infoColumns.map((c) => r[c.field] ?? ''),
      ...r.scores,
      r.comment ?? '',
    ])
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const csv = '﻿' + [header, ...rows].map((row) => row.map(esc).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${title}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="admin-page" data-testid={testid}>
      <div className="page-head">
        <h1>{title}</h1>
        {status === 'ready' && responses.length > 0 && (
          <button type="button" className="btn btn-outline" onClick={downloadCsv} data-testid="survey-csv">
            ดาวน์โหลด CSV
          </button>
        )}
      </div>
      {intro}
      {status === 'loading' && <p className="muted">กำลังโหลด...</p>}
      {status === 'error' && <div className="alert" role="alert">{error}</div>}
      {status === 'ready' && (
        <>
          <div className="stats">
            <Stat
              label="จำนวนผู้ประเมิน"
              value={nf.format(summary.count)}
              unit={target ? `/ ${target} ${unit}` : unit}
              testid="survey-count"
            />
            <Stat label="ค่าเฉลี่ยภาพรวม (x̄)" value={f2(summary.overall.mean)} unit={`S.D. ${f2(summary.overall.sd)}`} testid="survey-mean" />
            <Stat label="ระดับภาพรวม" value={level(summary.overall.mean)} testid="survey-level" />
          </div>

          {summary.count === 0 ? (
            <p className="muted panel">{emptyText}</p>
          ) : (
            <>
              <div className="panel table-scroll">
                <h2 className="panel-title">ผลรายข้อ</h2>
                <table className="table survey-table" data-testid="survey-table">
                  <thead>
                    <tr>
                      <th>รายการประเมิน</th>
                      <th className="num">x̄</th>
                      <th className="num">S.D.</th>
                      <th>ระดับ</th>
                    </tr>
                  </thead>
                  {summary.perGroup.map((g, gi) => (
                    <tbody key={g.title}>
                      <tr className="row-group">
                        <th>{g.title}</th>
                        <th className="num">{f2(g.mean)}</th>
                        <th className="num">{f2(g.sd)}</th>
                        <th>{level(g.mean)}</th>
                      </tr>
                      {summary.perQuestion
                        .filter((q) => q.group === gi)
                        .map((q) => (
                          <tr key={q.no}>
                            <td>{q.no}. {q.text}</td>
                            <td className="num">{f2(q.mean)}</td>
                            <td className="num">{f2(q.sd)}</td>
                            <td>{level(q.mean)}</td>
                          </tr>
                        ))}
                    </tbody>
                  ))}
                  <tfoot>
                    <tr>
                      <th>ภาพรวม</th>
                      <th className="num">{f2(summary.overall.mean)}</th>
                      <th className="num">{f2(summary.overall.sd)}</th>
                      <th>{level(summary.overall.mean)}</th>
                    </tr>
                  </tfoot>
                </table>
                <p className="muted small">
                  เกณฑ์แปลความหมาย: 4.51–5.00 {form.levels[0]} · 3.51–4.50 {form.levels[1]} · 2.51–3.50 {form.levels[2]} ·
                  1.51–2.50 {form.levels[3]} · 1.00–1.50 {form.levels[4]}
                </p>
              </div>

              {extra?.(responses)}

              {comments.length > 0 && (
                <div className="panel">
                  <h2 className="panel-title">ข้อเสนอแนะ ({nf.format(comments.length)})</h2>
                  <ul className="comments">
                    {comments.map((r) => (
                      <li key={r.id}>
                        <p>{r.comment}</p>
                        <span className="muted small">
                          {new Date(r.created_at).toLocaleDateString('th-TH', { dateStyle: 'medium' })}
                          {infoColumns.map((c) => (r[c.field] ? ` · ${r[c.field]}` : '')).join('')}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

function Stat({ label, value, unit, testid }) {
  return (
    <div className="panel stat" data-testid={testid}>
      <span className="muted small">{label}</span>
      <strong className="stat-value">
        {value} {unit && <span className="stat-unit">{unit}</span>}
      </strong>
    </div>
  )
}
