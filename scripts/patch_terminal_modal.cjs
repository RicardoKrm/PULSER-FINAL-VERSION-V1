const fs = require('fs');

let content = fs.readFileSync('src/pages/logistica/GestionSuministros.tsx', 'utf-8');

// 1. Update states
content = content.replace(
  `const [terminalForm, setTerminalForm] = useState({
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
  `const [terminalForm, setTerminalForm] = useState({
    repuestoId: '',
    sku: '',
    nombre: '',
    bodegaId: '',
    tipoMovimiento: 'SALIDA',
    cantidad: 1,
    solicitante: '',
    autorizador: '',
    destino: ''
  });
  const [terminalItems, setTerminalItems] = useState<any[]>([]);`
);

// 2. Add handleAddTerminalItem
const handleAddTerminalItemStr = `
  const handleAddTerminalItem = () => {
    if (!terminalForm.sku) {
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
       cantidad: terminalForm.cantidad
    }]);
    
    // Reset inputs but keep common data
    setTerminalForm(prev => ({
       ...prev,
       repuestoId: '',
       sku: '',
       nombre: '',
       cantidad: 1
    }));
  };
`;

// Insert handleAddTerminalItem before handleTerminalSubmit
content = content.replace(
  `  const handleTerminalSubmit = async () => {`,
  handleAddTerminalItemStr + `\n  const handleTerminalSubmit = async () => {`
);

// 3. Rewrite handleTerminalSubmit to iterate over terminalItems
const handleTerminalSubmitNew = `  const handleTerminalSubmit = async () => {
    if (!currentCompany?.id) return;
    if (terminalItems.length === 0) {
      Swal.fire("Error", "La lista de artículos está vacía", "error");
      return;
    }

    try {
      // Find all SKUs
      const { data: reps } = await supabase.from('logistica_repuestos')
         .select('*, logistica_bodegas(nombre)')
         .eq('empresa_id', currentCompany.id);

      let hasErrors = false;

      for (const item of terminalItems) {
         let rep = null;
         let isNewProduct = false;

         if (reps && reps.length > 0) {
            let found = null;
            if (item.repuestoId) {
                found = reps.filter(r => r.id === item.repuestoId);
            } else {
                found = reps.filter(r => r.sku === item.sku);
            }

            if (found.length > 0) {
                if (terminalForm.tipoMovimiento === 'ENTRADA') {
                    rep = found.find(r => r.bodega_id === item.bodegaId) || found[0];
                } else {
                    rep = found.find(r => r.bodega_id === item.bodegaId);
                    if (!rep) {
                        rep = found.find(r => r.stock >= item.cantidad) || found[0];
                    }
                }
            }
         }

         if (!rep) {
            if (terminalForm.tipoMovimiento === 'ENTRADA') {
               if (!item.bodegaId) {
                  hasErrors = true;
                  continue; // Skip items without bodega
               }
               isNewProduct = true;
            } else {
               hasErrors = true;
               continue; // Cannot extract if not found
            }
         }

         if (isNewProduct) {
             const { data: newRep, error: createErr } = await supabase.from('logistica_repuestos').insert({
                 empresa_id: currentCompany.id,
                 sku: item.sku,
                 nombre: item.nombre || \`Repuesto \${item.sku}\`,
                 bodega_id: item.bodegaId || null,
                 stock: item.cantidad,
                 precio: 0,
                 valor_total: 0,
                 calidad: 'ORIGINAL',
                 estado: 'ACTIVO',
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
                 notas: \`Ingreso Masivo - Solicitante: \${terminalForm.solicitante}, Destino: \${terminalForm.destino}\`,
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
            
            await supabase.from('logistica_repuestos').update({ 
               stock: newStock,
               ult_mov: new Date().toISOString()
            }).eq('id', rep.id);
            
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
        cantidad: 1, solicitante: '', autorizador: '', destino: ''
      });

    } catch (e) {
      console.error(e);
      Swal.fire("Error", "Error al procesar", "error");
    }
  };`;

// Replace handleTerminalSubmit until next function (handleEditBodega) or something
const startIndex = content.indexOf('const handleTerminalSubmit = async () => {');
const endIndex = content.indexOf('const handleExportSelected = () => {', startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + handleTerminalSubmitNew + '\n\n  ' + content.substring(endIndex);
}

fs.writeFileSync('src/pages/logistica/GestionSuministros.tsx', content);
