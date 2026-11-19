import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Catalog from './pages/Catalog.jsx'
import NotFound from './pages/NotFound.jsx'

// หน้าที่ใช้ไลบรารี 3D หนักๆ โหลดเมื่อเปิดหน้านั้นเท่านั้น
const RoomPlanner = lazy(() => import('./pages/RoomPlanner.jsx'))
const SharedRoom = lazy(() => import('./pages/SharedRoom.jsx'))

export default function App() {
  return (
    <Suspense fallback={<p className="muted page-loading">กำลังโหลด...</p>}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Catalog />} />
          <Route path="planner" element={<RoomPlanner />} />
          <Route path="room/:id" element={<SharedRoom />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
