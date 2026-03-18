import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sidugcfihejehufeedui.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpZHVnY2ZpaGVqZWh1ZmVlZHVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NDc2MDksImV4cCI6MjA4OTIyMzYwOX0.cAiIyWhe-TQCRbZP5tuRVG7_sTdQefFD2FdAJiabE5w'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
