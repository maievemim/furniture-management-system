import { NavLink } from 'react-router-dom'

export const SITE_NAME = 'ระบบการจัดการการวางเฟอร์นิเจอร์เสมือนจริง'

// เมนูหลัก ใช้ทุกหน้า · overlay = วางทับภาพใหญ่ในหน้าแรก (พื้นโปร่ง ตัวอักษรเข้ม)
export default function SiteHeader({ overlay = false }) {
  return (
    <header className={overlay ? 'topbar topbar-overlay' : 'topbar'}>
      <div className="topbar-inner">
        <NavLink to="/" className="brand" aria-label={`${SITE_NAME} หน้าแรก`} data-testid="brand">
          <span className="brand-sub">ระบบการจัดการการวาง</span>
          <span className="brand-mark">เฟอร์นิเจอร์เสมือนจริง</span>
        </NavLink>
        <nav className="nav" aria-label="เมนูหลัก">
          <NavLink to="/catalog" data-testid="nav-catalog">สินค้า</NavLink>
          <NavLink to="/search" data-testid="nav-search">ค้นหาด้วยรูป</NavLink>
          <NavLink to="/planner" data-testid="nav-planner">จัดห้อง 3D</NavLink>
          <NavLink to="/survey" data-testid="nav-survey">แบบประเมิน</NavLink>
        </nav>
        <NavLink to="/admin" className="nav-admin" data-testid="nav-admin">ผู้ดูแล</NavLink>
      </div>
    </header>
  )
}
