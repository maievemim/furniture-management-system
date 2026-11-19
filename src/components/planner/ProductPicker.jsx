import { useRoomStore } from '../../store/roomStore.js'
import { publicModelUrl } from '../../lib/supabase.js'
import { formatBaht, formatDimensions } from '../../lib/format.js'
import { fitsInRoom } from '../../lib/geometry.js'

export default function ProductPicker({ products }) {
  const addItem = useRoomStore((s) => s.addItem)
  const room = useRoomStore((s) => s.room)

  return (
    <div className="panel">
      <h2 className="panel-title">เพิ่มเฟอร์นิเจอร์</h2>
      <ul className="picker" data-testid="picker">
        {products
          .filter((p) => p.model_path)
          .map((p) => {
            const fits = fitsInRoom(p, 0, room) || fitsInRoom(p, 90, room)
            return (
              <li key={p.id} className="picker-item">
                <img src={publicModelUrl(p.thumbnail_url) ?? undefined} alt="" className="picker-thumb" loading="lazy" />
                <div className="picker-info">
                  <span className="picker-name">{p.name}</span>
                  <span className="muted picker-meta">{formatDimensions(p)}</span>
                  <span className="picker-price">{formatBaht(p.price)}</span>
                  {!fits && <span className="form-error">ใหญ่กว่าห้อง</span>}
                </div>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => addItem(p.id)}
                  disabled={!fits}
                  data-testid={`add-${p.sku}`}
                >
                  วาง
                </button>
              </li>
            )
          })}
      </ul>
    </div>
  )
}
