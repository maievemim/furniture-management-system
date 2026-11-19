import { useEffect, useRef, useState } from 'react'
import { publicModelUrl } from '../lib/supabase.js'
import { formatDimensions } from '../lib/format.js'

// หน้าต่างดูโมเดล 3D ของสินค้า 1 ชิ้น (หมุน/ซูมกล้องได้ แต่ขนาดโมเดลคงที่ตามของจริง)
// โหลดไลบรารี model-viewer เฉพาะตอนเปิดครั้งแรก เพื่อไม่ให้หน้าแคตตาล็อกช้า
export default function ModelViewerDialog({ product, onClose }) {
  const dialogRef = useRef(null)
  const viewerRef = useRef(null)
  const [libReady, setLibReady] = useState(Boolean(customElements.get('model-viewer')))
  const [status, setStatus] = useState('loading') // loading | ready | error

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  useEffect(() => {
    if (libReady) return
    import('@google/model-viewer')
      .then(() => setLibReady(true))
      .catch((err) => {
        console.error(err)
        setStatus('error')
      })
  }, [libReady])

  useEffect(() => {
    const el = viewerRef.current
    if (!el) return
    const onLoad = () => setStatus('ready')
    const onError = () => setStatus('error')
    el.addEventListener('load', onLoad)
    el.addEventListener('error', onError)
    return () => {
      el.removeEventListener('load', onLoad)
      el.removeEventListener('error', onError)
    }
  }, [libReady])

  const src = publicModelUrl(product.model_path)

  return (
    <dialog
      ref={dialogRef}
      className="viewer-dialog"
      onClose={onClose}
      onClick={(e) => e.target === dialogRef.current && dialogRef.current.close()}
      data-testid="model-dialog"
    >
      <div className="viewer-head">
        <div>
          <h2 className="viewer-title">{product.name}</h2>
          <p className="muted viewer-dims">ขนาดจริง (ก×ล×ส) {formatDimensions(product)}</p>
        </div>
        <button type="button" className="btn-close" onClick={() => dialogRef.current.close()} aria-label="ปิด">
          ✕
        </button>
      </div>

      <div className="viewer-stage">
        {libReady && (
          <model-viewer
            ref={viewerRef}
            src={src}
            poster={publicModelUrl(product.thumbnail_url) ?? undefined}
            alt={`โมเดล 3D ของ ${product.name}`}
            camera-controls=""
            touch-action="pan-y"
            shadow-intensity="1"
            ar=""
            ar-modes="webxr scene-viewer quick-look"
            ar-scale="fixed"
            data-testid="model-viewer"
            data-status={status}
          >
            <button slot="ar-button" className="btn ar-btn" type="button">ดูในห้องจริง (AR)</button>
          </model-viewer>
        )}
        {status === 'loading' && <p className="viewer-msg" data-testid="model-loading">กำลังโหลด...</p>}
        {status === 'error' && (
          <p className="viewer-msg alert" role="alert">โหลดโมเดล 3D ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง</p>
        )}
      </div>
      <p className="muted viewer-hint">ลากเพื่อหมุน · ใช้สองนิ้วหรือล้อเมาส์เพื่อซูมกล้อง</p>
    </dialog>
  )
}
