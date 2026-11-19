# แหล่งที่มาของโมเดล 3D

ใช้เฉพาะไลเซนส์ CC0 หรือ CC-BY ไฟล์ .glb แต่ละไฟล์ต้องไม่เกิน 5 MB หลังบีบด้วย gltf-transform

| SKU | ไฟล์ใน bucket `models` | ชื่อโมเดลต้นฉบับ | ผู้สร้าง | ลิงก์ | ไลเซนส์ | ขนาดไฟล์ |
| --- | --- | --- | --- | --- | --- | --- |
| SF-001 | glb/sf-001.glb | | | | | |
| TB-001 | glb/tb-001.glb | | | | | |
| BD-001 | glb/bd-001.glb | | | | | |
| WD-001 | glb/wd-001.glb | | | | | |
| CH-001 | glb/ch-001.glb | | | | | |

แหล่งโมเดลฟรีที่แนะนำ: Poly Haven (CC0), Kenney Furniture Kit (CC0), Sketchfab (กรอง Downloadable + CC-BY/CC0)

คำสั่งบีบไฟล์:

```bash
npx @gltf-transform/cli optimize input.glb output.glb --texture-compress webp --texture-size 1024
```
