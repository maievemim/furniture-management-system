# แหล่งที่มาของโมเดล 3D

ใช้เฉพาะไลเซนส์ CC0 หรือ CC-BY ไฟล์ .glb แต่ละไฟล์ต้องไม่เกิน 5 MB หลังบีบด้วย gltf-transform

## สินค้าตัวอย่าง (สัปดาห์ที่ 1)

โมเดลและรูปทั้งหมดมาจาก [Poly Haven](https://polyhaven.com) ไลเซนส์ **CC0** (ใช้ได้ฟรีโดยไม่ต้องให้เครดิต แต่บันทึกไว้เพื่ออ้างอิงในเล่ม)
ชื่อและราคาสินค้าเป็นค่าตัวอย่าง ไม่ใช่สินค้าจริงของร้าน

| SKU | ไฟล์ใน bucket `models` | โมเดลต้นฉบับ | ผู้สร้าง | ลิงก์ | ไลเซนส์ | ขนาดไฟล์ |
| --- | --- | --- | --- | --- | --- | --- |
| SF-001 | glb/sf-001.glb | Sofa 02 | Poly Haven | https://polyhaven.com/a/sofa_02 | CC0 | 165 KB |
| TB-001 | glb/tb-001.glb | Modern Coffee Table 01 | Poly Haven | https://polyhaven.com/a/modern_coffee_table_01 | CC0 | 164 KB |
| BD-001 | glb/bd-001.glb | Gothic Bed 01 | Poly Haven | https://polyhaven.com/a/GothicBed_01 | CC0 | 392 KB |
| SH-001 | glb/sh-001.glb | Drawer Cabinet | Poly Haven | https://polyhaven.com/a/drawer_cabinet | CC0 | 242 KB |
| CH-001 | glb/ch-001.glb | Dining Chair 02 | Poly Haven | https://polyhaven.com/a/dining_chair_02 | CC0 | 259 KB |

ขั้นตอนที่ใช้: ดาวน์โหลด glTF ความละเอียด 1k → แปลงเป็น .glb และบีบ texture เป็น WebP 1024px
รูปสินค้า (`thumbs/*.webp`, กว้าง 480px) คือภาพ render ของ Poly Haven

## คำสั่งบีบไฟล์

```bash
npx @gltf-transform/cli optimize input.gltf output.glb --texture-compress webp --texture-size 1024
```

แหล่งโมเดลฟรีอื่นๆ: Kenney Furniture Kit (CC0), Sketchfab (กรอง Downloadable + CC-BY/CC0)
