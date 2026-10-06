-- =================================================================================
-- PULSER V2 - MOTOR DE ESCALAMIENTO DE ALERTAS (ESCALATION ENGINE)
-- Ejecuta este script en el editor SQL de Supabase para crear la arquitectura.
-- =================================================================================

-- 1. MATRIZ DE ESCALAMIENTO
-- Define la jerarquía de quién debe recibir las alertas en cada nivel por empresa.
CREATE TABLE IF NOT EXISTS matriz_escalamiento (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    empresa_id UUID REFERENCES empresa(id) ON DELETE CASCADE,
    area VARCHAR(255) NOT NULL, -- Ej: 'CONTROL_DOCUMENTAL', 'MANTENIMIENTO', 'FINANZAS'
    responsable_id UUID REFERENCES usuario_aplicacion(id) ON DELETE SET NULL, -- Nivel 1
    supervisor_id UUID REFERENCES usuario_aplicacion(id) ON DELETE SET NULL,  -- Nivel 2
    gerente_id UUID REFERENCES usuario_aplicacion(id) ON DELETE SET NULL,     -- Nivel 3
    dias_para_escalar INT DEFAULT 1, -- Cuántos días esperar sin respuesta antes de subir al siguiente nivel
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(empresa_id, area) -- Solo puede haber una matriz por área por empresa
);

-- 2. REGISTRO DE ALERTAS AUTOMÁTICAS (TRACKING)
-- Rastrea el ciclo de vida de cada alerta enviada para saber en qué nivel está.
CREATE TABLE IF NOT EXISTS registro_alertas_automaticas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    empresa_id UUID REFERENCES empresa(id) ON DELETE CASCADE,
    entidad_tipo VARCHAR(50) NOT NULL, -- Ej: 'VEHICULO', 'CONDUCTOR'
    entidad_id UUID NOT NULL, 
    motivo VARCHAR(255) NOT NULL, -- Ej: 'Vencimiento Licencia', 'Revisión Técnica'
    nivel_actual INT DEFAULT 1, -- 1: Responsable, 2: Supervisor, 3: Gerente
    estado VARCHAR(50) DEFAULT 'PENDIENTE', -- 'PENDIENTE', 'ESCALADA', 'RESUELTA_OK'
    ultimo_envio_at TIMESTAMP WITH TIME ZONE,
    fecha_resolucion TIMESTAMP WITH TIME ZONE,
    resuelto_por UUID REFERENCES usuario_aplicacion(id) ON DELETE SET NULL,
    metodo_envio VARCHAR(50), -- 'WHATSAPP', 'EMAIL', 'AMBOS'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Seguridad RLS (Row Level Security)
ALTER TABLE matriz_escalamiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE registro_alertas_automaticas ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad para Matriz
CREATE POLICY "Empresas ven su propia matriz" ON matriz_escalamiento
    FOR ALL USING (empresa_id IN (
        SELECT empresa_id FROM usuario_aplicacion WHERE id = auth.uid()
    ));

-- Políticas de Seguridad para Registro de Alertas
CREATE POLICY "Empresas ven sus propias alertas" ON registro_alertas_automaticas
    FOR ALL USING (empresa_id IN (
        SELECT empresa_id FROM usuario_aplicacion WHERE id = auth.uid()
    ));
