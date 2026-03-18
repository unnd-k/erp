// MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Button from '@mui/material/Button'

const WidgetsPage = () => {
  return (
    <div className='p-6'>
      <Typography variant='h4' className='mbe-6'>대시보드 위젯 설정</Typography>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardHeader title='활성 위젯 선택' subtitle='대시보드 메인 화면에 표시할 위젯을 선택하세요.' />
            <CardContent className='flex flex-col gap-2'>
              <FormControlLabel control={<Checkbox defaultChecked />} label='프로젝트 요약 통계 (총 매출, 계약금 등)' />
              <FormControlLabel control={<Checkbox defaultChecked />} label='프로젝트 타임라인' />
              <FormControlLabel control={<Checkbox defaultChecked />} label='최근 성과 (Award)' />
              <FormControlLabel control={<Checkbox defaultChecked />} label='사용자 목록 테이블' />
              <FormControlLabel control={<Checkbox />} label='매출 분석 차트' />
              <FormControlLabel control={<Checkbox />} label='기타 분석 도구' />
              <div className='mt-4'>
                <Button variant='contained' color='primary'>설정 저장</Button>
              </div>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardHeader title='위젯 배치 안내' />
            <CardContent>
              <Typography variant='body2'>
                위젯 설정을 완료하면 CRM 대시보드 메인 화면의 구성이 실시간으로 변경됩니다. (현재는 UI 데모 버전입니다.)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  )
}

export default WidgetsPage
