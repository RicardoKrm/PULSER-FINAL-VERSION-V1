import React, { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export function useSyncOdometers(activeCompanyId: string | null, setVehiculos?: React.Dispatch<React.SetStateAction<any[]>>) {
  const isSyncing = useRef(false);

  useEffect(() => {
    if (!activeCompanyId) return;

    const doSync = async () => {
      if (isSyncing.current) return;
      isSyncing.current = true;
      try {
         const [vehiculosRes, configRes] = await Promise.all([
            supabase.from('vehiculo').select('id, patente, kilometraje_actual, detalles').eq('empresa_id', activeCompanyId),
            supabase.from('empresa').select('detalles').eq('id', activeCompanyId).single()
         ]);
         
         if (!vehiculosRes.data || vehiculosRes.error) return;
         
         let configured = vehiculosRes.data.filter(v => {
            if (v.detalles?.gps_proveedor) return true;
            return false;
         });
         
         if (configured.length === 0) return;
         
         let apiKeys: any = {};
         if (configRes.data && configRes.data.detalles) {
             apiKeys = configRes.data.detalles.gps_config || {};
         }

         let gps2Data: any[] = [];
         if (apiKeys.traccar_url && apiKeys.traccar_user && apiKeys.traccar_pass) {
            try {
                const res = await fetch("/api/gps/sync-gps2", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        url: apiKeys.traccar_url,
                        username: apiKeys.traccar_user,
                        password: apiKeys.traccar_pass
                    })
                });
                if (res.ok) {
                    const parsed = await res.json();
                    if (Array.isArray(parsed)) gps2Data = parsed;
                }
            } catch (e) {
                console.error("BG sync: Error fetching GPS2:", e);
            }
         }

         await Promise.all(configured.map(async (v) => {
            const prov = v.detalles?.gps_proveedor;
            let newKm = v.kilometraje_actual || 0;
            let updatedTimestamp: string | null = null;
            let hasUpdate = false;
            
            if (prov === 'traccar') {
                const registro = gps2Data.find((x: any) => x.plateNumber === v.patente);
                if (registro && registro.odometer) {
                    const km = parseInt(registro.odometer);
                    if (km > newKm) {
                        newKm = km;
                        hasUpdate = true;
                    }
                }
            } else if (prov === 'dominio') {
               try {
                   const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNzgwNTk0MDAxLCJleHAiOjQ5MzQxOTQwMDF9.XSMC_zxhn-d_BXzsWLuILtVkep4QxIhekRBGR0Hc8WA';
                   const now = new Date();
                   let past = v.detalles?.fecha_actualizacion_km ? new Date(v.detalles.fecha_actualizacion_km) : null;
                   
                   // Si falló el parseo anterior o no hay
                   if (!past || isNaN(past.getTime())) {
                       past = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                   }
                   
                   const formatLocalStr = (d: Date) => {
                      const pad = (n: number) => n.toString().padStart(2, '0');
                      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
                   };

                   const desde = formatLocalStr(past);
                   const hasta = formatLocalStr(now);

                   const res = await fetch('/api/gps/dominio', {
                       method: 'POST',
                       headers: { 'Content-Type': 'application/json' },
                       body: JSON.stringify({ patente: v.patente, desde, hasta, token })
                   });
                   if (res.ok) {
                       const data = await res.json();
                       updatedTimestamp = data.lastTimestamp;
                       if (data.totalKm && data.totalKm > 0) {
                            newKm += data.totalKm;
                            hasUpdate = true;
                       }
                   }
               } catch(e) {
                  // silent
               }
            } else if (prov === 'gpsglobal' && apiKeys.gpsglobal) {
                 // For gpsglobal, they don't seem to have odometer implemented in backend logic.
                 // It just returns lat/lng.
                 // Keep it as is
            }

            if (hasUpdate && newKm > (v.kilometraje_actual || 0) && !v.id.toString().startsWith('mock')) {
                const detalles = v.detalles || {};
                
                // Asegurarse de mantener precision de Km
                newKm = Math.round(newKm * 100) / 100;
                
                if (updatedTimestamp && !isNaN(new Date(updatedTimestamp).getTime())) {
                    detalles.fecha_actualizacion_km = new Date(updatedTimestamp).toISOString();
                } else {
                    detalles.fecha_actualizacion_km = new Date().toISOString();
                }
                const { error } = await supabase.from('vehiculo').update({ kilometraje_actual: newKm, detalles }).eq('id', v.id);
                if (!error) {
                    console.log(`BG Sync updated Vehiculo ${v.patente} to newKm: ${newKm}`);
                    if (setVehiculos) {
                        setVehiculos(prev => prev.map(veh => veh.id === v.id ? { ...veh, kilometraje_actual: newKm } : veh));
                    }
                }
            }
         }));
      } catch (e) {
         console.error("BG sync error:", e);
      } finally {
         isSyncing.current = false;
      }
    };

    doSync();
    // Real-time polling every 3 minutes globally
    const interval = setInterval(doSync, 3 * 60000);
    return () => clearInterval(interval);
  }, [activeCompanyId]);
}
