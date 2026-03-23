
-- Adicionar coluna de observação na tabela de movimentações
ALTER TABLE public.movements ADD COLUMN IF NOT EXISTS observation TEXT;

-- Garantir que a coluna observation seja incluída no tipo Database do Supabase futuramente
COMMENT ON COLUMN public.movements.observation IS 'Observação automática sobre o tipo de movimentação (ex: Retorno de Intervalo, Atraso)';
