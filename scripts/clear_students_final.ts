import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Missing Supabase credentials in environment variables.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function countAndClearStudents() {
    const { count } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

    console.log(`Total records to delete: ${count}`);

    if (count === 0) {
        console.log("No students to delete.");
        return;
    }

    // To bypass the 1000 row limit, we'll keep deleting as long as there are rows
    let deletedCount = 0;
    let hasMore = true;

    while (hasMore) {
        // Delete in batches of 1000 (Supabase default max)
        const { data: studentsInfo, error: fetchError } = await supabase
            .from('students')
            .select('id')
            .limit(1000);

        if (fetchError) {
            console.error("Error fetching students:", fetchError);
            return;
        }

        if (!studentsInfo || studentsInfo.length === 0) {
            hasMore = false;
            break;
        }

        const ids = studentsInfo.map(s => s.id);
        console.log(`Deleting batch of ${ids.length} students...`);

        const { error: deleteError } = await supabase
            .from('students')
            .delete()
            .in('id', ids);

        if (deleteError) {
            console.error("Error deleting students:", deleteError);
            return;
        }

        deletedCount += ids.length;
        console.log(`Deleted ${deletedCount} students so far.`);
    }

    console.log(`\nSuccess! Completely cleared ${deletedCount} records from the students table.`);
}

countAndClearStudents();
