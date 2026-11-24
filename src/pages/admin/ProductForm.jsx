import { lazy, Suspense, useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { removeFromModels, uploadToModels, validateGlb, validateImage } from '../../lib/uploads.js'
import { dimsReady, initialTemplateValue } from '../../lib/templateCatalog.js'

// ตัวสร้างโมเดลจากแม่แบบใช้ไลบรารี 3D หนัก โหลดเฉพาะเมื่อเลือกโหมดนี้
const TemplateModelBuilder = lazy(() => import('../../components/TemplateModelBuilder.jsx'))

const EMPTY = { sku: '', name: '', price: '', width_cm: '', depth_cm: '', height_cm: '' }

// ฟอร์มเพิ่ม/แก้ไขสินค้า (product = null คือเพิ่มใหม่)
export default function ProductForm({ product, onSaved, onCancel }) {
  const isNew = !product
  const [form, setForm] = useState(() =>
    isNew ? EMPTY : Object.fromEntries(Object.keys(EMPTY).map((k) => [k, String(product[k] ?? '')])),
  )
  const [glb, setGlb] = useState(null)
  const [image, setImage] = useState(null)
  const [dropModel, setDropModel] = useState(false) // แก้ไข: ลบโมเดลเดิมออก (สินค้าจะแสดงเป็นกล่อง)
  const [modelSource, setModelSource] = useState('file') // file = อัปโหลด .glb · template = สร้างจากแม่แบบ
  const [tpl, setTpl] = useState(() => initialTemplateValue())
  const [savingStep, setSavingStep] = useState('')
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
    // ไฟล์ .glb ไม่บังคับ สินค้าที่ไม่มีโมเดลจะแสดงเป็นกล่องขนาดจริงในห้อง 3D
    if (modelSource === 'file' && errors.glb) e.glb = errors.glb
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
      let modelFile = modelSource === 'file' ? glb : null
      let imageFile = image
      if (modelSource === 'template') {
        // สร้าง .glb และรูปสินค้าจากแม่แบบในเบราว์เซอร์ แล้วอัปโหลดแบบเดียวกับไฟล์ที่เลือกเอง
        setSavingStep('กำลังสร้างโมเดล 3D...')
        const { createTemplateAssets } = await import('../../lib/modelTemplates.js')
        const assets = await createTemplateAssets(tpl, row, sku.toLowerCase())
        const err = await validateGlb(assets.glb)
        if (err) throw new Error(`สร้างโมเดลไม่สำเร็จ: ${err}`)
        modelFile = assets.glb
        if (!imageFile) imageFile = assets.thumbnail // ไม่ได้เลือกรูปเอง → ใช้ภาพจากโมเดล
      }
      setSavingStep('กำลังอัปโหลด...')
      if (modelFile) uploaded.push((row.model_path = await uploadToModels('glb', sku, modelFile)))
      else if (!isNew && dropModel) row.model_path = null
      if (imageFile) {
        uploaded.push((row.thumbnail_url = await uploadToModels('thumbs', sku, imageFile)))
        row.embedding = null // รูปเปลี่ยน: ต้องสร้างข้อมูล AI ค้นหาด้วยรูปใหม่
      }

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
          'model_path' in row && product.model_path !== row.model_path ? product.model_path : null,
          row.thumbnail_url && product.thumbnail_url !== row.thumbnail_url ? product.thumbnail_url : null,
        ])
      }
      onSaved()
    } catch (err) {
      console.error(err)
      setFormError(err.message || 'บันทึกสินค้าไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setSaving(false)
      setSavingStep('')
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
        <div className="field field-wide">
          <span>โมเดล 3D</span>
          <div className="choices" role="radiogroup" aria-label="ที่มาของโมเดล 3D">
            <label className={`chip${modelSource === 'file' ? ' is-on' : ''}`}>
              <input type="radio" name="model-source" checked={modelSource === 'file'} onChange={() => setModelSource('file')} data-testid="pf-source-file" />
              อัปโหลดไฟล์ .glb
            </label>
            <label className={`chip${modelSource === 'template' ? ' is-on' : ''}`}>
              <input type="radio" name="model-source" checked={modelSource === 'template'} onChange={() => setModelSource('template')} data-testid="pf-source-template" />
              สร้างจากแม่แบบ
            </label>
          </div>
        </div>
        {modelSource === 'file' && (
          <Field
            label={`ไฟล์โมเดล .glb (ไม่บังคับ, ไม่เกิน 5 MB)${isNew || !product.model_path ? '' : ' — เว้นว่างถ้าไม่เปลี่ยน'}`}
            error={errors.glb}
            wide
          >
            <input type="file" accept=".glb,model/gltf-binary" onChange={pickGlb} disabled={dropModel} data-testid="pf-glb" />
          </Field>
        )}
        {modelSource === 'template' && (
          <div className="field-full">
            <Suspense fallback={<p className="muted">กำลังโหลด...</p>}>
              <TemplateModelBuilder
                dims={form}
                value={tpl}
                onChange={setTpl}
                onUseSample={(d) => setForm((f) => ({ ...f, width_cm: String(d.width_cm), depth_cm: String(d.depth_cm), height_cm: String(d.height_cm) }))}
              />
            </Suspense>
            <p className="muted small">
              {!isNew && product.model_path ? 'โมเดลเดิมจะถูกแทนที่ด้วยโมเดลจากแม่แบบ · ' : ''}
              ถ้าไม่เลือกรูปสินค้า ระบบจะใช้ภาพจากโมเดลนี้เป็นรูปสินค้าให้อัตโนมัติ
              {!dimsReady(form) && ' · ต้องกรอกขนาดก่อนบันทึก'}
            </p>
          </div>
        )}
        {modelSource === 'file' && !isNew && product.model_path && !glb && (
          <label className="check-inline field-wide">
            <input
              type="checkbox"
              checked={dropModel}
              onChange={(e) => setDropModel(e.target.checked)}
              data-testid="pf-drop-model"
            />
            ลบโมเดล 3D เดิมออก (สินค้าจะแสดงเป็นกล่องขนาดจริง)
          </label>
        )}
        <Field label={`รูปสินค้า .jpg/.png/.webp (ไม่เกิน 2 MB)${isNew ? '' : ' — เว้นว่างถ้าไม่เปลี่ยน'}`} error={errors.image} wide>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pickImage} data-testid="pf-image" />
        </Field>
      </div>
      <p className="muted small">
        ขนาดต้องตรงกับสินค้าจริง ระบบจะปรับโมเดลให้มีขนาดเท่านี้เสมอ ·
        ถ้ายังไม่มีไฟล์ .glb สินค้าจะแสดงเป็นกล่องขนาดจริงในห้อง 3D และยังไม่มีปุ่มดู AR
      </p>
      {formError && <p className="form-error" role="alert" data-testid="pf-error">{formError}</p>}
      <div className="btn-row">
        <button type="submit" className="btn" disabled={saving} data-testid="pf-save">
          {saving ? savingStep || 'กำลังบันทึก...' : 'บันทึก'}
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
