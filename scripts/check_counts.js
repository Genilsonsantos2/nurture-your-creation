
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cmwdvtwmtsdjxhfcjmjb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtd2R2dHdtdHNkanhoZmNqbWpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MDgyMjksImV4cCI6MjA4Nzk4NDIyOX0.J92vyaRGonfCJBYcUTbyjHXGd0IBvlAMjZyUjwUp6vs'

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
    const tables = ['alerts', 'absence_justifications', 'occurrences', 'movements']
    for (const table of tables) {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
        console.log(`${table}: ${count} (Error: ${error?.message || 'none'})`)
    }
}

check()
