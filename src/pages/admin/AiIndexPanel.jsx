import { useCallback, useEffect, useRef, useState } from 'react'
import { publicModelUrl } from '../../lib/supabase.js'
import { fetchProductsMissingEmbedding, saveEmbedding } from '../../lib/products.js'

// สร้างข้อมูล AI (CLIP embedding) จากรูปสินค้า เพื่อให้ลูกค้าค้นหาด้วยรูปเจอ
// ทำใน browser ของแอดมิน อัตโนมัติเมื่อเปิดหน้าจัดการสินค้าหรือบันทึกสินค้า แล้วพบสินค้าที่ยังไม่มีข้อมูล AI
// (เพิ่มใหม่ หรือเปลี่ยนรูป) · ครั้งแรกต้องโหลดโมเดล AI ราว 90 MB · ถ้าล้มเหลวจะไม่ลองซ้ำเอง ให้กดปุ่มเอง
export default function AiIndexPanel({ refreshKey }) {
  const [missing, setMissing] = useState(null)
  const [state, setState] = useState({ running: false, done: 0, total: 0, loadPct: 0 })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const runningRef = useRef(false)
  const autoFailedRef = useRef(false)
  const lastAutoIdsRef = useRef('') // กันลูป: ถ้ารอบก่อนทำชุดเดิมไปแล้วแต่ยังเหลืออยู่ จะไม่ทำซ้ำเอง

  const load = useCallback(async () => {
    try {
      setMissing(await fetchProductsMissingEmbedding())
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  const run = useCallback(async (list, auto = false) => {
    if (runningRef.current || list.length === 0) return
    runningRef.current = true
    if (!auto) autoFailedRef.current = false
    setError('')
    setNotice('')
    setState({ running: true, done: 0, total: list.length, loadPct: 0 })
    try {
      const { imageToEmbedding } = await import('../../lib/clip.js')
      let done = 0
      for (const p of list) {
        const vec = await imageToEmbedding(publicModelUrl(p.thumbnail_url), (pct) =>
          setState((s) => ({ ...s, loadPct: pct })),
        )
        await saveEmbedding(p.id, vec)
        done += 1
        setState((s) => ({ ...s, done, loadPct: 100 }))
      }
      setNotice(`สร้างข้อมูล AI แล้ว ${done} รายการ`)
    } catch (err) {
      console.error(err)
      if (auto) autoFailedRef.current = true
      setError(err.message?.startsWith('บันทึก') ? err.message : 'สร้างข้อมูล AI ไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่')
    } finally {
      runningRef.current = false
      setState((s) => ({ ...s, running: false }))
      load()
    }
  }, [load])

  // มีสินค้าที่ยังไม่มีข้อมูล AI → สร้างให้อัตโนมัติ (ไม่ต้องจำกดปุ่ม)
  useEffect(() => {
    if (!missing?.length || autoFailedRef.current) return
    const ids = missing.map((p) => p.id).join(',')
    if (ids === lastAutoIdsRef.current) return
    lastAutoIdsRef.current = ids
    run(missing, true)
  }, [missing, run])

  if (missing === null && !error) return null

  return (
    <div className="panel ai-panel" data-testid="ai-panel">
      <div>
        <h2 className="panel-title">AI ค้นหาด้วยรูป</h2>
        {missing && missing.length === 0 ? (
          <p className="muted small" data-testid="ai-ready">สินค้าที่มีรูปทุกชิ้นพร้อมให้ค้นหาด้วยรูปแล้ว</p>
        ) : (
          <p className="muted small" data-testid="ai-missing">
            มีสินค้า {missing?.length ?? 0} ชิ้นที่ยังค้นหาด้วยรูปไม่ได้ (เพิ่มใหม่หรือเปลี่ยนรูป)
            {state.running ? ' ระบบกำลังสร้างข้อมูล AI ให้อัตโนมัติ' : ' กดปุ่มเพื่อสร้างข้อมูล AI'}
          </p>
        )}
        {state.running && (
          <p className="small" role="status">
            {state.loadPct < 100
              ? `กำลังโหลด AI... ${Math.round(state.loadPct)}% (ครั้งแรกใช้เวลาสักครู่)`
              : `กำลังสร้างข้อมูล ${state.done} / ${state.total}`}
          </p>
        )}
        {notice && <p className="small check-ok">{notice}</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
      </div>
      {missing && missing.length > 0 && (
        <button type="button" className="btn" onClick={() => run(missing ?? [])} disabled={state.running} data-testid="ai-index">
          {state.running ? 'กำลังทำงาน...' : 'สร้างข้อมูล AI'}
        </button>
      )}
    </div>
  )
}
