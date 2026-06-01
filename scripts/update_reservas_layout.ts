import fs from 'fs';
import path from 'path';

const file = path.resolve('src/pages/operaciones/Reservas.tsx');
let content = fs.readFileSync(file, 'utf8');

const startB2 = content.indexOf('{/* Bloque 2: Ruta y Horario */}');
const startB4 = content.indexOf('{/* Bloque 4: Finanzas y Cobranza */}');

if (startB2 === -1 || startB4 === -1) {
  console.error("Markers not found");
  process.exit(1);
}

const before = content.slice(0, startB2);
const after = content.slice(startB4);

const newBlocks = `                {/* Bloque 2 & 3: Pasajeros + Ruta (Left) and Horario + Logistica (Right) */}
                <div className="p-6 grid md:grid-cols-2 gap-8 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                   {/* Left Side: Pasajeros y Ruta */}
                   <div className="space-y-6">
                      <div className="flex items-center justify-between">
                         <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-2">
                           <Users className="h-4 w-4 text-blue-500" /><MapPin className="h-4 w-4 text-emerald-500 -ml-1" /> DETALLES DEL PASAJERO (PAX) Y RUTA
                         </h3>
                         <button type="button" onClick={() => setMostrarCrearRuta(true)} className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                           + Nueva Ruta Maestra
                         </button>
                      </div>

                      <div className="space-y-3">
                         <div className="flex justify-between items-center mb-2 px-1">
                           <span className="text-[10px] font-bold text-slate-500">Pasajeros Adicionales con Rutas</span>
                           <button 
                             type="button" 
                             onClick={() => setFormReserva({...formReserva, pasajerosList: [...formReserva.pasajerosList, {nombre: '', telefono: '', origen: '', destino: ''}]})}
                             className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded"
                           >
                             + Agregar Pasajero
                           </button>
                         </div>
                         
                         <div className="grid grid-cols-2 gap-3">
                            <input 
                               type="text" required placeholder="Nombre de quien viaja"
                               className="w-full px-3 py-2 border rounded-lg dark:border-slate-800 text-sm bg-white dark:bg-slate-800/50 dark:text-slate-100"
                               value={formReserva.pasajeros.nombre}
                               onChange={(e) => setFormReserva({...formReserva, pasajeros: {...formReserva.pasajeros, nombre: e.target.value}})}
                            />
                            <input 
                               type="text" placeholder="Teléfono"
                               className="w-full px-3 py-2 border rounded-lg dark:border-slate-800 text-sm bg-white dark:bg-slate-800/50 dark:text-slate-100"
                               value={formReserva.pasajeros.telefono}
                               onChange={(e) => setFormReserva({...formReserva, pasajeros: {...formReserva.pasajeros, telefono: e.target.value}})}
                            />
                         </div>
                         
                         <div className="grid grid-cols-2 gap-3">
                            <input 
                               type="text" required placeholder="Origen (ej: Hotel / Oficina)"
                               list="lugares-list"
                               className="w-full px-3 py-2 border rounded-lg dark:border-slate-800 text-sm bg-white dark:bg-slate-800/50 dark:text-slate-100"
                               value={formReserva.lugares.origen}
                               onChange={(e) => setFormReserva({...formReserva, lugares: {...formReserva.lugares, origen: e.target.value}})}
                            />
                            <input 
                               type="text" required placeholder="Destino Final"
                               list="lugares-list"
                               className="w-full px-3 py-2 border rounded-lg dark:border-slate-800 text-sm bg-white dark:bg-slate-800/50 dark:text-slate-100"
                               value={formReserva.lugares.destino}
                               onChange={(e) => setFormReserva({...formReserva, lugares: {...formReserva.lugares, destino: e.target.value}})}
                            />
                         </div>

                         <div className="grid grid-cols-2 gap-3">
                            <input 
                               type="text" placeholder="N° Vuelo (Tracking)"
                               className="w-full px-3 py-2 border rounded-lg dark:border-slate-800 text-sm bg-white dark:bg-slate-800/50 dark:text-slate-100"
                               value={formReserva.lugares.numeroVuelo}
                               onChange={(e) => setFormReserva({...formReserva, lugares: {...formReserva.lugares, numeroVuelo: e.target.value}})}
                            />
                            <div className="flex flex-col relative">
                               <span className="absolute -top-3 left-1 text-[10px] text-slate-500 font-bold bg-slate-50 dark:bg-slate-900/50 px-1">Numero de pasajeros</span>
                               <input 
                                  type="number" required min="1"
                                  className="w-full px-3 py-2 border rounded-lg dark:border-slate-800 text-sm bg-slate-100 dark:bg-slate-800 text-center dark:text-slate-100 font-bold"
                                  value={formReserva.pasajeros.cantidad}
                                  onChange={(e) => setFormReserva({...formReserva, pasajeros: {...formReserva.pasajeros, cantidad: parseInt(e.target.value)}})}
                               />
                            </div>
                         </div>
                         
                         <div className="flex gap-2 relative items-center">
                            <div className="flex-1 relative">
                               <input 
                                  type="url" placeholder="Enlace Google Maps (Opc)"
                                  className="w-full pl-8 pr-2 py-2 border rounded-lg dark:border-slate-800 text-sm bg-white dark:bg-slate-800/50 dark:text-slate-100"
                                  value={(formReserva as any).enlaceMapa || ''}
                                  onChange={(e) => setFormReserva({...formReserva, enlaceMapa: e.target.value as any})}
                               />
                               <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-emerald-500" />
                            </div>
                            
                            {formReserva.lugares.origen && formReserva.lugares.destino && !(formReserva as any).enlaceMapa && (
                               <button
                                  type="button"
                                  title="Generar link de Maps"
                                  onClick={() => {
                                     const url = \`https://www.google.com/maps/dir/?api=1&origin=\${encodeURIComponent(formReserva.lugares.origen)}&destination=\${encodeURIComponent(formReserva.lugares.destino)}\`;
                                     setFormReserva({...formReserva, enlaceMapa: url as any});
                                  }}
                                  className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 font-bold text-xs px-3 py-2 rounded md:rounded-lg hover:bg-emerald-200"
                               >
                                   Generar
                               </button>
                            )}
                            {(formReserva as any).enlaceMapa && (
                               <a 
                                  href={(formReserva as any).enlaceMapa} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 font-bold text-xs px-4 py-2 rounded-lg hover:bg-blue-200 flex items-center justify-center whitespace-nowrap shadow-sm"
                               >
                                   Abrir Ruta
                               </a>
                            )}
                         </div>

                         {formReserva.pasajerosList.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                               {formReserva.pasajerosList.map((p, idx) => (
                                 <div key={idx} className="bg-white dark:bg-slate-900/30 p-2 rounded border border-slate-100 dark:border-slate-800 mb-2 relative">
                                   <button type="button" onClick={() => {
                                     const list = [...formReserva.pasajerosList];
                                     list.splice(idx, 1);
                                     setFormReserva({...formReserva, pasajerosList: list});
                                   }} className="absolute top-1 right-1 text-red-500 hover:text-red-700">
                                     <XCircle className="h-4 w-4" />
                                   </button>
                                   <div className="grid grid-cols-2 gap-2 mb-2 pr-6">
                                     <input type="text" placeholder="Nombre" className="w-full px-2 py-1 text-xs border rounded-md dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={p.nombre} onChange={e => { const l = [...formReserva.pasajerosList]; l[idx].nombre = e.target.value; setFormReserva({...formReserva, pasajerosList: l}); }} />
                                     <input type="text" placeholder="Teléfono" className="w-full px-2 py-1 text-xs border rounded-md dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={p.telefono} onChange={e => { const l = [...formReserva.pasajerosList]; l[idx].telefono = e.target.value; setFormReserva({...formReserva, pasajerosList: l}); }} />
                                   </div>
                                   <div className="grid grid-cols-2 gap-2">
                                     <input type="text" placeholder="Origen" className="w-full px-2 py-1 text-xs border rounded-md dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={p.origen} onChange={e => { const l = [...formReserva.pasajerosList]; l[idx].origen = e.target.value; setFormReserva({...formReserva, pasajerosList: l}); }} />
                                     <input type="text" placeholder="Destino" className="w-full px-2 py-1 text-xs border rounded-md dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={p.destino} onChange={e => { const l = [...formReserva.pasajerosList]; l[idx].destino = e.target.value; setFormReserva({...formReserva, pasajerosList: l}); }} />
                                   </div>
                                 </div>
                               ))}
                            </div>
                         )}

                         <datalist id="lugares-list">
                           {lugaresComunes.map((l, idx) => <option key={idx} value={l} />)}
                         </datalist>
                      </div>
                   </div>

                   {/* Right Side: Día/Hora + Logistica */}
                   <div className="space-y-6">
                      <div className="space-y-4">
                         <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-2">
                           <CalendarIcon className="h-4 w-4 text-fuchsia-500" /> DÍA Y HORA DE RESERVA
                         </h3>
                         <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-1">
                               <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase">Fecha</span>
                               <input 
                                  type="date" required
                                  className="w-full px-2 py-2 border rounded-lg dark:border-slate-800 text-sm bg-white dark:bg-slate-800/50 dark:text-slate-100 font-medium"
                                  value={formReserva.fecha}
                                  onChange={(e) => setFormReserva({...formReserva, fecha: e.target.value})}
                               />
                            </div>
                            <div className="col-span-2">
                               <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase">Hora Inicio</span>
                               <input 
                                  type="time" required
                                  className="w-full px-2 py-2 border rounded-lg dark:border-slate-800 text-sm bg-white dark:bg-slate-800/50 dark:text-slate-100 font-medium"
                                  value={formReserva.horaInicio}
                                  onChange={(e) => setFormReserva({...formReserva, horaInicio: e.target.value})}
                               />
                            </div>
                         </div>
                         <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-1">
                               <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase">Vehículo</span>
                               <select 
                                  required className="w-full px-2 py-2 border rounded-lg dark:border-slate-800 text-sm bg-white dark:bg-slate-800/50 dark:text-slate-100 font-medium"
                                  value={formReserva.tipoVehiculo}
                                  onChange={(e) => setFormReserva({...formReserva, tipoVehiculo: e.target.value as any})}
                               >
                                  <option value="SUV">SUV</option>
                                  <option value="Van">Van</option>
                                  <option value="Mini Bus">Mini Bus</option>
                                  <option value="Bus">Bus</option>
                                  <option value="Sedán">Sedán</option>
                                  <option value="Otros">Otros</option>
                               </select>
                            </div>
                            <div className="col-span-2">
                               <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase">Asignar Chofer</span>
                               <select 
                                  className="w-full px-2 py-2 border rounded-lg dark:border-slate-800 text-sm bg-white dark:bg-slate-800/50 dark:text-slate-100 font-medium"
                                  value={formReserva.conductorId}
                                  onChange={(e) => setFormReserva({...formReserva, conductorId: e.target.value})}
                               >
                                  <option value="">Seleccione Conductor (Opcional)</option>
                                  {conductores.map(c => (
                                    <option key={c.id} value={c.id}>{c.nombre} ({c.estado})</option>
                                  ))}
                               </select>
                            </div>
                         </div>
                      </div>

                      <div className="space-y-4">
                         <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-2">
                           <Luggage className="h-4 w-4 text-orange-500" /> LOGÍSTICA DE CARGA
                         </h3>
                         <div className="grid grid-cols-3 gap-3">
                            <div className="flex flex-col gap-1">
                               <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase text-center">Maletas G (23K)</span>
                               <input 
                                  type="number" required min="0"
                                  className="w-full px-3 py-2 border rounded-lg dark:border-slate-800 text-sm text-center bg-white dark:bg-slate-800/50 dark:text-slate-100 font-bold"
                                  value={formReserva.logistica.maletasGrandes}
                                  onChange={(e) => setFormReserva({...formReserva, logistica: {...formReserva.logistica, maletasGrandes: parseInt(e.target.value)}})}
                               />
                            </div>
                            <div className="flex flex-col gap-1">
                               <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase text-center">Maletas Cabina</span>
                               <input 
                                  type="number" required min="0"
                                  className="w-full px-3 py-2 border rounded-lg dark:border-slate-800 text-sm text-center bg-white dark:bg-slate-800/50 dark:text-slate-100 font-bold"
                                  value={formReserva.logistica.maletasChicas}
                                  onChange={(e) => setFormReserva({...formReserva, logistica: {...formReserva.logistica, maletasChicas: parseInt(e.target.value)}})}
                               />
                            </div>
                            <div className="flex flex-col gap-1 pl-1">
                               <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase text-center mb-1">Silla Bebé / Alzador</span>
                               <div className="flex justify-between items-center px-1 mb-1 bg-white dark:bg-slate-900/50 rounded">
                                 <span className="text-[10px] text-slate-500 font-bold">Sillas:</span>
                                 <input 
                                   type="number" min="0" className="w-10 px-1 py-0.5 border rounded dark:border-slate-800 text-xs text-center dark:bg-slate-800/50 dark:text-slate-100"
                                   value={formReserva.logistica.cantidadSillas || ''}
                                   onChange={(e) => setFormReserva({...formReserva, logistica: {...formReserva.logistica, cantidadSillas: parseInt(e.target.value) || 0, sillaBebe: parseInt(e.target.value) > 0}})}
                                 />
                               </div>
                               <div className="flex justify-between items-center px-1 bg-white dark:bg-slate-900/50 rounded">
                                 <span className="text-[10px] text-slate-500 font-bold">Alzas:</span>
                                 <input 
                                   type="number" min="0" className="w-10 px-1 py-0.5 border rounded dark:border-slate-800 text-xs text-center dark:bg-slate-800/50 dark:text-slate-100"
                                   value={(formReserva.logistica as any).cantidadAlzadores || ''}
                                   onChange={(e) => setFormReserva({...formReserva, logistica: {...formReserva.logistica, cantidadAlzadores: parseInt(e.target.value) || 0, alzador: parseInt(e.target.value) > 0}})}
                                 />
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
`;

content = before + newBlocks + "\n" + after;
fs.writeFileSync(file, content);
console.log("Updated correctly.");
