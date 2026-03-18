import { useState, useEffect } from 'react'
import { extractNumber, FA_ICONS } from '../lib/utils'

export default function ProjectForm({ project, categories, onSave, onClose }) {
  const [form, setForm] = useState({
    projectName: '', category: '', company: '', status: '대기중',
    date: '', amount: '', advance: '', advanceDate: '', balanceDate: '', taxDate: '',
    outCompany: '', outAmount: '', outAdvance: '', outAdvanceDate: '', outBalanceDate: '',
  })
  const [outOn, setOutOn] = useState(false)
  const [catOpen, setCatOpen] = useState(false)
  const isEdit = !!project

  useEffect(() => {
    if (project) {
      setForm({
        projectName: project.projectName || '',
        category: project.category || '',
        company: project.company || '',
        status: project.status || '대기중',
        date: project.date || '',
        amount: project.amount ? Number(project.amount).toLocaleString('ko-KR') : '',
        advance: project.advance ? Number(project.advance).toLocaleString('ko-KR') : '',
        advanceDate: project.advanceDate || '',
        balanceDate: project.balanceDate || '',
        taxDate: project.taxDate || '',
        outCompany: project.outCompany || '',
        outAmount: project.outAmount ? Number(project.outAmount).toLocaleString('ko-KR') : '',
        outAdvance: project.outAdvance ? Number(project.outAdvance).toLocaleString('ko-KR') : '',
        outAdvanceDate: project.outAdvanceDate || '',
        outBalanceDate: project.outBalanceDate || '',
      })
      const hasOut = !!(project.outCompany || project.outAmount > 0)
      setOutOn(hasOut)
    }
  }, [project])

  function handleCurrency(field, val) {
    const num = val.replace(/[^0-9]/g, '')
    setForm(f => ({ ...f, [field]: num ? Number(num).toLocaleString('ko-KR') : '' }))
  }

  function handleSave() {
    const amount = extractNumber(form.amount)
    const advance = extractNumber(form.advance)
    if (!form.projectName || !form.company || !form.date || !amount) {
      return alert('프로젝트명, 업체명, 계약일, 계약금액은 필수입니다!')
    }
    let outAmount = 0, outAdvance = 0
    if (outOn) { outAmount = extractNumber(form.outAmount); outAdvance = extractNumber(form.outAdvance) }
    onSave({
      projectName: form.projectName, category: form.category, company: form.company,
      status: form.status, date: form.date, amount, advance, balance: amount - advance,
      advanceDate: form.advanceDate, balanceDate: form.balanceDate, taxDate: form.taxDate,
      outCompany: outOn ? form.outCompany : '', outAmount, outAdvance,
      outBalance: outAmount - outAdvance,
      outAdvanceDate: outOn ? form.outAdvanceDate : '', outBalanceDate: outOn ? form.outBalanceDate : '',
    })
  }

  const catObj = categories.find(c => c.name === form.category)

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header-actions">
          <button className="action-icon" onClick={onClose}><i className="fa-solid fa-xmark" /></button>
        </div>
        <div className="modal-title">{isEdit ? '프로젝트 수정' : '프로젝트 등록'}</div>
        <div className="section-title">본계약 정보</div>

        <div className="input-group"><label>프로젝트명</label><input value={form.projectName} onChange={e => setForm(f => ({...f, projectName: e.target.value}))} /></div>

        {/* 카테고리 드롭다운 */}
        <div className="input-group">
          <label>카테고리</label>
          <div className="custom-select-wrap">
            <div className="custom-select-display" onClick={() => setCatOpen(o => !o)}>
              {catObj ? <span style={{ color: catObj.color }}><i className={`fa-solid ${catObj.icon}`} /> {catObj.name}</span> : '선택 안함'}
            </div>
            {catOpen && (
              <div className="custom-select-options">
                <div className="custom-option" onClick={() => { setForm(f=>({...f,category:''})); setCatOpen(false) }}>선택 안함</div>
                {categories.map(cat => (
                  <div key={cat.name} className="custom-option" style={{ color: cat.color }}
                    onClick={() => { setForm(f=>({...f,category:cat.name})); setCatOpen(false) }}>
                    <i className={`fa-solid ${cat.icon}`} /> {cat.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="input-group"><label>업체명</label><input value={form.company} onChange={e => setForm(f=>({...f, company:e.target.value}))} /></div>
        <div className="input-group">
          <label>상태</label>
          <select value={form.status} onChange={e => setForm(f=>({...f,status:e.target.value}))}>
            <option value="대기중">대기중</option>
            <option value="진행중">진행중</option>
            <option value="완료">완료</option>
          </select>
        </div>
        <div className="input-group"><label>계약일</label><input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} /></div>
        <div className="input-group"><label>계약금액 (원)</label><input value={form.amount} onChange={e=>handleCurrency('amount', e.target.value)} /></div>
        <div className="input-group"><label>선금 (원)</label><input value={form.advance} onChange={e=>handleCurrency('advance', e.target.value)} /></div>
        <div className="input-group"><label>선금일</label><input type="date" value={form.advanceDate} onChange={e=>setForm(f=>({...f,advanceDate:e.target.value}))} /></div>
        <div className="input-group"><label>잔금일</label><input type="date" value={form.balanceDate} onChange={e=>setForm(f=>({...f,balanceDate:e.target.value}))} /></div>
        <div className="input-group"><label>계산서 발행일</label><input type="date" value={form.taxDate} onChange={e=>setForm(f=>({...f,taxDate:e.target.value}))} /></div>

        <hr className="section-divider" />
        <div className="section-header" style={{marginBottom:14}}>
          <div className="section-title" style={{marginBottom:0}}>외주 정보</div>
          <div className="toggle-wrap" onClick={() => setOutOn(o=>!o)}>
            <div className={`toggle-switch ${outOn?'on':''}`}><div className="toggle-slider" /></div>
            <span className="toggle-label">{outOn?'ON':'OFF'}</span>
          </div>
        </div>
        {outOn && (
          <div>
            <div className="input-group"><label>외주업체명</label><input value={form.outCompany} onChange={e=>setForm(f=>({...f,outCompany:e.target.value}))} /></div>
            <div className="input-group"><label>외주 총금액 (원)</label><input value={form.outAmount} onChange={e=>handleCurrency('outAmount', e.target.value)} /></div>
            <div className="input-group"><label>외주 선금 (원)</label><input value={form.outAdvance} onChange={e=>handleCurrency('outAdvance', e.target.value)} /></div>
            <div className="input-group"><label>외주 선금일</label><input type="date" value={form.outAdvanceDate} onChange={e=>setForm(f=>({...f,outAdvanceDate:e.target.value}))} /></div>
            <div className="input-group"><label>외주 잔금일</label><input type="date" value={form.outBalanceDate} onChange={e=>setForm(f=>({...f,outBalanceDate:e.target.value}))} /></div>
          </div>
        )}
        <button className="submit-btn" onClick={handleSave}>저장하기</button>
      </div>
    </div>
  )
}
