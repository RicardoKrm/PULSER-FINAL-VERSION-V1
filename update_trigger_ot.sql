CREATE OR REPLACE FUNCTION procesar_cierre_ot()
RETURNS TRIGGER AS $$
DECLARE
    r RECORD;
    v_tipo_mant TEXT;
    v_fecha_mant TEXT;
BEGIN
    -- Cuando la OT se pasa a FINALIZADA (por update o por insert directo como listada)
    IF NEW.estado = 'FINALIZADA' AND (TG_OP = 'INSERT' OR OLD.estado IS DISTINCT FROM 'FINALIZADA') THEN
        
        -- 1. Descontar Stock de los Insumos usados (sólo útil en UPDATE normalmente, pero por si acaso)
        FOR r IN SELECT repuesto_id, cantidad FROM public.detalle_insumo_ot WHERE orden_id = NEW.id
        LOOP
            UPDATE public.repuesto
            SET stock_actual = stock_actual - r.cantidad,
                updated_at = NOW()
            WHERE id = r.repuesto_id;
        END LOOP;

        -- 2. Actualizar Odómetro General (Para CUALQUIER tipo de OT)
        IF NEW.kilometraje_cierre > 0 THEN
            UPDATE public.vehiculo
            SET kilometraje_actual = GREATEST(kilometraje_actual, NEW.kilometraje_cierre)
            WHERE id = NEW.vehiculo_id;
        END IF;

        -- 3. RESETEAR LA PIZARRA DE MANTENIMIENTO (SÓLO PREVENTIVAS)
        IF NEW.tipo = 'PREVENTIVA' THEN
            
            IF NEW.pauta_mantenimiento_id IS NOT NULL THEN
                SELECT nombre INTO v_tipo_mant
                FROM public.pauta_mantenimiento
                WHERE id = NEW.pauta_mantenimiento_id;
            ELSE
                v_tipo_mant := COALESCE(NEW.pauta, 'Mantenimiento Preventivo');
            END IF;
            
            -- Usar termino_proceso o fecha_creacion si fecha_programada no está disponible
            IF NEW.termino_proceso IS NOT NULL THEN
                v_fecha_mant := TO_CHAR(NEW.termino_proceso, 'YYYY-MM-DD');
            ELSE
                v_fecha_mant := TO_CHAR(COALESCE(NEW.inicio_proceso, NEW.fecha_creacion, CURRENT_DATE), 'YYYY-MM-DD');
            END IF;
            
            -- Solo actualiza si el kilometraje es mayor que el que ya tiene el vehículo (para no pisar con datos muy viejos accidentalmente)
            UPDATE public.vehiculo
            SET km_ultima_mantencion = NEW.kilometraje_cierre,
                fecha_ultima_mantencion = v_fecha_mant,
                tipo_ultimo_mant = v_tipo_mant
            WHERE id = NEW.vehiculo_id AND (km_ultima_mantencion IS NULL OR km_ultima_mantencion <= NEW.kilometraje_cierre);
        END IF;

    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cierre_ot ON public.orden_de_trabajo;
CREATE TRIGGER trigger_cierre_ot
AFTER INSERT OR UPDATE ON public.orden_de_trabajo
FOR EACH ROW
EXECUTE FUNCTION procesar_cierre_ot();
