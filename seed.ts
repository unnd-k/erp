import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sidugcfihejehufeedui.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpZHVnY2ZpaGVqZWh1ZmVlZHVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NDc2MDksImV4cCI6MjA4OTIyMzYwOX0.cAiIyWhe-TQCRbZP5tuRVG7_sTdQefFD2FdAJiabE5w'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function seed() {
  const dummyProjects = [
    {
      project_name: '홈페이지 리뉴얼',
      company: '스튜디오언네임드',
      category: '홈페이지',
      amount: 5500000,
      status: '대기중',
      date: '2026-03-01',
      advance: 1500000,
      balance: 4000000,
      advance_date: '2026-03-02',
      balance_date: '2026-04-01',
      tax_date: '2026-04-05',
      out_amount: 0, out_advance: 0, out_balance: 0,
    },
    {
      project_name: '브랜드 홍보 영상 제작',
      company: '언네임드 디자인',
      category: '영상',
      amount: 12000000,
      status: '진행중',
      date: '2026-02-15',
      advance: 4000000,
      balance: 8000000,
      advance_date: '2026-02-16',
      balance_date: '2026-03-20',
      tax_date: '2026-03-25',
      out_amount: 2000000, out_advance: 1000000, out_balance: 1000000,
      out_company: '프리랜서 A',
    },
    {
      project_name: '사내 연수 편집디자인',
      company: '메타버스 테크',
      category: '편집디자인',
      amount: 3000000,
      status: '완료',
      date: '2026-01-20',
      advance: 1000000,
      balance: 2000000,
      advance_date: '2026-01-21',
      balance_date: '2026-02-10',
      tax_date: '2026-02-15',
      out_amount: 0, out_advance: 0, out_balance: 0,
    }
  ]

  console.log('Inserting dummy projects...')
  for (const row of dummyProjects) {
    const { data, error } = await supabase.from('projects').insert([row]).select()
    if (error) {
      console.error('Error inserting:', row.project_name, error)
    } else {
      console.log('Inserted:', data[0].project_name)
    }
  }
}

seed()
