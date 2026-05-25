-- 1. Deshacer el uso de JSONB
ALTER TABLE public.orden_de_trabajo DROP COLUMN IF EXISTS insumos;
ALTER TABLE public.orden_de_trabajo DROP COLUMN IF EXISTS tareas_realizadas;
ALTER TABLE public.orden_de_trabajo DROP COLUMN IF EXISTS detalles;
ALTER TABLE public.orden_de_trabajo DROP COLUMN IF EXISTS historial;

-- 2. Asegurar catálogo de Repuestos (Inventario / Bodega)
CREATE TABLE IF NOT EXISTS public.repuesto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT UNIQUE,
    nombre TEXT NOT NULL,
    stock_actual NUMERIC(10,2) DEFAULT 0,
    costo_unitario NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS si aplica
ALTER TABLE public.repuesto ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo repuesto" ON public.repuesto;
CREATE POLICY "Permitir todo repuesto" ON public.repuesto FOR ALL USING (true);

-- 3. Tabla Relacional Insumos OT
CREATE TABLE IF NOT EXISTS public.detalle_insumo_ot (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_id UUID NOT NULL REFERENCES public.orden_de_trabajo(id) ON DELETE CASCADE,
    repuesto_id UUID NOT NULL REFERENCES public.repuesto(id) ON DELETE RESTRICT,
    cantidad NUMERIC(10,2) NOT NULL,
    costo_unitario_aplicado NUMERIC(10,2) DEFAULT 0,
    costo_total NUMERIC(10,2) GENERATED ALWAYS AS (cantidad * costo_unitario_aplicado) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.detalle_insumo_ot ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo detalle_insumo_ot" ON public.detalle_insumo_ot;
CREATE POLICY "Permitir todo detalle_insumo_ot" ON public.detalle_insumo_ot FOR ALL USING (true);

-- Drop old schema linking to raw insumo/tarea instead of catalog
DROP TABLE IF EXISTS public.orden_insumo CASCADE;
DROP TABLE IF EXISTS public.orden_tarea CASCADE;

-- 4. Asegurarnos del Catálogo de Tareas (Tarea Estandar)
-- Ya existe tarea_estandar, la usaremos como catálogo (tiempo_estandar, costo_base).
ALTER TABLE public.tarea_estandar ADD COLUMN IF NOT EXISTS codigo TEXT UNIQUE;
ALTER TABLE public.tarea_estandar RENAME COLUMN costo_mano_obra TO costo_base;

-- 5. Tabla Relacional Tareas OT
CREATE TABLE IF NOT EXISTS public.ot_tareas_realizadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_id UUID NOT NULL REFERENCES public.orden_de_trabajo(id) ON DELETE CASCADE,
    tarea_estandar_id UUID NOT NULL REFERENCES public.tarea_estandar(id) ON DELETE RESTRICT,
    tiempo_real_minutos INTEGER DEFAULT 0,
    costo_real NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ot_tareas_realizadas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo ot_tareas_realizadas" ON public.ot_tareas_realizadas;
CREATE POLICY "Permitir todo ot_tareas_realizadas" ON public.ot_tareas_realizadas FOR ALL USING (true);

-- 6. Actualizar y Relacionar la Orden de Trabajo
-- Mantenemos los 7 tipos y reglas
ALTER TABLE public.orden_de_trabajo ADD COLUMN IF NOT EXISTS pauta_mantenimiento_id UUID REFERENCES public.pauta_mantenimiento(id);
ALTER TABLE public.orden_de_trabajo ADD COLUMN IF NOT EXISTS tipo_falla_id UUID; -- Asumiendo que se creará la tabla tipo_falla lueguo o ya existe.
ALTER TABLE public.orden_de_trabajo ADD COLUMN IF NOT EXISTS responsable_id UUID REFERENCES auth.users(id); -- o la tabla de mecánicos. Usaremos texto mientras tanto si no está lista:
ALTER TABLE public.orden_de_trabajo ALTER COLUMN tecnico_responsable DROP NOT NULL;

-- Seguimiento y KPIs
ALTER TABLE public.orden_de_trabajo ADD COLUMN IF NOT EXISTS inicio_proceso TIMESTAMPTZ;
ALTER TABLE public.orden_de_trabajo ADD COLUMN IF NOT EXISTS termino_proceso TIMESTAMPTZ;
ALTER TABLE public.orden_de_trabajo ADD COLUMN IF NOT EXISTS tfs_minutos INTEGER DEFAULT 0;

-- 7. Historial de la OT (Registro de estados en tabla separada como en Pulser)
CREATE TABLE IF NOT EXISTS public.historial_ot (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_id UUID NOT NULL REFERENCES public.orden_de_trabajo(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES auth.users(id),
    usuario_nombre TEXT,
    estado_anterior TEXT,
    estado_nuevo TEXT,
    comentario TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.historial_ot ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo historial_ot" ON public.historial_ot;
CREATE POLICY "Permitir todo historial_ot" ON public.historial_ot FOR ALL USING (true);


-- =========================================================================
-- 8. TRIGGER DE DESCUENTO DE STOCK (Transacción Atómica Supabase/PostgreSQL)
-- =========================================================================
CREATE OR REPLACE FUNCTION procesar_cierre_ot()
RETURNS TRIGGER AS $$
DECLARE
    r RECORD;
BEGIN
    -- Cuando la OT se pasa a FINALIZADA
    IF NEW.estado = 'FINALIZADA' AND (OLD.estado IS DISTINCT FROM 'FINALIZADA') THEN
        
        -- 1. Descontar Stock de los Insumos usados
        FOR r IN SELECT repuesto_id, cantidad FROM public.detalle_insumo_ot WHERE orden_id = NEW.id
        LOOP
            UPDATE public.repuesto
            SET stock_actual = stock_actual - r.cantidad,
                updated_at = NOW()
            WHERE id = r.repuesto_id;
        END LOOP;

        -- 2. Actualizar Odómetro General (Para CUALQUIER tipo de OT)
        IF NEW.kilometraje_cierre > 0 THEN
            UPDATE public.vehiculo
            SET kilometraje_actual = GREATEST(kilometraje_actual, NEW.kilometraje_cierre)
            WHERE id = NEW.vehiculo_id;
        END IF;

        -- 3. RESETEAR LA PIZARRA DE MANTENIMIENTO (SÓLO PREVENTIVAS)
        -- Esto es lo que hace que la alerta roja/amarilla vuelva a verde en el Dashboard
        IF NEW.tipo = 'PREVENTIVA' AND NEW.pauta_mantenimiento_id IS NOT NULL THEN
            UPDATE public.vehiculo
            SET km_ultima_mantencion = NEW.kilometraje_cierre,
                fecha_ultima_mantencion = CURRENT_DATE
            WHERE id = NEW.vehiculo_id;
        END IF;

    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cierre_ot ON public.orden_de_trabajo;
CREATE TRIGGER trigger_cierre_ot
AFTER UPDATE ON public.orden_de_trabajo
FOR EACH ROW
EXECUTE FUNCTION procesar_cierre_ot();
