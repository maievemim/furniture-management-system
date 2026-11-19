import { useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured, publicModelUrl } from '../lib/supabase.js'
import { formatBaht, formatDimensions } from '../lib/format.js'
import ModelViewerDialog from '../components/ModelViewerDialog.jsx'

export default function Catalog() {
  const [products, setProducts] = useState([])
  const [viewing, setViewing] = useState(null) // สินค้าที่เปิดดูแบบ 3D
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [errorMessage, setErrorMessage] = useState('')
  const [query, setQuery] = useState('')

  async function loadProducts() {
    if (!isSupabaseConfigured) {
      setStatus('error')
      setErrorMessage('ยังไม่ได้ตั้งค่าการเชื่อมต่อฐานข้อมูล (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)')
      return
    }
    setStatus('loading')
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, sku, name, price, width_cm, depth_cm, height_cm, model_path, thumbnail_url')
        .order('name')
      if (error) throw error
      setProducts(data ?? [])
      setStatus('ready')
    } catch (err) {
      console.error(err)
      setErrorMessage('โหลดรายการสินค้าไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่อีกครั้ง')
      setStatus('error')
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
    )
  }, [products, query])

  return (
    <section>
      <div className="page-head">
        <h1>แคตตาล็อกสินค้า</h1>
        <input
          type="search"
          className="search"
          placeholder="ค้นหาชื่อหรือรหัสสินค้า"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          data-testid="catalog-search"
        />
      </div>

      {status === 'loading' && <p className="muted" data-testid="catalog-loading">กำลังโหลด...</p>}

      {status === 'error' && (
        <div className="alert" role="alert" data-testid="catalog-error">
          <p>{errorMessage}</p>
          {isSupabaseConfigured && (
            <button type="button" className="btn" onClick={loadProducts}>ลองใหม่</button>
          )}
        </div>
      )}

      {status === 'ready' && filtered.length === 0 && (
        <p className="muted" data-testid="catalog-empty">
          {products.length === 0 ? 'ยังไม่มีสินค้าในระบบ' : 'ไม่พบสินค้าที่ค้นหา'}
        </p>
      )}

      {status === 'ready' && filtered.length > 0 && (
        <ul className="grid" data-testid="product-list">
          {filtered.map((p) => (
            <li key={p.id} className="card" data-testid="product-card">
              <div className="thumb">
                {p.thumbnail_url ? (
                  <img src={publicModelUrl(p.thumbnail_url)} alt={p.name} loading="lazy" />
                ) : (
                  <span className="muted">ไม่มีรูป</span>
                )}
              </div>
              <div className="card-body">
                <span className="sku">{p.sku}</span>
                <h2 className="name" data-testid="product-name">{p.name}</h2>
                <p className="dims">ขนาด (ก×ล×ส) {formatDimensions(p)}</p>
                <p className="price" data-testid="product-price">{formatBaht(p.price)}</p>
                {p.model_path && (
                  <button
                    type="button"
                    className="btn btn-block"
                    onClick={() => setViewing(p)}
                    data-testid="view-3d"
                  >
                    ดูแบบ 3D
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {viewing && <ModelViewerDialog product={viewing} onClose={() => setViewing(null)} />}
    </section>
  )
}
