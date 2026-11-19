import { useCallback, useEffect, useState } from 'react'
import { supabase, publicModelUrl } from '../../lib/supabase.js'
import { fetchProducts } from '../../lib/products.js'
import { removeFromModels } from '../../lib/uploads.js'
import { formatBaht, formatDimensions } from '../../lib/format.js'
import ProductForm from './ProductForm.jsx'

export default function Products() {
  const [products, setProducts] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editing, setEditing] = useState(undefined) // undefined = ปิดฟอร์ม, null = เพิ่มใหม่, object = แก้ไข

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      setProducts(await fetchProducts())
      setStatus('ready')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function remove(p) {
    if (!window.confirm(`ลบสินค้า "${p.name}" (${p.sku}) ใช่หรือไม่?`)) return
    setError('')
    setNotice('')
    try {
      const { error } = await supabase.from('products').delete().eq('id', p.id)
      if (error) {
        if (error.code === '23503') throw new Error('ลบไม่ได้ เพราะสินค้านี้ถูกวางอยู่ในห้องที่ลูกค้าบันทึกไว้')
        console.error(error)
        throw new Error('ลบสินค้าไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
      }
      await removeFromModels([p.model_path, p.thumbnail_url])
      setNotice(`ลบ ${p.sku} แล้ว`)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  function saved() {
    setNotice(editing ? `บันทึก ${editing.sku} แล้ว` : 'เพิ่มสินค้าแล้ว')
    setEditing(undefined)
    load()
  }

  return (
    <div className="admin-page">
      <div className="page-head">
        <h1>จัดการสินค้า</h1>
        {editing === undefined && (
          <button type="button" className="btn" onClick={() => { setNotice(''); setEditing(null) }} data-testid="add-product">
            + เพิ่มสินค้า
          </button>
        )}
      </div>

      {editing !== undefined && (
        <ProductForm key={editing?.id ?? 'new'} product={editing} onSaved={saved} onCancel={() => setEditing(undefined)} />
      )}

      {notice && <p className="notice" role="status" data-testid="admin-notice">{notice}</p>}
      {error && <div className="alert" role="alert" data-testid="admin-error">{error}</div>}
      {status === 'loading' && <p className="muted">กำลังโหลด...</p>}

      {status === 'ready' && (
        <div className="panel table-scroll">
          <table className="table admin-table" data-testid="admin-products">
            <thead>
              <tr>
                <th>รูป</th>
                <th>รหัส</th>
                <th>ชื่อสินค้า</th>
                <th>ขนาด (ก×ล×ส)</th>
                <th className="num">ราคา</th>
                <th>โมเดล</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} data-testid="admin-product-row">
                  <td>
                    {p.thumbnail_url ? <img className="admin-thumb" src={publicModelUrl(p.thumbnail_url)} alt="" /> : '—'}
                  </td>
                  <td>{p.sku}</td>
                  <td>{p.name}</td>
                  <td>{formatDimensions(p)}</td>
                  <td className="num">{formatBaht(p.price)}</td>
                  <td>{p.model_path ? '✓' : <span className="form-error">ไม่มี</span>}</td>
                  <td>
                    <div className="btn-row">
                      <button type="button" className="btn btn-sm" onClick={() => { setNotice(''); setEditing(p) }}>แก้ไข</button>
                      <button type="button" className="btn btn-sm btn-danger" onClick={() => remove(p)}>ลบ</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
