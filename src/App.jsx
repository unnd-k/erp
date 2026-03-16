import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { DEFAULT_CATEGORIES, formatCurrency } from './lib/utils'
import AuthScreen from './components/AuthScreen'
import ProjectCard from './components/ProjectCard'
import ProjectDetail from './components/ProjectDetail'
import ProjectForm from './components/ProjectForm'
import CategoryModal from './components/CategoryModal'
import CalendarView from './components/CalendarView'
import StatsView from './components/StatsView'
import './index.css'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 769)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 769)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

export default function App() {
  const isMobile = useIsMobile()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState([])
  const [categories, setCategories] = useState(() => JSON.parse(localStorage.getItem('myCategories')) || DEFAULT_CATEGORIES)
  const [activeTab, setActiveTab] = useState('home')
  const [statusFilter, setStatusFilter] = useState('전체')
  const [catFilter, setCatFilter] = useState('전체')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('latest')
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true')
  const [selectedProject, setSelectedProject] = useState(null)
  const [editingProject, setEditingProject] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState(undefined)
  const [showCatModal, setShowCatModal] = useState(false)
  const [dragIdx, setDragIdx] = useState(null)

  // 다크모드 적용
  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode)
    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

  // 카테고리 저장
  useEffect(() => { localStorage.setItem('myCategories', JSON.stringify(categories)) }, [categories])

  // Supabase 세션 확인
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { setUser(session.user); loadProjects() }
      else setLoading(false)
    })
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') { setUser(null); setProjects([]) }
    })
  }, [])

  async function loadProjects() {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setProjects((data || []).map(p => ({
        id: p.id, projectName: p.project_name, company: p.company, status: p.status,
        category: p.category, amount: p.amount||0, date: p.date, advance: p.advance||0,
        balance: p.balance||0, advanceDate: p.advance_date, balanceDate: p.balance_date,
        taxDate: p.tax_date, outCompany: p.out_company||'', outAmount: p.out_amount||0,
        outAdvance: p.out_advance||0, outBalance: p.out_balance||0,
        outAdvanceDate: p.out_advance_date, outBalanceDate: p.out_balance_date,
      })))
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function saveProject(data) {
    setLoading(true)
    const row = {
      user_id: user.id, project_name: data.projectName, company: data.company,
      status: data.status, category: data.category, amount: data.amount||0,
      date: data.date||null, advance: data.advance||0, balance: data.balance||0,
      advance_date: data.advanceDate||null, balance_date: data.balanceDate||null,
      tax_date: data.taxDate||null, out_company: data.outCompany||null,
      out_amount: data.outAmount||0, out_advance: data.outAdvance||0,
      out_balance: data.outBalance||0, out_advance_date: data.outAdvanceDate||null,
      out_balance_date: data.outBalanceDate||null,
    }
    try {
      if (editingProject?.id) {
        await supabase.from('projects').update(row).eq('id', editingProject.id)
      } else {
        await supabase.from('projects').insert([row])
      }
      await loadProjects()
    } catch(e) { alert('저장 오류: ' + e.message) }
    finally { setLoading(false); setShowForm(false); setEditingProject(null) }
  }

  async function deleteProject(project) {
    if (!confirm('정말로 삭제하시겠습니까?')) return
    setLoading(true)
    try {
      await supabase.from('projects').delete().eq('id', project.id)
      await loadProjects()
      setSelectedProject(null)
    } catch(e) { alert('삭제 오류') }
    finally { setLoading(false) }
  }

  async function handleLogout() {
    if (!confirm('로그아웃 하시겠습니까?')) return
    await supabase.auth.signOut()
    setUser(null); setProjects([])
  }

  function saveCategory(data) {
    if (editingCategory) {
      const oldName = editingCategory.name
      setCategories(cs => cs.map(c => c.name === oldName ? data : c))
      setProjects(ps => ps.map(p => p.category === oldName ? {...p, category: data.name} : p))
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

  // 필터링 & 정렬
  const filteredProjects = projects
    .filter(p => {
      if (statusFilter !== '전체' && p.status !== statusFilter) return false
      if (catFilter !== '전체' && p.category !== catFilter) return false
      if (search) {
        const kw = search.toLowerCase()
        if (!(p.projectName||'').toLowerCase().includes(kw) && !(p.company||'').toLowerCase().includes(kw)) return false
      }
      return true
    })
    .sort((a, b) => {
      if (sort === 'latest') return new Date(b.date||0) - new Date(a.date||0)
      if (sort === 'amountDesc') return ((b.amount||0)-(b.outAmount||0)) - ((a.amount||0)-(a.outAmount||0))
      if (sort === 'nameAsc') return (a.projectName||'').localeCompare(b.projectName||'')
      return 0
    })

  // 대시보드 통계
  const totalNet = projects.reduce((s,p) => s + (Number(p.amount)||0) - (Number(p.outAmount)||0), 0)
  const totalContract = projects.reduce((s,p) => s + (Number(p.amount)||0), 0)
  const counts = { all: projects.length, done: projects.filter(p=>p.status==='완료').length, active: projects.filter(p=>p.status==='진행중').length, pending: projects.filter(p=>p.status==='대기중').length }

  // Drag & Drop
  function handleDrop(toIdx) {
    if (dragIdx === null || dragIdx === toIdx) return
    const updated = [...projects]
    const [moved] = updated.splice(dragIdx, 1)
    updated.splice(toIdx, 0, moved)
    setProjects(updated)
    setDragIdx(null)
  }

  const ToggleSwitch = ({ on, onClick }) => (
    <div className="toggle-wrap" onClick={onClick}>
      <div className={`toggle-switch${on?' on':''}`}><div className="toggle-slider" /></div>
    </div>
  )

  // ── 렌더 ──
  if (!user && !loading) return <AuthScreen onLogin={(u) => { setUser(u); loadProjects() }} />

  const FilterButtons = ({ mobile }) => (
    <div className={mobile ? 'm-filter' : 'filter-scroll'}>
      <button className={`filter-btn filter-btn-all${catFilter==='전체'?' active':''}`} onClick={() => setCatFilter('전체')}>ALL</button>
      {categories.map(cat => (
        <button key={cat.name}
          className={`filter-btn filter-btn-cat${catFilter===cat.name?' active':''}`}
          style={{ '--theme-color': cat.color, ...(catFilter===cat.name ? {background:cat.color,color:'#fff',borderColor:cat.color} : {}) }}
          onClick={() => setCatFilter(cat.name)}>
          <i className={`fa-solid ${cat.icon}`} /> {cat.name}
        </button>
      ))}
    </div>
  )

  const ProjectList = ({ mobile }) => (
    <div className={mobile ? 'm-list' : 'list-grid'}>
      {filteredProjects.map((p, i) => (
        <ProjectCard key={p.id||i} project={p} categories={categories}
          onClick={() => setSelectedProject(p)}
          draggable={sort==='custom'}
          onDragStart={() => setDragIdx(projects.indexOf(p))}
          onDragOver={e => e.preventDefault()}
          onDrop={() => handleDrop(projects.indexOf(p))} />
      ))}
    </div>
  )

  const SettingsPanel = ({ mobile }) => (
    <div>
      {mobile && (
        <div className="m-settings-row">
          <div className="m-settings-label"><i className="fa-solid fa-moon" /> 다크 모드</div>
          <ToggleSwitch on={darkMode} onClick={() => setDarkMode(d=>!d)} />
        </div>
      )}
      <div className={mobile?'m-settings-header':'settings-header'} style={!mobile?{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'20px 24px',borderBottom:'1px solid var(--border-main)'}:{}}>
        <h3 style={{fontSize:17,fontWeight:700,textTransform:'uppercase'}}>카테고리 관리</h3>
        <button className="btn-add-cat" onClick={() => { setEditingCategory(undefined); setShowCatModal(true) }}>+ Add</button>
      </div>
      <div className={mobile?'m-cat-list':''} style={!mobile?{display:'flex',flexWrap:'wrap',padding:'16px 20px'}:{}}>
        {categories.map((cat,i) => (
          <div key={i} className="cat-item" style={{borderColor:cat.color, ...(!mobile?{width:'100%',maxWidth:'48%',margin:4}:{})}}>
            <div className="cat-item-left" style={{color:cat.color}}>
              <i className={`fa-solid ${cat.icon}`} /> {cat.name}
            </div>
            <div className="cat-item-actions">
              <button className="cat-action-btn" onClick={() => { setEditingCategory(cat); setShowCatModal(true) }}><i className="fa-solid fa-pen" /></button>
              <button className="cat-action-btn" onClick={() => deleteCategory(cat)}><i className="fa-solid fa-trash-can" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  // ── MOBILE ──
  if (isMobile) return (
    <div style={{display:'flex',justifyContent:'center', background:'var(--bg-body)', minHeight:'100vh'}}>
      <div className="mobile-app">
        {/* Header */}
        {activeTab !== 'calendar' && (
          <div className="mobile-header">
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <img className="mobile-header-logo" src="https://unnd.kr/img/unnd_logo.svg" alt="unnd" />
              <span style={{fontFamily:'Paperlogy,sans-serif',fontSize:13,fontWeight:800,color:'var(--text-sub)',textTransform:'uppercase'}}>스튜디오언네임드</span>
            </div>
          </div>
        )}

        {/* Home */}
        {activeTab === 'home' && (
          <>
            <div className="m-summary">
              <div className="m-summary-top"><h2>총 예상 매출</h2><div className="m-summary-contract">계약총액 ₩ {formatCurrency(totalContract)}</div></div>
              <div className="m-summary-total">₩ {formatCurrency(totalNet)}</div>
            </div>
            <div className="m-status-row">
              {[['전체',counts.all],['완료',counts.done],['진행중',counts.active],['대기중',counts.pending]].map(([s,n]) => (
                <div key={s} className={`m-status-card${statusFilter===s?' active':''}`} onClick={()=>setStatusFilter(s)}>
                  <div className="s-label">{s}</div><div className="s-value">{n}</div>
                </div>
              ))}
            </div>
            <FilterButtons mobile />
            <div className="m-search-row">
              <div className="m-search"><i className="fa-solid fa-magnifying-glass" /><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="검색어 입력..." /></div>
              <select className="m-sort" value={sort} onChange={e=>setSort(e.target.value)}>
                <option value="latest">최신순</option>
                <option value="amountDesc">금액순</option>
                <option value="nameAsc">이름순</option>
                <option value="custom">사용자 지정</option>
              </select>
            </div>
            <ProjectList mobile />
            <button className="fab" onClick={() => { setEditingProject(null); setShowForm(true) }}><i className="fa-solid fa-plus" /></button>
          </>
        )}

        {activeTab === 'calendar' && <CalendarView projects={projects} categories={categories} onSelectProject={i => setSelectedProject(projects[i])} isMobile />}
        {activeTab === 'stats' && <StatsView projects={projects} categories={categories} isMobile />}
        {activeTab === 'settings' && <SettingsPanel mobile />}

        {/* Bottom Nav */}
        <nav className="bottom-nav">
          {[['home','fa-house','Home'],['calendar','fa-calendar','Schedule'],['stats','fa-chart-simple','Stats'],['settings','fa-gear','Settings']].map(([tab,icon,label]) => (
            <div key={tab} className={`nav-item${activeTab===tab?' active':''}`} onClick={()=>setActiveTab(tab)}>
              <i className={`fa-solid ${icon}`} /><span>{label}</span>
            </div>
          ))}
        </nav>
      </div>

      {/* Modals */}
      {loading && <div className="loading-overlay"><div className="loading-spinner"/><div className="loading-text">불러오는 중...</div></div>}
      {selectedProject && <ProjectDetail project={selectedProject} categories={categories} onEdit={() => { setEditingProject(selectedProject); setSelectedProject(null); setShowForm(true) }} onDelete={() => deleteProject(selectedProject)} onClose={() => setSelectedProject(null)} />}
      {showForm && <ProjectForm project={editingProject} categories={categories} onSave={saveProject} onClose={() => { setShowForm(false); setEditingProject(null) }} />}
      {showCatModal && <CategoryModal category={editingCategory} onSave={saveCategory} onClose={() => { setShowCatModal(false); setEditingCategory(undefined) }} />}
    </div>
  )

  // ── DESKTOP ──
  const tabs = [['home','fa-house','Home'],['calendar','fa-calendar','Schedule'],['stats','fa-chart-simple','Stats'],['settings','fa-gear','Settings']]
  const tabTitles = { home:'프로젝트 관리', calendar:'Schedule', stats:'통계', settings:'설정' }

  return (
    <div className="desktop-shell" style={{display:'flex'}}>
      {/* Sidebar */}
      <div id="sidebar">
        <div className="sidebar-logo">
          <img className="sidebar-logo-img" src="https://unnd.kr/img/unnd_logo.svg" alt="unnd" />
          <span className="sidebar-logo-name">Studio Unnamed</span>
        </div>
        <nav className="sidebar-nav">
          {tabs.map(([tab,icon,label]) => (
            <div key={tab} className={`sidebar-nav-item${activeTab===tab?' active':''}`} onClick={()=>setActiveTab(tab)}>
              <i className={`fa-solid ${icon}`} /> {label}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-darkmode">
            <span><i className="fa-solid fa-moon" style={{marginRight:8}} />Dark Mode</span>
            <ToggleSwitch on={darkMode} onClick={() => setDarkMode(d=>!d)} />
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="desktop-main">
        <div className="desktop-header">
          <span className="desktop-header-title">{tabTitles[activeTab]}</span>
          <div className="desktop-header-right">
            <span className="desktop-user-email">{user?.email}</span>
            <button className="btn-logout" onClick={handleLogout}><i className="fa-solid fa-right-from-bracket" /> 로그아웃</button>
            {activeTab === 'home' && <button className="btn-add" onClick={() => { setEditingProject(null); setShowForm(true) }}><i className="fa-solid fa-plus" /> 새 프로젝트</button>}
          </div>
        </div>

        <div className="desktop-content">
          {/* Home */}
          {activeTab === 'home' && (
            <>
              <div className="home-summary-grid">
                <div className="summary-panel">
                  <h2>총 예상 매출</h2>
                  <div className="big-num">₩ {formatCurrency(totalNet)}</div>
                  <div className="sub-tag">계약총액 ₩ {formatCurrency(totalContract)}</div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',borderBottom:'1px solid var(--border-main)'}}>
                  <div className="summary-panel">
                    <h2>진행중</h2><div className="big-num">{counts.active}</div>
                  </div>
                  <div className="summary-panel" style={{borderRight:'none'}}>
                    <h2>완료</h2><div className="big-num">{counts.done}</div>
                  </div>
                </div>
              </div>
              <div className="status-row">
                {[['전체',counts.all],['완료',counts.done],['진행중',counts.active],['대기중',counts.pending]].map(([s,n]) => (
                  <div key={s} className={`status-card${statusFilter===s?' active':''}`} onClick={()=>setStatusFilter(s)}>
                    <div className="s-label">{s}</div><div className="s-value">{n}</div>
                  </div>
                ))}
              </div>
              <div className="toolbar">
                <FilterButtons />
                <div className="search-area">
                  <div className="search-box"><i className="fa-solid fa-magnifying-glass" /><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="검색어 입력..." /></div>
                  <select className="sort-select" value={sort} onChange={e=>setSort(e.target.value)}>
                    <option value="latest">최신순</option>
                    <option value="amountDesc">금액순</option>
                    <option value="nameAsc">이름순</option>
                    <option value="custom">사용자 지정</option>
                  </select>
                </div>
              </div>
              <ProjectList />
            </>
          )}
          {activeTab === 'calendar' && <CalendarView projects={projects} categories={categories} onSelectProject={i => setSelectedProject(projects[i])} isMobile={false} />}
          {activeTab === 'stats' && <StatsView projects={projects} categories={categories} isMobile={false} />}
          {activeTab === 'settings' && (
            <div style={{display:'grid',gridTemplateColumns:'360px 1fr',minHeight:'calc(100vh - 60px)'}}>
              <div style={{borderRight:'1px solid var(--border-main)',background:'var(--bg-main)'}}><SettingsPanel /></div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-muted)',flexDirection:'column',gap:16}}>
                <i className="fa-solid fa-gear" style={{fontSize:48,opacity:0.25}} />
                <p style={{fontSize:13,fontWeight:700,textTransform:'uppercase',letterSpacing:1}}>카테고리를 선택하거나 추가하세요</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {loading && <div className="loading-overlay"><div className="loading-spinner"/><div className="loading-text">불러오는 중...</div></div>}
      {selectedProject && <ProjectDetail project={selectedProject} categories={categories} onEdit={() => { setEditingProject(selectedProject); setSelectedProject(null); setShowForm(true) }} onDelete={() => deleteProject(selectedProject)} onClose={() => setSelectedProject(null)} />}
      {showForm && <ProjectForm project={editingProject} categories={categories} onSave={saveProject} onClose={() => { setShowForm(false); setEditingProject(null) }} />}
      {showCatModal && <CategoryModal category={editingCategory} onSave={saveCategory} onClose={() => { setShowCatModal(false); setEditingCategory(undefined) }} />}
    </div>
  )
}
