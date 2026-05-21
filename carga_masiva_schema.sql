-- Preparar base de datos para Carga Masiva (Tablas y Columnas Faltantes)

-- 1. Rutas
CREATE TABLE IF NOT EXISTS public.ruta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_ruta TEXT UNIQUE NOT NULL,
    origen TEXT NOT NULL,
    destino TEXT NOT NULL,
    distancia_km NUMERIC(10,2) DEFAULT 0,
    tiempo_estimado_horas NUMERIC(10,2) DEFAULT 0,
    tarifa_base NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Neumáticos
CREATE TABLE IF NOT EXISTS public.neumatico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_interno TEXT UNIQUE NOT NULL,
    marca TEXT,
    modelo TEXT,
    medida TEXT,
    estado TEXT DEFAULT 'Nuevo',
    patente_asignada TEXT,
    posicion TEXT,
    kilometraje_instalacion NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Registros de Combustible
CREATE TABLE IF NOT EXISTS public.registro_combustible (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha TIMESTAMPTZ NOT NULL,
    patente TEXT NOT NULL,
    odometro NUMERIC(10,2),
    litros NUMERIC(10,2),
    costo_total NUMERIC(12,2),
    proveedor TEXT,
    conductor TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Bodegas
CREATE TABLE IF NOT EXISTS public.bodega (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_bodega TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    direccion TEXT,
    encargado TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Suministros (EPP, Consumibles, etc.)
CREATE TABLE IF NOT EXISTS public.suministro (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_suministro TEXT UNIQUE NOT NULL,
    nombres TEXT NOT NULL,
    tipo TEXT,
    stock NUMERIC(10,2) DEFAULT 0,
    precio_unitario NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Actualizaciones a Tablas Existentes

-- Empleados (Colaborador)
ALTER TABLE public.colaborador
ADD COLUMN IF NOT EXISTS rut TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS cargos TEXT,
ADD COLUMN IF NOT EXISTS telefono TEXT,
ADD COLUMN IF NOT EXISTS apellidos TEXT;

-- Vehículo
ALTER TABLE public.vehiculo 
ADD COLUMN IF NOT EXISTS tipo_vehiculo TEXT,
ADD COLUMN IF NOT EXISTS empresa_nombre TEXT,
ADD COLUMN IF NOT EXISTS norma_euro TEXT,
ADD COLUMN IF NOT EXISTS tipo_aceite TEXT,
ADD COLUMN IF NOT EXISTS km_ultima_mantencion NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS fecha_ultima_mantencion TEXT,
ADD COLUMN IF NOT EXISTS tipo_ultimo_mant TEXT,
ADD COLUMN IF NOT EXISTS razon_social TEXT,
ADD COLUMN IF NOT EXISTS rut TEXT,
ADD COLUMN IF NOT EXISTS chasis TEXT,
ADD COLUMN IF NOT EXISTS motor TEXT,
ADD COLUMN IF NOT EXISTS capacidad_carga NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS aplicacion TEXT,
ADD COLUMN IF NOT EXISTS intervalo_km NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS en_operacion_activa BOOLEAN DEFAULT true;

-- Inventario / Insumo
ALTER TABLE public.insumo
ADD COLUMN IF NOT EXISTS codigo TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS categoria TEXT,
ADD COLUMN IF NOT EXISTS precio_unitario NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS proveedor_principal TEXT;

-- Pautas de Mantenimiento
ALTER TABLE public.pauta_mantenimiento
ADD COLUMN IF NOT EXISTS nombre_pauta TEXT,
ADD COLUMN IF NOT EXISTS modelo_vehiculo TEXT,
ADD COLUMN IF NOT EXISTS tipo TEXT,
ADD COLUMN IF NOT EXISTS km_ejecucion NUMERIC(10,2);

-- Tareas Estándar
ALTER TABLE public.tarea_estandar
ADD COLUMN IF NOT EXISTS codigo_tarea TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS tiempo_estimado_horas NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS costo_base_mano_obra NUMERIC(12,2);

-- Tipo de Falla
ALTER TABLE public.tipo_falla
ADD COLUMN IF NOT EXISTS codigo_falla TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS sistema_afectado TEXT,
ADD COLUMN IF NOT EXISTS criticidad TEXT;

-- Proveedor
ALTER TABLE public.proveedor
ADD COLUMN IF NOT EXISTS rut TEXT,
ADD COLUMN IF NOT EXISTS razon_social TEXT,
ADD COLUMN IF NOT EXISTS contacto TEXT,
ADD COLUMN IF NOT EXISTS tipo_servicio TEXT;

-- Kits
ALTER TABLE public.kit_repuesto
ADD COLUMN IF NOT EXISTS codigo_kit TEXT UNIQUE;

-- Contratos
ALTER TABLE public.operacion_contrato
ADD COLUMN IF NOT EXISTS codigo_contrato TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS cliente TEXT,
ADD COLUMN IF NOT EXISTS monto_mensual NUMERIC(12,2);

-- Documental
ALTER TABLE public.operacion_documento
ADD COLUMN IF NOT EXISTS entidad TEXT,
ADD COLUMN IF NOT EXISTS referencia TEXT;

-- OTs (Orden de Trabajo)
ALTER TABLE public.orden_de_trabajo
ADD COLUMN IF NOT EXISTS numero_ot TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS patente TEXT,
ADD COLUMN IF NOT EXISTS tipo_mantenimiento TEXT,
ADD COLUMN IF NOT EXISTS costo_total NUMERIC(12,2);

-- Reservas (operaciones_reserva o similar)
ALTER TABLE public.operacion_reserva
ADD COLUMN IF NOT EXISTS codigo_reserva TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS cliente TEXT;

-- Usuario Aplicación / Configuración Login
ALTER TABLE public.usuario_aplicacion
ADD COLUMN IF NOT EXISTS panel_inicio TEXT DEFAULT '/dashboard';


