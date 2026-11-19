import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { useSession } from '../../lib/useSession.js'

// ครอบทุกหน้า /admin/* ยกเว้นหน้าล็อกอิน: ถ้ายังไม่ล็อกอินให้ไปหน้าล็อกอิน
export default function AdminLayout() {
  const { session, loading } = useSession()
  const location = useLocation()

  if (loading) return <p className="muted">กำลังโหลด...</p>
  if (!session) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />

  return (
    <section>
      <div className="page-head admin-head">
        <nav className="subnav">
          <NavLink to="/admin/products" data-testid="admin-nav-products">จัดการสินค้า</NavLink>
          <NavLink to="/admin/report" data-testid="admin-nav-report">รายงานความนิยม</NavLink>
        </nav>
        <div className="admin-user">
          <span className="muted small">{session.user.email}</span>
          <button type="button" className="btn btn-sm btn-outline" onClick={() => supabase.auth.signOut()} data-testid="logout">
            ออกจากระบบ
          </button>
        </div>
      </div>
      <Outlet />
    </section>
  )
}
