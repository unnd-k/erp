// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'

// Third-Party Imports
import classnames from 'classnames'

// Type Imports
import type { ColumnType, TaskType } from '@/types/apps/kanbanTypes'
import type { AppDispatch } from '@/redux-store'
import type { ThemeColor } from '@core/types'

// Slice Imports
import { getCurrentTask, deleteTask } from '@/redux-store/slices/kanban'

// Styles Imports
import styles from './styles.module.css'

type TaskCardProps = {
  task: TaskType
  dispatch: AppDispatch
  column: ColumnType
  setColumns: (value: ColumnType[]) => void
  columns: ColumnType[]
  setDrawerOpen: (value: boolean) => void
  tasksList: (TaskType | undefined)[]
  setTasksList: (value: (TaskType | undefined)[]) => void
}

const TaskCard = (props: TaskCardProps) => {
  // Props
  const { task, dispatch, column, setColumns, columns, setDrawerOpen, tasksList, setTasksList } = props

  // States
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  // Handle menu click
  const handleClick = (e: any) => {
    setMenuOpen(true)
    setAnchorEl(e.currentTarget)
    e.stopPropagation()
  }

  // Handle menu close
  const handleClose = (e?: any) => {
    if (e) e.stopPropagation()
    setAnchorEl(null)
    setMenuOpen(false)
  }

  // Handle Task Click
  const handleTaskClick = () => {
    setDrawerOpen(true)
    dispatch(getCurrentTask(task.id))
  }

  // Delete Task
  const handleDeleteTask = () => {
    dispatch(deleteTask(task.id))
    setTasksList(tasksList.filter(taskItem => taskItem?.id !== task.id))

    const newTaskIds = column.taskIds.filter(taskId => taskId !== task.id)
    const newColumn = { ...column, taskIds: newTaskIds }
    const newColumns = columns.map(col => (col.id === column.id ? newColumn : col))

    setColumns(newColumns)
  }

  // Handle Delete
  const handleDelete = (e: any) => {
    handleClose(e)
    handleDeleteTask()
  }

  const categoryColors: { [key: string]: ThemeColor } = {
    홈페이지: 'success',
    편집디자인: 'warning',
    영상: 'primary',
    유지보수: 'info'
  }

  return (
    <Card
      className={classnames(
        'item-draggable is-[18rem] cursor-grab active:cursor-grabbing overflow-visible mbe-4 z-0',
        styles.card
      )}
      onClick={() => handleTaskClick()}
    >
      <CardContent className='flex flex-col gap-y-3 items-start relative overflow-hidden'>
        <div className='flex justify-between items-start is-full'>
          <Chip variant='tonal' label={task.category} size='small' color={categoryColors[task.category] || 'secondary'} />
          <div onClick={e => e.stopPropagation()}>
            <IconButton
              aria-label='more'
              size='small'
              className={classnames(styles.menu, {
                [styles.menuOpen]: menuOpen
              })}
              aria-controls='long-menu'
              aria-haspopup='true'
              onClick={handleClick}
            >
              <i className='ri-more-2-line text-xl' />
            </IconButton>
            <Menu
              id='long-menu'
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              anchorEl={anchorEl}
              keepMounted
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={handleClose}>Duplicate Project</MenuItem>
              <MenuItem
                onClick={e => {
                  handleDelete(e)
                }}
              >
                Delete
              </MenuItem>
            </Menu>
          </div>
        </div>

        <div className='flex flex-col gap-1'>
          <Typography variant='h6' color='text.primary' className='wrap-break-word font-bold'>
            {task.title}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {task.company}
          </Typography>
        </div>

        <div className='flex flex-col gap-1 is-full border-bs pt-2 mt-1'>
          <div className='flex justify-between items-center'>
            <Typography variant='caption' className='font-medium uppercase'>
              계약 금액
            </Typography>
            <Typography variant='body2' color='primary.main' className='font-bold'>
              ₩{task.amount?.toLocaleString()}
            </Typography>
          </div>
          {task.date && (
            <div className='flex justify-between items-center'>
              <Typography variant='caption' className='font-medium uppercase'>
                계약일
              </Typography>
              <Typography variant='caption' color='text.primary'>
                {task.date}
              </Typography>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default TaskCard

