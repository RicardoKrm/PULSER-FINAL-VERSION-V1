-- Script para auto-confirmar los correos de los usuarios automáticamente.
-- Esto permite que los usuarios puedan iniciar sesión inmediatamente sin necesidad de validar su correo.

-- 1. Creamos la función que marca el correo como confirmado
CREATE OR REPLACE FUNCTION public.auto_confirm_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Establece la fecha de confirmación a la fecha actual al crear el usuario
  NEW.email_confirmed_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Creamos (o reemplazamos) el trigger en la tabla auth.users
DROP TRIGGER IF EXISTS auto_confirm_email_trigger ON auth.users;

CREATE TRIGGER auto_confirm_email_trigger
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_confirm_email();

-- 3. (Opcional) Confirmar a todos los usuarios que ya existen y que no han sido confirmados aún
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;
