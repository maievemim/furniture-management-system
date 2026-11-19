import { useEffect, useState } from 'react'
import RoomScene from '../components/3d/RoomScene.jsx'
import RoomSizeForm from '../components/planner/RoomSizeForm.jsx'
import ProductPicker from '../components/planner/ProductPicker.jsx'
import SelectedPanel from '../components/planner/SelectedPanel.jsx'
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
      <h1>จัดห้อง 3D</h1>
      {error && <div className="alert" role="alert">{error}</div>}
      <div className="planner">
        <aside className="planner-side">
          <RoomSizeForm />
          <ProductPicker products={products} />
        </aside>
        <div className="planner-main">
          <p className="muted small room-caption" data-testid="room-caption">
            {room.name} · {room.width} × {room.length} ม. สูง {room.height} ม. · ตารางพื้นช่องละ 1 เมตร
          </p>
          <RoomScene />
          <SelectedPanel />
          <div className="planner-bottom">
            <Bom />
            <SaveRoom />
          </div>
        </div>
      </div>
    </section>
  )
}
