-- Correcciones de límite numérico para evitar desbordamientos (overflow) en Supabase

-- Tabla: orden_de_trabajo
ALTER TABLE public.orden_de_trabajo ALTER COLUMN kilometraje_apertura TYPE NUMERIC(14,2);
ALTER TABLE public.orden_de_trabajo ALTER COLUMN kilometraje_cierre TYPE NUMERIC(14,2);
ALTER TABLE public.orden_de_trabajo ALTER COLUMN valor_hh TYPE NUMERIC(14,2);
ALTER TABLE public.orden_de_trabajo ALTER COLUMN presupuesto_aprobado TYPE NUMERIC(14,2);
ALTER TABLE public.orden_de_trabajo ALTER COLUMN costo_insumos TYPE NUMERIC(14,2);
ALTER TABLE public.orden_de_trabajo ALTER COLUMN costo_mano_obra_tareas TYPE NUMERIC(14,2);
ALTER TABLE public.orden_de_trabajo ALTER COLUMN costo_mano_obra_hh TYPE NUMERIC(14,2);

-- Tabla: detalle_insumo_ot
ALTER TABLE public.detalle_insumo_ot ALTER COLUMN cantidad TYPE NUMERIC(14,2);
ALTER TABLE public.detalle_insumo_ot ALTER COLUMN costo_unitario_aplicado TYPE NUMERIC(14,2);
ALTER TABLE public.detalle_insumo_ot ALTER COLUMN costo_total TYPE NUMERIC(14,2);

-- Tabla: vehiculo
ALTER TABLE public.vehiculo ALTER COLUMN kilometraje_actual TYPE NUMERIC(14,2);
ALTER TABLE public.vehiculo ALTER COLUMN intervalo_mantencion_km TYPE NUMERIC(14,2);
ALTER TABLE public.vehiculo ALTER COLUMN km_promedio_dia TYPE NUMERIC(14,2);

-- Tabla: ot_tareas_realizadas
ALTER TABLE public.ot_tareas_realizadas ALTER COLUMN costo_real TYPE NUMERIC(14,2);

-- Tabla: solicitud_repuesto_ot
ALTER TABLE public.solicitud_repuesto_ot ALTER COLUMN cantidad TYPE NUMERIC(14,2);

-- Tabla: repuesto
ALTER TABLE public.repuesto ALTER COLUMN stock_actual TYPE NUMERIC(14,2);
ALTER TABLE public.repuesto ALTER COLUMN costo_unitario TYPE NUMERIC(14,2);
