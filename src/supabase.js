import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://ltwuhklbftacevagylfh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0d3Voa2xiZnRhY2V2YWd5bGZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MjAxOTksImV4cCI6MjA5MjM5NjE5OX0.JfcXW7eCIPLKLV3Xk3g26c9wZEwxD05Jsatkjo_irwE'
)