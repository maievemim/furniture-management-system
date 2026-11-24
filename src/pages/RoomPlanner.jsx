import { useEffect, useState } from 'react'
import RoomScene from '../components/3d/RoomScene.jsx'
import RoomSizeForm from '../components/planner/RoomSizeForm.jsx'
import ProductPicker from '../components/planner/ProductPicker.jsx'
import SelectedPanel from '../components/planner/SelectedPanel.jsx'
import RoomCheck from '../components/planner/RoomCheck.jsx'
import Bom from '../components/planner/Bom.jsx'
import SaveRoom from '../components/planner/SaveRoom.jsx'
import { fetchProducts } from '../lib/products.js'
import { useRoomStore } from '../store/roomStore.js'

export default function RoomPlanner() {
  const setProducts = useRoomStore((s) => s.setProducts)
  const room = useRoomStore((s) => s.room)
  const [products, setList] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchProducts()
      .then((list) => {
        if (cancelled) return
        setList(list)
        setProducts(list)
      })
      .catch((err) => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [setProducts])

  return (
    <section>
      <div className="page-intro">
        <p className="eyebrow">3 ขั้นตอน · ขนาดห้อง → วางเฟอร์นิเจอร์ → บันทึกและแชร์</p>
        <h1>จัดห้อง 3D</h1>
        <p className="muted">กำหนดขนาดห้องจริง วางเฟอร์นิเจอร์ขนาดเท่าของจริง แล้วดูราคารวมได้ทันที</p>
      </div>
      {error && <div className="alert" role="alert">{error}</div>}
      <div className="planner">
        <aside className="planner-side">
          <RoomSizeForm step="1" />
          <ProductPicker products={products} step="2" />
        </aside>
        <div className="planner-main">
          <p className="muted small room-caption" data-testid="room-caption">
            {room.name} · {room.width} × {room.length} ม. สูง {room.height} ม. · ตารางพื้นช่องละ 1 เมตร
          </p>
          <RoomScene />
          <SelectedPanel />
          <div className="planner-bottom">
            <Bom />
            <div className="planner-stack">
              <RoomCheck />
              <SaveRoom step="3" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
