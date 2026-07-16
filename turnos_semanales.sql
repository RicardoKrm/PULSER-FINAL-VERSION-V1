CREATE TABLE IF NOT EXISTS turnos_semanales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  area VARCHAR(50) NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE turnos_semanales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users" ON turnos_semanales
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
