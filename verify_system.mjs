
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySystem() {
    console.log("--- CETI Digital System Verification ---");

    // 1. Check Table Columns
    console.log("\n1. Verificando Colunas da Tabela 'students'...");
    const { data: columns, error: colError } = await supabase.rpc('get_table_columns', { table_name: 'students' });

    // Alternative if RPC doesn't exist: try a select
    const { data: studentSample, error: sampleError } = await supabase.from('students').select('*').limit(1);

    if (sampleError) {
        console.error("❌ Erro ao acessar tabela students:", sampleError.message);
    } else if (studentSample && studentSample.length > 0) {
        const keys = Object.keys(studentSample[0]);
        const required = ['photo_url', 'blood_type', 'allergies', 'medical_notes'];
        required.forEach(col => {
            if (keys.includes(col)) {
                console.log(`✅ Coluna '${col}' detectada.`);
            } else {
                console.error(`❌ Coluna '${col}' NÃO encontrada.`);
            }
        });
    } else {
        console.log("⚠️ Tabela students vazia ou inacessível para amostragem de colunas.");
    }

    // 2. Check Storage Buckets
    console.log("\n2. Verificando Buckets de Storage...");
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

    if (bucketError) {
        console.error("❌ Erro ao acessar storage:", bucketError.message);
    } else {
        const photoBucket = buckets.find(b => b.id === 'student-photos');
        if (photoBucket) {
            console.log("✅ Bucket 'student-photos' existe e está pronto.");
        } else {
            console.error("❌ Bucket 'student-photos' NÃO encontrado.");
        }
    }

    // 3. Simple Query Test for Dashboard Data
    console.log("\n3. Verificando Acesso a Dados (Dashboard)...");
    const { count: studentCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
    const { count: movementCount } = await supabase.from('movements').select('*', { count: 'exact', head: true });

    console.log(`✅ Alunos Ativos: ${studentCount}`);
    console.log(`✅ Movimentações Registradas: ${movementCount}`);

    console.log("\n--- Fim da Verificação ---");
}

verifySystem();
