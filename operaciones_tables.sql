-- --------------------------------------------------------
-- SCRIPT DE CREACIÓN DE TABLAS DE OPERACIONES Y SERVICIOS
-- --------------------------------------------------------

-- Asegurarse de eliminar tablas si existieran con otro esquema
DROP TABLE IF EXISTS public.operacion_contrato_vehiculo CASCADE;
DROP TABLE IF EXISTS public.operacion_servicio CASCADE;
DROP TABLE IF EXISTS public.operacion_reserva CASCADE;
DROP TABLE IF EXISTS public.operacion_documento CASCADE;
DROP TABLE IF EXISTS public.operacion_contrato CASCADE;
DROP TABLE IF EXISTS public.vehiculo CASCADE;
DROP TABLE IF EXISTS public.colaborador CASCADE;

-- Tabla de Colaboradores (Conductores, Mecánicos, etc)
CREATE TABLE IF NOT EXISTS public.colaborador (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID REFERENCES public.empresa(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    rut TEXT,
    rol TEXT,
    telefono TEXT,
    licencia TEXT,
    especialidad TEXT,
    estado TEXT DEFAULT 'ACTIVO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.colaborador ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access colaborador of their company" ON public.colaborador FOR ALL USING (
    empresa_id IN (
        SELECT empresa_id 
        FROM public.usuario_aplicacion 
        WHERE auth_user_id = auth.uid()
    )
);

-- Tabla de Vehículos
CREATE TABLE IF NOT EXISTS public.vehiculo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID REFERENCES public.empresa(id) ON DELETE CASCADE,
    patente TEXT NOT NULL,
    marca TEXT,
    modelo TEXT,
    anio INTEGER,
    tipo TEXT,
    estado TEXT DEFAULT 'OPERATIVO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.vehiculo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access vehiculo of their company" ON public.vehiculo FOR ALL USING (
    empresa_id IN (
        SELECT empresa_id 
        FROM public.usuario_aplicacion 
        WHERE auth_user_id = auth.uid()
    )
);

-- 1. Tabla de Contratos (Operaciones -> Contratos Clientes)
CREATE TABLE IF NOT EXISTS public.operacion_contrato (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID REFERENCES public.empresa(id) ON DELETE CASCADE,
    cliente_razon_social TEXT NOT NULL,
    cliente_rut TEXT,
    descripcion TEXT,
    tipo_servicio TEXT,
    zona_operacion TEXT,
    fecha_inicio DATE,
    fecha_termino DATE,
    valor_total NUMERIC,
    moneda TEXT DEFAULT 'CLP',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla intermedia para asociar Vehículos a un Contrato
CREATE TABLE IF NOT EXISTS public.operacion_contrato_vehiculo (
    contrato_id UUID REFERENCES public.operacion_contrato(id) ON DELETE CASCADE,
    vehiculo_id UUID REFERENCES public.vehiculo(id) ON DELETE CASCADE,
    PRIMARY KEY (contrato_id, vehiculo_id)
);

-- 2. Tabla de Servicios (Operaciones -> Crear Servicio)
CREATE TABLE IF NOT EXISTS public.operacion_servicio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID REFERENCES public.empresa(id) ON DELETE CASCADE,
    codigo TEXT NOT NULL,
    contrato_id UUID REFERENCES public.operacion_contrato(id) ON DELETE SET NULL,
    tipo_carga TEXT NOT NULL,
    subtipo TEXT,
    origen TEXT NOT NULL,
    destino TEXT NOT NULL,
    fecha_servicio TIMESTAMP WITH TIME ZONE NOT NULL,
    conductor_id UUID REFERENCES public.colaborador(id) ON DELETE SET NULL, -- Asumiendo que conductor es colaborador
    vehiculo_id UUID REFERENCES public.vehiculo(id) ON DELETE SET NULL,
    estado TEXT DEFAULT 'Borrador', -- Borrador, Confirmado, En Ruta, Finalizado
    ingreso_esperado NUMERIC DEFAULT 0,
    costo_estimado NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabla de Reservas (Operaciones -> Reservas)
-- Es similar a servicios pero más orientada al cliente directo / turismo
CREATE TABLE IF NOT EXISTS public.operacion_reserva (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID REFERENCES public.empresa(id) ON DELETE CASCADE,
    codigo TEXT,
    categoria TEXT, -- Web, Minera, Extranjero, Operador
    cliente_nombre TEXT,
    cliente_email TEXT,
    cliente_telefono TEXT,
    cliente_rut TEXT,
    origen TEXT,
    destino TEXT,
    fecha_reserva TIMESTAMP WITH TIME ZONE,
    pasajeros_cantidad INTEGER DEFAULT 1,
    monto_total NUMERIC DEFAULT 0,
    estado_pago TEXT DEFAULT 'Pendiente', -- Pendiente, Pagado
    estado_viaje TEXT DEFAULT 'Pendiente', -- Pendiente, Confirmado, En Curso, Finalizado
    conductor_id UUID REFERENCES public.colaborador(id) ON DELETE SET NULL,
    vehiculo_id UUID REFERENCES public.vehiculo(id) ON DELETE SET NULL,
    notas TEXT,
    detalles JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Documentos Entidades (Operaciones -> Control Documental)
-- Para llevar registro de vencimientos de documentos (licencia, revisión técnica, etc)
CREATE TABLE IF NOT EXISTS public.operacion_documento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID REFERENCES public.empresa(id) ON DELETE CASCADE,
    tipo_entidad TEXT NOT NULL, -- 'CONDUCTOR' o 'VEHICULO'
    entidad_id UUID NOT NULL, -- UUID genérico del colaborador o vehículo
    tipo_documento TEXT NOT NULL, -- Licencia, Revisión Técnica, Seguro, etc
    numero_documento TEXT,
    fecha_emision DATE,
    fecha_vencimiento DATE,
    estado TEXT DEFAULT 'Vigente', -- Vigente, Por Vencer, Vencido
    archivo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.operacion_contrato ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operacion_contrato_vehiculo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operacion_servicio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operacion_reserva ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operacion_documento ENABLE ROW LEVEL SECURITY;

-- Políticas base (solo ver datos de la propia empresa)
CREATE POLICY "Users can access operacion_contrato of their company" ON public.operacion_contrato FOR ALL USING (
    empresa_id IN (
        SELECT empresa_id 
        FROM public.usuario_aplicacion 
        WHERE auth_user_id = auth.uid()
    )
);

CREATE POLICY "Users can access operacion_contrato_vehiculo of their company" ON public.operacion_contrato_vehiculo FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.operacion_contrato c
        WHERE c.id = contrato_id AND c.empresa_id IN (
            SELECT empresa_id 
            FROM public.usuario_aplicacion 
            WHERE auth_user_id = auth.uid()
        )
    )
);

CREATE POLICY "Users can access operacion_servicio of their company" ON public.operacion_servicio FOR ALL USING (
    empresa_id IN (
        SELECT empresa_id 
        FROM public.usuario_aplicacion 
        WHERE auth_user_id = auth.uid()
    )
);

CREATE POLICY "Users can access operacion_reserva of their company" ON public.operacion_reserva FOR ALL USING (
    empresa_id IN (
        SELECT empresa_id 
        FROM public.usuario_aplicacion 
        WHERE auth_user_id = auth.uid()
    )
);

CREATE POLICY "Users can access operacion_documento of their company" ON public.operacion_documento FOR ALL USING (
    empresa_id IN (
        SELECT empresa_id 
        FROM public.usuario_aplicacion 
        WHERE auth_user_id = auth.uid()
    )
);

-- Nota: Recordar correr este script en el SQL Editor de Supabase
