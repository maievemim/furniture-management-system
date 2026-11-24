import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { buildTemplate, fitCamera } from '../lib/modelTemplates.js'
import { COLORS, TEMPLATES, dimsReady, initialTemplateValue, templateById } from '../lib/templateCatalog.js'

// เลือกแม่แบบ + ปรับตัวเลือก + สี แล้วดูตัวอย่าง 3D ตามขนาดในฟอร์ม
// value = { templateId, options, colors: { body, accent }, frontFile }
export default function TemplateModelBuilder({ dims, value, onChange, onUseSample }) {
  const tpl = templateById(value.templateId)
  const ready = dimsReady(dims)

  function pickTemplate(id) {
    onChange(initialTemplateValue(id))
  }
  const setOption = (key, v) => onChange({ ...value, options: { ...value.options, [key]: v } })
  const setColor = (part, key) => onChange({ ...value, colors: { ...value.colors, [part]: key } })

  return (
    <div className="tpl" data-testid="tpl-builder">
      <div className="tpl-list" role="radiogroup" aria-label="แม่แบบเฟอร์นิเจอร์">
        {TEMPLATES.map((t) => (
          <label key={t.id} className={`tpl-card${t.id === value.templateId ? ' is-on' : ''}`}>
            <input
              type="radio"
              name="tpl"
              checked={t.id === value.templateId}
              onChange={() => pickTemplate(t.id)}
              data-testid={`tpl-${t.id}`}
            />
            <strong>{t.label}</strong>
            <span className="muted">{t.hint}</span>
          </label>
        ))}
      </div>

      <div className="tpl-body">
        <div className="tpl-controls">
          {tpl.options.map((o) => (
            <div key={o.key} className="choice-group">
              <span className="choice-label">{o.label}</span>
              {o.type === 'count' ? (
                <div className="stepper">
                  <button type="button" className="btn btn-sm btn-outline" onClick={() => setOption(o.key, Math.max(o.min, value.options[o.key] - 1))} aria-label={`ลด${o.label}`}>
                    −
                  </button>
                  <strong data-testid={`tpl-opt-${o.key}`}>{value.options[o.key]}</strong>
                  <button type="button" className="btn btn-sm btn-outline" onClick={() => setOption(o.key, Math.min(o.max, value.options[o.key] + 1))} aria-label={`เพิ่ม${o.label}`}>
                    +
                  </button>
                </div>
              ) : (
                <div className="choices">
                  {o.choices.map(([v, label]) => (
                    <label key={v} className={`chip${value.options[o.key] === v ? ' is-on' : ''}`}>
                      <input type="radio" name={`tpl-${o.key}`} checked={value.options[o.key] === v} onChange={() => setOption(o.key, v)} />
                      {label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}

          <ColorPicker label="วัสดุหลัก" value={value.colors.body} onChange={(k) => setColor('body', k)} name="body" />
          <ColorPicker label="วัสดุรอง (ขา/โครง/มือจับ)" value={value.colors.accent} onChange={(k) => setColor('accent', k)} name="accent" />

          {tpl.frontImage && (
            <label className="field">
              <span>รูปหน้าตู้ (ไม่บังคับ) ครอปให้เหลือเฉพาะหน้าตู้ก่อน ระบบจะแปะเต็มหน้าตู้</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => onChange({ ...value, frontFile: e.target.files[0] ?? null })}
                data-testid="tpl-front"
              />
            </label>
          )}
        </div>

        <div className="tpl-preview" data-testid="tpl-preview" data-ready={ready ? '1' : '0'}>
          {ready ? (
            <Canvas dpr={[1, 2]} camera={{ fov: 30 }} gl={{ preserveDrawingBuffer: true }}>
              <color attach="background" args={['#efe7dc']} />
              <hemisphereLight args={['#ffffff', '#b8a98f', 1.3]} />
              <directionalLight position={[2, 4, 3]} intensity={1.6} />
              <Suspense fallback={null}>
                <PreviewModel dims={dims} value={value} />
              </Suspense>
              <OrbitControls makeDefault enablePan={false} />
            </Canvas>
          ) : (
            <div className="tpl-empty">
              <p>กรอก กว้าง ลึก สูง (ซม.) ก่อน เพื่อดูตัวอย่างขนาดจริง</p>
              <button type="button" className="btn btn-sm" onClick={() => onUseSample(tpl.sample)} data-testid="tpl-sample">
                ใช้ขนาดตัวอย่าง {tpl.sample.width_cm} × {tpl.sample.depth_cm} × {tpl.sample.height_cm} ซม.
              </button>
            </div>
          )}
          {ready && <span className="tpl-dims">{Number(dims.width_cm)} × {Number(dims.depth_cm)} × {Number(dims.height_cm)} ซม. · ลากเพื่อหมุน</span>}
        </div>
      </div>
    </div>
  )
}

function ColorPicker({ label, value, onChange, name }) {
  return (
    <div className="choice-group">
      <span className="choice-label">{label}</span>
      <div className="choices">
        {Object.entries(COLORS).map(([k, c]) => (
          <label key={k} className={`chip swatch${value === k ? ' is-on' : ''}`} title={c.label}>
            <input type="radio" name={`tpl-color-${name}`} checked={value === k} onChange={() => onChange(k)} />
            <span className="swatch-dot" style={{ background: c.hex }} aria-hidden="true" />
            {c.label}
          </label>
        ))}
      </div>
    </div>
  )
}

function PreviewModel({ dims, value }) {
  const texture = useFileTexture(value.frontFile)
  const { camera, controls } = useThree()
  const group = useMemo(
    () => buildTemplate(value.templateId, dims, value.options, value.colors, value.templateId === 'cabinet' ? texture : null),
    [value.templateId, value.options, value.colors, texture, dims],
  )

  // คืนหน่วยความจำ GPU ของโมเดลเก่าเมื่อเปลี่ยนแบบ (ยกเว้นลายไม้ที่ใช้ร่วมกัน)
  useEffect(
    () => () =>
      group.traverse((o) => {
        if (o.isMesh) {
          o.geometry.dispose()
          o.material.dispose()
        }
      }),
    [group],
  )

  // จัดกล้องให้เห็นเต็มเฟรมเมื่อเปลี่ยนแม่แบบหรือขนาด (ไม่รีเซ็ตเมื่อเปลี่ยนแค่สี)
  // รอให้ OrbitControls พร้อมก่อน ไม่อย่างนั้นมันจะหันกล้องกลับไปที่จุด 0,0,0 (พื้น)
  const fitKey = controls ? `${value.templateId}|${dims.width_cm}|${dims.depth_cm}|${dims.height_cm}` : ''
  const lastFit = useRef('')
  useEffect(() => {
    if (!fitKey || lastFit.current === fitKey) return
    lastFit.current = fitKey
    const fit = fitCamera(group, 1)
    camera.position.copy(fit.position)
    const center = new THREE.Box3().setFromObject(group).getCenter(new THREE.Vector3())
    controls.target.copy(center)
    controls.update()
  }, [fitKey, group, camera, controls])

  return <primitive object={group} />
}

// แปลงไฟล์รูปที่ผู้ใช้เลือกเป็น texture (null ถ้าไม่มี)
function useFileTexture(file) {
  const [texture, setTexture] = useState(null)
  useEffect(() => {
    if (!file) {
      setTexture(null)
      return
    }
    const url = URL.createObjectURL(file)
    let alive = true
    let loaded = null
    new THREE.TextureLoader().load(url, (t) => {
      loaded = t
      if (alive) setTexture(t)
    })
    return () => {
      alive = false
      URL.revokeObjectURL(url)
      loaded?.dispose()
    }
  }, [file])
  return texture
}
