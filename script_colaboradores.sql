-- Script para asegurar que la tabla colaborador existe y cuenta con los campos necesarios para la carga masiva

CREATE TABLE IF NOT EXISTS public.colaborador (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresa(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    rut TEXT,
    rol TEXT,
    telefono TEXT,
    licencia TEXT,
    especialidad TEXT,
    email TEXT,
    estado TEXT DEFAULT 'ACTIVO',
    detalles JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Asegurarse de que las columnas están creadas en caso de que la tabla ya existiera
ALTER TABLE public.colaborador ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.colaborador ADD COLUMN IF NOT EXISTS detalles JSONB DEFAULT '{}'::jsonb;

-- Habilitar RLS
ALTER TABLE public.colaborador ENABLE ROW LEVEL SECURITY;

-- Crear o reemplazar las políticas de acceso
DROP POLICY IF EXISTS "Users can access colaborador of their company" ON public.colaborador;
CREATE POLICY "Users can access colaborador of their company" ON public.colaborador FOR ALL USING (
    public.is_super_admin() OR empresa_id IN (
        SELECT empresa_id 
        FROM public.usuario_aplicacion 
        WHERE auth_user_id = auth.uid()
    )
);
