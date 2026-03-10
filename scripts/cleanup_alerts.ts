
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing environment variables");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupAlerts() {
    console.log("Iniciando limpeza de alertas pendentes...");

    const { count, error } = await supabase
        .from('alerts')
        .delete()
        .eq('status', 'pending');

    if (error) {
        console.error("Erro ao deletar alertas:", error.message);
    } else {
        console.log(`Sucesso! ${count} alertas pendentes foram apagados.`);
    }
}

cleanupAlerts();
