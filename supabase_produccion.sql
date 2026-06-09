-- ========================================================================================
-- SCRIPT DE BASE DE DATOS PARA SUPABASE - MODULO: PRODUCCIÓN Y LOGÍSTICA
-- ========================================================================================

-- Habilitar la extensión para UUIDs si no está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TABLA: CONFIGURACIÓN DE METAS (prod_metas)
-- =====================================================
CREATE TABLE public.prod_metas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    meta_diaria INT NOT NULL DEFAULT 8000,
    meta_semanal INT NOT NULL DEFAULT 56000,
    meta_mensual INT NOT NULL DEFAULT 240000,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Realtime para reflejar los cambios en los KPIs al instante
ALTER PUBLICATION supabase_realtime ADD TABLE public.prod_metas;

-- =====================================================
-- 2. TABLA: REPORTES DIARIOS DE OPERACIÓN (prod_reportes_operacion)
-- =====================================================
CREATE TABLE public.prod_reportes_operacion (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    toneladas_extraidas NUMERIC NOT NULL DEFAULT 0,
    toneladas_molidas NUMERIC NOT NULL DEFAULT 0,
    nivel_stock NUMERIC NOT NULL DEFAULT 0,
    notas TEXT,
    created_by UUID, -- Para enlazar a auth.users cuando sea necesario
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.prod_reportes_operacion;

-- =====================================================
-- 3. TABLA: REPORTES DE TRANSPORTE Y TRAZABILIDAD (prod_reportes_transporte)
-- =====================================================
CREATE TABLE public.prod_reportes_transporte (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    camion_id VARCHAR(50) NOT NULL,
    chofer VARCHAR(150) NOT NULL,
    numero_vuelta INT NOT NULL,
    toneladas NUMERIC NOT NULL,
    tipo_sal VARCHAR(50) NOT NULL,
    suceso VARCHAR(100) NOT NULL DEFAULT 'Normal',
    notas TEXT,
    created_by UUID, -- Para enlazar a auth.users
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.prod_reportes_transporte;

-- =====================================================
-- 4. TABLA: ESTADO EN VIVO DE LOGÍSTICA EN RUTA (prod_logistica_vivo)
-- =====================================================
-- Esta tabla actualiza las posiciones y ETA para el mapa del Dashboard
CREATE TABLE public.prod_logistica_vivo (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    camion_id VARCHAR(50) NOT NULL,
    patente VARCHAR(20) NOT NULL,
    chofer VARCHAR(150) NOT NULL,
    carga_toneladas NUMERIC NOT NULL,
    tipo_material VARCHAR(50) NOT NULL,
    estado VARCHAR(20) NOT NULL CHECK (estado IN ('transit', 'arrived', 'alert')),
    progreso INT NOT NULL DEFAULT 0,
    eta VARCHAR(20),
    hora_salida VARCHAR(20),
    hora_arribo VARCHAR(20),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.prod_logistica_vivo;

-- =====================================================
-- DATOS DE PRUEBA (SEEDING) 
-- =====================================================

-- Insertar metas base
INSERT INTO public.prod_metas (meta_diaria, meta_semanal, meta_mensual)
VALUES (8500, 24000, 115000);

-- Insertar camiones en vivo de prueba
INSERT INTO public.prod_logistica_vivo (camion_id, patente, chofer, carga_toneladas, tipo_material, estado, progreso, eta, hora_salida) VALUES 
('TR-05', 'DX-FR-44', 'Juan Pérez', 32, 'Sal Gruesa', 'transit', 45, '14:30', '13:00'),
('TR-12', 'HT-YK-21', 'Miguel Rojas', 34, 'Sal Fina', 'alert', 65, '15:10', '12:45'),
('TR-08', 'GZ-LP-99', 'Carlos Soto', 32, 'Sal Gruesa', 'arrived', 100, 'Arribado', '09:30');

-- =====================================================
-- ROW LEVEL SECURITY (RLS) - CONFIGURACIÓN BÁSICA PREPARADA
-- =====================================================
-- Activamos RLS (puedes dejarlas públicas ajustando las politicas si estás en dev)
ALTER TABLE public.prod_metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prod_reportes_operacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prod_reportes_transporte ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prod_logistica_vivo ENABLE ROW LEVEL SECURITY;

-- Politicas Permisivas Iniciales para Desarrollo (Reemplazar en Prod)
CREATE POLICY "Permitir todo a usuarios anonimos y autenticados (DEV)" ON public.prod_metas FOR ALL USING (true);
CREATE POLICY "Permitir todo a usuarios anonimos y autenticados (DEV)" ON public.prod_reportes_operacion FOR ALL USING (true);
CREATE POLICY "Permitir todo a usuarios anonimos y autenticados (DEV)" ON public.prod_reportes_transporte FOR ALL USING (true);
CREATE POLICY "Permitir todo a usuarios anonimos y autenticados (DEV)" ON public.prod_logistica_vivo FOR ALL USING (true);
