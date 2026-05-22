-- Tablas para mantenimiento de flota pautas y tareas

-- Tabla: mantenimiento_modelo_vehiculo
CREATE TABLE IF NOT EXISTS public.mantenimiento_modelo_vehiculo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL,
    nombre TEXT NOT NULL,
    estado TEXT DEFAULT 'Activo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.mantenimiento_modelo_vehiculo ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access mantenimiento_modelo_vehiculo of their company" ON public.mantenimiento_modelo_vehiculo;
CREATE POLICY "Users can access mantenimiento_modelo_vehiculo of their company" ON public.mantenimiento_modelo_vehiculo FOR ALL USING (
    public.is_super_admin() OR
    empresa_id IN (
        SELECT empresa_id 
        FROM public.usuario_aplicacion 
        WHERE auth_user_id = auth.uid()
    )
);

-- Tabla: mantenimiento_tarea
CREATE TABLE IF NOT EXISTS public.mantenimiento_tarea (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL,
    descripcion TEXT NOT NULL,
    tiempo_estandar_minutos INTEGER DEFAULT 60,
    costo_mano_obra NUMERIC DEFAULT 0,
    color TEXT DEFAULT 'bg-blue-500',
    estado TEXT DEFAULT 'Activo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.mantenimiento_tarea ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access mantenimiento_tarea of their company" ON public.mantenimiento_tarea;
CREATE POLICY "Users can access mantenimiento_tarea of their company" ON public.mantenimiento_tarea FOR ALL USING (
    public.is_super_admin() OR
    empresa_id IN (
        SELECT empresa_id 
        FROM public.usuario_aplicacion 
        WHERE auth_user_id = auth.uid()
    )
);

-- Tabla: mantenimiento_pauta
CREATE TABLE IF NOT EXISTS public.mantenimiento_pauta (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL,
    nombre TEXT NOT NULL,
    modelo_vehiculo_id UUID REFERENCES public.mantenimiento_modelo_vehiculo(id),
    kilometraje_inicial INTEGER DEFAULT 0,
    intervalo_1 INTEGER NOT NULL,
    intervalo_2 INTEGER,
    archivo_pdf TEXT,
    tipo_aplicacion TEXT,
    tipo_aceite TEXT,
    tareas JSONB, -- Array de IDs de tareas seleccionadas
    color TEXT DEFAULT 'bg-blue-500',
    estado TEXT DEFAULT 'Activo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.mantenimiento_pauta ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access mantenimiento_pauta of their company" ON public.mantenimiento_pauta;
CREATE POLICY "Users can access mantenimiento_pauta of their company" ON public.mantenimiento_pauta FOR ALL USING (
    public.is_super_admin() OR
    empresa_id IN (
        SELECT empresa_id 
        FROM public.usuario_aplicacion 
        WHERE auth_user_id = auth.uid()
    )
);
