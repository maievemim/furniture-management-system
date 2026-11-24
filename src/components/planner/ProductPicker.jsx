import { useMemo, useState } from 'react'
import { useRoomStore } from '../../store/roomStore.js'
import { publicModelUrl } from '../../lib/supabase.js'
import { formatBaht, formatDimensions } from '../../lib/format.js'
import { fitsInRoom } from '../../lib/geometry.js'

export default function ProductPicker({ products, step }) {
  const addItem = useRoomStore((s) => s.addItem)
  const room = useRoomStore((s) => s.room)
  const [query, setQuery] = useState('')

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
  }, [products, query])

  return (
    <div className="panel">
      <h2 className="panel-title">
        {step && <span className="step">{step}</span>}
        เพิ่มเฟอร์นิเจอร์
      </h2>
      {products.length > 4 && (
        <input
          type="search"
          className="search search-sm"
          placeholder="ค้นหาสินค้า"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="ค้นหาสินค้า"
        />
      )}
      <ul className="picker" data-testid="picker">
        {list.map((p) => {
          const fits = fitsInRoom(p, 0, room) || fitsInRoom(p, 90, room)
          const thumb = publicModelUrl(p.thumbnail_url)
          return (
            <li key={p.id} className="picker-item">
              {thumb ? (
                <img src={thumb} alt="" className="picker-thumb" loading="lazy" />
              ) : (
                <span className="picker-thumb picker-thumb-empty" aria-hidden="true">▢</span>
              )}
              <div className="picker-info">
                <span className="picker-name">{p.name}</span>
                <span className="muted picker-meta">{formatDimensions(p)}</span>
                <span className="picker-price">{formatBaht(p.price)}</span>
                {!p.model_path && <span className="badge">ไม่มีโมเดล 3D · แสดงเป็นกล่อง</span>}
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
        {list.length === 0 && <li className="muted small">ไม่พบสินค้า</li>}
      </ul>
    </div>
  )
}
