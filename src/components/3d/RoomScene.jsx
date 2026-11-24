import { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { Html, OrbitControls, useProgress } from '@react-three/drei'
import Room from './Room.jsx'
import Furniture from './Furniture.jsx'
import { useRoomStore } from '../../store/roomStore.js'
import { findOverlaps } from '../../lib/geometry.js'

export default function RoomScene({ readOnly = false }) {
  const room = useRoomStore((s) => s.room)
  const items = useRoomStore((s) => s.items)
  const products = useRoomStore((s) => s.products)
  const selectedUid = useRoomStore((s) => s.selectedUid)
  const dragging = useRoomStore((s) => s.dragging)

  const span = Math.max(room.width, room.length)
  const overlaps = useMemo(() => findOverlaps(items, products), [items, products])

  return (
    <div
      className="scene-wrap"
      data-testid="room-scene"
      // ตำแหน่งเฟอร์นิเจอร์ (เมตร) ให้ E2E test ตรวจว่าไม่หลุดนอกห้อง
      data-items={JSON.stringify(items.map((it) => ({ sku: products[it.productId]?.sku, x: it.x, z: it.z, r: it.rotationY })))}
    >
      <Canvas shadows dpr={[1, 2]} camera={{ position: [span * 0.9, span * 1.1, span * 1.3], fov: 45 }}>
        <color attach="background" args={['#efe8de']} />
        <hemisphereLight args={['#ffffff', '#b8a98f', 1.4]} />
        <ambientLight intensity={0.35} />
        <directionalLight
          position={[room.width, room.height * 2.5, room.length]}
          intensity={1.4}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-span}
          shadow-camera-right={span}
          shadow-camera-top={span}
          shadow-camera-bottom={-span}
        />

        <Room width={room.width} length={room.length} height={room.height} />

        {items.map((item) => {
          const product = products[item.productId]
          if (!product) return null
          return (
            <Suspense key={item.uid} fallback={<LoadingLabel x={item.x} z={item.z} />}>
              <Furniture
                item={item}
                product={product}
                selected={item.uid === selectedUid}
                overlapping={overlaps.has(item.uid)}
                readOnly={readOnly}
              />
            </Suspense>
          )
        })}

        <OrbitControls
          makeDefault
          enabled={!dragging}
          target={[0, 0, 0]}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={1}
          maxDistance={span * 4}
        />
      </Canvas>
      <ProgressOverlay />
    </div>
  )
}

function LoadingLabel({ x, z }) {
  return (
    <Html position={[x, 0.3, z]} center>
      <span className="scene-loading">กำลังโหลด...</span>
    </Html>
  )
}

function ProgressOverlay() {
  const { active, progress } = useProgress()
  if (!active) return null
  return (
    <div className="scene-overlay" data-testid="scene-loading">
      กำลังโหลด... {Math.round(progress)}%
    </div>
  )
}
