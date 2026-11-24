import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section>
      <h1>ไม่พบหน้าที่ต้องการ</h1>
      <p><Link to="/">กลับหน้าแรก</Link></p>
    </section>
  )
}
