import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Catalog from './pages/Catalog.jsx'
import RoomPlanner from './pages/RoomPlanner.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Catalog />} />
        <Route path="planner" element={<RoomPlanner />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
