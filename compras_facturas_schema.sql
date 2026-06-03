CREATE TABLE IF NOT EXISTS public.compras_facturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresa(id) ON DELETE CASCADE,
    proveedor_rut TEXT NOT NULL,
    proveedor_nombre TEXT NOT NULL,
    folio_factura TEXT NOT NULL,
    orden_id UUID REFERENCES public.compras_ordenes(id) ON DELETE SET NULL,
    orden_folio TEXT,
    fecha_emision DATE NOT NULL,
    monto_total NUMERIC(15,2) DEFAULT 0,
    estado TEXT DEFAULT 'PENDIENTE', -- PENDIENTE, PAGADA, ANULADA
    archivo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.compras_facturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access compras_facturas of their company" ON public.compras_facturas FOR ALL USING (
    public.is_super_admin() OR empresa_id IN (
        SELECT empresa_id FROM public.usuario_aplicacion WHERE auth_user_id = auth.uid()
    )
) WITH CHECK (
    public.is_super_admin() OR empresa_id IN (
        SELECT empresa_id FROM public.usuario_aplicacion WHERE auth_user_id = auth.uid()
    )
);
