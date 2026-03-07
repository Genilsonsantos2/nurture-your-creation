import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Missing Supabase credentials in environment variables.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTables() {
    console.log("Checking movements count:");
    const m = await supabase.from('movements').select('*', { count: 'exact', head: true });
    console.log(m.count);

    console.log("Checking occurrences count:");
    const o = await supabase.from('occurrences').select('*', { count: 'exact', head: true });
    console.log(o.count);

    console.log("Checking alerts count:");
    const a = await supabase.from('alerts').select('*', { count: 'exact', head: true });
    console.log(a.count);
}

checkTables();
