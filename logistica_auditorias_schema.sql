-- 1. Crear tabla Auditorías
CREATE TABLE IF NOT EXISTS public.logistica_auditorias (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    empresa_id UUID NOT NULL,
    bodega_id UUID REFERENCES public.logistica_bodegas(id) ON DELETE CASCADE,
    responsable VARCHAR(255),
    notas TEXT,
    fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_termino TIMESTAMP WITH TIME ZONE,
    estado VARCHAR(50) DEFAULT 'CAPTURANDO', -- CAPTURANDO, ESPERANDO, FINALIZADA
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para Auditorías
ALTER TABLE public.logistica_auditorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logistica_auditorias_select" ON public.logistica_auditorias FOR SELECT USING (true);
CREATE POLICY "logistica_auditorias_insert" ON public.logistica_auditorias FOR INSERT WITH CHECK (true);
CREATE POLICY "logistica_auditorias_update" ON public.logistica_auditorias FOR UPDATE USING (true);
CREATE POLICY "logistica_auditorias_delete" ON public.logistica_auditorias FOR DELETE USING (true);


-- 2. Crear tabla Detalles de Auditoría
CREATE TABLE IF NOT EXISTS public.logistica_auditoria_detalles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    auditoria_id UUID REFERENCES public.logistica_auditorias(id) ON DELETE CASCADE,
    repuesto_id UUID REFERENCES public.logistica_repuestos(id) ON DELETE CASCADE,
    stock_sistema INTEGER NOT NULL,
    stock_fisico INTEGER NOT NULL,
    diferencia INTEGER NOT NULL,
    justificacion TEXT,
    estado_ajuste VARCHAR(50) DEFAULT 'PENDIENTE', -- PENDIENTE, APROBADO, RECHAZADO
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para Detalles de Auditoría
ALTER TABLE public.logistica_auditoria_detalles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logistica_auditoria_detalles_select" ON public.logistica_auditoria_detalles FOR SELECT USING (true);
CREATE POLICY "logistica_auditoria_detalles_insert" ON public.logistica_auditoria_detalles FOR INSERT WITH CHECK (true);
CREATE POLICY "logistica_auditoria_detalles_update" ON public.logistica_auditoria_detalles FOR UPDATE USING (true);
CREATE POLICY "logistica_auditoria_detalles_delete" ON public.logistica_auditoria_detalles FOR DELETE USING (true);
