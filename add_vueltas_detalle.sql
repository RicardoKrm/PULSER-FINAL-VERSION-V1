ALTER TABLE produccion_registro_diario ADD COLUMN IF NOT EXISTS vueltas_detalle jsonb;
ALTER TABLE produccion_registro_diario_mina ADD COLUMN IF NOT EXISTS vueltas_detalle jsonb;
