import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
    console.log("Profiles in DB:", profiles || pError);
}

test();
