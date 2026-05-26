-- 1. Crear tabla de proveedores si no existe (o añadir empresa_id)
CREATE TABLE IF NOT EXISTS public.proveedores_directorio (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    empresa_id UUID NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    rut VARCHAR(50),
    telefono VARCHAR(50),
    email VARCHAR(255),
    direccion TEXT,
    estado VARCHAR(50) DEFAULT 'ACTIVO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habilitar RLS
ALTER TABLE public.proveedores_directorio ENABLE ROW LEVEL SECURITY;

-- 3. Crear Políticas de Seguridad
CREATE POLICY "proveedores_select" ON public.proveedores_directorio FOR SELECT USING (true);
CREATE POLICY "proveedores_insert" ON public.proveedores_directorio FOR INSERT WITH CHECK (true);
CREATE POLICY "proveedores_update" ON public.proveedores_directorio FOR UPDATE USING (true);
CREATE POLICY "proveedores_delete" ON public.proveedores_directorio FOR DELETE USING (true);
