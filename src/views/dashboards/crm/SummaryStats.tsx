// MUI Imports
import Grid from '@mui/material/Grid'

// Component Imports
import CardStatHorizontalWithAvatar from '@components/card-statistics/HorizontalWithAvatar'

// Type Imports
import type { CardStatsHorizontalWithAvatarProps } from '@/types/pages/widgetTypes'

const SummaryStats = ({ data }: { data: any[] }) => {
  // Stats Calculation
  const totalContract = data.reduce((s, p) => s + (Number(p.amount) || 0), 0)
  const totalNet = data.reduce((s, p) => s + (Number(p.amount) || 0) - (Number(p.out_amount) || 0), 0)
  const activeCount = data.filter(p => p.status === '진행중').length
  const pendingCount = data.filter(p => p.status === '대기중').length

  const stats: CardStatsHorizontalWithAvatarProps[] = [
    {
      stats: `₩${totalNet.toLocaleString()}`,
      title: '총 매출액 (실수령)',
      avatarIcon: 'ri-money-dollar-circle-line',
      avatarColor: 'primary'
    },
    {
      stats: `₩${totalContract.toLocaleString()}`,
      title: '총 계약 금액',
      avatarIcon: 'ri-bank-card-line',
      avatarColor: 'success'
    },
    {
      stats: activeCount.toString(),
      title: '진행중인 프로젝트',
      avatarIcon: 'ri-time-line',
      avatarColor: 'warning'
    },
    {
      stats: pendingCount.toString(),
      title: '대기중인 프로젝트',
      avatarIcon: 'ri-pause-circle-line',
      avatarColor: 'info'
    }
  ]

  return (
    <Grid container spacing={6}>
      {stats.map((item, index) => (
        <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
          <CardStatHorizontalWithAvatar {...item} />
        </Grid>
      ))}
    </Grid>
  )
}

export default SummaryStats
