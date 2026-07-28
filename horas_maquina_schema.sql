-- =========================================================================
-- SCRIPT DE CREACIÓN DE TABLA: HORAS MÁQUINA Y DISPONIBILIDAD OPERACIONAL
-- Copie y ejecute este script en el SQL Editor de Supabase
-- =========================================================================

-- 1. Crear tabla principal
CREATE TABLE IF NOT EXISTS public.horas_maquina (
    id TEXT PRIMARY KEY,
    fecha DATE NOT NULL,
    turno TEXT NOT NULL DEFAULT 'b', -- 'a' = noche, 'b' = día
    equipo TEXT NOT NULL,
    horometro_inicial NUMERIC(10, 2) DEFAULT 0,
    horometro_final NUMERIC(10, 2) DEFAULT 0,
    operador TEXT DEFAULT 'Sin Operador',
    vueltas INTEGER DEFAULT 0,
    observacion TEXT DEFAULT 'Disponible',
    checklist TEXT DEFAULT 'OK',
    horas_operativas NUMERIC(10, 2) DEFAULT 0,
    horas_redondeadas NUMERIC(10, 2) DEFAULT 0,
    combustible_l NUMERIC(10, 2) DEFAULT 0,
    empresa_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear Índices para optimizar consultas de ~6,000+ registros
CREATE INDEX IF NOT EXISTS idx_horas_maquina_fecha ON public.horas_maquina(fecha);
CREATE INDEX IF NOT EXISTS idx_horas_maquina_equipo ON public.horas_maquina(equipo);
CREATE INDEX IF NOT EXISTS idx_horas_maquina_turno ON public.horas_maquina(turno);

-- 3. Habilitar RLS (Row Level Security) y Políticas de Acceso
ALTER TABLE public.horas_maquina ENABLE ROW LEVEL SECURITY;

-- Política de lectura para todos los usuarios autenticados y anónimos de la app
CREATE POLICY "Permitir lectura publica de horas_maquina" 
ON public.horas_maquina FOR SELECT 
USING (true);

-- Política de inserción
CREATE POLICY "Permitir insercion de horas_maquina" 
ON public.horas_maquina FOR INSERT 
WITH CHECK (true);

-- Política de actualización
CREATE POLICY "Permitir actualizacion de horas_maquina" 
ON public.horas_maquina FOR UPDATE 
USING (true);

-- Política de eliminación
CREATE POLICY "Permitir eliminacion de horas_maquina" 
ON public.horas_maquina FOR DELETE 
USING (true);

-- Otorgar permisos a los roles anon y authenticated de Supabase
GRANT ALL ON public.horas_maquina TO anon, authenticated, service_role;
