import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { isSupabaseConfigured } from '../lib/supabase.js'
import { fetchProducts } from '../lib/products.js'
import ModelViewerDialog from '../components/ModelViewerDialog.jsx'
import ProductCard from '../components/ProductCard.jsx'

// /catalog รายการสินค้าทั้งหมด + ปุ่มดู 3D / AR และวางในห้อง
export default function Catalog() {
  const [products, setProducts] = useState([])
  const [viewing, setViewing] = useState(null) // สินค้าที่เปิดดูแบบ 3D
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [errorMessage, setErrorMessage] = useState('')
  const [query, setQuery] = useState('')

  async function loadProducts() {
    setStatus('loading')
    try {
      setProducts(await fetchProducts())
      setStatus('ready')
    } catch (err) {
      setErrorMessage(err.message)
      setStatus('error')
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
  }, [products, query])

  return (
    <section className="catalog">
      <div className="page-head">
        <div className="page-intro">
          <p className="eyebrow">สินค้าของร้าน</p>
          <h1>แคตตาล็อกสินค้า</h1>
          <p className="muted">
            ทุกชิ้นแสดงขนาดจริง กด "ดู 3D / AR" เพื่อส่องในห้องของคุณ หรือ{' '}
            <Link to="/search">ค้นหาด้วยรูปภาพ</Link>
          </p>
        </div>
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
            <ProductCard key={p.id} product={p} onView={setViewing} />
          ))}
        </ul>
      )}

      {viewing && <ModelViewerDialog product={viewing} onClose={() => setViewing(null)} />}
    </section>
  )
}
