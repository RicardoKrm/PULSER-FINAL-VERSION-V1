-- Script para asegurar columnas necesarias en tabla vehiculo para carga masiva

ALTER TABLE public.vehiculo ADD COLUMN IF NOT EXISTS numero_interno TEXT;
ALTER TABLE public.vehiculo ADD COLUMN IF NOT EXISTS kilometraje_actual NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.vehiculo ADD COLUMN IF NOT EXISTS detalles JSONB DEFAULT '{}'::jsonb;
