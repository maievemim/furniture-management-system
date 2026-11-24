import { useEffect, useState } from 'react'
import { ROOM_LIMITS, useRoomStore } from '../../store/roomStore.js'

const FIELDS = [
  { key: 'width', label: 'กว้าง (ม.)' },
  { key: 'length', label: 'ยาว (ม.)' },
  { key: 'height', label: 'สูง (ม.)' },
]

export default function RoomSizeForm({ disabled = false, step }) {
  const room = useRoomStore((s) => s.room)
  const setRoom = useRoomStore((s) => s.setRoom)
  const [draft, setDraft] = useState(() => toDraft(room))
  const [error, setError] = useState('')

  useEffect(() => setDraft(toDraft(room)), [room])

  function submit(e) {
    e.preventDefault()
    const next = {}
    for (const { key, label } of FIELDS) {
      const v = Number(draft[key])
      const { min, max } = ROOM_LIMITS[key]
      if (!Number.isFinite(v) || v < min || v > max) {
        setError(`${label.replace(' (ม.)', '')}ต้องอยู่ระหว่าง ${min}–${max} เมตร`)
        return
      }
      next[key] = Math.round(v * 100) / 100
    }
    setError('')
    setRoom({ ...next, name: draft.name.trim() || 'ห้องของฉัน' })
  }

  return (
    <form className="panel" onSubmit={submit} data-testid="room-form">
      <h2 className="panel-title">
        {step && <span className="step">{step}</span>}
        ขนาดห้อง
      </h2>
      <label className="field">
        <span>ชื่อห้อง</span>
        <input
          value={draft.name}
          maxLength={60}
          disabled={disabled}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          data-testid="room-name"
        />
      </label>
      <div className="field-row">
        {FIELDS.map(({ key, label }) => (
          <label className="field" key={key}>
            <span>{label}</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min={ROOM_LIMITS[key].min}
              max={ROOM_LIMITS[key].max}
              value={draft[key]}
              disabled={disabled}
              onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
              data-testid={`room-${key}`}
            />
          </label>
        ))}
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {!disabled && (
        <button type="submit" className="btn btn-block" data-testid="room-apply">สร้างห้อง / ปรับขนาด</button>
      )}
    </form>
  )
}

function toDraft(room) {
  return { name: room.name, width: String(room.width), length: String(room.length), height: String(room.height) }
}
