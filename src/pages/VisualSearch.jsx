import { useEffect, useRef, useState } from 'react'
import { searchByEmbedding } from '../lib/products.js'
import ModelViewerDialog from '../components/ModelViewerDialog.jsx'
import ProductCard from '../components/ProductCard.jsx'

const MAX_SEARCH_IMAGE = 10 * 1024 * 1024 // รูปที่ใช้ค้นหาไม่ถูกอัปโหลดขึ้นเซิร์ฟเวอร์ จึงยอมให้ใหญ่กว่ารูปสินค้า
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// เกณฑ์ "คล้าย" (cosine similarity ของ CLIP) วัดจากการทดสอบจริง:
// รูปชิ้นเดียวกับสินค้าได้ ~0.72–0.84 ส่วนสินค้าคนละประเภทได้ ~0.45–0.58
const MIN_SIMILARITY = 0.62
const MAX_GAP_FROM_BEST = 0.1 // ต่ำกว่าอันดับ 1 เกินนี้ ถือว่าไม่ใช่ของแบบเดียวกัน

// แยกผลเป็น "คล้ายจริง" กับ "สินค้าอื่นที่อาจสนใจ" (ผลเรียงจากคล้ายมากไปน้อยอยู่แล้ว)
function splitMatches(results) {
  const best = results[0]?.similarity ?? 0
  const isMatch = (p) => p.similarity >= MIN_SIMILARITY && p.similarity >= best - MAX_GAP_FROM_BEST
  return { matches: results.filter(isMatch), others: results.filter((p) => !isMatch(p)) }
}

// /search ค้นหาสินค้าด้วยรูป: ถ่ายหรือเลือกรูปเฟอร์นิเจอร์ → AI (CLIP ใน browser) หาสินค้าที่หน้าตาคล้ายที่สุด 6 อันดับ
// รูปของลูกค้าไม่ถูกส่งออกจากเครื่อง ส่งไปแค่ตัวเลข 512 ค่าเพื่อเทียบกับสินค้า
export default function VisualSearch() {
  const [ai, setAi] = useState({ status: 'loading', pct: 0 }) // loading | ready | error
  const [preview, setPreview] = useState(null)
  const [status, setStatus] = useState('idle') // idle | searching | done | error
  const [results, setResults] = useState([])
  const [error, setError] = useState('')
  const [viewing, setViewing] = useState(null)
  const cameraRef = useRef(null)
  const fileRef = useRef(null)
  const clipRef = useRef(null)

  // โหลดโมเดล AI ทันทีที่เปิดหน้านี้ (เฉพาะหน้านี้เท่านั้น)
  useEffect(() => {
    let active = true
    import('../lib/clip.js')
      .then((clip) => {
        clipRef.current = clip
        return clip.loadClip((pct) => active && setAi((s) => (s.status === 'loading' ? { ...s, pct } : s)))
      })
      .then(() => active && setAi({ status: 'ready', pct: 100 }))
      .catch((err) => {
        console.error(err)
        if (active) setAi({ status: 'error', pct: 0 })
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview])

  async function onPick(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const err = !IMAGE_TYPES.includes(file.type)
      ? 'รองรับเฉพาะรูป .jpg, .png หรือ .webp'
      : file.size > MAX_SEARCH_IMAGE
        ? 'รูปใหญ่เกิน 10 MB กรุณาเลือกรูปอื่น'
        : null
    if (err) {
      setError(err)
      setStatus('error')
      return
    }
    setPreview(URL.createObjectURL(file))
    setResults([])
    setError('')
    setStatus('searching')
    try {
      const clip = clipRef.current ?? (await import('../lib/clip.js'))
      let vec
      try {
        vec = await clip.imageToEmbedding(file)
      } catch (e2) {
        console.error(e2)
        throw new Error('อ่านรูปนี้ไม่ได้ กรุณาลองรูปอื่น (รองรับ .jpg, .png, .webp)')
      }
      const list = await searchByEmbedding(vec, 6)
      setResults(list)
      setStatus('done')
    } catch (err2) {
      setError(err2.message)
      setStatus('error')
    }
  }

  const busy = status === 'searching'
  const { matches, others } = splitMatches(results)

  return (
    <section className="vsearch">
      <div className="page-intro">
        <p className="eyebrow">ค้นหาด้วย AI</p>
        <h1>ค้นหาด้วยรูปภาพ</h1>
        <p className="muted">
          ถ่ายหรือเลือกรูปเฟอร์นิเจอร์ที่ชอบ ระบบจะหาสินค้าในร้านที่หน้าตาคล้ายที่สุดให้ · รูปของคุณไม่ถูกอัปโหลดออกจากเครื่อง
        </p>
      </div>

      <div className="vsearch-top">
        <div className="panel vsearch-drop">
          <div className={`vsearch-preview${preview ? ' has-image' : ''}`}>
            {preview ? (
              <img src={preview} alt="รูปที่ใช้ค้นหา" data-testid="search-preview" />
            ) : (
              <p className="muted">ยังไม่ได้เลือกรูป</p>
            )}
            {busy && <span className="vsearch-scan" aria-hidden="true" />}
          </div>
          <div className="btn-row center">
            <button type="button" className="btn btn-pill" onClick={() => cameraRef.current.click()} disabled={busy}>
              ถ่ายรูป
            </button>
            <button type="button" className="btn btn-pill btn-outline" onClick={() => fileRef.current.click()} disabled={busy}>
              เลือกจากเครื่อง
            </button>
          </div>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={onPick} />
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={onPick}
            data-testid="search-file"
          />
        </div>

        <div className="panel vsearch-status" data-testid="ai-status" data-status={ai.status}>
          <h2 className="panel-title">สถานะ AI</h2>
          {ai.status === 'loading' && (
            <>
              <p className="small">กำลังโหลด AI... {Math.round(ai.pct)}%</p>
              <div className="meter"><span style={{ width: `${ai.pct}%` }} /></div>
              <p className="muted small">ครั้งแรกต้องดาวน์โหลดราว 90 MB ครั้งต่อไปจะเร็วขึ้น เลือกรูปรอไว้ได้เลย</p>
            </>
          )}
          {ai.status === 'ready' && <p className="check-ok small">✓ พร้อมค้นหา</p>}
          {ai.status === 'error' && (
            <p className="form-error">โหลด AI ไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ต หรือใช้ Chrome / Safari รุ่นใหม่ แล้วรีเฟรชหน้า</p>
          )}
          <ol className="mini-steps">
            <li>ถ่ายหรือเลือกรูปที่เห็นเฟอร์นิเจอร์ชัดๆ ชิ้นเดียว</li>
            <li>รอ AI เทียบกับสินค้าในร้าน</li>
            <li>กดดู AR หรือวางในห้องได้ทันที</li>
          </ol>
        </div>
      </div>

      {busy && <p className="muted" role="status" data-testid="search-busy">กำลังค้นหาสินค้าที่คล้าย...</p>}
      {status === 'error' && <div className="alert" role="alert" data-testid="search-error">{error}</div>}

      {status === 'done' && (
        <div className="vsearch-results">
          <h2 className="section-title">สินค้าที่คล้ายที่สุด</h2>
          {matches.length === 0 ? (
            <p className="muted" data-testid="search-empty">
              ไม่พบสินค้าที่คล้ายกับรูปนี้ในร้าน ลองถ่ายให้เห็นเฟอร์นิเจอร์ชิ้นเดียวชัดๆ หรือดูสินค้าอื่นด้านล่าง
            </p>
          ) : (
            <ul className="grid" data-testid="search-results">
              {matches.map((p) => (
                <ProductCard key={p.id} product={p} onView={setViewing} similarity={p.similarity} />
              ))}
            </ul>
          )}
          {others.length > 0 && (
            <>
              <h2 className="section-title vsearch-others-title">สินค้าอื่นที่อาจสนใจ</h2>
              <ul className="grid" data-testid="search-others">
                {others.map((p) => (
                  <ProductCard key={p.id} product={p} onView={setViewing} similarity={p.similarity} />
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {viewing && <ModelViewerDialog product={viewing} onClose={() => setViewing(null)} />}
    </section>
  )
}
