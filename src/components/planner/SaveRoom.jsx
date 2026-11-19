import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useRoomStore } from '../../store/roomStore.js'
import { saveRoom, shareUrl } from '../../lib/rooms.js'

export default function SaveRoom() {
  const room = useRoomStore((s) => s.room)
  const items = useRoomStore((s) => s.items)
  const savedRoomId = useRoomStore((s) => s.savedRoomId)
  const markSaved = useRoomStore((s) => s.markSaved)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  async function onSave() {
    setSaving(true)
    setError('')
    setCopied(false)
    try {
      const id = await saveRoom(room, items)
      markSaved(id)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl(savedRoomId))
      setCopied(true)
    } catch {
      setError('คัดลอกไม่สำเร็จ กรุณาคัดลอกลิงก์ด้วยตนเอง')
    }
  }

  return (
    <div className="panel" data-testid="save-panel">
      <h2 className="panel-title">บันทึกและแชร์ห้อง</h2>
      <button
        type="button"
        className="btn btn-block"
        onClick={onSave}
        disabled={saving || items.length === 0}
        data-testid="save-room"
      >
        {saving ? 'กำลังบันทึก...' : 'บันทึกห้อง'}
      </button>
      {items.length === 0 && <p className="muted small">วางเฟอร์นิเจอร์อย่างน้อย 1 ชิ้นก่อนบันทึก</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {savedRoomId && (
        <div className="share-box" data-testid="share-box">
          <p className="small">บันทึกแล้ว ส่งลิงก์นี้ให้ผู้อื่นเปิดดูห้องเดียวกันได้</p>
          <input readOnly value={shareUrl(savedRoomId)} onFocus={(e) => e.target.select()} data-testid="share-url" />
          <div className="btn-row">
            <button type="button" className="btn btn-sm" onClick={copy}>{copied ? 'คัดลอกแล้ว ✓' : 'คัดลอกลิงก์'}</button>
            <Link className="btn btn-sm btn-outline" to={`/room/${savedRoomId}`} data-testid="open-share">
              เปิดลิงก์
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
