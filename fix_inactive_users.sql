UPDATE public.usuario_aplicacion u
SET estado = 'Inactivo'
FROM public.empresa e
WHERE u.empresa_id = e.id
AND e.estado = 'Inactivo';
