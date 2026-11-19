import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import RoomScene from '../components/3d/RoomScene.jsx'
import Bom from '../components/planner/Bom.jsx'
import { loadRoom } from '../lib/rooms.js'
import { useRoomStore } from '../store/roomStore.js'

// /room/:id เปิดห้องที่ถูกแชร์ (ดูอย่างเดียว) และกด "แก้ไขต่อ" เพื่อคัดลอกไปหน้าจัดห้องได้
export default function SharedRoom() {
  const { id } = useParams()
  const navigate = useNavigate()
  const loadIntoStore = useRoomStore((s) => s.loadRoom)
  const room = useRoomStore((s) => s.room)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [meta, setMeta] = useState(null)

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    loadRoom(id)
      .then(({ room, items, products }) => {
        if (cancelled) return
        loadIntoStore(room, items, products)
        setMeta(room)
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
  }, [id, loadIntoStore])

  const created = useMemo(
    () => (meta ? new Date(meta.created_at).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : ''),
    [meta],
  )

  if (status === 'loading') return <p className="muted">กำลังโหลด...</p>
  if (status === 'error') {
    return (
      <section>
        <h1>ห้องที่แชร์</h1>
        <div className="alert" role="alert" data-testid="shared-error">{error}</div>
        <p><Link to="/planner">ไปหน้าจัดห้อง</Link></p>
      </section>
    )
  }

  return (
    <section>
      <div className="page-head">
        <div>
          <h1 data-testid="shared-name">{room.name}</h1>
          <p className="muted small" data-testid="room-caption">
            {room.width} × {room.length} ม. สูง {room.height} ม. · บันทึกเมื่อ {created}
          </p>
        </div>
        <button type="button" className="btn" onClick={() => navigate('/planner')} data-testid="edit-copy">
          แก้ไขต่อ (บันทึกเป็นห้องใหม่)
        </button>
      </div>
      <div className="shared-layout">
        <RoomScene readOnly />
        <Bom />
      </div>
    </section>
  )
}
