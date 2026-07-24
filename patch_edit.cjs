const fs = require('fs');
let content = fs.readFileSync('src/pages/logistica/GestionSuministros.tsx', 'utf-8');

const targetEditModalStr = `             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ubicación (Rack/Pasillo)</label>`;

const replacementEditModalStr = `             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bodega</label>
                <select 
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                  value={editRepuestoObj?.bodega_id || ''}
                  onChange={e => setEditRepuestoObj(prev => prev ? {...prev, bodega_id: e.target.value} : prev)}
                >
                  <option value="">Seleccione bodega...</option>
                  {bodegasList.map(b => (
                    <option key={b.id} value={b.id}>{b.nombre}</option>
                  ))}
                </select>
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ubicación (Rack/Pasillo)</label>`;

content = content.replace(targetEditModalStr, replacementEditModalStr);

const updateQueryTargetStr = `                    const { error } = await supabase.from('logistica_repuestos').update({
                       nombre: editRepuestoObj.nombre,
                       sku: editRepuestoObj.sku,
                       precio: editRepuestoObj.precio,
                       min_stock: editRepuestoObj.min,
                       stock: editRepuestoObj.stock,
                       ubicacion: editRepuestoObj.ubicacion,
                       valor_total: editRepuestoObj.stock * (editRepuestoObj.precio || 0)
                    }).eq('id', editRepuestoObj.id);`;

const updateQueryRepStr = `                    const { error } = await supabase.from('logistica_repuestos').update({
                       nombre: editRepuestoObj.nombre,
                       sku: editRepuestoObj.sku,
                       precio: editRepuestoObj.precio,
                       min_stock: editRepuestoObj.min,
                       stock: editRepuestoObj.stock,
                       ubicacion: editRepuestoObj.ubicacion,
                       bodega_id: editRepuestoObj.bodega_id,
                       valor_total: editRepuestoObj.stock * (editRepuestoObj.precio || 0)
                    }).eq('id', editRepuestoObj.id);`;

content = content.replace(updateQueryTargetStr, updateQueryRepStr);

fs.writeFileSync('src/pages/logistica/GestionSuministros.tsx', content);
console.log("Patched Edit Modal");
