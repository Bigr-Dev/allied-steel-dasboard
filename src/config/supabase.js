// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'
// import dotenv from 'dotenv'
// dotenv.config()

const supabase = createClient(
  'https://hpvhoicmpxbsrkeweccf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwdmhvaWNtcHhic3JrZXdlY2NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMTExMzIsImV4cCI6MjA2OTY4NzEzMn0.eujZpPTEDctb-g1O-ypbnY8k8CRfh_KM1hOZy0o-viM',
  {
    auth: { persistSession: true },
    realtime: { params: { eventsPerSecond: 10 } },
  }
)

export default supabase
