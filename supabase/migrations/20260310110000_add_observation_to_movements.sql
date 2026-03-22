-- Migration: Add observation column to movements table
-- Description: Allows storing specific contextual information for exception-based gate tracking
-- (e.g., 'Saída no horário de almoço', 'Saída Institucional / Antecipada', 'Entrada (Atraso)')

ALTER TABLE IF EXISTS public.movements 
ADD COLUMN IF NOT EXISTS observation text;
