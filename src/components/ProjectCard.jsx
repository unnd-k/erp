import { formatCurrency, formatDate, calculateProgress } from '../lib/utils'

export default function ProjectCard({ project, categories, onClick, draggable, onDragStart, onDragOver, onDrop }) {
  const contractAmt = Number(project.amount) || 0
  const netRevenue = contractAmt - (Number(project.outAmount) || 0)
  const today = new Date().toISOString().split('T')[0]
  let collected = 0
  if (project.advanceDate && project.advanceDate <= today) collected += (Number(project.advance) || 0)
  if (project.balanceDate && project.balanceDate <= today) collected += (Number(project.balance) || 0)
  const progress = calculateProgress(project)
  const catObj = categories.find(c => c.name === project.category)
  const catColor = catObj?.color || 'var(--text-main)'
  const catIcon = catObj?.icon || 'fa-globe'

  return (
    <div
      className="project-card"
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="card-header">
        <div className="card-name">{project.projectName || '-'}</div>
        <div className={`status-badge bg-${project.status}`}>{project.status}</div>
      </div>
      <div className="card-meta">
        <span><i className="fa-solid fa-building" /> {project.company || '-'}</span>
        <span className="meta-divider">|</span>
        <span style={{ color: catColor }}><i className={`fa-solid ${catIcon}`} /> {project.category || '-'}</span>
        <span className="meta-divider">|</span>
        <span><i className="fa-solid fa-calendar" /> {formatDate(project.date)}</span>
      </div>
      <div className="finance-box">
        <div className="fin-col">
          <span className="fin-label">계약금액</span>
          <span className="fin-val blue">₩{formatCurrency(contractAmt)}</span>
        </div>
        <div className="fin-col">
          <span className="fin-label">순 매출액</span>
          <span className="fin-val red">₩{formatCurrency(netRevenue)}</span>
        </div>
        <div className="fin-col">
          <span className="fin-label">수금액</span>
          <span className="fin-val">₩{formatCurrency(collected)}</span>
        </div>
      </div>
      <div className="progress-wrap">
        <div className="progress-labels"><span>Progress</span><span>{progress}%</span></div>
        <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
      </div>
    </div>
  )
}
