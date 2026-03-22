import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Missing Supabase credentials in environment variables.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkMovements() {
    console.log("Checking movements:");
    const m = await supabase.from('movements').select('*');
    console.log(m.data);

    if (m.data && m.data.length > 0) {
        console.log('Attempting to delete by specific IDs');
        const ids = m.data.map(i => i.id);
        const del = await supabase.from('movements').delete().in('id', ids).select();
        console.log(del);
    }
}

checkMovements();
