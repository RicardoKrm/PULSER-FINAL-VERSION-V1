-- ACTUALIZACIÓN DE TABLAS colaborador Y vehiculo PARA CONTROL DOCUMENTAL

-- 1. Agregar campo detalles y email a colaborador
ALTER TABLE public.colaborador ADD COLUMN IF NOT EXISTS detalles JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.colaborador ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Agregar campo detalles y kilometraje_actual a vehiculo
ALTER TABLE public.vehiculo ADD COLUMN IF NOT EXISTS detalles JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.vehiculo ADD COLUMN IF NOT EXISTS kilometraje_actual INTEGER DEFAULT 0;

-- Nota: Si utilizas el caché del esquema de Supabase, 
-- automáticamente se refrescará al correr estas instrucciones.
