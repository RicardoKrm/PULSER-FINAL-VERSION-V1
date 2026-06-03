CREATE TABLE IF NOT EXISTS public.compras_contratos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresa(id) ON DELETE CASCADE,
    folio TEXT NOT NULL,
    proveedor_id UUID REFERENCES public.proveedores_directorio(id) ON DELETE SET NULL,
    proveedor_nombre TEXT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_termino DATE NOT NULL,
    tipo TEXT NOT NULL,
    estado TEXT DEFAULT 'Activo',
    monto_total NUMERIC(15,2) DEFAULT 0,
    responsable TEXT,
    condicion_pago TEXT,
    alertas_activadas BOOLEAN DEFAULT true,
    observaciones TEXT,
    archivo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.compras_contratos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access compras_contratos of their company" ON public.compras_contratos FOR ALL USING (
    public.is_super_admin() OR empresa_id IN (
        SELECT empresa_id FROM public.usuario_aplicacion WHERE auth_user_id = auth.uid()
    )
) WITH CHECK (
    public.is_super_admin() OR empresa_id IN (
        SELECT empresa_id FROM public.usuario_aplicacion WHERE auth_user_id = auth.uid()
    )
);
