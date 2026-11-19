import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../../lib/supabase.js'
import { useSession } from '../../lib/useSession.js'

export default function Login() {
  const { session, loading } = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const goTo = location.state?.from && location.state.from !== '/admin/login' ? location.state.from : '/admin/products'

  if (loading) return <p className="muted">กำลังโหลด...</p>
  if (session) return <Navigate to={goTo} replace />

  async function onSubmit(e) {
    e.preventDefault()
    if (!isSupabaseConfigured) {
      setError('ยังไม่ได้ตั้งค่าการเชื่อมต่อฐานข้อมูล')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) {
        setError(error.status === 400 ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' : 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
        return
      }
      navigate(goTo, { replace: true })
    } catch {
      setError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="login">
      <form className="panel login-form" onSubmit={onSubmit} data-testid="login-form">
        <h1>เข้าสู่ระบบผู้ดูแล</h1>
        <label className="field">
          <span>อีเมล</span>
          <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} data-testid="login-email" />
        </label>
        <label className="field">
          <span>รหัสผ่าน</span>
          <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} data-testid="login-password" />
        </label>
        {error && <p className="form-error" role="alert" data-testid="login-error">{error}</p>}
        <button type="submit" className="btn btn-block" disabled={submitting} data-testid="login-submit">
          {submitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
      </form>
    </section>
  )
}
