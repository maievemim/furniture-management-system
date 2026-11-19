import { useMemo } from 'react'
import { computeBom, useRoomStore } from '../../store/roomStore.js'
import { formatBaht } from '../../lib/format.js'

// สรุปราคารวม: รหัส ชื่อ จำนวน ราคารวม (คำนวณจากรายการในห้อง × ราคาในฐานข้อมูล)
export default function Bom() {
  const items = useRoomStore((s) => s.items)
  const products = useRoomStore((s) => s.products)
  const bom = useMemo(() => computeBom(items, products), [items, products])

  return (
    <div className="panel" data-testid="bom">
      <h2 className="panel-title">สรุปราคารวม (BOM)</h2>
      {bom.rows.length === 0 ? (
        <p className="muted">ยังไม่มีเฟอร์นิเจอร์ในห้อง</p>
      ) : (
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>รหัส</th>
                <th>ชื่อสินค้า</th>
                <th className="num">จำนวน</th>
                <th className="num">ราคา/ชิ้น</th>
                <th className="num">รวม</th>
              </tr>
            </thead>
            <tbody>
              {bom.rows.map((r) => (
                <tr key={r.id} data-testid="bom-row">
                  <td>{r.sku}</td>
                  <td>{r.name}</td>
                  <td className="num" data-testid="bom-qty">{r.qty}</td>
                  <td className="num">{formatBaht(r.price)}</td>
                  <td className="num">{formatBaht(r.subtotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th colSpan={2}>รวมทั้งหมด</th>
                <th className="num">{bom.count}</th>
                <th />
                <th className="num" data-testid="bom-total">{formatBaht(bom.total)}</th>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
