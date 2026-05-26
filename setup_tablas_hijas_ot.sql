-- =====================================================================
-- SCRIPT DE CONFIGURACIÓN DE TABLAS HIJAS PARA ORDEN DE TRABAJO (OT)
-- =====================================================================
-- Este script crea de forma segura las tablas secundarias de la OT si es que
-- no existen. Si ya existen, las mantiene con sus datos actuales intactos.
-- También configura de forma robusta las políticas de seguridad (RLS)
-- eliminándolas previamente para evitar errores de duplicado.
-- =====================================================================

-- 1. Tabla para asentar Tareas Realizadas en la OT
CREATE TABLE IF NOT EXISTS public.ot_tareas_realizadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_id UUID NOT NULL REFERENCES public.orden_de_trabajo(id) ON DELETE CASCADE,
    tarea_estandar_id UUID,
    tiempo_real_minutos INTEGER DEFAULT 0,
    costo_real NUMERIC(10,2) DEFAULT 0,
    tarea_estandar JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Si la tabla ya existía de un intento anterior, eliminamos las restricciones antiguas restrictivas
ALTER TABLE public.ot_tareas_realizadas DROP CONSTRAINT IF EXISTS ot_tareas_realizadas_tarea_estandar_id_fkey;

-- 2. Tabla para registrar los Insumos y Repuestos consumidos por cada OT
CREATE TABLE IF NOT EXISTS public.detalle_insumo_ot (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_id UUID NOT NULL REFERENCES public.orden_de_trabajo(id) ON DELETE CASCADE,
    repuesto_id UUID,
    cantidad NUMERIC(10,2) NOT NULL DEFAULT 1,
    costo_unitario_aplicado NUMERIC(10,2) DEFAULT 0,
    costo_total NUMERIC(10,2) DEFAULT 0,
    repuesto JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Si la tabla ya existía de un intento anterior, eliminamos las restricciones antiguas restrictivas
ALTER TABLE public.detalle_insumo_ot DROP CONSTRAINT IF EXISTS detalle_insumo_ot_repuesto_id_fkey;

-- 3. Tabla para llevar el Historial de la OT (cambios de estado, notas, etc.)
CREATE TABLE IF NOT EXISTS public.historial_ot (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_id UUID NOT NULL REFERENCES public.orden_de_trabajo(id) ON DELETE CASCADE,
    usuario_nombre TEXT DEFAULT 'Sistema',
    comentario TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla para procesar las solicitudes de Bodega originadas en las OTs
CREATE TABLE IF NOT EXISTS public.solicitud_repuesto_ot (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_id UUID NOT NULL REFERENCES public.orden_de_trabajo(id) ON DELETE CASCADE,
    repuesto_id UUID,
    repuesto_nombre TEXT NOT NULL,
    cantidad NUMERIC(10,2) NOT NULL DEFAULT 1,
    estado TEXT DEFAULT 'PENDIENTE', -- PENDIENTE, APROBADA, RECHAZADA
    usuario_nombre TEXT DEFAULT 'Mecánico',
    motivo_rechazo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- CONFIGURACIÓN DE SEGURIDAD RLS (Row Level Security)
-- =====================================================================

-- Habilitar RLS de forma segura (no afecta datos existentes)
ALTER TABLE public.ot_tareas_realizadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_insumo_ot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historial_ot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitud_repuesto_ot ENABLE ROW LEVEL SECURITY;

-- Limpieza y recreación de políticas para evitar errores de duplicación (42710)
DROP POLICY IF EXISTS "Permitir todo ot_tareas_realizadas" ON public.ot_tareas_realizadas;
CREATE POLICY "Permitir todo ot_tareas_realizadas" ON public.ot_tareas_realizadas FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir todo detalle_insumo_ot" ON public.detalle_insumo_ot;
CREATE POLICY "Permitir todo detalle_insumo_ot" ON public.detalle_insumo_ot FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir todo historial_ot" ON public.historial_ot;
CREATE POLICY "Permitir todo historial_ot" ON public.historial_ot FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir todo solicitud_repuesto_ot" ON public.solicitud_repuesto_ot;
CREATE POLICY "Permitir todo solicitud_repuesto_ot" ON public.solicitud_repuesto_ot FOR ALL USING (true);
