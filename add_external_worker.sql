ALTER TABLE public.orden_de_trabajo ADD COLUMN IF NOT EXISTS tecnico_tipo TEXT DEFAULT 'INTERNO';
ALTER TABLE public.orden_de_trabajo ADD COLUMN IF NOT EXISTS externo_nombre TEXT;
ALTER TABLE public.orden_de_trabajo ADD COLUMN IF NOT EXISTS externo_especialidad TEXT;
ALTER TABLE public.orden_de_trabajo ADD COLUMN IF NOT EXISTS externo_intervencion TEXT;
