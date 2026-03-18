// MUI Imports
import Grid from '@mui/material/Grid'

// Views Imports
import SummaryStats from '@views/dashboards/crm/SummaryStats'
import Award from '@views/dashboards/crm/Award'
import CardStatVertical from '@components/card-statistics/Vertical'
import StackedBarChart from '@views/dashboards/crm/StackedBarChart'
import DonutChart from '@views/dashboards/crm/DonutChart'
import OrganicSessions from '@views/dashboards/crm/OrganicSessions'
import ProjectTimeline from '@views/dashboards/crm/ProjectTimeline'
import WeeklyOverview from '@views/dashboards/crm/WeeklyOverview'
import SocialNetworkVisits from '@views/dashboards/crm/SocialNetworkVisits'
import MonthlyBudget from '@views/dashboards/crm/MonthlyBudget'
import MeetingSchedule from '@views/dashboards/crm/MeetingSchedule'
import ExternalLinks from '@views/dashboards/crm/ExternalLinks'
import PaymentHistory from '@views/dashboards/crm/PaymentHistory'
import SalesInCountries from '@views/dashboards/crm/SalesInCountries'
import UserTable from '@views/dashboards/crm/UserTable'

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'

// Data Imports
import { getUserData } from '@/app/server/actions'

// Supabase Import
import { supabase } from '@/libs/supabase'

const DashboardCRM = async () => {
  // Fetch Project Data from Supabase
  const { data: projectsData } = await supabase.from('projects').select('*')
  
  // Vars
  const data = await getUserData()
  const serverMode = await getServerMode()

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <SummaryStats data={projectsData || []} />
      </Grid>
      <Grid size={{ xs: 12, md: 8 }}>
        <ProjectTimeline />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Award />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <UserTable tableData={data} />
      </Grid>
    </Grid>
  )
}

export default DashboardCRM
