import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Missing Supabase credentials in environment variables.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkWhyFailedToDelete() {
    const { data, error } = await supabase
        .from('students')
        .select('id')
        .limit(5);

    if (error) {
        console.error("Error fetching students:", error);
        return;
    }

    const ids = data.map(d => d.id);
    console.log(`Trying to delete: ${ids}`);

    const { data: deleteData, error: deleteError } = await supabase
        .from('students')
        .delete()
        .in('id', ids)
        .select();

    console.log('Delete result error:', deleteError);
    console.log('Delete result data:', deleteData);
}

checkWhyFailedToDelete();
