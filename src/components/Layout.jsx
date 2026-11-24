import { Outlet, useLocation } from 'react-router-dom'
import SiteHeader, { SITE_NAME } from './SiteHeader.jsx'

export default function Layout() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  return (
    <div className={`app${isHome ? ' app-home' : ''}`}>
      {/* หน้าแรกวางเมนูไว้บนภาพใหญ่เอง */}
      {!isHome && <SiteHeader />}
      <main className={isHome ? 'main-home' : 'main'}>
        <Outlet />
      </main>
      <footer className="footer">
        <div className="footer-inner">
          <div>
            <strong className="footer-brand">{SITE_NAME}</strong>
            <p className="small">Web-based Virtual Furniture Placement Management System</p>
          </div>
          <p className="small footer-meta">
            โครงงาน ปวช.3/3 ธด. วิทยาลัยอาชีวศึกษานครปฐม
            <br />
            สำหรับ บริษัท เรืองศิลป์เฟอร์นิแลนด์ จำกัด
          </p>
        </div>
      </footer>
    </div>
  )
}
