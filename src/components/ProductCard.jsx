import { useNavigate } from 'react-router-dom'
import { publicModelUrl } from '../lib/supabase.js'
import { formatBaht, formatDimensions } from '../lib/format.js'
import { useRoomStore } from '../store/roomStore.js'

// การ์ดสินค้า 1 ชิ้น ใช้ทั้งแคตตาล็อกและผลค้นหาด้วยรูป
// onView: เปิดหน้าต่างดู 3D / AR (แสดงเฉพาะสินค้าที่มีโมเดล) · similarity: 0–1 (ผลค้นหาด้วยรูป)
export default function ProductCard({ product: p, onView, similarity }) {
  const navigate = useNavigate()
  const setStoreProducts = useRoomStore((s) => s.setProducts)
  const addItem = useRoomStore((s) => s.addItem)

  function placeInRoom() {
    setStoreProducts([p])
    addItem(p.id)
    navigate('/planner')
  }

  return (
    <li className="card" data-testid="product-card">
      <div className="thumb">
        {p.thumbnail_url ? (
          <img src={publicModelUrl(p.thumbnail_url)} alt={p.name} loading="lazy" />
        ) : (
          <span className="muted small">ยังไม่มีรูปสินค้า</span>
        )}
        {!p.model_path && <span className="thumb-tag" data-testid="no-model-tag">ยังไม่มีโมเดล 3D</span>}
        {similarity !== undefined && (
          <span className="thumb-tag thumb-tag-match" data-testid="similarity">
            คล้าย {Math.round(Math.max(0, similarity) * 100)}%
          </span>
        )}
      </div>
      <div className="card-body">
        <span className="sku">{p.sku}</span>
        <h2 className="name" data-testid="product-name">{p.name}</h2>
        <p className="dims">ขนาด (ก×ล×ส) {formatDimensions(p)}</p>
        <p className="price" data-testid="product-price">{formatBaht(p.price)}</p>
        <div className={`card-actions${p.model_path ? '' : ' card-actions-single'}`}>
          {p.model_path && (
            <button type="button" className="btn btn-outline" onClick={() => onView(p)} data-testid="view-3d">
              ดู 3D / AR
            </button>
          )}
          <button type="button" className="btn" onClick={placeInRoom} data-testid="place-in-room">
            วางในห้อง
          </button>
        </div>
      </div>
    </li>
  )
}
