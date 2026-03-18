export type TaskType = {
  id: number
  title: string
  company: string
  category: string
  amount: number
  status: string
  date?: string
  advance?: number
  advanceDate?: string
  balanceDate?: string
  taxDate?: string
  outCompany?: string
  outAmount?: number
  badgeText?: string[]
  attachments?: number
  comments?: number
  assigned?: { src: string; name: string }[]
  image?: string
  dueDate?: Date
}

export type ColumnType = {
  id: number
  title: string
  taskIds: number[]
}

export type KanbanType = {
  columns: ColumnType[]
  tasks: TaskType[]
  currentTaskId?: number
}
