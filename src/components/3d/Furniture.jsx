import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Edges, Html, useGLTF } from '@react-three/drei'
import { publicModelUrl } from '../../lib/supabase.js'
import { formatDimensions } from '../../lib/format.js'
import { useRoomStore } from '../../store/roomStore.js'

const FLOOR = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
const hit = new THREE.Vector3()

// เฟอร์นิเจอร์ 1 ชิ้นในห้อง ขนาดตรง width/depth/height (ซม.) ในฐานข้อมูลเสมอ
// - มีไฟล์ .glb: โหลดโมเดลแล้วบังคับ scale ให้ตรงขนาดจริง
// - ไม่มีไฟล์ .glb: แสดงเป็นกล่องขนาดจริงแทน เพื่อให้ยังประเมินพื้นที่ได้
// ผู้ใช้ย่อ/ขยายไม่ได้ ทำได้แค่ลากบนพื้น (X/Z) และหมุนทีละ 90°
export default function Furniture({ item, product, selected, overlapping = false, readOnly = false }) {
  const moveItem = useRoomStore((s) => s.moveItem)
  const commitItem = useRoomStore((s) => s.commitItem)
  const select = useRoomStore((s) => s.select)
  const setDragging = useRoomStore((s) => s.setDragging)
  const dragOffset = useRef(null)

  const handlers = readOnly
    ? {}
    : {
        onPointerDown: (e) => {
          e.stopPropagation()
          select(item.uid)
          if (!e.ray.intersectPlane(FLOOR, hit)) return
          dragOffset.current = { dx: item.x - hit.x, dz: item.z - hit.z }
          e.target.setPointerCapture(e.pointerId)
          setDragging(true)
        },
        onPointerMove: (e) => {
          if (!dragOffset.current) return
          e.stopPropagation()
          if (!e.ray.intersectPlane(FLOOR, hit)) return
          moveItem(item.uid, hit.x + dragOffset.current.dx, hit.z + dragOffset.current.dz)
        },
        onPointerUp: (e) => {
          if (!dragOffset.current) return
          e.stopPropagation()
          dragOffset.current = null
          e.target.releasePointerCapture?.(e.pointerId)
          setDragging(false)
          commitItem(item.uid) // clamp ตอนปล่อยเมาส์
        },
      }

  const w = product.width_cm / 100
  const d = product.depth_cm / 100
  const h = product.height_cm / 100
  const marker = overlapping ? '#d64535' : '#2f7de1'

  return (
    <group position={[item.x, 0, item.z]} rotation-y={THREE.MathUtils.degToRad(item.rotationY)} {...handlers}>
      {product.model_path ? <GlbModel product={product} /> : <BoxModel w={w} d={d} h={h} />}
      {(selected || overlapping) && (
        <mesh rotation-x={-Math.PI / 2} position-y={0.004} raycast={() => null}>
          <planeGeometry args={[w + 0.06, d + 0.06]} />
          <meshBasicMaterial color={marker} transparent opacity={overlapping ? 0.45 : 0.35} depthWrite={false} />
        </mesh>
      )}
      {selected && !readOnly && (
        <Html position={[0, h + 0.15, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <span className="scene-dims">{formatDimensions(product)}</span>
        </Html>
      )}
    </group>
  )
}

export function GlbModel({ product }) {
  const { scene } = useGLTF(publicModelUrl(product.model_path))

  const { model, scale, offset } = useMemo(() => {
    const model = scene.clone(true)
    model.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true
        o.receiveShadow = true
      }
    })
    const box = new THREE.Box3().setFromObject(model)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const target = new THREE.Vector3(product.width_cm / 100, product.height_cm / 100, product.depth_cm / 100)
    return {
      model,
      scale: [target.x / (size.x || 1), target.y / (size.y || 1), target.z / (size.z || 1)],
      // วางกึ่งกลางฐานไว้ที่จุดกำเนิด และให้ก้นโมเดลแตะพื้นพอดี
      offset: [-center.x, -box.min.y, -center.z],
    }
  }, [scene, product.width_cm, product.height_cm, product.depth_cm])

  return (
    <group scale={scale}>
      <primitive object={model} position={offset} />
    </group>
  )
}

// กล่องแทนสินค้าที่ยังไม่มีโมเดล 3D (ขนาดเท่าของจริง)
function BoxModel({ w, d, h }) {
  return (
    <mesh position-y={h / 2} castShadow receiveShadow>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color="#c9a77c" transparent opacity={0.85} roughness={0.8} />
      <Edges color="#6f4826" />
    </mesh>
  )
}
