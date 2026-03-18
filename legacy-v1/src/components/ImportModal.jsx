import { useState } from 'react'
import Papa from 'papaparse'

export default function ImportModal({ onSave, onClose }) {
  const [data, setData] = useState([])
  const [headers, setHeaders] = useState([])
  const [mapping, setMapping] = useState({
    projectName: '', company: '', status: '', category: '', amount: '', date: '',
    advance: '', balance: '', advanceDate: '', balanceDate: '',
    taxDate: '', outCompany: '', outAmount: '', outAdvance: '', outBalance: '',
    outAdvanceDate: '', outBalanceDate: ''
  })

  // Options
  const dbFields = [
    { key: 'projectName', label: '프로젝트명(필수)' },
    { key: 'company', label: '업체명' },
    { key: 'status', label: '상태 (대기중/진행중/완료)' },
    { key: 'category', label: '카테고리' },
    { key: 'amount', label: '계약금액' },
    { key: 'date', label: '계약일자(YYYY-MM-DD)' },
    { key: 'advance', label: '선금' },
    { key: 'advanceDate', label: '선금일' },
    { key: 'balance', label: '잔금' },
    { key: 'balanceDate', label: '잔금일' },
    { key: 'taxDate', label: '세금계산서일' },
    { key: 'outCompany', label: '외주업체' },
    { key: 'outAmount', label: '외주금액' },
    { key: 'outAdvance', label: '외주선금' },
    { key: 'outAdvanceDate', label: '외주선금일' },
    { key: 'outBalance', label: '외주잔금' },
    { key: 'outBalanceDate', label: '외주잔금일' },
  ]

  function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function(results) {
        if (results.data && results.data.length > 0) {
          const fetchedHeaders = Object.keys(results.data[0])
          setHeaders(fetchedHeaders)
          setData(results.data)

          // Auto-map common names
          const newMap = { ...mapping }
          fetchedHeaders.forEach(h => {
             if (h.includes('프로젝트') || h.includes('이름')) newMap.projectName = h
             else if ((h.includes('업체') || h.includes('고객')) && !h.includes('외주')) newMap.company = h
             else if (h.includes('상태') || h.includes('진행')) newMap.status = h
             else if (h.includes('카테고리') || h.includes('분류')) newMap.category = h
             else if ((h.includes('금액') || h.includes('가격')) && !h.includes('외주')) newMap.amount = h
             else if ((h.includes('날짜') || h.includes('일자') || h.includes('기간')) && !h.includes('선금') && !h.includes('잔금') && !h.includes('계산서') && !h.includes('외주')) newMap.date = h
             else if (h.includes('선금') && !h.includes('일') && !h.includes('외주')) newMap.advance = h
             else if (h.includes('선금일') && !h.includes('외주')) newMap.advanceDate = h
             else if (h.includes('잔금') && !h.includes('일') && !h.includes('외주')) newMap.balance = h
             else if (h.includes('잔금일') && !h.includes('외주')) newMap.balanceDate = h
             else if (h.includes('세금') || h.includes('계산서')) newMap.taxDate = h
             else if (h.includes('외주') && (h.includes('업체') || h.includes('이름'))) newMap.outCompany = h
             else if (h.includes('외주') && h.includes('금액')) newMap.outAmount = h
             else if (h.includes('외주') && h.includes('선금') && !h.includes('일')) newMap.outAdvance = h
             else if (h.includes('외주') && h.includes('선금일')) newMap.outAdvanceDate = h
             else if (h.includes('외주') && h.includes('잔금') && !h.includes('일')) newMap.outBalance = h
             else if (h.includes('외주') && h.includes('잔금일')) newMap.outBalanceDate = h
          })
          setMapping(newMap)
        } else {
          alert('CSV 파일에서 데이터를 찾을 수 없습니다.')
        }
      },
      error: function(err) {
        alert('CSV 파싱 오류: ' + err.message)
      }
    })
  }

  function handleSave() {
    if (!mapping.projectName) return alert('프로젝트명 매핑은 필수입니다.')
    const confirmMsg = `${data.length}개의 프로젝트를 가져오시겠습니까?`
    if (!confirm(confirmMsg)) return

    const formattedData = data.map(row => {
      // 숫자에서 쉼표 제거나 빈문자열 방지
      const parseAmount = (val) => {
        if(!val) return 0;
        const num = Number(String(val).replace(/[^0-9-]/g, ''))
        return isNaN(num) ? 0 : num
      }

      // 날짜 형식 정리 (예: "2025. 05. 14" -> "2025-05-14")
      const parseDate = (val) => {
        if (!val) return null;
        let str = String(val).trim();
        if (!str) return null;
        
        // 1. 공백 제거
        str = str.replace(/\s+/g, '');
        // 2. 마침표(.)나 슬래시(/)나 한글(년월일)을 하이픈(-)으로 변경
        str = str.replace(/[\.\/]/g, '-').replace(/[년월]/g, '-').replace(/일/g, '');
        // 3. 끝에 있는 하이픈 제거 (예: "2025-05-14-" -> "2025-05-14")
        str = str.replace(/-+$/, '');
        
        // 4. 각각 2자리 포맷팅 (예: "2025-5-1" -> "2025-05-01")
        const parts = str.split('-');
        if (parts.length === 3) {
           return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        }
        return str;
      }

      return {
        projectName: row[mapping.projectName] || '이름 없음',
        company: mapping.company ? row[mapping.company] : '',
        status: mapping.status ? (row[mapping.status] || '대기중') : '대기중',
        category: mapping.category ? row[mapping.category] : '기타',
        amount: mapping.amount ? parseAmount(row[mapping.amount]) : 0,
        date: mapping.date ? parseDate(row[mapping.date]) : null,
        advance: mapping.advance ? parseAmount(row[mapping.advance]) : 0,
        balance: mapping.balance ? parseAmount(row[mapping.balance]) : 0,
        advanceDate: mapping.advanceDate ? parseDate(row[mapping.advanceDate]) : null,
        balanceDate: mapping.balanceDate ? parseDate(row[mapping.balanceDate]) : null,
        taxDate: mapping.taxDate ? parseDate(row[mapping.taxDate]) : null,
        outCompany: mapping.outCompany ? row[mapping.outCompany] : '',
        outAmount: mapping.outAmount ? parseAmount(row[mapping.outAmount]) : 0,
        outAdvance: mapping.outAdvance ? parseAmount(row[mapping.outAdvance]) : 0,
        outBalance: mapping.outBalance ? parseAmount(row[mapping.outBalance]) : 0,
        outAdvanceDate: mapping.outAdvanceDate ? parseDate(row[mapping.outAdvanceDate]) : null,
        outBalanceDate: mapping.outBalanceDate ? parseDate(row[mapping.outBalanceDate]) : null,
      }
    })

    onSave(formattedData)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{maxWidth: 600}}>
        <div className="modal-header-actions">
          <button className="action-icon" onClick={onClose}><i className="fa-solid fa-xmark" /></button>
        </div>
        <div className="modal-title" style={{marginBottom: 16}}>CSV 데이터 가져오기</div>
        
        <div className="input-group">
          <label>CSV 파일 업로드</label>
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleFileUpload} 
            style={{
              padding: '12px', 
              width: '100%', 
              border: '2px dashed var(--border-main)', 
              borderRadius: '8px',
              background: 'var(--bg-main)',
              color: 'var(--text-main)',
              cursor: 'pointer'
            }} 
          />
          <div style={{fontSize: 12, color: 'var(--text-muted)', marginTop: 8}}>
            * 첫 번째 행은 열 제목(헤더)이어야 합니다.
          </div>
        </div>

        {headers.length > 0 && (
          <div style={{marginTop: 24, padding: '16px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-main)'}}>
            <h4 style={{marginBottom: 16, fontSize: 14, color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between'}}>
              <span>데이터 매핑 설정</span>
              <span style={{fontSize: 12, color: 'var(--blue)'}}>불러온 데이터: {data.length}개 항목</span>
            </h4>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap: '12px 16px', maxHeight: '45vh', overflowY: 'auto', paddingRight: '8px', paddingBottom: '8px'}}>
              {dbFields.map(field => (
                <div key={field.key} className="input-group" style={{marginBottom:0}}>
                  <label style={{fontSize: 12, color: 'var(--text-sub)'}}>{field.label}</label>
                  <select 
                    value={mapping[field.key] || ''} 
                    onChange={e => setMapping({...mapping, [field.key]: e.target.value})}
                    style={{
                      width:'100%', 
                      padding:'8px 12px', 
                      borderRadius:'6px', 
                      border:'1px solid var(--border-main)', 
                      background:'var(--bg-body)', 
                      color:'var(--text-main)',
                      outline: 'none',
                      fontSize: 13
                    }}
                  >
                    <option value="">-- 선택 안함 --</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <button 
              className="submit-btn" 
              style={{marginTop: 24, padding: '12px', fontSize: 14, fontWeight: 'bold'}} 
              onClick={handleSave}
            >
              <i className="fa-solid fa-cloud-arrow-up" style={{marginRight: 8}} />
              데이터 가져오기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
