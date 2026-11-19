import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section>
      <h1>ไม่พบหน้าที่ต้องการ</h1>
      <p><Link to="/">กลับไปหน้าแคตตาล็อก</Link></p>
    </section>
  )
}
