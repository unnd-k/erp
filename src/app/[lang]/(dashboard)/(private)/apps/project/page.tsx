'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/libs/supabase'
import type { User } from '@supabase/supabase-js'

import {
  Card, CardContent, Typography, Button, IconButton, Chip, Box,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  LinearProgress, ToggleButton, ToggleButtonGroup, MenuItem, Select, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, Switch, FormControlLabel,
  InputAdornment, Grid
} from '@mui/material'

// ── 유틸 ────────────────────────────────────────────────────────
function formatCurrency(num: number | string) {
  const parsed = Number(num)
  return isNaN(parsed) || !parsed ? '0' : parsed.toLocaleString('ko-KR')
}
function formatDate(s?: string | null) {
  return s ? s.replace(/-/g, '.') : '-'
}
function extractNumber(str: string | number) {
  return Number(str.toString().replace(/,/g, '')) || 0
}
function calculateProgress(p: Project) {
  const today = new Date().toISOString().split('T')[0]
  const amount  = Number(p.amount)  || 0
  const advance = Number(p.advance) || 0
  const steps: (string | null | undefined)[] = [p.date, p.advanceDate]
  if (p.outCompany) { steps.push(p.outAdvanceDate); steps.push(p.outBalanceDate) }
  if (amount > advance) steps.push(p.balanceDate)
  steps.push(p.taxDate)
  let completed = 0
  steps.forEach(d => { if (d && d <= today) completed++ })
  return Math.round((completed / steps.length) * 100) || 0
}

const DEFAULT_CATEGORIES = [
  { name: '홈페이지',   color: '#16a34a', icon: 'ri-computer-line'    },
  { name: '편집디자인', color: '#f59e0b', icon: 'ri-pencil-line'       },
  { name: '영상',       color: '#8b5cf6', icon: 'ri-movie-line'        },
  { name: '유지보수',   color: '#3b82f6', icon: 'ri-tools-line'        },
]

// ── 타입 ────────────────────────────────────────────────────────
interface Project {
  id?: string
  projectName: string
  company: string
  status: string
  category: string
  amount: number
  date?: string
  advance: number
  balance: number
  advanceDate?: string
  balanceDate?: string
  taxDate?: string
  outCompany?: string
  outAmount: number
  outAdvance: number
  outBalance: number
  outAdvanceDate?: string
  outBalanceDate?: string
}

interface Category {
  name: string
  color: string
  icon: string
}

const emptyForm = (): Omit<Partial<Project>, 'amount' | 'advance' | 'outAmount' | 'outAdvance'> & { amount: string; advance: string; outAmount: string; outAdvance: string } => ({
  projectName: '', company: '', status: '대기중', category: '',
  date: '', advanceDate: '', balanceDate: '', taxDate: '',
  outCompany: '', amount: '', advance: '', outAmount: '', outAdvance: '',
  outAdvanceDate: '', outBalanceDate: '',
})

// ── 컴포넌트 ────────────────────────────────────────────────────
export default function ProjectPage() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading]   = useState(false)
  const [catFilter, setCatFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [sort, setSort]           = useState('latest')
  const [view, setView]           = useState<'grid' | 'table'>('grid')
  const [selected, setSelected]   = useState<Project | null>(null)
  const [editing, setEditing]     = useState<Project | null>(null)
  const [showForm, setShowForm]   = useState(false)
  const [categories] = useState<Category[]>(DEFAULT_CATEGORIES)

  // Supabase 로그인 확인
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Supabase 로드
  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) {
      setProjects(data.map((p: any) => ({
        id: p.id,
        projectName: p.project_name,
        company:     p.company,
        status:      p.status,
        category:    p.category,
        amount:      p.amount      || 0,
        date:        p.date,
        advance:     p.advance     || 0,
        balance:     p.balance     || 0,
        advanceDate: p.advance_date,
        balanceDate: p.balance_date,
        taxDate:     p.tax_date,
        outCompany:  p.out_company  || '',
        outAmount:   p.out_amount   || 0,
        outAdvance:  p.out_advance  || 0,
        outBalance:  p.out_balance  || 0,
        outAdvanceDate: p.out_advance_date,
        outBalanceDate: p.out_balance_date,
      })))
    }
    setLoading(false)
  }, [user])

  useEffect(() => { if (user) load() }, [user, load])

  // 필터 & 정렬
  const filtered = projects
    .filter(p => catFilter === 'ALL' || p.category === catFilter)
    .filter(p => p.projectName.toLowerCase().includes(searchQuery.toLowerCase()) || p.company.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'latest')     return new Date(b.date||0).getTime() - new Date(a.date||0).getTime()
      if (sort === 'amountDesc') return ((b.amount||0)-(b.outAmount||0)) - ((a.amount||0)-(a.outAmount||0))
      return (a.projectName||'').localeCompare(b.projectName||'')
    })

  if (authLoading) return <Box sx={{ p: 10, textAlign: 'center' }}><Typography color="text.secondary">인증 정보를 불러오는 중...</Typography></Box>
  if (!user) return <AuthScreen onLogin={u => setUser(u)} />

  return (
    <Box sx={{ p: 4 }}>
      {/* ── 헤더 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="800">All Projects</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={(_, newView) => { if (newView) setView(newView) }}
            size="small"
            sx={{ backgroundColor: 'background.paper' }}
          >
            <ToggleButton value="grid"><i className="ri-layout-grid-line" style={{ fontSize: 20 }} /></ToggleButton>
            <ToggleButton value="table"><i className="ri-list-unordered" style={{ fontSize: 20 }} /></ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* ── 필터 툴바 */}
      <Paper elevation={0} sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        p: 2, px: 3, mb: 4, borderRadius: '0.625rem', border: '1px solid', borderColor: 'divider',
        flexWrap: 'wrap', gap: 2
      }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="프로젝트명 또는 업체명 검색..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><i className="ri-search-line" /></InputAdornment> }}
            sx={{ mr: 2, width: 250, '& .MuiOutlinedInput-root': { borderRadius: '0.625rem' } }}
          />
          <Chip
            label="ALL"
            onClick={() => setCatFilter('ALL')}
            color={catFilter === 'ALL' ? 'primary' : 'default'}
            variant={catFilter === 'ALL' ? 'filled' : 'outlined'}
            sx={{ fontWeight: 'bold', px: 1 }}
          />
          {categories.map(cat => (
            <Chip
              key={cat.name}
              icon={<i className={cat.icon} style={{ fontSize: '16px', display: 'block', color: catFilter === cat.name ? '#fff' : cat.color }} />}
              label={cat.name}
              onClick={() => setCatFilter(catFilter === cat.name ? 'ALL' : cat.name)}
              variant={catFilter === cat.name ? 'filled' : 'outlined'}
              sx={{
                fontWeight: 'bold', px: 1,
                ...(catFilter === cat.name ? { backgroundColor: cat.color, color: '#fff', '&:hover': { backgroundColor: cat.color, opacity: 0.9 } } : { borderColor: 'divider', color: 'text.secondary' })
              }}
            />
          ))}
        </Box>
        <Select
          size="small"
          value={sort}
          onChange={e => setSort(e.target.value)}
          sx={{ borderRadius: '0.625rem', minWidth: 150, '& .MuiOutlinedInput-notchedOutline': { border: 'none' }, fontWeight: 'bold', color: 'primary.main' }}
        >
          <MenuItem value='latest'>Sort by Date</MenuItem>
          <MenuItem value='amountDesc'>Sort by Amount</MenuItem>
          <MenuItem value='nameAsc'>Sort by Name</MenuItem>
        </Select>
      </Paper>

      {/* ── 프로젝트 뷰 */}
      {loading ? (
        <Box sx={{ p: 10, textAlign: 'center' }}><LinearProgress sx={{ maxWidth: 200, mx: 'auto', mb: 2 }} /><Typography color="text.secondary">불러오는 중...</Typography></Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ p: 10, textAlign: 'center' }}>
          <i className='ri-folder-open-line' style={{ fontSize: 48, opacity: 0.3, display: 'block', marginBottom: 16 }} />
          <Typography variant="h6" color="text.secondary" fontWeight="bold">프로젝트가 없습니다</Typography>
        </Box>
      ) : view === 'grid' ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 4 }}>
          {filtered.map((p) => (
            <ProjectCard project={p} categories={categories} onClick={() => setSelected(p)} key={p.id} />
          ))}
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, overflow: 'hidden' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ '& th': { backgroundColor: 'action.hover', fontWeight: 'bold' } }}>
                <TableCell>프로젝트명</TableCell>
                <TableCell>업체명</TableCell>
                <TableCell align="right">총 계약금액</TableCell>
                <TableCell align="right">수금액</TableCell>
                <TableCell align="center">계약일</TableCell>
                <TableCell align="center">진행률</TableCell>
                <TableCell align="center">상태</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((p) => {
                const contract = Number(p.amount) || 0
                const today = new Date().toISOString().split('T')[0]
                let collected = 0
                if (p.advanceDate && p.advanceDate <= today) collected += (Number(p.advance) || 0)
                if (p.balanceDate && p.balanceDate <= today) collected += (Number(p.balance) || 0)
                const progress = calculateProgress(p)
                
                let badgeColor: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'default'
                if(p.status === '진행중') badgeColor = 'success'
                if(p.status === '대기중') badgeColor = 'warning'
                if(p.status === '완료') badgeColor = 'info'

                return (
                  <TableRow key={p.id} hover onClick={() => setSelected(p)} sx={{ cursor: 'pointer', transition: 'background-color 0.2s' }}>
                    <TableCell><Typography fontWeight="700">{p.projectName}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{p.company || '-'}</Typography></TableCell>
                    <TableCell align="right"><Typography fontWeight="bold" color="primary.main">₩{formatCurrency(contract)}</Typography></TableCell>
                    <TableCell align="right"><Typography fontWeight="bold" color="text.primary">₩{formatCurrency(collected)}</Typography></TableCell>
                    <TableCell align="center"><Typography variant="body2" color="text.secondary">{formatDate(p.date)}</Typography></TableCell>
                    <TableCell align="center" sx={{ width: 150 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress variant="determinate" value={progress} color="secondary" sx={{ flex: 1, borderRadius: 4 }} />
                        <Typography variant="caption" fontWeight="bold">{progress}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={p.status} color={badgeColor} size="small" variant="outlined" sx={{ fontWeight: 'bold', borderWidth: 1.5 }} />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ── 상세 보기 모달 */}
      {selected && (
        <DetailModal
          project={selected}
          categories={categories}
          onEdit={() => { setEditing(selected); setSelected(null); setShowForm(true) }}
          onDelete={async () => {
            if (!confirm('정말로 삭제하시겠습니까?')) return
            await supabase.from('projects').delete().eq('id', selected.id)
            setSelected(null); load()
          }}
          onClose={() => setSelected(null)}
        />
      )}

      {/* ── 추가/편집 폼 */}
      {showForm && (
        <FormModal
          project={editing}
          categories={categories}
          onSave={async (data) => {
            const row = {
              project_name: data.projectName, company: data.company, status: data.status,
              category: data.category, amount: data.amount, date: data.date || null,
              advance: data.advance, balance: data.balance,
              advance_date: data.advanceDate || null, balance_date: data.balanceDate || null,
              tax_date: data.taxDate || null,
              out_company: data.outCompany || null, out_amount: data.outAmount,
              out_advance: data.outAdvance, out_balance: data.outBalance,
              out_advance_date: data.outAdvanceDate || null, out_balance_date: data.outBalanceDate || null,
              user_id: user.id, // 필수 추가
            }
            if (editing?.id) await supabase.from('projects').update(row).eq('id', editing.id)
            else {
              const { error } = await supabase.from('projects').insert([row])
              if (error) {
                alert('프로젝트 추가 중 오류가 발생했습니다: ' + error.message)
                return
              }
            }
            setShowForm(false); setEditing(null); load()
          }}
          onClose={() => { setShowForm(false); setEditing(null) }}
        />
      )}
    </Box>
  )
}

// ── 카드 컴포넌트 ─────────────────────────────────────────────
function ProjectCard({ project, categories, onClick }: { project: Project; categories: Category[]; onClick: () => void }) {
  const today     = new Date().toISOString().split('T')[0]
  const contract  = Number(project.amount) || 0
  const net       = contract - (Number(project.outAmount) || 0)
  let   collected = 0
  if (project.advanceDate && project.advanceDate <= today) collected += (Number(project.advance) || 0)
  if (project.balanceDate && project.balanceDate <= today) collected += (Number(project.balance) || 0)
  const progress = calculateProgress(project)
  const cat      = categories.find(c => c.name === project.category)

  let badgeColor: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'default'
  if(project.status === '진행중') badgeColor = 'success'
  if(project.status === '대기중') badgeColor = 'warning'
  if(project.status === '완료') badgeColor = 'info'

  return (
    <Card
      onClick={onClick}
      elevation={0}
      sx={{
        border: '1px solid', borderColor: 'divider', borderRadius: '0.625rem',
        cursor: 'pointer', transition: 'all 0.2s ease-in-out',
        '&:hover': { boxShadow: '0 10px 30px rgba(0,0,0,0.08)', transform: 'translateY(-2px)' }
      }}
    >
      <CardContent sx={{ p: 4, '&:last-child': { pb: 4 } }}>
        {/* 헤더: 프로젝트명 + 상태 배지 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" fontWeight="800" sx={{ lineHeight: 1.3, letterSpacing: '-0.5px' }}>
            {project.projectName}
          </Typography>
          <Chip label={project.status} color={badgeColor} size="small" variant="outlined" sx={{ fontWeight: 'bold', borderWidth: 1.5 }} />
        </Box>

        {/* 메타 정보 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
            <i className='ri-building-line' style={{ marginRight: '2px', fontSize: '1.2rem' }}/>{project.company || '-'}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.4 }}>|</Typography>
          {cat && (
            <>
              <Typography variant="caption" sx={{ color: cat.color, display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
                <i className={cat.icon} style={{ marginRight: '2px', fontSize: '1.2rem' }}/>{cat.name}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.4 }}>|</Typography>
            </>
          )}
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
            <i className='ri-calendar-line' style={{ marginRight: '2px', fontSize: '1.2rem' }}/>{formatDate(project.date)}
          </Typography>
        </Box>

        {/* 재무 정보 */}
        <Box sx={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, py: 2.5,
          borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider', mb: 3
        }}>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight="700" display="block" mb={0.5}>계약금액</Typography>
            <Typography variant="body2" fontWeight="800" color="primary.main" letterSpacing="-0.5px">₩{formatCurrency(contract)}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight="700" display="block" mb={0.5}>순 매출액</Typography>
            <Typography variant="body2" fontWeight="800" color="error.main" letterSpacing="-0.5px">₩{formatCurrency(net)}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight="700" display="block" mb={0.5}>수금액</Typography>
            <Typography variant="body2" fontWeight="800" color="text.primary" letterSpacing="-0.5px">₩{formatCurrency(collected)}</Typography>
          </Box>
        </Box>

        {/* 진행률 */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" fontWeight="800" color="text.secondary" letterSpacing="0.05em">PROGRESS</Typography>
            <Typography variant="caption" fontWeight="800" color="text.secondary">{progress}%</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            color="secondary"
            sx={{ borderRadius: 4 }}
          />
        </Box>
      </CardContent>
    </Card>
  )
}

// ── 상세 모달 ─────────────────────────────────────────────────
function DetailModal({ project, categories, onEdit, onDelete, onClose }: {
  project: Project; categories: Category[]; onEdit: () => void; onDelete: () => void; onClose: () => void
}) {
  const cat = categories.find(c => c.name === project.category)
  const net = (project.amount||0) - (project.outAmount||0)
  const hasOut = !!(project.outCompany || (project.outAmount||0) > 0)

  let badgeColor: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'default'
  if(project.status === '진행중') badgeColor = 'success'
  if(project.status === '대기중') badgeColor = 'warning'
  if(project.status === '완료') badgeColor = 'info'

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography variant="h5" fontWeight="800">{project.projectName}</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" onClick={onEdit}><i className='ri-pencil-line'/></IconButton>
          <IconButton size="small" color="error" onClick={onDelete}><i className='ri-delete-bin-line'/></IconButton>
          <IconButton size="small" onClick={onClose}><i className='ri-close-line'/></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 3 }}>
        <Row label="카테고리" value={cat ? <Typography variant="body2" fontWeight="bold" sx={{ color: cat.color }}><i className={cat.icon}/> {cat.name}</Typography> : project.category} />
        <Row label="업체명" value={project.company} />
        <Row label="계약일" value={formatDate(project.date)} />
        <Row label="상태" value={<Chip label={project.status} size="small" color={badgeColor} sx={{ fontWeight: 'bold' }}/>} />
        <Box sx={{ my: 1, borderTop: '1px solid', borderColor: 'divider' }} />
        <Row label="총 계약금액" value={`₩ ${formatCurrency(project.amount)}`} valueColor="primary.main" />
        <Row label="총 매출액" value={`₩ ${formatCurrency(net)}`} valueColor="error.main" />
        <Row label="선금" value={`₩ ${formatCurrency(project.advance)} ${project.advanceDate ? `(${formatDate(project.advanceDate)})` : ''}`} />
        <Row label="잔금" value={`₩ ${formatCurrency(project.balance)} ${project.balanceDate ? `(${formatDate(project.balanceDate)})` : ''}`} />
        <Row label="계산서 발행" value={formatDate(project.taxDate)} />
        {hasOut && (
          <>
            <Box sx={{ my: 1, borderTop: '1px solid', borderColor: 'divider' }} />
            <Typography variant="overline" fontWeight="800" color="text.secondary">외주 정보</Typography>
            <Row label="외주업체" value={project.outCompany} />
            <Row label="외주금액" value={`₩ ${formatCurrency(project.outAmount)}`} />
            <Row label="외주 선금" value={`₩ ${formatCurrency(project.outAdvance)}`} />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Row({ label, value, valueColor }: { label: string; value: React.ReactNode; valueColor?: string }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 2, alignItems: 'center' }}>
      <Typography variant="body2" color="text.secondary" fontWeight="700">{label}</Typography>
      {typeof value === 'string' ? <Typography variant="body2" fontWeight="800" color={valueColor || 'text.primary'}>{value || '-'}</Typography> : value}
    </Box>
  )
}

// ── 폼 모달 ──────────────────────────────────────────────────
function FormModal({ project, categories, onSave, onClose }: {
  project: Project | null; categories: Category[]; onSave: (data: Project) => void; onClose: () => void
}) {
  const initForm = () => {
    if (!project) return emptyForm()
    return {
      ...project,
      amount: formatCurrency(project.amount),
      advance: formatCurrency(project.advance),
      outAmount: formatCurrency(project.outAmount),
      outAdvance: formatCurrency(project.outAdvance),
    }
  }
  const [form, setForm] = useState(initForm)
  const [outOn, setOutOn] = useState(!!(project?.outCompany || (project?.outAmount||0) > 0))

  const setField = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const setCurrency = (k: string, v: string) => {
    const num = v.replace(/[^0-9]/g, '')
    setField(k, num ? Number(num).toLocaleString('ko-KR') : '')
  }

  const handleSave = () => {
    const amount  = extractNumber(form.amount as string)
    const advance = extractNumber(form.advance as string)
    if (!form.projectName || !form.company || !form.date || !amount)
      return alert('프로젝트명, 업체명, 계약일, 계약금액은 필수입니다!')
    const outAmount  = outOn ? extractNumber(form.outAmount as string) : 0
    const outAdvance = outOn ? extractNumber(form.outAdvance as string) : 0
    onSave({
      projectName: form.projectName as string,
      company:     form.company as string,
      status:      form.status as string,
      category:    form.category as string,
      date:        form.date as string,
      amount, advance, balance: amount - advance,
      advanceDate: form.advanceDate as string,
      balanceDate: form.balanceDate as string,
      taxDate:     form.taxDate as string,
      outCompany:  outOn ? form.outCompany as string : '',
      outAmount, outAdvance, outBalance: outAmount - outAdvance,
      outAdvanceDate: outOn ? form.outAdvanceDate as string : '',
      outBalanceDate: outOn ? form.outBalanceDate as string : '',
    })
  }

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography variant="h5" fontWeight="800">{project ? '프로젝트 수정' : '프로젝트 등록'}</Typography>
        <IconButton size="small" onClick={onClose}><i className='ri-close-line'/></IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 3 }}>
        <TextField label="프로젝트명" fullWidth size="small" value={form.projectName} onChange={e => setField('projectName', e.target.value)} />
        
        <Box>
          <Typography variant="caption" fontWeight="bold" color="text.secondary" display="block" mb={1}>카테고리</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {categories.map(c => (
              <Chip
                key={c.name}
                icon={<i className={c.icon} style={{ color: form.category === c.name ? '#fff' : c.color }} />}
                label={c.name}
                onClick={() => setField('category', form.category === c.name ? '' : c.name)}
                variant={form.category === c.name ? 'filled' : 'outlined'}
                sx={{
                  fontWeight: 'bold',
                  ...(form.category === c.name ? { backgroundColor: c.color, color: '#fff' } : {})
                }}
              />
            ))}
          </Box>
        </Box>

        <TextField label="업체명" fullWidth size="small" value={form.company} onChange={e => setField('company', e.target.value)} />
        
        <TextField select label="상태" fullWidth size="small" value={form.status} onChange={e => setField('status', e.target.value)}>
          <MenuItem value="대기중">대기중</MenuItem>
          <MenuItem value="진행중">진행중</MenuItem>
          <MenuItem value="완료">완료</MenuItem>
        </TextField>

        <TextField label="계약일" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} value={form.date} onChange={e => setField('date', e.target.value)} />

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <TextField label="계약금액" fullWidth size="small" InputProps={{ startAdornment: <InputAdornment position="start">₩</InputAdornment> }} value={form.amount} onChange={e => setCurrency('amount', e.target.value)} />
          <TextField label="선금" fullWidth size="small" InputProps={{ startAdornment: <InputAdornment position="start">₩</InputAdornment> }} value={form.advance} onChange={e => setCurrency('advance', e.target.value)} />
          <TextField label="선금일" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} value={form.advanceDate} onChange={e => setField('advanceDate', e.target.value)} />
          <TextField label="잔금일" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} value={form.balanceDate} onChange={e => setField('balanceDate', e.target.value)} />
        </Box>
        
        <TextField label="계산서 발행일" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} value={form.taxDate} onChange={e => setField('taxDate', e.target.value)} />

        <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
          <FormControlLabel
            control={<Switch checked={outOn} onChange={e => setOutOn(e.target.checked)} color="primary" />}
            label={<Typography fontWeight="bold">외주 정보 입력</Typography>}
          />
        </Box>

        {outOn && (
          <>
            <TextField label="외주업체명" fullWidth size="small" value={form.outCompany} onChange={e => setField('outCompany', e.target.value)} />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField label="외주 총금액" fullWidth size="small" InputProps={{ startAdornment: <InputAdornment position="start">₩</InputAdornment> }} value={form.outAmount} onChange={e => setCurrency('outAmount', e.target.value)} />
              <TextField label="외주 선금" fullWidth size="small" InputProps={{ startAdornment: <InputAdornment position="start">₩</InputAdornment> }} value={form.outAdvance} onChange={e => setCurrency('outAdvance', e.target.value)} />
              <TextField label="외주 선금일" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} value={form.outAdvanceDate} onChange={e => setField('outAdvanceDate', e.target.value)} />
              <TextField label="외주 잔금일" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} value={form.outBalanceDate} onChange={e => setField('outBalanceDate', e.target.value)} />
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={onClose} color="inherit" sx={{ fontWeight: 'bold' }}>취소</Button>
        <Button onClick={handleSave} variant="contained" sx={{ borderRadius: 4, px: 4, fontWeight: 'bold' }}>저장하기</Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Auth 컴포넌트 ──────────────────────────────────────────────
function AuthScreen({ onLogin }: { onLogin: (u: User) => void }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!email || !password) return setError('이메일과 비밀번호를 입력해주세요.')
    setLoading(true); setError('')
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) return setError('이메일 또는 비밀번호가 올바르지 않습니다.')
        if (data.user) onLogin(data.user)
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) return setError(error.message)
        if (data.user) onLogin(data.user)
      }
    } catch {
      setError('오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', minHeight: '60vh', alignItems: 'center' }}>
      <Paper elevation={0} sx={{ width: 400, p: 5, borderRadius: 6, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h5" fontWeight="800" textAlign="center" mb={1}>{isLogin ? '로그인' : '회원가입'}</Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center" mb={4}>
          프로젝트 데이터를 보려면 Supabase 인증이 필요합니다.
        </Typography>
        {error && <Typography color="error" variant="body2" fontWeight="bold" textAlign="center" mb={2}>{error}</Typography>}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 4 }}>
          <TextField label="이메일" type="email" fullWidth size="small" value={email} onChange={e => setEmail(e.target.value)} />
          <TextField label="비밀번호" type="password" fullWidth size="small" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </Box>
        <Button variant="contained" fullWidth onClick={handleSubmit} disabled={loading} sx={{ py: 1.5, borderRadius: 4, fontWeight: 'bold' }}>
          {loading ? '처리 중...' : (isLogin ? '로그인' : '가입하기')}
        </Button>
        <Typography variant="body2" color="text.secondary" textAlign="center" mt={3}>
          {isLogin ? '계정이 없으신가요? ' : '이미 계정이 있으신가요? '}
          <Box component="span" onClick={() => { setIsLogin(!isLogin); setError('') }} sx={{ color: 'primary.main', fontWeight: 'bold', cursor: 'pointer' }}>
            {isLogin ? '가입하기' : '로그인'}
          </Box>
        </Typography>
      </Paper>
    </Box>
  )
}
