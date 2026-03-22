import pg from 'pg';
const { Client } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("Missing DATABASE_URL");
    process.exit(1);
}

const client = new Client({
    connectionString,
});

async function clearRemaining() {
    try {
        await client.connect();
        console.log("Connected to database directly");

        console.log("Deleting all records from movements...");
        const result = await client.query('DELETE FROM movements');
        console.log(`Deleted ${result.rowCount} movements.`);

    } catch (err) {
        console.error("Database error:", err);
    } finally {
        await client.end();
    }
}

clearRemaining();
