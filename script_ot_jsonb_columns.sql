ALTER TABLE public.orden_de_trabajo ADD COLUMN IF NOT EXISTS detalles JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.orden_de_trabajo ADD COLUMN IF NOT EXISTS historial JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.orden_de_trabajo ADD COLUMN IF NOT EXISTS tareas_realizadas JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.orden_de_trabajo ADD COLUMN IF NOT EXISTS insumos JSONB DEFAULT '[]'::jsonb;
