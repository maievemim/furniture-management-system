import { Link } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader.jsx'
import { publicModelUrl } from '../lib/supabase.js'

// ภาพแบนเนอร์จาก Pexels (Pexels License) ดูที่มาใน docs/model-credits.md
const HERO_IMAGE = '/home/hero-room.jpg'

const FEATURES = [
  {
    id: 'search',
    no: '01',
    kicker: 'ค้นหาด้วย AI',
    title: 'ค้นหาสินค้าจากรูปภาพ',
    text: 'เห็นเฟอร์นิเจอร์ที่ชอบจากที่ไหนก็ตาม ถ่ายหรืออัปโหลดรูปเข้ามา AI จะหาสินค้าในร้านที่หน้าตาใกล้เคียงที่สุดให้ทันที โดยรูปของคุณไม่ถูกส่งออกจากเครื่อง',
    steps: [
      'เปิดเมนู "ค้นหาด้วยรูป"',
      'กด "ถ่ายรูป" หรือ "เลือกจากเครื่อง" รูปเฟอร์นิเจอร์ที่ต้องการ',
      'รอ AI เทียบกับสินค้าทั้งหมดในร้าน ไม่กี่วินาที',
      'เลือกสินค้าที่คล้าย แล้วกดดู 3D / AR หรือวางในห้องต่อได้เลย',
    ],
    cta: { to: '/search', label: 'ลองค้นหาด้วยรูป' },
  },
  {
    id: 'planner',
    no: '02',
    kicker: 'จัดห้องเสมือนจริง',
    title: 'จัดห้อง 3 มิติด้วยขนาดจริง',
    text: 'สร้างห้องตามขนาดจริงของบ้านคุณ วางเฟอร์นิเจอร์ที่มีสัดส่วนเท่าของจริงทุกชิ้น ดูระยะห่างจากผนัง พื้นที่เหลือ และราคารวมได้ทันที ก่อนตัดสินใจซื้อ',
    steps: [
      'กรอกขนาดห้อง กว้าง × ยาว × สูง เป็นเมตร',
      'กด "วาง" สินค้าที่ต้องการ ระบบหาที่ว่างให้อัตโนมัติ',
      'ลากเพื่อย้าย กด "หมุน 90°" และดูระยะห่างจากผนังทุกด้าน',
      'ตรวจราคารวม แล้วกด "บันทึกห้อง" เพื่อรับลิงก์แชร์',
    ],
    cta: { to: '/planner', label: 'เริ่มจัดห้องของคุณ' },
  },
  {
    id: 'ar',
    no: '03',
    kicker: 'ความเป็นจริงเสริม (AR)',
    title: 'ส่องสินค้าในห้องจริงผ่านกล้อง',
    text: 'เปิดกล้องมือถือแล้วเห็นโมเดลสินค้าวางอยู่บนพื้นห้องของคุณจริงๆ ในขนาดเท่าของจริง เดินดูรอบได้ ไม่ต้องติดตั้งแอปใดๆ ใช้ได้ทั้ง Android และ iPhone',
    steps: [
      'เปิดเว็บไซต์ด้วยมือถือ แล้วเลือกสินค้าที่สนใจ',
      'กด "ดู 3D / AR" แล้วกด "ดูในห้องจริง (AR)"',
      'ส่องไปที่พื้น ขยับมือถือช้าๆ ให้ระบบจับพื้นได้',
      'โมเดลจะวางบนพื้นในขนาดจริง ลากเพื่อเลื่อนหรือหมุนได้',
    ],
    cta: { to: '/catalog', label: 'เลือกสินค้าเพื่อดู AR' },
  },
]

export default function Home() {
  return (
    <div className="home">
      <div className="home-backdrop" style={{ backgroundImage: `url(${HERO_IMAGE})` }} aria-hidden="true" />

      <section className="showcase" style={{ backgroundImage: `url(${HERO_IMAGE})` }} aria-labelledby="home-title">
        <SiteHeader overlay />
        <div className="showcase-copy">
          <p className="showcase-kicker">ออกแบบห้องในฝัน ตั้งแต่ก่อนซื้อ</p>
          <h1 id="home-title">
            จัดห้องให้<em>ลงตัว</em>
            <br />
            ด้วยเฟอร์นิเจอร์<span className="nowrap">ขนาดจริง</span>
          </h1>
          <p className="showcase-sub">
            ค้นหาสินค้าด้วยรูป จัดวางในห้อง 3 มิติตามขนาดจริง และส่องในห้องของคุณผ่านกล้องมือถือ ครบในเว็บเดียว
          </p>
          <div className="showcase-actions">
            <Link to="/planner" className="btn btn-pill btn-light" data-testid="hero-start">
              เริ่มจัดห้องของคุณ <span aria-hidden="true">↗</span>
            </Link>
            <a href="#features" className="btn btn-pill btn-glass">ดูวิธีใช้งาน</a>
          </div>
        </div>
      </section>

      <section id="features" className="features" aria-labelledby="features-title">
        <header className="features-head">
          <p className="eyebrow">ฟีเจอร์และวิธีใช้งาน</p>
          <h2 id="features-title" className="display-2">
            สามขั้นตอนสู่ห้องที่<em>ใช่</em>
          </h2>
          <p className="muted">ค้นหา จัดวาง แล้วส่องดูของจริง ทำได้ทั้งบนคอมพิวเตอร์และมือถือ</p>
        </header>

        {FEATURES.map((f, i) => (
          <article key={f.id} className={`feature${i % 2 ? ' feature-flip' : ''}`} id={`feature-${f.id}`} data-testid="feature">
            <div className="feature-visual" aria-hidden="true">
              {f.id === 'search' && <SearchVisual />}
              {f.id === 'planner' && <PlannerVisual />}
              {f.id === 'ar' && <ArVisual />}
            </div>
            <div className="feature-body">
              <p className="feature-no">
                <span>{f.no}</span> {f.kicker}
              </p>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-text">{f.text}</p>
              <ol className="feature-steps">
                {f.steps.map((s, si) => (
                  <li key={s}>
                    <span className="feature-step-no">{si + 1}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
              <Link to={f.cta.to} className="btn btn-pill" data-testid={`feature-cta-${f.id}`}>
                {f.cta.label} <span aria-hidden="true">→</span>
              </Link>
            </div>
          </article>
        ))}
      </section>

      <section className="home-cta">
        <h2 className="display-2">พร้อมออกแบบห้องของคุณแล้วหรือยัง</h2>
        <p>ไม่ต้องสมัครสมาชิก ไม่ต้องติดตั้งแอป เริ่มได้ทันที</p>
        <div className="showcase-actions center">
          <Link to="/planner" className="btn btn-pill btn-light">เริ่มจัดห้องของคุณ <span aria-hidden="true">↗</span></Link>
          <Link to="/catalog" className="btn btn-pill btn-glass">ดูสินค้าทั้งหมด</Link>
        </div>
      </section>
    </div>
  )
}

// ภาพประกอบฟีเจอร์ค้นหาด้วยรูป: รูปที่ลูกค้าอัปโหลด → สินค้าที่คล้าย
function SearchVisual() {
  const thumbs = ['thumbs/sf-001.webp', 'thumbs/ch-001.webp', 'thumbs/tb-001.webp']
  return (
    <div className="viz viz-search">
      <div className="viz-photo" style={{ backgroundImage: `url(${HERO_IMAGE})` }}>
        <span className="viz-frame" />
        <span className="viz-label">รูปของคุณ</span>
      </div>
      <div className="viz-results">
        <span className="viz-ai">AI กำลังเทียบ...</span>
        {thumbs.map((t, i) => (
          <div key={t} className="viz-result" style={{ '--d': `${i * 0.12}s` }}>
            <img src={publicModelUrl(t) ?? ''} alt="" loading="lazy" />
            <span className="viz-bar"><span style={{ width: `${88 - i * 14}%` }} /></span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ภาพประกอบหน้าจัดห้อง (ภาพหน้าจอจริงของระบบ)
function PlannerVisual() {
  return (
    <div className="viz viz-planner">
      <div className="viz-window">
        <div className="viz-window-bar"><i /><i /><i /><span>จัดห้อง 3D</span></div>
        <img src="/home/planner.jpg" alt="" loading="lazy" />
      </div>
      <div className="viz-chip viz-chip-a">ห้อง 4 × 5 ม.</div>
      <div className="viz-chip viz-chip-b">รวม 25,990 บาท</div>
    </div>
  )
}

// ภาพประกอบ AR: มือถือส่องพื้นห้องแล้วเห็นเก้าอี้วางอยู่
function ArVisual() {
  return (
    <div className="viz viz-ar">
      <div className="phone">
        <div className="phone-screen" style={{ backgroundImage: 'url(/home/ar-room.jpg)' }}>
          <span className="phone-notch" />
          <span className="ar-reticle" />
          <span className="ar-tag">43 × 58 × 97 ซม.</span>
          <span className="ar-hint">ส่องไปที่พื้น</span>
        </div>
      </div>
    </div>
  )
}
