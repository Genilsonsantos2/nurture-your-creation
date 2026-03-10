
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cmwdvtwmtsdjxhfcjmjb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtd2R2dHdtdHNkanhoZmNqbWpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MDgyMjksImV4cCI6MjA4Nzk4NDIyOX0.J92vyaRGonfCJBYcUTbyjHXGd0IBvlAMjZyUjwUp6vs'

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
    const { count: alertsCount } = await supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('status', 'pending')
    const { count: justifCount } = await supabase.from('absence_justifications').select('*', { count: 'exact', head: true }).eq('status', 'pending')

    console.log(`Alertas pendentes: ${alertsCount}`)
    console.log(`Justificativas pendentes: ${justifCount}`)
}

check()
