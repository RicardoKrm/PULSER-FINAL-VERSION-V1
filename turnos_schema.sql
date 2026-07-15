CREATE TABLE turnos_semanales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES empresa(id) ON DELETE CASCADE,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  area VARCHAR(255) NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
