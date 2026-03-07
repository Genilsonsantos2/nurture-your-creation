import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Missing Supabase credentials in environment variables.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function clearStudentPendencies() {
    console.log("Iniciando limpeza de pendências dos alunos...");

    // 1. Limpar Movimentações de Portaria (movements)
    console.log("Limpando movements (Portaria)...");
    const { error: gmError } = await supabase
        .from('movements')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything in this table

    if (gmError) console.error("Erro limpando movements:", gmError);
    else console.log("Movimentações na portaria limpas!");

    // 2. Limpar Ocorrências Disciplinares (occurrences)
    console.log("Limpando occurrences (Ocorrências)...");
    const { error: drError } = await supabase
        .from('occurrences')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

    if (drError) console.error("Erro limpando occurrences:", drError);
    else console.log("Ocorrências disciplinares limpas!");

    // 3. Limpar Alertas
    console.log("Limpando alerts...");
    const { error: alertsError } = await supabase
        .from('alerts')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

    if (alertsError) console.log("Tabela alerts pode não existir ou deu erro:", alertsError.message);
    else console.log("Alertas limpos!");

    // 4. Limpar Justificativas (justifications)
    console.log("Limpando justifications (Justificativas)...");
    const { error: justError } = await supabase
        .from('justifications')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

    if (justError) console.log("Erro em justifications:", justError.message);
    else console.log("Justificativas limpas!");

    console.log("\nLimpeza de pendências concluída! Todos os alunos permanecem na base de dados, porém sem histórico de movimentações, ocorrências ou alertas.");
}

clearStudentPendencies();
