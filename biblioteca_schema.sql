CREATE TABLE IF NOT EXISTS public.biblioteca_documento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresa(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES public.usuario_aplicacion(id) ON DELETE SET NULL,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    archivo_url TEXT NOT NULL,
    archivo_path TEXT NOT NULL,
    tipo_documento TEXT NOT NULL,
    marca TEXT,
    modelo TEXT,
    anio INTEGER,
    categoria TEXT,
    etiquetas TEXT[],
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    visitas INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.biblioteca_favorito (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    documento_id UUID REFERENCES public.biblioteca_documento(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES public.usuario_aplicacion(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(documento_id, usuario_id)
);

ALTER TABLE public.biblioteca_documento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biblioteca_favorito ENABLE ROW LEVEL SECURITY;

CREATE POLICY "biblioteca_select_policy" ON public.biblioteca_documento FOR SELECT TO authenticated USING (true);
CREATE POLICY "biblioteca_insert_policy" ON public.biblioteca_documento FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "biblioteca_update_policy" ON public.biblioteca_documento FOR UPDATE TO authenticated USING (true);

CREATE POLICY "favoritos_select_policy" ON public.biblioteca_favorito FOR SELECT TO authenticated USING (true);
CREATE POLICY "favoritos_insert_policy" ON public.biblioteca_favorito FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "favoritos_delete_policy" ON public.biblioteca_favorito FOR DELETE TO authenticated USING (true);

-- RPC for securely incrementing hits
CREATE OR REPLACE FUNCTION public.increment_visita(doc_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.biblioteca_documento
  SET visitas = visitas + 1
  WHERE id = doc_id;
END;
$$;

-- Create storage bucket if possible, but usually done via UI/API
-- insert into storage.buckets (id, name, public) values ('biblioteca', 'biblioteca', true) ON CONFLICT DO NOTHING;
