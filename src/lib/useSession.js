import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'

// คืน { session, loading } และอัปเดตอัตโนมัติเมื่อล็อกอิน/ออกจากระบบ
export function useSession() {
  const [state, setState] = useState({ session: null, loading: Boolean(supabase) })

  useEffect(() => {
    if (!supabase) return
    let active = true
    supabase.auth
      .getSession()
      .then(({ data }) => active && setState({ session: data.session, loading: false }))
      .catch(() => active && setState({ session: null, loading: false }))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ session, loading: false })
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return state
}
