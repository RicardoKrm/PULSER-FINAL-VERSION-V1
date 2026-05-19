CREATE TABLE IF NOT EXISTS public.tickets_ayuda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id TEXT NOT NULL,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    categoria TEXT,
    prioridad TEXT,
    estado TEXT DEFAULT 'ABIERTO',
    empresa TEXT,
    usuario TEXT,
    email_contacto TEXT,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    mensajes JSONB DEFAULT '[]'::jsonb
);

ALTER TABLE public.usuario_aplicacion ADD COLUMN IF NOT EXISTS cambio_clave_pendiente BOOLEAN DEFAULT true;

-- Habilitar RLS en la tabla pero permitir inserciones de usuarios sin cuenta (login)
ALTER TABLE public.tickets_ayuda ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir inserts sin login" ON public.tickets_ayuda FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir select a todos" ON public.tickets_ayuda FOR SELECT USING (true);
CREATE POLICY "Permitir update a todos" ON public.tickets_ayuda FOR UPDATE USING (true);
