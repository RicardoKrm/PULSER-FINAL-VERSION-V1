-- Ejecute este SQL en el panel de Supabase (SQL Editor) para habilitar la configuración avanzada de la empresa.
ALTER TABLE public.empresa ADD COLUMN IF NOT EXISTS detalles JSONB DEFAULT '{}'::jsonb;
