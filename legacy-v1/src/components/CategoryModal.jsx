import { useState, useEffect } from 'react'
import { FA_ICONS } from '../lib/utils'

export default function CategoryModal({ category, onSave, onClose }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#16a34a')
  const [icon, setIcon] = useState('fa-globe')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (category) { setName(category.name); setColor(category.color); setIcon(category.icon || 'fa-globe') }
  }, [category])

  const filtered = FA_ICONS.filter(i => i.includes(search.toLowerCase()))

  function handleSave() {
    if (!name.trim()) return alert('카테고리명을 입력해주세요.')
    onSave({ name: name.trim(), color, icon })
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header-actions">
          <button className="action-icon" onClick={onClose}><i className="fa-solid fa-xmark" /></button>
        </div>
        <div className="modal-title">{category ? '카테고리 수정' : '카테고리 추가'}</div>
        <div className="input-group"><label>카테고리명</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="예: 홈페이지" /></div>
        <div className="input-group">
          <label>아이콘 선택</label>
          <input className="icon-search-input" style={{width:'100%',padding:'10px 13px',border:'1px solid var(--border-main)',background:'var(--bg-main)',color:'var(--text-main)',outline:'none',marginBottom:8}} value={search} onChange={e=>setSearch(e.target.value)} placeholder="영문 키워드 검색 (예: car, user)..." />
          <div className="icon-grid">
            {filtered.length === 0
              ? <div style={{gridColumn:'1/-1',textAlign:'center',color:'var(--text-muted)',fontSize:12,padding:16}}>검색 결과 없음</div>
              : filtered.map(ic => (
                  <div key={ic} className={`icon-item${icon===ic?' active':''}`} onClick={()=>setIcon(ic)} title={ic}>
                    <i className={`fa-solid ${ic}`} />
                  </div>
                ))
            }
          </div>
        </div>
        <div className="input-group"><label>테마 색상</label><input type="color" value={color} onChange={e=>setColor(e.target.value)} /></div>
        <button className="submit-btn" onClick={handleSave}>저장하기</button>
      </div>
    </div>
  )
}
