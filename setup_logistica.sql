-- Supabase SQL script para crear las tablas de Logística y Suministros (Multi-empresa)

-- 1. Crear tabla Bodegas
CREATE TABLE IF NOT EXISTS public.logistica_bodegas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    empresa_id UUID NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para Bodegas
ALTER TABLE public.logistica_bodegas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logistica_bodegas_select" ON public.logistica_bodegas FOR SELECT USING (true);
CREATE POLICY "logistica_bodegas_insert" ON public.logistica_bodegas FOR INSERT WITH CHECK (true);
CREATE POLICY "logistica_bodegas_update" ON public.logistica_bodegas FOR UPDATE USING (true);
CREATE POLICY "logistica_bodegas_delete" ON public.logistica_bodegas FOR DELETE USING (true);


-- 2. Crear tabla Repuestos / Insumos
CREATE TABLE IF NOT EXISTS public.logistica_repuestos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    empresa_id UUID NOT NULL,
    bodega_id UUID REFERENCES public.logistica_bodegas(id) ON DELETE SET NULL,
    nombre VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    proveedor VARCHAR(255),
    ubicacion VARCHAR(255),
    calidad VARCHAR(100),
    stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    precio NUMERIC(12,2) DEFAULT 0,
    valor_total NUMERIC(12,2) DEFAULT 0,
    is_critico BOOLEAN DEFAULT false,
    ult_mov TIMESTAMP WITH TIME ZONE,
    estado VARCHAR(50) DEFAULT 'ACTIVO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para Repuestos
ALTER TABLE public.logistica_repuestos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logistica_repuestos_select" ON public.logistica_repuestos FOR SELECT USING (true);
CREATE POLICY "logistica_repuestos_insert" ON public.logistica_repuestos FOR INSERT WITH CHECK (true);
CREATE POLICY "logistica_repuestos_update" ON public.logistica_repuestos FOR UPDATE USING (true);
CREATE POLICY "logistica_repuestos_delete" ON public.logistica_repuestos FOR DELETE USING (true);


-- 3. Crear tabla Movimientos de Inventario (Auditorías, Consumos, Validaciones)
CREATE TABLE IF NOT EXISTS public.logistica_movimientos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    empresa_id UUID NOT NULL,
    repuesto_id UUID REFERENCES public.logistica_repuestos(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL, -- ENTRADA, SALIDA, AUDITORIA, PENDIENTE_VALIDACION
    cantidad INTEGER NOT NULL,
    referencia TEXT,
    notas TEXT,
    usuario_id UUID,
    usuario_nombre VARCHAR(255),
    estado VARCHAR(50) DEFAULT 'COMPLETADO', -- COMPLETADO, PENDIENTE
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para Movimientos
ALTER TABLE public.logistica_movimientos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logistica_movimientos_select" ON public.logistica_movimientos FOR SELECT USING (true);
CREATE POLICY "logistica_movimientos_insert" ON public.logistica_movimientos FOR INSERT WITH CHECK (true);
CREATE POLICY "logistica_movimientos_update" ON public.logistica_movimientos FOR UPDATE USING (true);
CREATE POLICY "logistica_movimientos_delete" ON public.logistica_movimientos FOR DELETE USING (true);
