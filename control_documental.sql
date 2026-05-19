-- Tabla para documentos
CREATE TABLE IF NOT EXISTS operacion_documento (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  entidad_tipo text NOT NULL CHECK (entidad_tipo IN ('conductor', 'vehiculo')),
  entidad_id uuid NOT NULL, -- ref a colaborador.id o vehiculo.id
  nombre text NOT NULL,
  archivo_url text, -- URL si usaramos storage
  fecha_vencimiento date,
  estado text DEFAULT 'vigente', 
  created_at timestamp with time zone DEFAULT now()
);

-- Políticas RLS básicas
ALTER TABLE operacion_documento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura general de documentos"
  ON operacion_documento FOR SELECT
  USING (true);

CREATE POLICY "Inserción de documentos"
  ON operacion_documento FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Actualizar documentos"
  ON operacion_documento FOR UPDATE
  USING (true);

CREATE POLICY "Eliminar documentos"
  ON operacion_documento FOR DELETE
  USING (true);
