-- Configuración de zona horaria y cosas generales
-- No es estrictamente necesario, pero ayuda
SET TIMEZONE='UTC';

-- ==========================================
-- 1. Tablas Independientes (Sin Foreign Keys obligatorias iniciales hacia otras de la lista base)
-- ==========================================

-- Tabla: collaborator (Personal)
CREATE TABLE IF NOT EXISTS public.collaborator (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initials TEXT NOT NULL,
    name TEXT NOT NULL,
    rut TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL,
    role_badge_text TEXT,
    phone TEXT,
    licencia TEXT,
    especialidad TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVO', -- 'ACTIVO' | 'LICENCIA' | 'VACACIONES'
    is_conductor BOOLEAN DEFAULT false,
    is_mecanico BOOLEAN DEFAULT false,
    is_supervisor BOOLEAN DEFAULT false,
    email TEXT,
    sueldo_base NUMERIC(10,2),
    valor_hh NUMERIC(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: conductor
CREATE TABLE IF NOT EXISTS public.conductor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    estado TEXT DEFAULT 'activo', -- 'activo' | 'inactivo'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: vehiculo
CREATE TABLE IF NOT EXISTS public.vehiculo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patente TEXT NOT NULL UNIQUE,
    numero_interno TEXT,
    modelo TEXT,
    marca TEXT,
    kilometraje_actual NUMERIC(10,2) DEFAULT 0,
    fecha_actualizacion_km TIMESTAMPTZ,
    intervalo_mantencion_km NUMERIC(10,2) DEFAULT 10000,
    km_promedio_dia NUMERIC(8,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: tarea (específica de OT)
CREATE TABLE IF NOT EXISTS public.tarea (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    descripcion TEXT NOT NULL,
    costo_base NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: insumo (específica de OT)
CREATE TABLE IF NOT EXISTS public.insumo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    cantidad NUMERIC(10,2) DEFAULT 0,
    precio_unitario NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: proveedor
CREATE TABLE IF NOT EXISTS public.proveedor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    rut TEXT,
    direccion TEXT,
    telefono TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: usuario
CREATE TABLE IF NOT EXISTS public.usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    cargo TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: tipo_falla
CREATE TABLE IF NOT EXISTS public.tipo_falla (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: tarea_estandar
CREATE TABLE IF NOT EXISTS public.tarea_estandar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    descripcion TEXT NOT NULL,
    tiempo_estandar_minutos INTEGER DEFAULT 0,
    costo_mano_obra NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: pauta_mantenimiento
CREATE TABLE IF NOT EXISTS public.pauta_mantenimiento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    modelo_vehiculo TEXT NOT NULL,
    km_aplicacion NUMERIC(10,2) NOT NULL,
    archivo_pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: kit_repuesto
CREATE TABLE IF NOT EXISTS public.kit_repuesto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. Tablas con Dependencias (Foreign Keys)
-- ==========================================

-- Tabla: reserva_turismo (JSONB para las estructuras anidadas para simplificar en v1)
CREATE TABLE IF NOT EXISTS public.reserva_turismo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    op TEXT,
    categoria TEXT, -- 'Web' | 'Minera' | 'Extranjero' | 'Operador'
    cliente JSONB, -- { nombre, email, telefono, dni_pasaporte, rut_empresa }
    pasajeros JSONB, -- { nombre, telefono, cantidad }
    lugares JSONB, -- { origen, destino, numeroVuelo }
    logistica JSONB, -- { maletasGrandes, maletasChicas, sillaBebe, cantidadSillas }
    servicio TEXT,
    tipo_vehiculo TEXT, -- 'SUV' | 'Van' | 'Sedán'
    fecha DATE NOT NULL,
    hora_inicio TIME,
    hora_termino TIME,
    conductor_id UUID REFERENCES public.conductor(id),
    vehiculo_id UUID REFERENCES public.vehiculo(id),
    finanzas JSONB, -- { montoBruto, gastosAdicionales, porcentajeComision, formaPago, tipoDocumento, cobrado, montoNeto, folioFactura, fechaDeposito }
    comentarios JSONB, -- { conductor, interno }
    estado TEXT DEFAULT 'pendiente', -- 'pendiente' | 'confirmada' | 'finalizada' | 'cancelada'
    audit_logs JSONB DEFAULT '[]'::jsonb, -- Array of { quien, accion, cuando }
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: orden_de_trabajo
CREATE TABLE IF NOT EXISTS public.orden_de_trabajo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folio TEXT UNIQUE NOT NULL,
    vehiculo_id UUID NOT NULL REFERENCES public.vehiculo(id),
    tecnico_responsable TEXT,
    tipo TEXT NOT NULL, 
    estado TEXT NOT NULL DEFAULT 'ABIERTA',
    prioridad TEXT NOT NULL DEFAULT 'MEDIA',
    kilometraje_apertura NUMERIC(10,2) NOT NULL,
    kilometraje_cierre NUMERIC(10,2),
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    -- Programación de la Pizarra de Mantenimiento
    fecha_programada DATE,
    hora_inicio_programada TIME,
    hora_termino_programada TIME,
    observacion_inicial TEXT,
    diagnostico_evaluacion TEXT,
    
    -- Detalle Técnico
    pauta TEXT,
    kit_repuestos TEXT,
    tipo_falla TEXT,
    sintomas TEXT,
    inspeccion_tren_motriz TEXT,
    eje TEXT,
    presion_neumatico NUMERIC(5,2),
    
    -- Gestión Administrativa
    personal_operativo TEXT,
    proveedor TEXT,
    empresa_externa TEXT,
    rut_empresa TEXT,
    valor_hh NUMERIC(10,2),
    presupuesto_aprobado NUMERIC(10, 2),
    observaciones TEXT,
    
    -- Costos
    costo_insumos NUMERIC(10,2) DEFAULT 0,
    costo_mano_obra_tareas NUMERIC(10,2) DEFAULT 0,
    costo_mano_obra_hh NUMERIC(10,2) DEFAULT 0,
    tiempo_trabajado_segundos INTEGER DEFAULT 0,
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. Tablas para la Pizarra de Programación
-- La pizarra se alimenta de 'orden_de_trabajo' (OTs) y 'collaborator' (Mecánicos).
-- Usamos 'asignacion_ot_mecanico' si queremos múltiples mecánicos por OT.
-- ==========================================

-- Relación OT <-> Mecánico (Colaborador)
CREATE TABLE IF NOT EXISTS public.asignacion_ot_mecanico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_id UUID NOT NULL REFERENCES public.orden_de_trabajo(id) ON DELETE CASCADE,
    mecanico_id UUID NOT NULL REFERENCES public.collaborator(id) ON DELETE CASCADE,
    es_principal BOOLEAN DEFAULT true, -- Indica si es el técnico responsable (líder)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para gestionar las "Pausas" de una Orden de Trabajo que se ven en la pizarra
CREATE TABLE IF NOT EXISTS public.pausa_ot (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_id UUID NOT NULL REFERENCES public.orden_de_trabajo(id) ON DELETE CASCADE,
    motivo TEXT NOT NULL, -- ej. 'Falta de Repuesto', 'Colación', 'Término de Jornada'
    hora_inicio TIMESTAMPTZ DEFAULT NOW(),
    hora_fin TIMESTAMPTZ,
    duracion_minutos INTEGER,
    usuario_id UUID REFERENCES public.collaborator(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. Tablas Intermedias / Relaciones Muchos a Muchos
-- ==========================================

-- Relación OT <-> Tareas
CREATE TABLE IF NOT EXISTS public.orden_tarea (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_id UUID NOT NULL REFERENCES public.orden_de_trabajo(id) ON DELETE CASCADE,
    tarea_id UUID NOT NULL REFERENCES public.tarea(id) ON DELETE CASCADE
);

-- Relación OT <-> Insumos
CREATE TABLE IF NOT EXISTS public.orden_insumo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_id UUID NOT NULL REFERENCES public.orden_de_trabajo(id) ON DELETE CASCADE,
    insumo_id UUID NOT NULL REFERENCES public.insumo(id) ON DELETE CASCADE
);

-- Historial Eventos para OT
CREATE TABLE IF NOT EXISTS public.historial_evento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_id UUID NOT NULL REFERENCES public.orden_de_trabajo(id) ON DELETE CASCADE,
    descripcion TEXT NOT NULL,
    fecha_evento TIMESTAMPTZ DEFAULT NOW(),
    usuario TEXT
);

-- Detalle Kit Repuesto
CREATE TABLE IF NOT EXISTS public.kit_repuesto_detalle (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kit_id UUID NOT NULL REFERENCES public.kit_repuesto(id) ON DELETE CASCADE,
    repuesto TEXT NOT NULL,
    cantidad NUMERIC(10,2) DEFAULT 1
);

-- ==========================================
-- 5. Tablas del Super Administrador (SaaS / Multi-Tenant / Permisos)
-- ==========================================

-- Tabla: empresa (Clientes del SaaS)
CREATE TABLE IF NOT EXISTS public.empresa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    razon_social TEXT,
    rut TEXT,
    estado TEXT DEFAULT 'Activo', -- 'Activo' | 'Inactivo'
    fecha_ingreso DATE DEFAULT CURRENT_DATE,
    tiempo_expiracion TEXT DEFAULT '6m',
    limite_usuarios INTEGER DEFAULT 1,
    limite_flota INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: rol (Perfiles de Acceso)
CREATE TABLE IF NOT EXISTS public.rol (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL UNIQUE,
    tipo TEXT DEFAULT 'Cliente', -- 'Sistema' | 'Cliente'
    permisos JSONB DEFAULT '[]'::jsonb, -- Array con los submódulos o vistas que puede acceder
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: usuario_aplicacion (Usuarios de Login, diferente al colaborador de recursos humanos)
CREATE TABLE IF NOT EXISTS public.usuario_aplicacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID, -- Aquí iría la referencia a auth.users de Supabase (opcional pero ideal)
    empresa_id UUID REFERENCES public.empresa(id) ON DELETE CASCADE,
    rol_id UUID REFERENCES public.rol(id) ON DELETE SET NULL,
    nombre TEXT NOT NULL,
    rut TEXT UNIQUE,
    email TEXT UNIQUE,
    telefono TEXT,
    estado TEXT DEFAULT 'Activo',
    panel_inicio TEXT DEFAULT '/dashboard',
    cambio_clave_pendiente BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 6. Semilla (Seed) Inicial - Súper Administrador
-- ==========================================

-- 1. Crear el Rol de Súper Administrador
INSERT INTO public.rol (nombre, tipo, permisos)
VALUES ('Súper Administrador', 'Sistema', '["*"]')
ON CONFLICT (nombre) DO NOTHING;

-- 2. Crear una Empresa Base para el Administrador
INSERT INTO public.empresa (nombre, razon_social, rut, estado)
VALUES ('Gaval', 'Sistema de Gestión', '00000000-0', 'Activo');

-- 3. Crear el usuario perfil. 
-- (Nota: Deberás registrar este email manualmente o mediante la app en Supabase Authentication 
-- y opcionalmente vincular el auth_user_id en el futuro)
INSERT INTO public.usuario_aplicacion (empresa_id, rol_id, nombre, email, rut, estado)
SELECT 
    e.id, 
    r.id, 
    'Súper Administrador', 
    'superadministrador@gaval.cl', 
    '11111111-1', 
    'Activo'
FROM public.empresa e, public.rol r
WHERE e.rut = '00000000-0' AND r.nombre = 'Súper Administrador'
LIMIT 1;

