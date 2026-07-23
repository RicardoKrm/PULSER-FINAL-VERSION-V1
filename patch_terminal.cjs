const fs = require('fs');

let content = fs.readFileSync('src/pages/logistica/GestionSuministros.tsx', 'utf-8');

// 1. Update states
content = content.replace(
  `  const [terminalForm, setTerminalForm] = useState({
    repuestoId: '',
    sku: '',
    nombre: '',
    bodegaId: '',
    tipoMovimiento: 'SALIDA',
    cantidad: 1,
    solicitante: '',
    autorizador: '',
    destino: ''
  });`,
  `  const [terminalForm, setTerminalForm] = useState({
    repuestoId: '',
    sku: '',
    nombre: '',
    bodegaId: '',
    tipoMovimiento: 'SALIDA',
    cantidad: 1,
    solicitante: '',
    autorizador: '',
    destino: '',
    ubicacion: '' // Added for new repuestos
  });
  const [terminalItems, setTerminalItems] = useState<any[]>([]);`
);

// 2. Add handleAddTerminalItem and replace handleTerminalSubmit
const oldSubmitStart = `  const handleTerminalSubmit = async () => {`;
const newSubmitText = `  const handleAddTerminalItem = () => {
    if (!terminalForm.sku && !terminalForm.nombre) {
       Swal.fire("Error", "Debe ingresar un SKU o Nombre", "error");
       return;
    }
    if (terminalForm.cantidad <= 0) {
       Swal.fire("Error", "La cantidad debe ser mayor a 0", "error");
       return;
    }
    
    setTerminalItems(prev => [...prev, {
       id: Date.now().toString(),
       repuestoId: terminalForm.repuestoId,
       sku: terminalForm.sku,
       nombre: terminalForm.nombre,
       bodegaId: terminalForm.bodegaId,
       cantidad: terminalForm.cantidad,
       ubicacion: terminalForm.ubicacion
    }]);
    
    // Reset item inputs but keep common data
    setTerminalForm(prev => ({
       ...prev,
       repuestoId: '',
       sku: '',
       nombre: '',
       cantidad: 1,
       ubicacion: ''
    }));
  };

  const handleTerminalSubmit = async () => {
    if (!currentCompany?.id) return;
    if (terminalItems.length === 0) {
      Swal.fire("Error", "La lista de artículos está vacía", "error");
      return;
    }

    try {
      const { data: reps } = await supabase.from('logistica_repuestos')
         .select('*, logistica_bodegas(nombre)')
         .eq('empresa_id', currentCompany.id);

      let hasErrors = false;

      for (const item of terminalItems) {
         let rep = null;
         let isNewProduct = false;

         if (reps && reps.length > 0) {
            let found = [];
            if (item.repuestoId) {
                found = reps.filter((r: any) => r.id === item.repuestoId);
            } else {
                found = reps.filter((r: any) => r.sku === item.sku);
            }

            if (found.length > 0) {
                if (terminalForm.tipoMovimiento === 'ENTRADA') {
                    rep = found.find((r: any) => r.bodega_id === item.bodegaId) || found[0];
                } else {
                    rep = found.find((r: any) => r.bodega_id === item.bodegaId);
                    if (!rep) {
                        rep = found.find((r: any) => r.stock >= item.cantidad) || found[0];
                    }
                }
            }
         }

         if (!rep) {
            if (terminalForm.tipoMovimiento === 'ENTRADA') {
               if (!item.bodegaId) {
                  hasErrors = true;
                  continue;
               }
               isNewProduct = true;
            } else {
               hasErrors = true;
               continue;
            }
         }

         if (isNewProduct) {
             const { data: newRep, error: createErr } = await supabase.from('logistica_repuestos').insert({
                 empresa_id: currentCompany.id,
                 sku: item.sku || \`SKU-\${Date.now()}\`,
                 nombre: item.nombre || \`Repuesto \${item.sku}\`,
                 bodega_id: item.bodegaId || null,
                 stock: item.cantidad,
                 precio: 0,
                 valor_total: 0,
                 calidad: 'ORIGINAL',
                 estado: 'ACTIVO',
                 ubicacion: item.ubicacion || 'Sin Ubicación',
                 ult_mov: new Date().toISOString()
             }).select().single();

             if (createErr || !newRep) {
                 hasErrors = true;
                 continue;
             }

             await supabase.from('logistica_movimientos').insert({
                 empresa_id: currentCompany.id,
                 repuesto_id: newRep.id,
                 tipo: 'ENTRADA',
                 cantidad: item.cantidad,
                 notas: \`Ingreso Masivo - Solicitante: \${terminalForm.solicitante}, Autorizador: \${terminalForm.autorizador}, Destino: \${terminalForm.destino}\`,
                 estado: 'COMPLETADO'
             });
             continue;
         }

         if (terminalForm.tipoMovimiento === 'SALIDA') {
            if (rep && rep.stock < item.cantidad) {
               hasErrors = true;
               continue;
            }
         }

         if (rep) {
            const newStock = terminalForm.tipoMovimiento === 'ENTRADA' ? rep.stock + item.cantidad : rep.stock - item.cantidad;
            const updatePayload: any = { 
               stock: newStock,
               ult_mov: new Date().toISOString()
            };
            // Only update ubicacion if it was explicitly provided during ENTRADA
            if (terminalForm.tipoMovimiento === 'ENTRADA' && item.ubicacion) {
               updatePayload.ubicacion = item.ubicacion;
            }
            
            await supabase.from('logistica_repuestos').update(updatePayload).eq('id', rep.id);
            
            await supabase.from('logistica_movimientos').insert({
               empresa_id: currentCompany.id,
               repuesto_id: rep.id,
               tipo: terminalForm.tipoMovimiento,
               cantidad: item.cantidad,
               notas: \`Solicitante: \${terminalForm.solicitante}, Autorizador: \${terminalForm.autorizador}, Destino: \${terminalForm.destino}\`,
               estado: 'COMPLETADO'
            });
         }
      }

      if (hasErrors) {
         Swal.fire("Aviso", "Se procesaron algunos movimientos, pero otros fallaron por falta de stock, errores o falta de bodega destino.", "warning");
      } else {
         Swal.fire("Éxito", "Movimientos procesados correctamente.", "success");
      }

      await loadData();
      setIsTerminalModalOpen(false);
      setTerminalItems([]);
      setTerminalForm({
        repuestoId: '', sku: '', nombre: '', bodegaId: '', tipoMovimiento: 'SALIDA', 
        cantidad: 1, solicitante: '', autorizador: '', destino: '', ubicacion: ''
      });

    } catch (e) {
      console.error(e);
      Swal.fire("Error", "Error al procesar", "error");
    }
  };`;

// Replace handleTerminalSubmit function (from `const handleTerminalSubmit...` up to `const [activeView...`)
const handleStart = content.indexOf('  const handleTerminalSubmit = async () => {');
const activeViewStart = content.indexOf("  const [activeView, setActiveView] = useState");

if (handleStart > -1 && activeViewStart > -1) {
  content = content.substring(0, handleStart) + newSubmitText + '\n\n' + content.substring(activeViewStart);
}

// 3. Fix the Terminal Modal content
const modalStartString = `<Modal
        isOpen={isTerminalModalOpen}
        onClose={() => setIsTerminalModalOpen(false)}
        title="Entrada / Salida (Control Móvil)"
      >`;

const modalEndString = `      </Modal>

      {/* Edit Repuesto Modal */}`;

const modalStartIndex = content.indexOf(modalStartString);
const modalEndIndex = content.indexOf(modalEndString, modalStartIndex);

if (modalStartIndex > -1 && modalEndIndex > -1) {
  const newModalContent = `<Modal
        isOpen={isTerminalModalOpen}
        onClose={() => {
           setIsTerminalModalOpen(false);
           setTerminalItems([]);
        }}
        title="Entrada / Salida Masiva"
      >
        <div className="space-y-4 pt-4 max-w-4xl max-h-[80vh] overflow-y-auto pr-2">
          
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-4">
             <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">1. Datos Generales del Movimiento</h4>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">TIPO DE MOVIMIENTO</label>
                  <select 
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                    value={terminalForm.tipoMovimiento}
                    onChange={(e) => setTerminalForm({...terminalForm, tipoMovimiento: e.target.value})}
                  >
                    <option value="ENTRADA">Entrada (Ingreso de Stock)</option>
                    <option value="SALIDA">Salida (Consumo / Descuento)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">SOLICITANTE</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                    value={terminalForm.solicitante}
                    onChange={(e) => setTerminalForm({...terminalForm, solicitante: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">AUTORIZADOR</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                    value={terminalForm.autorizador}
                    onChange={(e) => setTerminalForm({...terminalForm, autorizador: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">DESTINO / USO</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                    value={terminalForm.destino}
                    onChange={(e) => setTerminalForm({...terminalForm, destino: e.target.value})}
                  />
                </div>
             </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-lg border border-amber-200 dark:border-amber-800/30 space-y-4">
             <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-500">2. Añadir Artículos</h4>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="relative md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">SKU / NOMBRE</label>
                  <input 
                    type="text" 
                    placeholder="Escanee o escriba..."
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                    value={terminalForm.sku}
                    onChange={(e) => {
                      setTerminalForm({...terminalForm, sku: e.target.value, repuestoId: ''});
                      setShowTerminalAutocomplete(true);
                    }}
                    onFocus={() => setShowTerminalAutocomplete(true)}
                  />
                  {showTerminalAutocomplete && terminalForm.sku.length > 1 && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {sumInsumosData.filter(i => 
                        i.sku?.toLowerCase().includes(terminalForm.sku.toLowerCase()) || 
                        i.nombre?.toLowerCase().includes(terminalForm.sku.toLowerCase())
                      ).slice(0, 50).map(item => (
                        <div 
                          key={item.id} 
                          className="px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                          onClick={() => {
                            setTerminalForm({
                               ...terminalForm, 
                               repuestoId: item.id || '',
                               sku: item.sku || '', 
                               nombre: item.nombre || '', 
                               bodegaId: item.bodega_id || terminalForm.bodegaId,
                               ubicacion: item.ubicacion || ''
                            });
                            setShowTerminalAutocomplete(false);
                          }}
                        >
                          <div className="font-semibold text-slate-900 dark:text-white">{item.sku} <span className="font-normal text-slate-500">- {item.nombre}</span></div>
                          <div className="text-xs text-slate-500 mt-0.5">Stock: {item.stock} | Bodega: {item.bodegaNombre} | Ubicación: {item.ubicacion || 'N/A'}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">NOMBRE (SI ES NUEVO)</label>
                  <input 
                    type="text"
                    placeholder="Opcional..."
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                    value={terminalForm.nombre}
                    onChange={(e) => setTerminalForm({...terminalForm, nombre: e.target.value})}
                    disabled={!!terminalForm.repuestoId}
                  />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CANTIDAD</label>
                  <input 
                    type="number"
                    min="1"
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                    value={terminalForm.cantidad}
                    onChange={(e) => setTerminalForm({...terminalForm, cantidad: parseInt(e.target.value) || 1})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">BODEGA</label>
                  <select 
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                    value={terminalForm.bodegaId}
                    onChange={(e) => setTerminalForm({...terminalForm, bodegaId: e.target.value})}
                  >
                    <option value="">Auto-detectar...</option>
                    {bodegasList.map((b) => (
                      <option key={b.id} value={b.id}>{b.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">UBICACIÓN (Rack/Pasillo)</label>
                  <input 
                    type="text"
                    placeholder="Opcional..."
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                    value={terminalForm.ubicacion}
                    onChange={(e) => setTerminalForm({...terminalForm, ubicacion: e.target.value})}
                  />
                </div>
                <div>
                  <Button 
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white"
                    onClick={handleAddTerminalItem}
                  >
                    + Añadir a Lista
                  </Button>
                </div>
             </div>
          </div>

          {terminalItems.length > 0 && (
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
               <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 flex justify-between items-center">
                  <h4 className="font-semibold text-sm">Lista de Artículos a Procesar ({terminalItems.length})</h4>
                  <button onClick={() => setTerminalItems([])} className="text-xs text-red-500 hover:text-red-700 font-medium">Limpiar Lista</button>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                   <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500">
                     <tr>
                       <th className="px-4 py-2">SKU</th>
                       <th className="px-4 py-2">Nombre</th>
                       <th className="px-4 py-2">Cant</th>
                       <th className="px-4 py-2">Bodega</th>
                       <th className="px-4 py-2">Ubicación</th>
                       <th className="px-4 py-2 text-right">Acción</th>
                     </tr>
                   </thead>
                   <tbody>
                     {terminalItems.map(item => (
                        <tr key={item.id} className="border-t border-slate-200 dark:border-slate-700">
                           <td className="px-4 py-2 font-medium">{item.sku}</td>
                           <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{item.nombre || '-'}</td>
                           <td className="px-4 py-2 font-bold">{item.cantidad}</td>
                           <td className="px-4 py-2 text-slate-600 dark:text-slate-300">
                             {bodegasList.find(b => b.id === item.bodegaId)?.nombre || 'Auto'}
                           </td>
                           <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{item.ubicacion || '-'}</td>
                           <td className="px-4 py-2 text-right">
                              <button 
                                onClick={() => setTerminalItems(prev => prev.filter(i => i.id !== item.id))}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                 Eliminar
                              </button>
                           </td>
                        </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" onClick={() => {
                setIsTerminalModalOpen(false);
                setTerminalItems([]);
            }}>Cancelar</Button>
            <Button 
              className="bg-amber-500 hover:bg-amber-600 text-white px-8"
              onClick={handleTerminalSubmit}
              disabled={terminalItems.length === 0}
            >
              Procesar Movimientos ({terminalItems.length})
            </Button>
          </div>
        </div>`;

  content = content.substring(0, modalStartIndex) + newModalContent + '\n' + content.substring(modalEndIndex);
}

// 4. Update the Edit modal to include ubicacion
const editModalStartStr = `<label className="block text-xs font-bold text-slate-500 uppercase mb-1">Stock Actual</label>`;
const editModalReplacementStr = `<label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ubicación (Rack/Pasillo)</label>
                <input 
                  type="text" 
                  value={editRepuestoObj?.ubicacion || ''}
                  onChange={e => setEditRepuestoObj(prev => prev ? {...prev, ubicacion: e.target.value} : prev)}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 bg-transparent text-sm dark:bg-slate-800"
                />
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Stock Actual</label>`;

content = content.replace(editModalStartStr, editModalReplacementStr);

// 5. Also update the supabase call in edit modal
const supabaseUpdateStr = `const { error } = await supabase.from('logistica_repuestos').update({
                       nombre: editRepuestoObj.nombre,
                       sku: editRepuestoObj.sku,
                       precio: editRepuestoObj.precio,
                       min_stock: editRepuestoObj.min,
                       stock: editRepuestoObj.stock
                    }).eq('id', editRepuestoObj.id);`;

const newSupabaseUpdateStr = `const { error } = await supabase.from('logistica_repuestos').update({
                       nombre: editRepuestoObj.nombre,
                       sku: editRepuestoObj.sku,
                       precio: editRepuestoObj.precio,
                       min_stock: editRepuestoObj.min,
                       stock: editRepuestoObj.stock,
                       ubicacion: editRepuestoObj.ubicacion
                    }).eq('id', editRepuestoObj.id);`;

content = content.replace(supabaseUpdateStr, newSupabaseUpdateStr);

fs.writeFileSync('src/pages/logistica/GestionSuministros.tsx', content);

console.log("Patch successfully applied");
