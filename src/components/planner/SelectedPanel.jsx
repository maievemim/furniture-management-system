import { useState } from 'react'
import { useRoomStore } from '../../store/roomStore.js'
import { formatDimensions, formatLength } from '../../lib/format.js'
import { wallGaps } from '../../lib/geometry.js'
import ModelViewerDialog from '../ModelViewerDialog.jsx'

const SIDES = [
  { key: 'left', label: 'ซ้าย' },
  { key: 'right', label: 'ขวา' },
  { key: 'back', label: 'หลัง' },
  { key: 'front', label: 'หน้า' },
]

// ควบคุมชิ้นที่เลือก: หมุน 90° / ลบ / ดู AR (ไม่มีปุ่มย่อขยาย เพราะขนาดต้องเท่าของจริง)
// และแสดงระยะห่างจากผนังทั้ง 4 ด้าน เพื่อช่วยประเมินพื้นที่ว่าง
export default function SelectedPanel() {
  const selectedUid = useRoomStore((s) => s.selectedUid)
  const item = useRoomStore((s) => s.items.find((it) => it.uid === s.selectedUid))
  const product = useRoomStore((s) => (item ? s.products[item.productId] : null))
  const room = useRoomStore((s) => s.room)
  const rotateItem = useRoomStore((s) => s.rotateItem)
  const removeItem = useRoomStore((s) => s.removeItem)
  const [arOpen, setArOpen] = useState(false)

  if (!selectedUid || !item || !product) {
    return (
      <div className="panel selected-panel selected-empty">
        <p className="muted">แตะเฟอร์นิเจอร์ในห้องเพื่อเลือก แล้วลากเพื่อย้ายตำแหน่ง · ลากพื้นที่ว่างเพื่อหมุนมุมมอง</p>
      </div>
    )
  }

  const gaps = wallGaps(item, product, room)

  return (
    <div className="panel selected-panel" data-testid="selected-panel">
      <div className="selected-info">
        <strong data-testid="selected-name">{product.name}</strong>
        <p className="muted small">
          {formatDimensions(product)} · หมุน <span data-testid="selected-rotation">{item.rotationY}</span>°
          {!product.model_path && ' · แสดงเป็นกล่องขนาดจริง'}
        </p>
        <ul className="gaps" data-testid="wall-gaps" aria-label="ระยะห่างจากผนัง">
          {SIDES.map(({ key, label }) => (
            <li key={key} className={gaps[key] === 0 ? 'gap-zero' : ''}>
              <span className="muted">ผนัง{label}</span>
              <strong data-testid={`gap-${key}`}>{gaps[key] === 0 ? 'ชิดผนัง' : formatLength(gaps[key])}</strong>
            </li>
          ))}
        </ul>
      </div>
      <div className="btn-row">
        <button type="button" className="btn" onClick={() => rotateItem(item.uid)} data-testid="rotate">
          หมุน 90°
        </button>
        {product.model_path && (
          <button type="button" className="btn btn-outline" onClick={() => setArOpen(true)} data-testid="view-ar">
            ดู 3D / AR
          </button>
        )}
        <button type="button" className="btn btn-danger" onClick={() => removeItem(item.uid)} data-testid="remove">
          ลบ
        </button>
      </div>
      {arOpen && <ModelViewerDialog product={product} onClose={() => setArOpen(false)} />}
    </div>
  )
}
