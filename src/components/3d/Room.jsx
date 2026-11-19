import { useMemo } from 'react'
import * as THREE from 'three'
import { useRoomStore } from '../../store/roomStore.js'

// พื้น + ผนัง 4 ด้านตามขนาดห้อง (เมตร) และเส้นตารางทุก 1 เมตรสำหรับวัดขนาด
// ผนังเป็นระนาบหันหน้าเข้าห้อง: ด้านที่หันหลังให้กล้องจะถูกซ่อนอัตโนมัติ จึงมองเข้ามาในห้องได้เสมอ
export default function Room({ width, length, height }) {
  const select = useRoomStore((s) => s.select)
  const grid = useMemo(() => buildGrid(width, length), [width, length])

  return (
    <group>
      <mesh
        rotation-x={-Math.PI / 2}
        receiveShadow
        onPointerDown={(e) => {
          // คลิกพื้นว่าง = ยกเลิกการเลือก (เฉพาะเมื่อไม่ได้คลิกโดนเฟอร์นิเจอร์)
          if (e.intersections[0]?.object === e.object) select(null)
        }}
        name="floor"
      >
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial color="#d9c7a8" />
      </mesh>

      <lineSegments geometry={grid} position-y={0.002}>
        <lineBasicMaterial color="#8a7a60" transparent opacity={0.45} />
      </lineSegments>

      {/* ผนัง: หลัง, หน้า, ซ้าย, ขวา */}
      <Wall position={[0, height / 2, -length / 2]} rotation={[0, 0, 0]} size={[width, height]} />
      <Wall position={[0, height / 2, length / 2]} rotation={[0, Math.PI, 0]} size={[width, height]} />
      <Wall position={[-width / 2, height / 2, 0]} rotation={[0, Math.PI / 2, 0]} size={[length, height]} />
      <Wall position={[width / 2, height / 2, 0]} rotation={[0, -Math.PI / 2, 0]} size={[length, height]} />
    </group>
  )
}

function Wall({ position, rotation, size }) {
  return (
    <mesh position={position} rotation={rotation} receiveShadow raycast={() => null}>
      <planeGeometry args={size} />
      <meshStandardMaterial color="#f2efe9" side={THREE.FrontSide} />
    </mesh>
  )
}

function buildGrid(width, length) {
  const pts = []
  const hw = width / 2
  const hl = length / 2
  for (let x = -hw; x <= hw + 1e-6; x += 1) pts.push(x, 0, -hl, x, 0, hl)
  for (let z = -hl; z <= hl + 1e-6; z += 1) pts.push(-hw, 0, z, hw, 0, z)
  // เส้นขอบห้องกรณีขนาดไม่ลงตัวเมตร
  pts.push(hw, 0, -hl, hw, 0, hl, -hw, 0, hl, hw, 0, hl)
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
  return g
}
