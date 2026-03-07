import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Missing Supabase credentials in environment variables.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkStudents() {
    const { data, error, count } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: false })
        .limit(5);

    if (error) {
        console.error("Error fetching students:", error);
        return;
    }

    console.log(`Actual total records according to exact count: ${count}`);
    console.log(`Sample of 5 records:`, data);
}

checkStudents();
