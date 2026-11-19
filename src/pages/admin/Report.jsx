import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { supabase } from '../../lib/supabase.js'

// รายงานความนิยมสินค้า: จำนวนครั้งที่สินค้าแต่ละชิ้นถูกวางในห้องที่บันทึกไว้ (view product_popularity)
export default function Report() {
  const [rows, setRows] = useState([])
  const [roomCount, setRoomCount] = useState(0)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [pop, rooms] = await Promise.all([
          supabase.from('product_popularity').select('id, sku, name, placed_count').order('placed_count', { ascending: false }),
          supabase.from('rooms').select('id', { count: 'exact', head: true }),
        ])
        if (pop.error) throw pop.error
        if (rooms.error) throw rooms.error
        if (cancelled) return
        setRows(pop.data ?? [])
        setRoomCount(rooms.count ?? 0)
        setStatus('ready')
      } catch (err) {
        console.error(err)
        if (cancelled) return
        setError('โหลดรายงานไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
        setStatus('error')
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const totalPlaced = rows.reduce((s, r) => s + r.placed_count, 0)
  const top = rows[0]
  const nf = new Intl.NumberFormat('th-TH')

  return (
    <div className="admin-page">
      <h1>รายงานความนิยมสินค้า</h1>
      {status === 'loading' && <p className="muted">กำลังโหลด...</p>}
      {status === 'error' && <div className="alert" role="alert">{error}</div>}
      {status === 'ready' && (
        <>
          <div className="stats">
            <Stat label="ห้องที่ลูกค้าบันทึก" value={nf.format(roomCount)} unit="ห้อง" testid="stat-rooms" />
            <Stat label="จำนวนชิ้นที่ถูกวางทั้งหมด" value={nf.format(totalPlaced)} unit="ชิ้น" testid="stat-placed" />
            <Stat label="สินค้ายอดนิยมอันดับ 1" value={top && top.placed_count > 0 ? top.name : '—'} testid="stat-top" />
          </div>

          <div className="panel">
            <h2 className="panel-title">จำนวนครั้งที่ถูกวางในห้อง แยกตามสินค้า</h2>
            {totalPlaced === 0 ? (
              <p className="muted">ยังไม่มีการบันทึกห้อง</p>
            ) : (
              <div className="chart" style={{ height: Math.max(220, rows.length * 44 + 40) }} data-testid="popularity-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }} barCategoryGap={10}>
                    <CartesianGrid horizontal={false} stroke="var(--grid)" />
                    <XAxis type="number" allowDecimals={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={150}
                      tick={{ fill: 'var(--text)', fontSize: 12 }}
                      axisLine={{ stroke: 'var(--border)' }}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'var(--hover)' }}
                      formatter={(v) => [`${nf.format(v)} ครั้ง`, 'ถูกวางในห้อง']}
                      labelFormatter={(name, payload) => `${payload?.[0]?.payload?.sku ?? ''} · ${name}`}
                      contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontFamily: 'inherit' }}
                    />
                    <Bar dataKey="placed_count" fill="var(--chart-1)" radius={[0, 4, 4, 0]} maxBarSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="panel table-scroll">
            <h2 className="panel-title">ตารางข้อมูล</h2>
            <table className="table" data-testid="popularity-table">
              <thead>
                <tr>
                  <th>อันดับ</th>
                  <th>รหัส</th>
                  <th>ชื่อสินค้า</th>
                  <th className="num">ถูกวาง (ครั้ง)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id}>
                    <td>{i + 1}</td>
                    <td>{r.sku}</td>
                    <td>{r.name}</td>
                    <td className="num">{nf.format(r.placed_count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function Stat({ label, value, unit, testid }) {
  return (
    <div className="panel stat" data-testid={testid}>
      <span className="muted small">{label}</span>
      <strong className="stat-value">
        {value} {unit && <span className="stat-unit">{unit}</span>}
      </strong>
    </div>
  )
}
