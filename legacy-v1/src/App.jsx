import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { DEFAULT_CATEGORIES, formatCurrency, formatDate, calculateProgress } from './lib/utils'
import AuthScreen from './components/AuthScreen'
import ProjectCard from './components/ProjectCard'
import ProjectDetail from './components/ProjectDetail'
import ProjectForm from './components/ProjectForm'
import CategoryModal from './components/CategoryModal'
import CalendarView from './components/CalendarView'
import StatsView from './components/StatsView'
import ImportModal from './components/ImportModal'
import './index.css'

function useIsMobile() {
  const [v, setV] = useState(window.innerWidth < 769)
  useEffect(() => {
    const h = () => setV(window.innerWidth < 769)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return v
}

export default function App() {
  const isMobile = useIsMobile()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState([])
  const [categories, setCategories] = useState(
    () => JSON.parse(localStorage.getItem('myCategories')) || DEFAULT_CATEGORIES
  )
  const [activeTab, setActiveTab]       = useState('home')
  const [statusFilter, setStatusFilter] = useState('전체')
  const [catFilter, setCatFilter]       = useState('전체')
  const [search, setSearch]             = useState('')
  const [sort, setSort]                 = useState('latest')
  const [dark, setDark]                 = useState(() => localStorage.getItem('dark') === 'true')
  const [selectedProject, setSelectedProject]   = useState(null)
  const [editingProject, setEditingProject]     = useState(null)
  const [showForm, setShowForm]                 = useState(false)
  const [editingCategory, setEditingCategory]   = useState(undefined)
  const [showCatModal, setShowCatModal]         = useState(false)
  const [showImportModal, setShowImportModal]   = useState(false)
  const [dragIdx, setDragIdx]                   = useState(null)

  useEffect(() => {
    document.body.classList.toggle('dark', dark)
    localStorage.setItem('dark', dark)
  }, [dark])

  useEffect(() => {
    localStorage.setItem('myCategories', JSON.stringify(categories))
  }, [categories])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { setUser(session.user); loadProjects() }
      else setLoading(false)
    })
    supabase.auth.onAuthStateChange((ev) => {
      if (ev === 'SIGNED_OUT') { setUser(null); setProjects([]) }
    })
  }, [])

  async function loadProjects() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('projects').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setProjects((data || []).map(p => ({
        id: p.id, projectName: p.project_name, company: p.company, status: p.status,
        category: p.category, amount: p.amount || 0, date: p.date,
        advance: p.advance || 0, balance: p.balance || 0,
        advanceDate: p.advance_date, balanceDate: p.balance_date, taxDate: p.tax_date,
        outCompany: p.out_company || '', outAmount: p.out_amount || 0,
        outAdvance: p.out_advance || 0, outBalance: p.out_balance || 0,
        outAdvanceDate: p.out_advance_date, outBalanceDate: p.out_balance_date,
      })))
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function saveProject(data) {
    setLoading(true)
    const row = {
      user_id: user.id, project_name: data.projectName, company: data.company,
      status: data.status, category: data.category, amount: data.amount || 0,
      date: data.date || null, advance: data.advance || 0, balance: data.balance || 0,
      advance_date: data.advanceDate || null, balance_date: data.balanceDate || null,
      tax_date: data.taxDate || null, out_company: data.outCompany || null,
      out_amount: data.outAmount || 0, out_advance: data.outAdvance || 0,
      out_balance: data.outBalance || 0,
      out_advance_date: data.outAdvanceDate || null, out_balance_date: data.outBalanceDate || null,
    }
    try {
      if (editingProject?.id) await supabase.from('projects').update(row).eq('id', editingProject.id)
      else await supabase.from('projects').insert([row])
      await loadProjects()
    } catch(e) { alert('저장 오류: ' + e.message) }
    finally { setLoading(false); setShowForm(false); setEditingProject(null) }
  }

  async function deleteProject(p) {
    if (!confirm('정말로 삭제하시겠습니까?')) return
    setLoading(true)
    try {
      await supabase.from('projects').delete().eq('id', p.id)
      await loadProjects(); setSelectedProject(null)
    } catch(e) { alert('삭제 오류') }
    finally { setLoading(false) }
  }

  async function handleImportProjects(importedData) {
    setLoading(true)
    const rows = importedData.map(d => ({
      user_id: user.id, project_name: d.projectName, company: d.company,
      status: d.status, category: d.category, amount: d.amount || 0,
      date: d.date || null, advance: d.advance || 0, balance: d.balance || 0,
      advance_date: d.advanceDate || null, balance_date: d.balanceDate || null,
      tax_date: d.taxDate || null, out_company: d.outCompany || null,
      out_amount: d.outAmount || 0, out_advance: d.outAdvance || 0,
      out_balance: d.outBalance || 0,
      out_advance_date: d.outAdvanceDate || null, out_balance_date: d.outBalanceDate || null,
    }))
    try {
      const { error } = await supabase.from('projects').insert(rows)
      if (error) throw error
      await loadProjects()
      alert(`${rows.length}개 프로젝트를 가져왔습니다.`)
    } catch(e) { alert('가져오기 오류: ' + e.message) }
    finally { setLoading(false); setShowImportModal(false) }
  }

  async function handleLogout() {
    if (!confirm('로그아웃 하시겠습니까?')) return
    await supabase.auth.signOut()
    setUser(null); setProjects([])
  }

  function saveCategory(data) {
    if (editingCategory) {
      const old = editingCategory.name
      setCategories(cs => cs.map(c => c.name === old ? data : c))
      setProjects(ps => ps.map(p => p.category === old ? { ...p, category: data.name } : p))
    } else {
      if (categories.find(c => c.name === data.name)) return alert('이미 존재하는 카테고리명입니다.')
      setCategories(cs => [...cs, data])
    }
    setShowCatModal(false); setEditingCategory(undefined)
  }

  function deleteCategory(cat) {
    if (!confirm('삭제하시겠습니까?')) return
    setCategories(cs => cs.filter(c => c.name !== cat.name))
  }

  function handleDrop(toIdx) {
    if (dragIdx === null || dragIdx === toIdx) return
    const up = [...projects]
    const [m] = up.splice(dragIdx, 1)
    up.splice(toIdx, 0, m)
    setProjects(up); setDragIdx(null)
  }

  const filtered = projects
    .filter(p => {
      if (statusFilter !== '전체' && p.status !== statusFilter) return false
      if (catFilter !== '전체' && p.category !== catFilter) return false
      if (search) {
        const kw = search.toLowerCase()
        if (!(p.projectName||'').toLowerCase().includes(kw) &&
            !(p.company||'').toLowerCase().includes(kw)) return false
      }
      return true
    })
    .sort((a, b) => {
      if (sort === 'latest')     return new Date(b.date||0) - new Date(a.date||0)
      if (sort === 'amountDesc') return ((b.amount||0)-(b.outAmount||0)) - ((a.amount||0)-(a.outAmount||0))
      if (sort === 'nameAsc')    return (a.projectName||'').localeCompare(b.projectName||'')
      return 0
    })

  const totalNet      = projects.reduce((s,p) => s + (p.amount||0) - (p.outAmount||0), 0)
  const totalContract = projects.reduce((s,p) => s + (p.amount||0), 0)
  const totalOut      = projects.reduce((s,p) => s + (p.outAmount||0), 0)
  const counts = {
    all:     projects.length,
    done:    projects.filter(p => p.status==='완료').length,
    active:  projects.filter(p => p.status==='진행중').length,
    pending: projects.filter(p => p.status==='대기중').length,
  }

  const initials = (user?.email||'U').slice(0,2).toUpperCase()

  const Tog = ({ on, onClick }) => (
    <div className="toggle-wrap" onClick={onClick}>
      <div className={`toggle-switch${on?' on':''}`}><div className="toggle-slider"/></div>
    </div>
  )

  if (!user && !loading) return <AuthScreen onLogin={u => { setUser(u); loadProjects() }} />

  /* ── category color map for sidebar ── */
  const catColors = ['#6c5ce7','#00b894','#fdcb6e','#fd79a8','#74b9ff','#e17055','#00cec9','#a29bfe']

  const FilterPills = ({ mobile }) => (
    <div className={mobile ? 'm-filter' : 'filter-pills'}
      style={!mobile ? { display:'flex', gap:7, flexWrap:'wrap', flex:1 } : {}}>
      <div className={`pill${catFilter==='전체'?' active':''}`} onClick={() => setCatFilter('전체')}>ALL</div>
      {categories.map(cat => (
        <div key={cat.name}
          className={`pill${catFilter===cat.name?' active':''}`}
          style={catFilter===cat.name ? { background:cat.color, borderColor:'transparent' } : {}}
          onClick={() => setCatFilter(cat.name)}>
          <i className={`fa-solid ${cat.icon}`} /> {cat.name}
        </div>
      ))}
    </div>
  )

  const SettingsPanel = ({ mobile }) => (
    <div>
      {mobile && (
        <div className="m-settings-row">
          <span style={{display:'flex',alignItems:'center',gap:10}}>
            <i className={`fa-solid fa-${dark?'sun':'moon'}`}/> {dark?'라이트 모드':'다크 모드'}
          </span>
          <Tog on={dark} onClick={() => setDark(d=>!d)}/>
        </div>
      )}
      <div className={mobile?'m-settings-header':'settings-header'}>
        <h3 style={{fontSize:11,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.1em',color:'var(--indigo)'}}>
          카테고리 관리
        </h3>
        <button className="btn-add-cat" onClick={() => { setEditingCategory(undefined); setShowCatModal(true) }}>
          + 추가
        </button>
      </div>
      <div className={mobile?'m-cat-list':''} style={!mobile?{padding:'12px 20px'}:{}}>
        {categories.map((cat, i) => (
          <div key={i} className="cat-item" style={{ borderColor: cat.color + '40' }}>
            <div className="cat-item-left" style={{ color: cat.color }}>
              <i className={`fa-solid ${cat.icon}`}/> {cat.name}
            </div>
            <div className="cat-item-actions">
              <button className="cat-action-btn" onClick={() => { setEditingCategory(cat); setShowCatModal(true) }}>
                <i className="fa-solid fa-pen"/>
              </button>
              <button className="cat-action-btn" onClick={() => deleteCategory(cat)}>
                <i className="fa-solid fa-trash-can"/>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  /* ══════════════ MOBILE ══════════════ */
  if (isMobile) return (
    <div style={{ display:'flex', justifyContent:'center', background:'var(--bg)', minHeight:'100vh' }}>
      <div className="mobile-app">
        {activeTab !== 'calendar' && (
          <div className="mobile-header">
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:30,height:30,background:'var(--indigo)',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:900,color:'#fff' }}>U</div>
              <span style={{ fontSize:14,fontWeight:800,color:'var(--t1)' }}>스튜디오언네임드</span>
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <div style={{ fontSize:18,cursor:'pointer',color:'var(--t2)' }} onClick={() => setDark(d=>!d)}>
                <i className={`fa-solid fa-${dark?'sun':'moon'}`}/>
              </div>
              <div style={{ width:30,height:30,borderRadius:'50%',background:'linear-gradient(135deg,var(--indigo),#a855f7)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'#fff' }}>
                {initials}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'home' && (
          <>
            <div className="m-summary">
              <div className="m-summary-top">
                <h2>총 예상 매출</h2>
                <div className="m-summary-contract">계약 ₩{formatCurrency(totalContract)}</div>
              </div>
              <div className="m-summary-total">₩ {formatCurrency(totalNet)}</div>
            </div>

            <div className="m-status-row">
              {[['전체',counts.all],['완료',counts.done],['진행중',counts.active],['대기중',counts.pending]].map(([s,n]) => (
                <div key={s} className={`m-status-card${statusFilter===s?' active':''}`} onClick={() => setStatusFilter(s)}>
                  <div className="s-label">{s}</div><div className="s-value">{n}</div>
                </div>
              ))}
            </div>

            <FilterPills mobile/>

            <div className="m-search-row">
              <div className="m-search">
                <i className="fa-solid fa-magnifying-glass"/>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="프로젝트 검색..."/>
              </div>
              <select className="m-sort" value={sort} onChange={e=>setSort(e.target.value)}>
                <option value="latest">최신순</option>
                <option value="amountDesc">금액순</option>
                <option value="nameAsc">이름순</option>
                <option value="custom">사용자 지정</option>
              </select>
            </div>

            <div className="m-list">
              {filtered.map((p, i) => (
                <ProjectCard key={p.id||i} project={p} categories={categories}
                  onClick={() => setSelectedProject(p)}
                  draggable={sort==='custom'}
                  onDragStart={() => setDragIdx(projects.indexOf(p))}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => handleDrop(projects.indexOf(p))}/>
              ))}
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:10, position:'fixed', bottom:90, right:18, zIndex:90 }}>
              <button className="fab" style={{ width:44,height:44,fontSize:15,background:'var(--bg-card)',border:'1.5px solid var(--border)',boxShadow:'var(--shadow-sm)',color:'var(--t2)' }}
                onClick={() => setShowImportModal(true)}>
                <i className="fa-solid fa-file-import"/>
              </button>
              <button className="fab" onClick={() => { setEditingProject(null); setShowForm(true) }}>
                <i className="fa-solid fa-plus"/>
              </button>
            </div>
          </>
        )}

        {activeTab==='calendar' && <CalendarView projects={projects} categories={categories} onSelectProject={i=>setSelectedProject(projects[i])} isMobile/>}
        {activeTab==='stats'    && <StatsView    projects={projects} categories={categories} isMobile/>}
        {activeTab==='settings' && <SettingsPanel mobile/>}

        <nav className="bottom-nav">
          {[['home','fa-house','Home'],['calendar','fa-calendar','일정'],['stats','fa-chart-simple','통계'],['settings','fa-gear','설정']].map(([tab,icon,label]) => (
            <div key={tab} className={`nav-item${activeTab===tab?' active':''}`} onClick={() => setActiveTab(tab)}>
              <i className={`fa-solid ${icon}`}/><span>{label}</span>
            </div>
          ))}
        </nav>
      </div>

      {loading && <div className="loading-overlay"><div className="loading-spinner"/><div className="loading-text">불러오는 중...</div></div>}
      {selectedProject && <ProjectDetail project={selectedProject} categories={categories} onEdit={() => { setEditingProject(selectedProject); setSelectedProject(null); setShowForm(true) }} onDelete={() => deleteProject(selectedProject)} onClose={() => setSelectedProject(null)}/>}
      {showForm && <ProjectForm project={editingProject} categories={categories} onSave={saveProject} onClose={() => { setShowForm(false); setEditingProject(null) }}/>}
      {showCatModal && <CategoryModal category={editingCategory} onSave={saveCategory} onClose={() => { setShowCatModal(false); setEditingCategory(undefined) }}/>}
      {showImportModal && <ImportModal onSave={handleImportProjects} onClose={() => setShowImportModal(false)}/>}
    </div>
  )

  /* ══════════════ DESKTOP ══════════════ */
  const navItems = [
    { tab:'home',     icon:'fa-table-cells-large', label:'Dashboard' },
    { tab:'calendar', icon:'fa-calendar-days',     label:'Calendar'  },
    { tab:'stats',    icon:'fa-chart-bar',          label:'Reports'   },
    { tab:'settings', icon:'fa-gear',               label:'Settings'  },
  ]

  const pageTitles = { home:'Projects', calendar:'Calendar', stats:'Reports', settings:'Settings' }

  // recent 7 days vs older split
  const today = new Date()
  const recent7 = filtered.filter(p => {
    if (!p.date) return false
    const diff = (today - new Date(p.date)) / 86400000
    return diff <= 7
  })
  const older = filtered.filter(p => {
    if (!p.date) return true
    return (today - new Date(p.date)) / 86400000 > 7
  })

  return (
    <div className="shell">
      {/* ══ SIDEBAR ══ */}
      <aside className="sidebar">
        <div className="sb-brand">
          <div className="sb-logo">U</div>
          <span className="sb-name">Unnamed</span>
        </div>

        <nav className="sb-nav">
          <div className="sb-section">메뉴</div>
          {navItems.map(({ tab, icon, label }) => (
            <div key={tab} className={`sb-item${activeTab===tab?' active':''}`} onClick={() => setActiveTab(tab)}>
              <i className={`fa-solid ${icon}`}/> {label}
            </div>
          ))}

          <div className="sb-section" style={{ marginTop:8 }}>카테고리</div>
          {categories.map((cat, i) => (
            <div key={cat.name}
              className={`sb-item${catFilter===cat.name?' active':''}`}
              style={catFilter===cat.name ? { background:cat.color+'18', color:cat.color } : {}}
              onClick={() => { setCatFilter(cat.name); setActiveTab('home') }}>
              <i className={`fa-solid ${cat.icon}`} style={{ color: catFilter===cat.name ? cat.color : cat.color+'99' }}/>
              {cat.name}
            </div>
          ))}
          {catFilter !== '전체' && (
            <div className="sb-item" style={{ color:'var(--t3)', fontSize:12 }}
              onClick={() => setCatFilter('전체')}>
              <i className="fa-solid fa-xmark"/> 필터 해제
            </div>
          )}
        </nav>

        <div className="sb-bottom">
          <div className="sb-upgrade">
            <div className="sb-upgrade-title">🎯 Pro 업그레이드</div>
            <div className="sb-upgrade-sub">더 많은 프로젝트와 기능을 사용해보세요</div>
            <div className="sb-upgrade-btn">Upgrade</div>
          </div>
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <div className="main">
        {/* Topbar */}
        <header className="topbar">
          <span className="topbar-title">{pageTitles[activeTab]}</span>

          <div className="topbar-search">
            <i className="fa-solid fa-magnifying-glass"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search for applications..."/>
          </div>

          <div className="topbar-right">
            {/* Dark mode */}
            <div className="dark-toggle" onClick={() => setDark(d=>!d)} title={dark?'라이트 모드':'다크 모드'}>
              <i className={`fa-solid fa-${dark?'sun':'moon'}`}/>
            </div>

            {activeTab === 'home' && (
              <>
                <button className="btn-secondary" onClick={() => setShowImportModal(true)}>
                  <i className="fa-solid fa-file-import"/> CSV
                </button>
                <button className="btn-add" onClick={() => { setEditingProject(null); setShowForm(true) }}>
                  <i className="fa-solid fa-plus"/> Add Project
                </button>
              </>
            )}

            <div className="topbar-icon" title="알림">
              <i className="fa-solid fa-bell"/>
              <div className="notif-dot"/>
            </div>

            <div className="user-chip" onClick={handleLogout} title="로그아웃">
              <div style={{width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,var(--indigo),#a855f7)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'#fff',flexShrink:0}}>
                {initials}
              </div>
              <span className="user-name">{user?.email?.split('@')[0]}</span>
            </div>
          </div>
        </header>

        {/* ══ HOME PAGE ══ */}
        {activeTab === 'home' && (
          <div className="page">
            {/* Stats row */}
            <div className="stats-row">
              <div className="stat-card c-indigo">
                <div className="stat-icon" style={{ background:'var(--indigo-dim)', color:'var(--indigo)' }}>
                  <i className="fa-solid fa-folder-open"/>
                </div>
                <div className="stat-label">전체 프로젝트</div>
                <div className="stat-val">{counts.all}</div>
                <div className="stat-sub">총 계약 ₩{formatCurrency(totalContract)}</div>
              </div>

              <div className="stat-card c-green">
                <div className="stat-icon" style={{ background:'var(--green-dim)', color:'var(--green)' }}>
                  <i className="fa-solid fa-circle-check"/>
                </div>
                <div className="stat-label">완료</div>
                <div className="stat-val" style={{ color:'var(--green)' }}>{counts.done}</div>
                <div className="stat-sub">전체의 {counts.all ? Math.round(counts.done/counts.all*100) : 0}%</div>
              </div>

              <div className="stat-card c-amber">
                <div className="stat-icon" style={{ background:'var(--amber-dim)', color:'var(--amber)' }}>
                  <i className="fa-solid fa-spinner"/>
                </div>
                <div className="stat-label">진행중</div>
                <div className="stat-val" style={{ color:'var(--amber)' }}>{counts.active}</div>
                <div className="stat-sub">대기 {counts.pending}건</div>
              </div>

              <div className="stat-card c-pink">
                <div className="stat-icon" style={{ background:'var(--pink-dim)', color:'var(--pink)' }}>
                  <i className="fa-solid fa-chart-line"/>
                </div>
                <div className="stat-label">순 매출</div>
                <div className="stat-val" style={{ fontSize:22, letterSpacing:'-0.5px' }}>
                  ₩{formatCurrency(Math.round(totalNet/10000))}만
                </div>
                <div className="stat-sub">외주 ₩{formatCurrency(Math.round(totalOut/10000))}만</div>
              </div>
            </div>

            {/* Toolbar */}
            <div className="toolbar">
              <FilterPills/>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <select className="sort-sel" value={sort} onChange={e=>setSort(e.target.value)}>
                  <option value="latest">최신순</option>
                  <option value="amountDesc">금액순</option>
                  <option value="nameAsc">이름순</option>
                  <option value="custom">사용자 지정</option>
                </select>
              </div>
            </div>

            {/* Recent projects */}
            {recent7.length > 0 && (
              <>
                <div className="proj-section-header">
                  <div className="proj-section-title">
                    최근 7일
                    <span className="proj-count">{recent7.length}</span>
                  </div>
                  <span className="see-all">See all →</span>
                </div>
                <div className="proj-grid">
                  {recent7.map((p, i) => (
                    <ProjectCard key={p.id||i} project={p} categories={categories}
                      onClick={() => setSelectedProject(p)}
                      draggable={sort==='custom'}
                      onDragStart={() => setDragIdx(projects.indexOf(p))}
                      onDragOver={e => e.preventDefault()}
                      onDrop={() => handleDrop(projects.indexOf(p))}/>
                  ))}
                </div>
              </>
            )}

            {/* Older projects */}
            {older.length > 0 && (
              <>
                <div className="proj-section-header">
                  <div className="proj-section-title">
                    이전 프로젝트
                    <span className="proj-count">{older.length}</span>
                  </div>
                </div>
                <div className="proj-grid">
                  {older.map((p, i) => (
                    <ProjectCard key={p.id||i} project={p} categories={categories}
                      onClick={() => setSelectedProject(p)}
                      draggable={sort==='custom'}
                      onDragStart={() => setDragIdx(projects.indexOf(p))}
                      onDragOver={e => e.preventDefault()}
                      onDrop={() => handleDrop(projects.indexOf(p))}/>
                  ))}
                </div>
              </>
            )}

            {filtered.length === 0 && (
              <div style={{ textAlign:'center', padding:'80px 20px', color:'var(--t3)' }}>
                <i className="fa-solid fa-folder-open" style={{ fontSize:48, marginBottom:16, display:'block', opacity:0.3 }}/>
                <p style={{ fontSize:15, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                  프로젝트가 없습니다
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="page">
            <CalendarView projects={projects} categories={categories}
              onSelectProject={i => setSelectedProject(projects[i])} isMobile={false}/>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="page">
            <StatsView projects={projects} categories={categories} isMobile={false}/>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="page">
            <div style={{ display:'grid', gridTemplateColumns:'360px 1fr', gap:24, minHeight:'calc(100vh - 120px)' }}>
              <div style={{ background:'var(--bg-card)', border:'1.5px solid var(--border)', borderRadius:'var(--r-lg)', overflow:'hidden', boxShadow:'var(--shadow-card)' }}>
                <SettingsPanel/>
              </div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', color:'var(--t3)', flexDirection:'column', gap:16 }}>
                <div style={{ width:80, height:80, borderRadius:'50%', background:'var(--indigo-dim)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <i className="fa-solid fa-gear" style={{ fontSize:32, color:'var(--indigo)', opacity:0.4 }}/>
                </div>
                <p style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--t3)' }}>
                  카테고리를 선택하거나 추가하세요
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══ MODALS ══ */}
      {loading && <div className="loading-overlay"><div className="loading-spinner"/><div className="loading-text">불러오는 중...</div></div>}
      {selectedProject && <ProjectDetail project={selectedProject} categories={categories}
        onEdit={() => { setEditingProject(selectedProject); setSelectedProject(null); setShowForm(true) }}
        onDelete={() => deleteProject(selectedProject)} onClose={() => setSelectedProject(null)}/>}
      {showForm && <ProjectForm project={editingProject} categories={categories}
        onSave={saveProject} onClose={() => { setShowForm(false); setEditingProject(null) }}/>}
      {showCatModal && <CategoryModal category={editingCategory} onSave={saveCategory}
        onClose={() => { setShowCatModal(false); setEditingCategory(undefined) }}/>}
      {showImportModal && <ImportModal onSave={handleImportProjects} onClose={() => setShowImportModal(false)}/>}
    </div>
  )
}
