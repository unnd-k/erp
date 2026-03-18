// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Drawer from '@mui/material/Drawer'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import FormHelperText from '@mui/material/FormHelperText'

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { minLength, nonEmpty, object, pipe, string } from 'valibot'
import type { InferInput } from 'valibot'

// Type Imports
import type { ColumnType, TaskType } from '@/types/apps/kanbanTypes'
import type { AppDispatch } from '@/redux-store'

// Slice Imports
import { editTask, deleteTask } from '@/redux-store/slices/kanban'

// Component Imports
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

type KanbanDrawerProps = {
  drawerOpen: boolean
  dispatch: AppDispatch
  setDrawerOpen: (value: boolean) => void
  task: TaskType
  columns: ColumnType[]
  setColumns: (value: ColumnType[]) => void
}

const schema = object({
  title: pipe(string(), nonEmpty('프로젝트명은 필수입니다.'), minLength(1)),
  company: pipe(string(), nonEmpty('업체명은 필수입니다.'), minLength(1)),
  category: pipe(string(), nonEmpty('카테고리는 필수입니다.')),
  amount: pipe(string(), nonEmpty('계약 금액은 필수입니다.'))
})

type FormData = InferInput<typeof schema>

const KanbanDrawer = (props: KanbanDrawerProps) => {
  // Props
  const { drawerOpen, dispatch, setDrawerOpen, task, columns, setColumns } = props

  // States
  const [date, setDate] = useState<Date | undefined>(task.date ? new Date(task.date) : undefined)

  // Hooks
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: {
      title: task.title,
      company: task.company || '',
      category: task.category || '',
      amount: task.amount?.toString() || '0'
    },
    resolver: valibotResolver(schema)
  })

  // Close Drawer
  const handleClose = () => {
    setDrawerOpen(false)
  }

  // Update Task
  const updateTask = (data: FormData) => {
    dispatch(
      editTask({
        id: task.id,
        title: data.title,
        company: data.company,
        category: data.category,
        amount: Number(data.amount),
        date: date?.toISOString().split('T')[0]
      })
    )
    handleClose()
  }

  // Handle Reset (Delete)
  const handleDelete = () => {
    setDrawerOpen(false)
    dispatch(deleteTask(task.id))

    const updatedColumns = columns.map(column => {
      return {
        ...column,
        taskIds: column.taskIds.filter(taskId => taskId !== task.id)
      }
    })

    setColumns(updatedColumns)
  }

  // To set the initial values according to the task
  useEffect(() => {
    if (drawerOpen) {
      reset({
        title: task.title,
        company: task.company || '',
        category: task.category || '',
        amount: task.amount?.toString() || '0'
      })
      setDate(task.date ? new Date(task.date) : undefined)
    }
  }, [task, reset, drawerOpen])

  return (
    <Drawer
      open={drawerOpen}
      anchor='right'
      variant='temporary'
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}
      onClose={handleClose}
    >
      <div className='flex justify-between items-center pli-5 plb-4 border-be'>
        <Typography variant='h5'>프로젝트 수정</Typography>
        <IconButton onClick={handleClose} size='small'>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <div className='p-6'>
        <form className='flex flex-col gap-y-5' onSubmit={handleSubmit(updateTask)}>
          <Controller
            name='title'
            control={control}
            render={({ field }) => (
              <TextField
                fullWidth
                label='프로젝트명'
                {...field}
                error={Boolean(errors.title)}
                helperText={errors.title?.message}
              />
            )}
          />

          <Controller
            name='company'
            control={control}
            render={({ field }) => (
              <TextField
                fullWidth
                label='업체명'
                {...field}
                error={Boolean(errors.company)}
                helperText={errors.company?.message}
              />
            )}
          />

          <FormControl fullWidth error={Boolean(errors.category)}>
            <InputLabel>카테고리</InputLabel>
            <Controller
              name='category'
              control={control}
              render={({ field }) => (
                <Select label='카테고리' {...field}>
                  <MenuItem value='홈페이지'>홈페이지</MenuItem>
                  <MenuItem value='편집디자인'>편집디자인</MenuItem>
                  <MenuItem value='영상'>영상</MenuItem>
                  <MenuItem value='유지보수'>유지보수</MenuItem>
                </Select>
              )}
            />
            {errors.category && <FormHelperText>{errors.category.message}</FormHelperText>}
          </FormControl>

          <Controller
            name='amount'
            control={control}
            render={({ field }) => (
              <TextField
                fullWidth
                label='계약 금액'
                type='number'
                {...field}
                error={Boolean(errors.amount)}
                helperText={errors.amount?.message}
              />
            )}
          />

          <AppReactDatepicker
            selected={date}
            onChange={(date: Date | null) => setDate(date || undefined)}
            placeholderText='계약일을 선택하세요'
            customInput={<TextField label='계약일' fullWidth />}
          />

          <div className='flex gap-4 mt-4'>
            <Button variant='contained' color='primary' type='submit' fullWidth>
              저장하기
            </Button>
            <Button variant='outlined' color='error' onClick={handleDelete} fullWidth>
              삭제하기
            </Button>
          </div>
        </form>
      </div>
    </Drawer>
  )
}

export default KanbanDrawer
