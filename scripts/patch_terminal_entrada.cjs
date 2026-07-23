const fs = require('fs');

let content = fs.readFileSync('src/pages/logistica/GestionSuministros.tsx', 'utf-8');

// 1. Update states
content = content.replace(
  `    ubicacion: '' // Added for new repuestos
  });`,
  `    ubicacion: '', // Added for new repuestos
    proveedorId: '',
    precioUnitario: 0
  });`
);

// 2. Add handleAddTerminalItem and replace it
const handleAddTarget = `  const handleAddTerminalItem = () => {
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
  };`;

const handleAddReplacement = `  const handleAddTerminalItem = () => {
    if (!terminalForm.sku && !terminalForm.nombre) {
       Swal.fire("Error", "Debe ingresar un SKU o Nombre", "error");
       return;
    }
    if (terminalForm.cantidad <= 0) {
       Swal.fire("Error", "La cantidad debe ser mayor a 0", "error");
       return;
    }
    if (terminalForm.tipoMovimiento === 'ENTRADA') {
       if (!terminalForm.proveedorId) {
          Swal.fire("Error", "Debe seleccionar un proveedor para la entrada", "error");
          return;
       }
       if (terminalForm.precioUnitario <= 0) {
          Swal.fire("Error", "El valor unitario debe ser mayor a 0", "error");
          return;
       }
    }
    
    setTerminalItems(prev => [...prev, {
       id: Date.now().toString(),
       repuestoId: terminalForm.repuestoId,
       sku: terminalForm.sku,
       nombre: terminalForm.nombre,
       bodegaId: terminalForm.bodegaId,
       cantidad: terminalForm.cantidad,
       ubicacion: terminalForm.ubicacion,
       proveedorId: terminalForm.proveedorId,
       precioUnitario: terminalForm.precioUnitario
    }]);
    
    // Reset item inputs but keep common data
    setTerminalForm(prev => ({
       ...prev,
       repuestoId: '',
       sku: '',
       nombre: '',
       cantidad: 1,
       ubicacion: '',
       proveedorId: '',
       precioUnitario: 0
    }));
  };`;

content = content.replace(handleAddTarget, handleAddReplacement);

// 3. In handleTerminalSubmit, update price and provider for new products
// and possibly for existing products too?
// "cuando ingreso por entradas recuerda que debe tambien preguntarme el proveedor y el valor ( cuando es entrada solamente)"
// So if it's a new product:
const newProductTarget = `             const { data: newRep, error: createErr } = await supabase.from('logistica_repuestos').insert({
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
             }).select().single();`;

const newProductReplacement = `             const provName = proveedores.find(p => p.id === item.proveedorId)?.nombre || item.proveedorId || '';
             const { data: newRep, error: createErr } = await supabase.from('logistica_repuestos').insert({
                 empresa_id: currentCompany.id,
                 sku: item.sku || \`SKU-\${Date.now()}\`,
                 nombre: item.nombre || \`Repuesto \${item.sku}\`,
                 bodega_id: item.bodegaId || null,
                 stock: item.cantidad,
                 precio: item.precioUnitario || 0,
                 valor_total: (item.precioUnitario || 0) * item.cantidad,
                 calidad: 'ORIGINAL',
                 estado: 'ACTIVO',
                 proveedor: provName,
                 ubicacion: item.ubicacion || 'Sin Ubicación',
                 ult_mov: new Date().toISOString()
             }).select().single();`;

content = content.replace(newProductTarget, newProductReplacement);

// For existing product, if it's ENTRADA, update stock AND perhaps update average price or at least update the last price and provider?
// "cuando ingreso por entradas recuerda que debe tambien preguntarme el proveedor y el valor ( cuando es entrada solamente)"
const existingProductTarget = `            // Only update ubicacion if it was explicitly provided during ENTRADA
            if (terminalForm.tipoMovimiento === 'ENTRADA' && item.ubicacion) {
               updatePayload.ubicacion = item.ubicacion;
            }`;

const existingProductReplacement = `            // Only update ubicacion if it was explicitly provided during ENTRADA
            if (terminalForm.tipoMovimiento === 'ENTRADA') {
               if (item.ubicacion) updatePayload.ubicacion = item.ubicacion;
               const provName = proveedores.find(p => p.id === item.proveedorId)?.nombre || item.proveedorId || '';
               if (provName) updatePayload.proveedor = provName;
               if (item.precioUnitario > 0) updatePayload.precio = item.precioUnitario;
            }`;

content = content.replace(existingProductTarget, existingProductReplacement);


// In the UI, add inputs for proveedor and valor unitario when ENTRADA
// Let's find the grid for items and inject the fields
const gridItemsTarget = `                <div>
                  <Button 
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white"
                    onClick={handleAddTerminalItem}
                  >
                    + Añadir a Lista
                  </Button>
                </div>
             </div>`;

const gridItemsReplacement = `                {terminalForm.tipoMovimiento === 'ENTRADA' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase mb-1">PROVEEDOR</label>
                      <select 
                        className="w-full border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                        value={terminalForm.proveedorId}
                        onChange={(e) => setTerminalForm({...terminalForm, proveedorId: e.target.value})}
                      >
                        <option value="">Seleccione...</option>
                        {proveedores.map(p => (
                          <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase mb-1">VALOR UNIT.</label>
                      <input 
                        type="number"
                        min="0"
                        className="w-full border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                        value={terminalForm.precioUnitario || ''}
                        onChange={(e) => setTerminalForm({...terminalForm, precioUnitario: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                  </>
                )}
                <div className={terminalForm.tipoMovimiento === 'ENTRADA' ? "md:col-span-2" : ""}>
                  <Button 
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white"
                    onClick={handleAddTerminalItem}
                  >
                    + Añadir a Lista
                  </Button>
                </div>
             </div>`;

content = content.replace(gridItemsTarget, gridItemsReplacement);

// Also need to adjust the grid cols dynamically or simply make it wrap
// The current grid is: <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mt-4">
// Since we added 2 inputs, it might be 6 columns or we should change it to md:grid-cols-6 if ENTRADA
const gridTargetStart = `<div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mt-4">`;
const gridReplacementStart = `<div className={\`grid grid-cols-1 \${terminalForm.tipoMovimiento === 'ENTRADA' ? 'md:grid-cols-6' : 'md:grid-cols-4'} gap-4 items-end mt-4\`}>`;

content = content.replace(gridTargetStart, gridReplacementStart);

// Resetting the fields after submit:
const resetTarget = `      setTerminalForm({
        repuestoId: '', sku: '', nombre: '', bodegaId: '', tipoMovimiento: 'SALIDA', 
        cantidad: 1, solicitante: '', autorizador: '', destino: '', ubicacion: ''
      });`;

const resetReplacement = `      setTerminalForm({
        repuestoId: '', sku: '', nombre: '', bodegaId: '', tipoMovimiento: 'SALIDA', 
        cantidad: 1, solicitante: '', autorizador: '', destino: '', ubicacion: '', proveedorId: '', precioUnitario: 0
      });`;

content = content.replace(resetTarget, resetReplacement);

fs.writeFileSync('src/pages/logistica/GestionSuministros.tsx', content);

console.log("Patch successfully applied");
