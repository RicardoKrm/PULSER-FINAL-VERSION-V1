ALTER TABLE public.logistica_movimientos ADD COLUMN IF NOT EXISTS bodega_id UUID REFERENCES public.logistica_bodegas(id) ON DELETE SET NULL;
