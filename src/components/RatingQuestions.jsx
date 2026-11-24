import { scaleOf } from '../lib/survey.js'

// รายการคำถามแบบให้คะแนน 1–5 แยกตามด้าน (ใช้ทั้งแบบประเมินผู้ใช้และผู้เชี่ยวชาญ)
// scores: array คะแนน (0 = ยังไม่ตอบ) · onChange(index, value)
export default function RatingQuestions({ form, scores, onChange }) {
  const scale = scaleOf(form)
  let qIndex = 0
  return (
    <>
      <p className="muted small">{scale.map((s) => `${s.value} = ${s.label}`).join(' · ')}</p>
      {form.groups.map((g) => (
        <div key={g.title} className="survey-group">
          <h3 className="survey-group-title">{g.title}</h3>
          <ol className="survey-list">
            {g.questions.map((text) => {
              const i = qIndex++
              return (
                <li key={text} className="survey-q" id={`q-${i + 1}`} data-testid="survey-q">
                  <p className="survey-q-text">
                    <span className="survey-q-no">{i + 1}.</span> {text}
                  </p>
                  <div className="rating" role="radiogroup" aria-label={`ข้อ ${i + 1} ${text}`}>
                    {scale.map(({ value, label }) => (
                      <label key={value} className={`rating-opt${scores[i] === value ? ' is-on' : ''}`} title={label}>
                        <input
                          type="radio"
                          name={`q${i + 1}`}
                          value={value}
                          checked={scores[i] === value}
                          onChange={() => onChange(i, value)}
                        />
                        <span className="rating-num">{value}</span>
                        <span className="rating-label">{label}</span>
                      </label>
                    ))}
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      ))}
    </>
  )
}

// หาข้อแรกที่ยังไม่ได้ตอบ แล้วเลื่อนไปที่ข้อนั้น คืนเลขข้อ (เริ่มที่ 1) หรือ 0 ถ้าตอบครบ
export function firstUnanswered(scores) {
  const i = scores.findIndex((v) => !v)
  if (i === -1) return 0
  document.getElementById(`q-${i + 1}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  return i + 1
}
