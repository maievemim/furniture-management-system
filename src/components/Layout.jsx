import { NavLink, Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="app">
      <header className="topbar">
        <NavLink to="/" className="brand">เรืองศิลป์เฟอร์นิแลนด์</NavLink>
        <nav className="nav">
          <NavLink to="/" end data-testid="nav-catalog">แคตตาล็อก</NavLink>
          <NavLink to="/planner" data-testid="nav-planner">จัดห้อง 3D</NavLink>
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
