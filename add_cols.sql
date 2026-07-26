ALTER TABLE prod_metas 
ADD COLUMN IF NOT EXISTS mina_diaria numeric,
ADD COLUMN IF NOT EXISTS mina_mensual numeric,
ADD COLUMN IF NOT EXISTS transporte_diario numeric,
ADD COLUMN IF NOT EXISTS transporte_mensual numeric;
