import { useState } from 'react'
import { formatCurrency } from '../lib/utils'

export default function StatsView({ projects, categories, isMobile }) {
  const [mode, setMode] = useState('month')
  const [date, setDate] = useState(new Date())

  const year = date.getFullYear()
  const month = date.getMonth()

  function changePeriod(offset) {
    const d = new Date(date)
    if (mode === 'month') d.setMonth(d.getMonth() + offset)
    else d.setFullYear(d.getFullYear() + offset)
    setDate(d)
  }

  const periodStr = mode === 'month' ? `${year}.${String(month+1).padStart(2,'0')}` : `${year}년`
  const prefix = mode === 'month' ? `${year}-${String(month+1).padStart(2,'0')}` : `${year}-`
  const filtered = projects.filter(p => p.date && p.date.startsWith(prefix))

  let totalContract = 0, totalOut = 0, totalNet = 0
  const catMapNet = {}, catMapCount = {}
  filtered.forEach(p => {
    const amt = Number(p.amount)||0, out = Number(p.outAmount)||0, net = amt - out
    totalContract += amt; totalOut += out; totalNet += net
    const cat = p.category || '기타'
    catMapNet[cat] = (catMapNet[cat]||0) + net
    catMapCount[cat] = (catMapCount[cat]||0) + 1
  })
  const totalCount = filtered.length

  function buildDonut(map, total, isAmount) {
    let gradient = [], legend = [], start = 0
    Object.entries(map).sort(([,a],[,b]) => b-a).forEach(([cat, val]) => {
      const pct = total > 0 ? (val/total)*100 : 0
      const catObj = categories.find(c=>c.name===cat) || { color:'#888', icon:'fa-box' }
      gradient.push(`${catObj.color} ${start}% ${start+pct}%`)
      start += pct
      legend.push({ cat, val, pct, catObj })
    })
    const conic = gradient.length ? `conic-gradient(${gradient.join(',')})` : 'var(--border-light)'
    return { conic, legend }
  }

  const { conic: netConic, legend: netLegend } = buildDonut(catMapNet, totalNet, true)
  const { conic: countConic, legend: countLegend } = buildDonut(catMapCount, totalCount, false)

  const controls = (
    <>
      <div className={isMobile ? 'm-stats-toggle' : 'stats-toggle'} style={!isMobile?{display:'flex',borderBottom:'1px solid var(--border-main)'}:{}}>
        <button className={mode==='month'?'active':''} onClick={()=>setMode('month')} style={!isMobile?{flex:1,padding:14,border:'none',borderRight:'1px solid var(--border-main)',background:mode==='month'?'var(--accent-bg)':'transparent',color:mode==='month'?'var(--accent-text)':'var(--text-sub)',fontWeight:600,cursor:'pointer',textTransform:'uppercase'}:{}}>월별</button>
        <button className={mode==='year'?'active':''} onClick={()=>setMode('year')} style={!isMobile?{flex:1,padding:14,border:'none',background:mode==='year'?'var(--accent-bg)':'transparent',color:mode==='year'?'var(--accent-text)':'var(--text-sub)',fontWeight:600,cursor:'pointer',textTransform:'uppercase'}:{}}>연도별</button>
      </div>
      <div className={isMobile?'m-stat-nav':'stat-nav'} style={!isMobile?{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 2.5rem',borderBottom:'1px solid var(--border-main)'}:{}}>
        <button onClick={()=>changePeriod(-1)} style={!isMobile?{background:'none',border:'none',fontSize:17,cursor:'pointer',color:'var(--text-main)'}:{}}><i className="fa-solid fa-chevron-left" /></button>
        <span style={!isMobile?{fontSize:17,fontWeight:800,letterSpacing:'-0.5px'}:{}}>{periodStr}</span>
        <button onClick={()=>changePeriod(1)} style={!isMobile?{background:'none',border:'none',fontSize:17,cursor:'pointer',color:'var(--text-main)'}:{}}><i className="fa-solid fa-chevron-right" /></button>
      </div>
    </>
  )

  const metrics = (
    <>
      <div className={isMobile?'m-stat-main':''} style={!isMobile?{background:'var(--border-light)',padding:'24px 28px',borderBottom:'1px solid var(--border-main)'}:{}}>
        <div className="s-title" style={{fontSize:11,fontWeight:700,color:'var(--text-sub)',textTransform:'uppercase',marginBottom:7}}>총 매출액</div>
        <div className="s-val" style={!isMobile?{fontSize:32,fontWeight:800,letterSpacing:'-1px'}:{}}>{`₩ ${formatCurrency(totalNet)}`}</div>
      </div>
      <div className={isMobile?'m-stat-row':''} style={!isMobile?{display:'grid',gridTemplateColumns:'1fr 1fr',borderBottom:'1px solid var(--border-main)'}:{}}>
        <div className={isMobile?'m-stat-sub':''} style={!isMobile?{padding:'18px 24px',borderRight:'1px solid var(--border-main)'}:{}}>
          <div className="s-title" style={{fontSize:11,fontWeight:700,color:'var(--text-sub)',textTransform:'uppercase',marginBottom:6}}>계약금액</div>
          <div style={{fontSize:18,fontWeight:700,letterSpacing:'-0.5px'}}>{`₩ ${formatCurrency(totalContract)}`}</div>
        </div>
        <div className={isMobile?'m-stat-sub':''} style={!isMobile?{padding:'18px 24px'}:{}}>
          <div className="s-title" style={{fontSize:11,fontWeight:700,color:'var(--text-sub)',textTransform:'uppercase',marginBottom:6}}>외주금액</div>
          <div style={{fontSize:18,fontWeight:700,letterSpacing:'-0.5px'}}>{`₩ ${formatCurrency(totalOut)}`}</div>
        </div>
      </div>
    </>
  )

  const charts = totalCount === 0
    ? <div className="no-events" style={{borderTop:'none',paddingTop:48}}>데이터가 없습니다.</div>
    : (
      <div style={{padding:'28px 0', display:'flex', flexDirection:'column', gap:40}}>
        <DonutSection title="매출액 기준 비중" conic={netConic} total={`₩ ${formatCurrency(totalNet)}`} totalLabel="Total Net" legend={netLegend} isAmount />
        <div style={{borderTop:'1px dashed var(--border-mid)',paddingTop:40}}>
          <DonutSection title="프로젝트 건수 기준 비중" conic={countConic} total={`${totalCount}건`} totalLabel="Total PJT" legend={countLegend} />
        </div>
      </div>
    )

  if (isMobile) return (
    <div>
      {controls}
      {metrics}
      <div style={{background:'var(--bg-sub)'}}>{charts}</div>
    </div>
  )

  return (
    <div style={{display:'grid', gridTemplateColumns:'300px 1fr', minHeight:'calc(100vh - 60px)'}}>
      <div style={{borderRight:'1px solid var(--border-main)', background:'var(--bg-main)', position:'sticky', top:60, height:'calc(100vh - 60px)', overflowY:'auto'}}>
        {controls}
        {metrics}
      </div>
      <div style={{overflowY:'auto', background:'var(--bg-body)'}}>{charts}</div>
    </div>
  )
}

function DonutSection({ title, conic, total, totalLabel, legend, isAmount }) {
  return (
    <div style={{display:'flex', flexDirection:'column', alignItems:'center', padding:'0 24px'}}>
      <div style={{fontSize:14, fontWeight:800, textTransform:'uppercase', borderBottom:'2px solid var(--border-main)', paddingBottom:5, marginBottom:22, alignSelf:'flex-start'}}>{title}</div>
      <div style={{display:'flex', gap:28, alignItems:'flex-start', width:'100%', flexWrap:'wrap'}}>
        <div className="donut-chart" style={{background:conic}}>
          <div className="donut-hole">
            <span className="donut-total-label">{totalLabel}</span>
            <span className="donut-total-val" style={{fontSize:isAmount?11:16}}>{total}</span>
          </div>
        </div>
        <div style={{flex:1, minWidth:200}}>
          {legend.map(({ cat, val, pct, catObj }) => (
            <div key={cat} className="legend-item">
              <div className="legend-left" style={{color:catObj.color}}>
                <i className={`fa-solid ${catObj.icon}`} /> {cat}
              </div>
              <div className="legend-right">
                <span className="legend-val">{isAmount ? `₩ ${formatCurrency(val)}` : `${val}건`}</span>
                <span className="legend-pct">{pct.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
