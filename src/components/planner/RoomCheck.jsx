import { useMemo } from 'react'
import { useRoomStore } from '../../store/roomStore.js'
import { findOverlaps, floorUsage } from '../../lib/geometry.js'

const nf = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 })

// ตรวจการจัดห้อง: พื้นที่ห้อง, พื้นที่ที่เฟอร์นิเจอร์ใช้ และเตือนเมื่อวางทับกัน
// ช่วยให้ผู้ใช้ประเมินขนาดและสัดส่วนได้ถูกต้อง (วัตถุประสงค์ข้อ 2.2)
export default function RoomCheck() {
  const room = useRoomStore((s) => s.room)
  const items = useRoomStore((s) => s.items)
  const products = useRoomStore((s) => s.products)
  const select = useRoomStore((s) => s.select)

  const overlaps = useMemo(() => findOverlaps(items, products), [items, products])
  const usage = useMemo(() => floorUsage(items, products, room), [items, products, room])
  const overlapItems = items.filter((it) => overlaps.has(it.uid))
  const percent = Math.min(100, usage.percent)

  return (
    <div className="panel" data-testid="room-check">
      <h2 className="panel-title">ตรวจพื้นที่ห้อง</h2>
      <dl className="check-stats">
        <div>
          <dt className="muted small">พื้นที่ห้อง</dt>
          <dd data-testid="room-area">{nf.format(usage.area)} ตร.ม.</dd>
        </div>
        <div>
          <dt className="muted small">เฟอร์นิเจอร์ใช้พื้นที่</dt>
          <dd data-testid="room-used">
            {nf.format(usage.used)} ตร.ม. <span className="muted small">({Math.round(usage.percent)}%)</span>
          </dd>
        </div>
      </dl>
      <div className="meter" role="img" aria-label={`ใช้พื้นที่ ${Math.round(usage.percent)}%`}>
        <span style={{ width: `${percent}%` }} />
      </div>
      <p className="muted small check-free">
        เหลือพื้นที่ว่าง {nf.format(Math.max(0, usage.area - usage.used))} ตร.ม.
      </p>

      {overlapItems.length > 0 ? (
        <div className="check-warn" role="alert" data-testid="overlap-warning">
          <strong>เฟอร์นิเจอร์วางทับกัน {overlapItems.length} ชิ้น</strong>
          <p className="small">ของจริงวางซ้อนกันไม่ได้ กรุณาย้ายชิ้นที่มีกรอบสีแดง</p>
          <div className="btn-row">
            {overlapItems.map((it) => (
              <button key={it.uid} type="button" className="chip" onClick={() => select(it.uid)}>
                {products[it.productId]?.name}
              </button>
            ))}
          </div>
        </div>
      ) : (
        items.length > 0 && (
          <p className="check-ok small" data-testid="overlap-ok">✓ ไม่มีเฟอร์นิเจอร์วางทับกัน</p>
        )
      )}
    </div>
  )
}
