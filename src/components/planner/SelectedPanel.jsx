import { useState } from 'react'
import { useRoomStore } from '../../store/roomStore.js'
import { formatDimensions } from '../../lib/format.js'
import ModelViewerDialog from '../ModelViewerDialog.jsx'

// ควบคุมชิ้นที่เลือก: หมุน 90° / ลบ / ดู AR (ไม่มีปุ่มย่อขยาย เพราะขนาดต้องเท่าของจริง)
export default function SelectedPanel() {
  const selectedUid = useRoomStore((s) => s.selectedUid)
  const item = useRoomStore((s) => s.items.find((it) => it.uid === s.selectedUid))
  const product = useRoomStore((s) => (item ? s.products[item.productId] : null))
  const rotateItem = useRoomStore((s) => s.rotateItem)
  const removeItem = useRoomStore((s) => s.removeItem)
  const [arOpen, setArOpen] = useState(false)

  if (!selectedUid || !item || !product) {
    return (
      <div className="panel selected-panel">
        <p className="muted">คลิกเฟอร์นิเจอร์ในห้องเพื่อเลือก แล้วลากเพื่อย้ายตำแหน่ง</p>
      </div>
    )
  }

  return (
    <div className="panel selected-panel" data-testid="selected-panel">
      <div>
        <strong data-testid="selected-name">{product.name}</strong>
        <p className="muted small">
          {formatDimensions(product)} · หมุน <span data-testid="selected-rotation">{item.rotationY}</span>°
        </p>
      </div>
      <div className="btn-row">
        <button type="button" className="btn" onClick={() => rotateItem(item.uid)} data-testid="rotate">
          หมุน 90°
        </button>
        <button type="button" className="btn btn-outline" onClick={() => setArOpen(true)} data-testid="view-ar">
          ดู 3D / AR
        </button>
        <button type="button" className="btn btn-danger" onClick={() => removeItem(item.uid)} data-testid="remove">
          ลบ
        </button>
      </div>
      {arOpen && <ModelViewerDialog product={product} onClose={() => setArOpen(false)} />}
    </div>
  )
}
