import { formatCurrency, formatDate } from '../lib/utils'

export default function ProjectDetail({ project, categories, onEdit, onDelete, onClose }) {
  const catObj = categories.find(c => c.name === project.category)
  const netRevenue = (project.amount || 0) - (project.outAmount || 0)
  const hasOut = !!(project.outCompany || project.outAmount > 0 || project.outAdvance > 0)

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header-actions">
          <button className="action-icon" onClick={onEdit}><i className="fa-solid fa-pen-to-square" /></button>
          <button className="action-icon" onClick={onDelete}><i className="fa-solid fa-trash-can" /></button>
          <button className="action-icon" onClick={onClose}><i className="fa-solid fa-xmark" /></button>
        </div>
        <div className="modal-title">{project.projectName}</div>

        <div className="section-header">
          <div className="section-title">본계약 정보</div>
          <span className={`status-badge bg-${project.status}`}>{project.status}</span>
        </div>
        <div className="detail-row">
          <span className="label">카테고리</span>
          <span className="value">
            {catObj
              ? <span style={{ color: catObj.color, fontWeight: 700 }}><i className={`fa-solid ${catObj.icon}`} /> {catObj.name}</span>
              : (project.category || '선택 안함')}
          </span>
        </div>
        <Row label="업체명" value={project.company} />
        <Row label="계약일" value={formatDate(project.date)} />
        <Row label="총 계약금액" value={`₩ ${formatCurrency(project.amount)}`} cls="text-blue" />
        <Row label="총 매출액" value={`₩ ${formatCurrency(netRevenue)}`} cls="text-red" />
        <Row label="선금" value={`₩ ${formatCurrency(project.advance)}${project.advanceDate ? ` (${project.advanceDate})` : ''}`} />
        <Row label="잔금" value={`₩ ${formatCurrency(project.balance)}${project.balanceDate ? ` (${project.balanceDate})` : ''}`} />
        <Row label="계산서 발행" value={formatDate(project.taxDate)} />

        {hasOut && (
          <>
            <hr className="section-divider" />
            <div className="section-header">
              <div className="section-title">외주 정보</div>
              {project.outCompany && <span className="out-company-badge">{project.outCompany}</span>}
            </div>
            <Row label="외주금액" value={`₩ ${formatCurrency(project.outAmount)}`} />
            <Row label="외주 선금" value={`₩ ${formatCurrency(project.outAdvance)}${project.outAdvanceDate ? ` (${project.outAdvanceDate})` : ''}`} />
            <Row label="외주 잔금" value={`₩ ${formatCurrency(project.outBalance)}${project.outBalanceDate ? ` (${project.outBalanceDate})` : ''}`} />
          </>
        )}
      </div>
    </div>
  )
}

function Row({ label, value, cls = '' }) {
  return (
    <div className="detail-row">
      <span className="label">{label}</span>
      <span className={`value ${cls}`}>{value || '-'}</span>
    </div>
  )
}
