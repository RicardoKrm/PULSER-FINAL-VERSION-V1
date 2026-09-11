DO $$ 
DECLARE
  v_empresa_id UUID;
BEGIN
  -- Get an active company ID
  SELECT id INTO v_empresa_id FROM public.empresa LIMIT 1;
  
  IF v_empresa_id IS NOT NULL THEN
    UPDATE public.produccion_sanny 
    SET empresa_id = v_empresa_id 
    WHERE empresa_id IS NULL;
  END IF;
END $$;
