-- Configuración de Órdenes de Compra

CREATE TABLE IF NOT EXISTS public.compras_ordenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresa(id) ON DELETE CASCADE,
    folio TEXT NOT NULL,
    proveedor_id UUID REFERENCES public.proveedores_directorio(id) ON DELETE SET NULL,
    proveedor_nombre TEXT,
    fecha_emision TIMESTAMPTZ DEFAULT NOW(),
    estado TEXT DEFAULT 'PENDIENTE', -- PENDIENTE, RECIBIDA, CANCELADA
    notas TEXT,
    monto_estimado NUMERIC(15,2) DEFAULT 0,
    usuario_id UUID REFERENCES public.usuario_aplicacion(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.compras_ordenes_lineas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_id UUID REFERENCES public.compras_ordenes(id) ON DELETE CASCADE,
    repuesto_nombre TEXT,
    descripcion TEXT,
    centro_costo TEXT,
    cantidad NUMERIC(10,2) DEFAULT 1,
    precio_unitario NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.compras_ordenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compras_ordenes_lineas ENABLE ROW LEVEL SECURITY;

-- Políticas para compras_ordenes
CREATE POLICY "Users can access compras_ordenes of their company" ON public.compras_ordenes FOR ALL USING (
    public.is_super_admin() OR empresa_id IN (
        SELECT empresa_id FROM public.usuario_aplicacion WHERE auth_user_id = auth.uid()
    )
) WITH CHECK (
    public.is_super_admin() OR empresa_id IN (
        SELECT empresa_id FROM public.usuario_aplicacion WHERE auth_user_id = auth.uid()
    )
);

-- Políticas para compras_ordenes_lineas
CREATE POLICY "Users can access compras_ordenes_lineas of their company" ON public.compras_ordenes_lineas FOR ALL USING (
    public.is_super_admin() OR orden_id IN (
        SELECT id FROM public.compras_ordenes WHERE empresa_id = (SELECT empresa_id FROM public.usuario_aplicacion WHERE auth_user_id = auth.uid() LIMIT 1)
    )
) WITH CHECK (
    public.is_super_admin() OR orden_id IN (
        SELECT id FROM public.compras_ordenes WHERE empresa_id = (SELECT empresa_id FROM public.usuario_aplicacion WHERE auth_user_id = auth.uid() LIMIT 1)
    )
);
