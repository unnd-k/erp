import { useState, useRef } from 'react'
import { formatCurrency } from '../lib/utils'

function getEventMap(projects) {
  const map = {}
  const add = (date, type, title, amount, idx, status) => {
    if (!date) return
    if (!map[date]) map[date] = []
    map[date].push({ type, title, amount, idx, status })
  }
  projects.forEach((p, i) => {
    add(p.date, 'contract', `[본계약] ${p.projectName}`, p.amount, i, p.status)
    add(p.advanceDate, 'advance', `[본선금] ${p.projectName}`, p.advance, i, p.status)
    add(p.balanceDate, 'balance', `[본잔금] ${p.projectName}`, p.balance, i, p.status)
    add(p.taxDate, 'tax', `[세금계산서] ${p.projectName}`, null, i, p.status)
    if (p.outCompany) {
      add(p.outAdvanceDate, 'out', `[외주선금] ${p.outCompany}`, p.outAdvance, i, p.status)
      add(p.outBalanceDate, 'out', `[외주잔금] ${p.outCompany}`, p.outBalance, i, p.status)
    }
  })
  return map
}

export default function CalendarView({ projects, onSelectProject, isMobile }) {
  const today = new Date()
  const [curDate, setCurDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selected, setSelected] = useState(new Date())
  const eventsRef = useRef(null)
  const touchX = useRef(0)

  const year = curDate.getFullYear()
  const month = curDate.getMonth()
  const monthStr = `${year}.${String(month+1).padStart(2,'0')}`
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month+1, 0).getDate()
  const prevDays = new Date(year, month, 0).getDate()
  const eventMap = getEventMap(projects)

  const selStr = `${selected.getFullYear()}-${String(selected.getMonth()+1).padStart(2,'0')}-${String(selected.getDate()).padStart(2,'0')}`

  function selectDate(y, m, d) {
    const dt = new Date(y, m, d)
    setSelected(dt)
    const ds = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    setTimeout(() => {
      const el = document.getElementById(`event-${ds}`)
      if (el && eventsRef.current) eventsRef.current.scrollTo({ top: el.offsetTop - 10, behavior: 'smooth' })
    }, 50)
  }

  function goToday() {
    setCurDate(new Date(today.getFullYear(), today.getMonth(), 1))
    setSelected(new Date())
  }

  // 이번 달 이벤트만
  const prefix = `${year}-${String(month+1).padStart(2,'0')}`
  const monthEvents = Object.entries(eventMap).filter(([d]) => d.startsWith(prefix)).sort(([a],[b]) => a.localeCompare(b))

  const cells = []
  for (let i = firstDay-1; i >= 0; i--) cells.push({ day: prevDays-i, isOther: true })
  for (let i = 1; i <= daysInMonth; i++) cells.push({ day: i, isOther: false })

  const calGrid = (
    <>
      <div className="cal-header">
        <div className="cal-header-left">
          <button className="arrow-btn" onClick={() => setCurDate(new Date(year, month-1, 1))}><i className="fa-solid fa-chevron-left" /></button>
          <span className="cal-month-label">{monthStr}</span>
        </div>
        <div className="cal-header-right">
          <button className="btn-today" onClick={goToday}>Today</button>
          <button className="arrow-btn" onClick={() => setCurDate(new Date(year, month+1, 1))}><i className="fa-solid fa-chevron-right" /></button>
        </div>
      </div>
      <div className="cal-grid-header">
        {['일','월','화','수','목','금','토'].map(d => <div key={d} className="cal-day-label">{d}</div>)}
      </div>
      <div className="cal-grid">
        {cells.map((cell, idx) => {
          if (cell.isOther) return <div key={`p${idx}`} className="cal-cell other-month">{cell.day}</div>
          const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(cell.day).padStart(2,'0')}`
          const evs = eventMap[ds] || []
          const isSel = ds === selStr
          return (
            <div key={ds} className={`cal-cell${isSel?' selected':''}`} onClick={() => selectDate(year, month, cell.day)}>
              {cell.day}
              {evs.length > 0 && (
                <div className="event-dots">
                  {evs.slice(0,4).map((ev,i) => {
                    let dotColor = 'var(--text-sub)'
                    if (ev.status==='진행중') dotColor='#2563eb'
                    else if (ev.status==='대기중') dotColor='#d97706'
                    return <div key={i} className="event-dot" style={{background:dotColor}} />
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )

  const eventList = (
    <>
      <div style={{fontSize:15, fontWeight:700, textTransform:'uppercase', padding:'8px 0 12px', color:'var(--text-main)'}}>
        {year}. {String(month+1).padStart(2,'0')} Schedule
      </div>
      {monthEvents.length === 0
        ? <div className="no-events">일정이 없습니다.</div>
        : monthEvents.map(([date, evs]) => {
            const dayNum = date.split('-')[2]
            return (
              <div key={date} id={`event-${date}`} className={`cal-card${date===selStr?' highlight':''}`}>
                <div className="cal-card-day">{dayNum}</div>
                <div className="cal-card-content">
                  {evs.map((ev,i) => (
                    <div key={i} className="cal-row" onClick={() => onSelectProject(ev.idx)}>
                      <div className="cal-row-left">
                        <span className={`status-badge bg-${ev.status}`}>{ev.status}</span>
                        <span className="cal-row-title">{ev.title}</span>
                      </div>
                      <div className="cal-row-amount">{ev.amount ? `₩ ${formatCurrency(ev.amount)}` : ''}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })
      }
    </>
  )

  if (isMobile) return (
    <div className="m-cal-wrap"
      onTouchStart={e => touchX.current = e.changedTouches[0].screenX}
      onTouchEnd={e => {
        const dx = e.changedTouches[0].screenX - touchX.current
        if (dx < -50) setCurDate(new Date(year, month+1, 1))
        if (dx > 50) setCurDate(new Date(year, month-1, 1))
      }}>
      <div className="m-cal-sticky">{calGrid}</div>
      <div className="m-cal-events" ref={eventsRef}>{eventList}</div>
    </div>
  )

  return (
    <div style={{display:'grid', gridTemplateColumns:'400px 1fr', minHeight:'calc(100vh - 60px)'}}>
      <div style={{borderRight:'1px solid var(--border-main)', background:'var(--bg-main)', padding:20, position:'sticky', top:60, height:'calc(100vh - 60px)', overflowY:'auto'}}>
        {calGrid}
      </div>
      <div style={{padding:'20px 28px', overflowY:'auto'}} ref={eventsRef}>{eventList}</div>
    </div>
  )
}
