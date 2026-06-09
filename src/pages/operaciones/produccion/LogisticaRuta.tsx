import React from 'react';
import { Warehouse, Ship, Wifi, TriangleAlert, Truck, CheckCircle2 } from 'lucide-react';
import { GlobalStats, TruckDispatch } from '../../../contexts/ProduccionContext';

interface Props {
  stats: GlobalStats;
  trucks: TruckDispatch[];
}

export default function LogisticaRuta({ stats, trucks }: Props) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm dark:shadow-xl transition-colors">
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-2">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white transition-colors">Monitoreo Predictivo de Transporte: Canchas a Puerto Patache</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Ruta de 85 km sin cobertura de red. Posición simulada mediante algoritmos de velocidad y ETA.</p>
            </div>
            <span className="bg-slate-50 dark:bg-slate-950 text-amber-600 dark:text-amber-500 border border-slate-200 dark:border-slate-800 text-[10px] font-black px-2.5 py-1 rounded-lg transition-colors">Frecuencia: Salida - Destino</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-6 relative overflow-hidden hidden sm:block transition-colors">
            <div className="relative h-20 w-full bg-white dark:bg-slate-900 rounded-lg flex items-center justify-between px-6 border border-slate-200 dark:border-slate-800 transition-colors">
              <div className="absolute inset-x-0 h-1.5 bg-slate-200 dark:bg-slate-700 border-t border-b border-dashed border-slate-300 dark:border-slate-500 top-1/2 -translate-y-1/2 z-0"></div>
              
              <div className="z-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 p-2 rounded-lg text-center w-28 transition-colors">
                <span className="block text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase">PUNTO DE CONTROL 1</span>
                <span className="text-xs font-black text-slate-900 dark:text-white flex items-center justify-center gap-1"><Warehouse className="w-3 h-3 text-amber-500" /> CANCHAS MINA</span>
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5 flex justify-center items-center gap-1"><Wifi className="w-3 h-3" /> COBERTURA</span>
              </div>

              <div className="absolute inset-x-32 top-0 bottom-0 opacity-[0.03] dark:opacity-10 pointer-events-none z-0 bg-repeat bg-diagonal-stripes"></div>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-white/95 dark:bg-slate-950/95 border border-rose-300 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-[9px] font-black tracking-widest uppercase px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm dark:shadow-lg transition-colors">
                <TriangleAlert className="w-3 h-3 animate-pulse" /> Zona Fuera de Cobertura (ZSC) - 65 KM
              </div>

              <div className="z-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 p-2 rounded-lg text-center w-28 transition-colors">
                <span className="block text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase">PUNTO DE CONTROL 2</span>
                <span className="text-xs font-black text-slate-900 dark:text-white flex items-center justify-center gap-1"><Ship className="w-3 h-3 text-blue-500" /> PTO. PATACHE</span>
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5 flex justify-center items-center gap-1"><Wifi className="w-3 h-3" /> COBERTURA</span>
              </div>
            </div>

            <div className="mt-3 flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              <span>Velocidad media estimada: <strong className="text-slate-900 dark:text-white">65 km/h</strong></span>
              <span>Tiempo de tránsito estándar: <strong className="text-slate-900 dark:text-white">1h 15m</strong></span>
              <span>Frenos y Control de rampa de frenado en Km 42</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Despachos en Ruta y Estimación de Ubicación</h3>
          <div className="space-y-2 overflow-y-auto max-h-56 pr-2">
            {trucks.map(truck => (
              <div key={truck.id} className={`p-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 rounded-lg border transition-colors
                ${truck.status === 'alert' ? 'bg-red-50 dark:bg-slate-950 border-rose-300 dark:border-rose-500/40 border-2' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'}
              `}>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <Truck className={`w-8 h-8 ${truck.status === 'alert' ? 'text-rose-500 dark:text-rose-400' : 'text-slate-400'}`} />
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">Camión {truck.id} (Patente: {truck.patente})</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Chofer: {truck.chofer} | Carga: {truck.carga} Toneladas de {truck.tipo}</p>
                  </div>
                </div>

                {truck.status === 'arrived' && (
                  <div className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-2 rounded">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
                {truck.status === 'transit' && (
                  <div className="w-full md:w-48">
                    <div className="flex justify-between text-[9px] text-slate-500 dark:text-slate-400 mb-1">
                      <span>Ruta: {truck.progress}% completado</span>
                      <span>ETA: {truck.eta}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${truck.progress}%` }}></div>
                    </div>
                  </div>
                )}
                {truck.status === 'alert' && (
                  <div className="w-full md:w-48">
                    <div className="flex justify-between text-[9px] text-rose-600 dark:text-rose-400 mb-1">
                      <span>Incidente reportado</span>
                      <span>ETA: {truck.eta} (Excedido)</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                )}

                <div className="text-left md:text-right text-[11px] w-full md:w-auto mt-2 md:mt-0">
                  {truck.status === 'arrived' && (
                    <>
                      <span className="bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 font-bold px-2 py-0.5 rounded text-[10px] inline-block">Arribado a Patache</span>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-1">Salida: {truck.salida} | Arribo: {truck.arribo} (Sincronizado)</p>
                    </>
                  )}
                  {truck.status === 'transit' && (
                    <>
                      <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-2 py-0.5 rounded text-[10px] inline-block">En Ruta (Sin Cobertura)</span>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-1">Salida: {truck.salida} | Tránsito Estimado</p>
                    </>
                  )}
                  {truck.status === 'alert' && (
                    <>
                      <span className="bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/40 font-black px-2 py-0.5 rounded text-[10px] animate-pulse inline-block">ALERTA: Retraso s/señal</span>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-1">Salida: {truck.salida} | Control de Seguridad Activo</p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm dark:shadow-xl transition-colors">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-2 uppercase flex items-center gap-1.5 transition-colors">
             Croquis Geográfico de Operación
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Ubicación de Salar Grande respecto a Iquique y el Puerto de Exportación.</p>
          
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2 flex items-center justify-center transition-colors">
            <svg viewBox="0 0 200 280" className="w-full max-w-[200px] h-auto">
              <rect x="0" y="0" width="60" height="280" className="fill-slate-200 dark:fill-slate-800 opacity-60 dark:opacity-40" />
              <text x="15" y="140" fill="#38bdf8" fontSize="8" fontWeight="900" transform="rotate(-90 15 140)" opacity="0.6">OCEANO PACÍFICO</text>

              <path d="M60,0 Q50,70 62,140 T58,280" fill="none" stroke="#94a3b8" className="dark:stroke-slate-600" strokeWidth="2" />

              <circle cx="59" cy="110" r="5" fill="#3b82f6" />
              <circle cx="59" cy="110" r="8" fill="none" stroke="#3b82f6" strokeWidth="1" className="animate-ping" style={{ transformOrigin: '59px 110px' }} />
              <text x="68" y="113" fill="currentColor" className="text-slate-800 dark:text-white" fontSize="8" fontWeight="900">PUERTO PATACHE</text>
              <text x="68" y="121" fill="#3b82f6" fontSize="6" fontWeight="700">Punto de Control 2</text>

              <circle cx="55" cy="30" r="4" fill="#94a3b8" />
              <text x="64" y="33" fill="#94a3b8" fontSize="8" fontWeight="700">IQUIQUE (100 KM)</text>

              <path d="M59,0 L59,110 L90,160 L140,210 L150,240" fill="none" stroke="#94a3b8" className="dark:stroke-slate-500" strokeWidth="1.5" strokeDasharray="3,3" />
              <text x="115" y="180" fill="#f43f5e" fontSize="7" fontWeight="900" transform="rotate(38 115 180)">Ruta s/Señal (85 km)</text>

              <ellipse cx="150" cy="235" r="25" rx="15" className="fill-slate-200 dark:fill-slate-50 opacity-40 dark:opacity-15" />
              <text x="150" y="238" fill="currentColor" className="text-slate-600 dark:text-slate-100" fontSize="7" fontWeight="900" textAnchor="middle">SALAR GRANDE</text>

              <circle cx="145" cy="225" r="5" fill="#f59e0b" />
              <text x="100" y="222" fill="currentColor" className="text-slate-800 dark:text-white" fontSize="7" fontWeight="950">Mina Tenardita</text>
              <text x="100" y="229" fill="#f59e0b" fontSize="6" fontWeight="700">Punto de Control 1</text>

              <circle cx="158" cy="248" r="4.5" fill="#10b981" />
              <text x="165" y="251" fill="#10b981" fontSize="6" fontWeight="700">Mina Kainita</text>
            </svg>
          </div>
        </div>

        <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-3 text-xs space-y-1.5 transition-colors">
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Total despachado hoy:</span>
            <span className="font-bold text-slate-900 dark:text-white">{stats.dispatchesCount} camiones</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Arribados a Puerto:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{stats.arrivedCount} camiones</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">En tránsito actualmente:</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">{stats.inTransitCount} camiones</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Alertas de desviación/Panne:</span>
            <span className="font-bold text-rose-600 dark:text-rose-400">{stats.alertsCount} incidente{stats.alertsCount !== 1 ? 's' : ''} activo{stats.alertsCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
