CREATE OR REPLACE FUNCTION get_roles_bypass()
RETURNS TABLE (id UUID, nombre TEXT, permisos JSONB)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT r.id, r.nombre, r.permisos FROM public.rol r;
END;
$$ LANGUAGE plpgsql;
