import { lazy, Suspense } from 'react'
import { Navigate, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Catalog from './pages/Catalog.jsx'
import NotFound from './pages/NotFound.jsx'

// หน้าที่ใช้ไลบรารี 3D หนักๆ โหลดเมื่อเปิดหน้านั้นเท่านั้น
const RoomPlanner = lazy(() => import('./pages/RoomPlanner.jsx'))
const SharedRoom = lazy(() => import('./pages/SharedRoom.jsx'))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout.jsx'))
const Login = lazy(() => import('./pages/admin/Login.jsx'))
const Products = lazy(() => import('./pages/admin/Products.jsx'))
const Report = lazy(() => import('./pages/admin/Report.jsx'))
const SurveyReport = lazy(() => import('./pages/admin/SurveyReport.jsx'))
const Survey = lazy(() => import('./pages/Survey.jsx'))
const VisualSearch = lazy(() => import('./pages/VisualSearch.jsx'))
const ExpertReview = lazy(() => import('./pages/ExpertReview.jsx'))
const ExpertReport = lazy(() => import('./pages/admin/ExpertReport.jsx'))

export default function App() {
  return (
    <Suspense fallback={<p className="muted page-loading">กำลังโหลด...</p>}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="catalog" element={<Catalog />} />
          <Route path="search" element={<VisualSearch />} />
          <Route path="planner" element={<RoomPlanner />} />
          <Route path="room/:id" element={<SharedRoom />} />
          <Route path="survey" element={<Survey />} />
          <Route path="expert" element={<ExpertReview />} />
          <Route path="admin/login" element={<Login />} />
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="products" replace />} />
            <Route path="products" element={<Products />} />
            <Route path="report" element={<Report />} />
            <Route path="survey" element={<SurveyReport />} />
            <Route path="expert" element={<ExpertReport />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
