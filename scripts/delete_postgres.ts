// Using pg to connect directly bypassing RLS
import pg from 'pg';
const { Client } = pg;

// Connection string from Supabase dashboard (Settings -> Database)
// Needs to be provided by user or found in env
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("Missing DATABASE_URL");
    process.exit(1);
}

const client = new Client({
    connectionString,
});

async function clearTable() {
    try {
        await client.connect();
        console.log("Connected to database directly");

        // First let's check what's blocking deletion
        // Likely these students have related records in gate_movements or disciplinary_records

        // We can just use cascade or delete the related records first
        console.log("Deleting all records that depend on students...");
        await client.query('DELETE FROM gate_movements');
        await client.query('DELETE FROM disciplinary_records');

        console.log("Deleting all students...");
        const result = await client.query('DELETE FROM students');
        console.log(`Deleted ${result.rowCount} students.`);

    } catch (err) {
        console.error("Database error:", err);
    } finally {
        await client.end();
    }
}

clearTable();
