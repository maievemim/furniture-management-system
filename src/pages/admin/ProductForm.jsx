import { useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { removeFromModels, uploadToModels, validateGlb, validateImage } from '../../lib/uploads.js'

const EMPTY = { sku: '', name: '', price: '', width_cm: '', depth_cm: '', height_cm: '' }

// ฟอร์มเพิ่ม/แก้ไขสินค้า (product = null คือเพิ่มใหม่)
export default function ProductForm({ product, onSaved, onCancel }) {
  const isNew = !product
  const [form, setForm] = useState(() =>
    isNew ? EMPTY : Object.fromEntries(Object.keys(EMPTY).map((k) => [k, String(product[k] ?? '')])),
  )
  const [glb, setGlb] = useState(null)
  const [image, setImage] = useState(null)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function pickGlb(e) {
    const file = e.target.files[0] ?? null
    const err = await validateGlb(file)
    setErrors((x) => ({ ...x, glb: err }))
    setGlb(err ? null : file)
    if (err) e.target.value = ''
  }

  function pickImage(e) {
    const file = e.target.files[0] ?? null
    const err = validateImage(file)
    setErrors((x) => ({ ...x, image: err }))
    setImage(err ? null : file)
    if (err) e.target.value = ''
  }

  function validate() {
    const e = {}
    if (!/^[A-Za-z0-9-]{2,20}$/.test(form.sku.trim())) e.sku = 'รหัสสินค้าใช้ A-Z, 0-9 และ - ได้ 2–20 ตัว'
    if (!form.name.trim()) e.name = 'กรุณากรอกชื่อสินค้า'
    const price = Number(form.price)
    if (form.price === '' || !Number.isFinite(price) || price < 0) e.price = 'ราคาต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป'
    for (const k of ['width_cm', 'depth_cm', 'height_cm']) {
      const v = Number(form[k])
      if (!Number.isFinite(v) || v <= 0 || v > 1000) e[k] = 'ต้องอยู่ระหว่าง 0.1–1000 ซม.'
    }
    if (isNew && !glb) e.glb = errors.glb || 'กรุณาเลือกไฟล์โมเดล .glb'
    return e
  }

  async function onSubmit(e) {
    e.preventDefault()
    const v = validate()
    setErrors(v)
    if (Object.values(v).some(Boolean)) return
    setSaving(true)
    setFormError('')
    const uploaded = []
    try {
      const sku = form.sku.trim().toUpperCase()
      const row = {
        sku,
        name: form.name.trim(),
        price: Number(form.price),
        width_cm: Number(form.width_cm),
        depth_cm: Number(form.depth_cm),
        height_cm: Number(form.height_cm),
      }
      if (glb) uploaded.push((row.model_path = await uploadToModels('glb', sku, glb)))
      if (image) uploaded.push((row.thumbnail_url = await uploadToModels('thumbs', sku, image)))

      const query = isNew
        ? supabase.from('products').insert(row)
        : supabase.from('products').update(row).eq('id', product.id)
      const { error } = await query
      if (error) {
        await removeFromModels(uploaded)
        if (error.code === '23505') throw new Error('รหัสสินค้านี้มีอยู่แล้ว')
        console.error(error)
        throw new Error('บันทึกสินค้าไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
      }
      // ลบไฟล์เก่าที่ถูกแทนที่
      if (!isNew) {
        await removeFromModels([
          row.model_path && product.model_path !== row.model_path ? product.model_path : null,
          row.thumbnail_url && product.thumbnail_url !== row.thumbnail_url ? product.thumbnail_url : null,
        ])
      }
      onSaved()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="panel admin-form" onSubmit={onSubmit} noValidate data-testid="product-form">
      <h2 className="panel-title">{isNew ? 'เพิ่มสินค้าใหม่' : `แก้ไข ${product.sku}`}</h2>
      <div className="form-grid">
        <Field label="รหัสสินค้า (SKU)" error={errors.sku}>
          <input value={form.sku} onChange={set('sku')} maxLength={20} data-testid="pf-sku" />
        </Field>
        <Field label="ชื่อสินค้า" error={errors.name} wide>
          <input value={form.name} onChange={set('name')} maxLength={120} data-testid="pf-name" />
        </Field>
        <Field label="ราคา (บาท)" error={errors.price}>
          <input type="number" inputMode="decimal" min="0" step="1" value={form.price} onChange={set('price')} data-testid="pf-price" />
        </Field>
        <Field label="กว้าง (ซม.)" error={errors.width_cm}>
          <input type="number" inputMode="decimal" step="0.1" value={form.width_cm} onChange={set('width_cm')} data-testid="pf-width" />
        </Field>
        <Field label="ลึก (ซม.)" error={errors.depth_cm}>
          <input type="number" inputMode="decimal" step="0.1" value={form.depth_cm} onChange={set('depth_cm')} data-testid="pf-depth" />
        </Field>
        <Field label="สูง (ซม.)" error={errors.height_cm}>
          <input type="number" inputMode="decimal" step="0.1" value={form.height_cm} onChange={set('height_cm')} data-testid="pf-height" />
        </Field>
        <Field label={`ไฟล์โมเดล .glb (ไม่เกิน 5 MB)${isNew ? '' : ' — เว้นว่างถ้าไม่เปลี่ยน'}`} error={errors.glb} wide>
          <input type="file" accept=".glb,model/gltf-binary" onChange={pickGlb} data-testid="pf-glb" />
        </Field>
        <Field label={`รูปสินค้า .jpg/.png/.webp (ไม่เกิน 2 MB)${isNew ? '' : ' — เว้นว่างถ้าไม่เปลี่ยน'}`} error={errors.image} wide>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pickImage} data-testid="pf-image" />
        </Field>
      </div>
      <p className="muted small">ขนาดต้องตรงกับสินค้าจริง ระบบจะปรับโมเดลให้มีขนาดเท่านี้เสมอ</p>
      {formError && <p className="form-error" role="alert" data-testid="pf-error">{formError}</p>}
      <div className="btn-row">
        <button type="submit" className="btn" disabled={saving} data-testid="pf-save">
          {saving ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
        <button type="button" className="btn btn-outline" onClick={onCancel} disabled={saving}>ยกเลิก</button>
      </div>
    </form>
  )
}

function Field({ label, error, wide, children }) {
  return (
    <label className={`field${wide ? ' field-wide' : ''}`}>
      <span>{label}</span>
      {children}
      {error && <span className="form-error" role="alert">{error}</span>}
    </label>
  )
}
