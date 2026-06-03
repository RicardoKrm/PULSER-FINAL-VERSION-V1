CREATE TABLE IF NOT EXISTS public.compras_cotizaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresa(id) ON DELETE CASCADE,
    folio TEXT NOT NULL,
    proveedor_rut TEXT NOT NULL,
    proveedor_nombre TEXT NOT NULL,
    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE,
    moneda TEXT DEFAULT 'CLP',
    monto_total NUMERIC(15,2) DEFAULT 0,
    articulos INTEGER DEFAULT 1,
    condicion_pago TEXT,
    observaciones TEXT,
    estado TEXT DEFAULT 'EVALUACION', -- EVALUACION, APROBADA, RECHAZADA
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.compras_cotizaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access compras_cotizaciones of their company" ON public.compras_cotizaciones FOR ALL USING (
    public.is_super_admin() OR empresa_id IN (
        SELECT empresa_id FROM public.usuario_aplicacion WHERE auth_user_id = auth.uid()
    )
) WITH CHECK (
    public.is_super_admin() OR empresa_id IN (
        SELECT empresa_id FROM public.usuario_aplicacion WHERE auth_user_id = auth.uid()
    )
);
