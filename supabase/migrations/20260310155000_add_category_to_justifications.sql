
-- Migration: Add category to absence_justifications
-- Description: Group justifications by type (Health, Traffic, Family, etc)
ALTER TABLE public.absence_justifications 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Outros';

-- Add comment for context
COMMENT ON COLUMN public.absence_justifications.category IS 'Categoria da justificativa para análise estatística (Saúde, Trânsito, Família, Outros)';
