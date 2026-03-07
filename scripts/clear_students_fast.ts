import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Missing Supabase credentials in environment variables.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function countAndClearStudents() {
    // First, get an estimate of how many we are dealing with
    const { count } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

    console.log(`Total records to delete: ${count}`);

    if (count === 0) {
        console.log("No students to delete.");
        return;
    }

    console.log("Starting deletion...");

    // To avoid fetching and deleting, we can try to delete where id is not null
    // The REST API limits to 1000 rows per request usually, so we'd loop
    let deletedTotal = 0;
    let keepGoing = true;

    while (keepGoing) {
        // The easiest way to bulk delete without fetching is if we can filter by something
        // For instance, status is not null or id > 0 (if uuid, id != '')
        const { data, error } = await supabase
            .from('students')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000') // just a dummy filter to match all valid UUIDs
            .select('id');
        // Note: select is needed to return the deleted rows so we know how many were deleted
        // but it might be slow if standard is 1000 limit. 

        if (error) {
            console.error("Error during deletion:", error);
            break;
        }

        const deletedCount = data ? data.length : 0;
        deletedTotal += deletedCount;
        console.log(`Deleted a batch of ${deletedCount}. Total so far: ${deletedTotal}.`);

        if (deletedCount === 0) {
            keepGoing = false;
        }
    }

    console.log(`\nFinished! Total deleted in this run: ${deletedTotal}`);
}

countAndClearStudents();
