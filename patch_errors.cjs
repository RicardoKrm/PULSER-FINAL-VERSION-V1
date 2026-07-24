const fs = require('fs');
let content = fs.readFileSync('src/pages/logistica/GestionSuministros.tsx', 'utf-8');

const targetLoopStart = `      let hasErrors = false;`;

const newLoopStart = `      let errorMessages: string[] = [];`;

content = content.replace(targetLoopStart, newLoopStart);

content = content.replace(/hasErrors = true;/g, `// hasErrors = true;`);

// Replace the specific error triggers:

// 1. New product no bodega
const noBodegaStr = `               if (!item.bodegaId) {
                  // hasErrors = true;
                  continue;
               }`;
const noBodegaRep = `               if (!item.bodegaId) {
                  errorMessages.push(\`Falta bodega para nuevo producto (\${item.sku || item.nombre})\`);
                  continue;
               }`;
content = content.replace(noBodegaStr, noBodegaRep);

// 2. Salida product not found
const notFoundStr = `            } else {
               // hasErrors = true;
               continue;
            }`;
const notFoundRep = `            } else {
               errorMessages.push(\`Producto no encontrado para SALIDA (\${item.sku || item.nombre})\`);
               continue;
            }`;
content = content.replace(notFoundStr, notFoundRep);

// 3. createErr
const createErrStr = `             if (createErr || !newRep) {
                 // hasErrors = true;
                 continue;
             }`;
const createErrRep = `             if (createErr || !newRep) {
                 errorMessages.push(\`Error creando producto (\${item.sku || item.nombre}): \${createErr?.message}\`);
                 continue;
             }`;
content = content.replace(createErrStr, createErrRep);

// 4. stock < cantidad
const stockErrStr = `            if (rep && Number(rep.stock) < Number(item.cantidad)) {
               // hasErrors = true;
               console.log("Stock error: ", rep.stock, item.cantidad);
               continue;
            }`;
const stockErrRep = `            if (rep && Number(rep.stock) < Number(item.cantidad)) {
               errorMessages.push(\`Stock insuficiente para \${rep.nombre} (Stock: \${rep.stock}, Solicitado: \${item.cantidad})\`);
               continue;
            }`;
content = content.replace(stockErrStr, stockErrRep);

// 5. supabase error checking for update/insert
const updateInsertStr = `            await supabase.from('logistica_repuestos').update(updatePayload).eq('id', rep.id);
            
            await supabase.from('logistica_movimientos').insert({
               empresa_id: currentCompany.id,
               repuesto_id: rep.id,
               tipo: terminalForm.tipoMovimiento,
               cantidad: item.cantidad,
               notas: \`Solicitante: \${terminalForm.solicitante}, Autorizador: \${terminalForm.autorizador}, Destino: \${terminalForm.destino}\`,
               estado: 'COMPLETADO'
            });`;

const updateInsertRep = `            const { error: updErr } = await supabase.from('logistica_repuestos').update(updatePayload).eq('id', rep.id);
            if (updErr) {
               errorMessages.push(\`Error actualizando stock para \${rep.nombre}: \${updErr.message}\`);
               continue;
            }
            
            const { error: insErr } = await supabase.from('logistica_movimientos').insert({
               empresa_id: currentCompany.id,
               repuesto_id: rep.id,
               tipo: terminalForm.tipoMovimiento,
               cantidad: item.cantidad,
               notas: \`Solicitante: \${terminalForm.solicitante}, Autorizador: \${terminalForm.autorizador}, Destino: \${terminalForm.destino}\`,
               estado: 'COMPLETADO'
            });
            if (insErr) {
               errorMessages.push(\`Error registrando movimiento para \${rep.nombre}: \${insErr.message}\`);
               continue;
            }`;
content = content.replace(updateInsertStr, updateInsertRep);

// 6. Alerting
const alertStr = `      if (hasErrors) {
         Swal.fire("Aviso", "Se procesaron algunos movimientos, pero otros fallaron por falta de stock, errores o falta de bodega destino.", "warning");
      } else {
         Swal.fire("Éxito", "Movimientos procesados correctamente.", "success");
      }`;
const alertRep = `      if (errorMessages.length > 0) {
         Swal.fire({
            icon: 'warning',
            title: 'Aviso',
            html: \`<div style="text-align: left; font-size: 14px;">Se procesaron algunos movimientos, pero hubo errores:<br/><ul style="margin-top: 10px; padding-left: 20px;">\${errorMessages.map(e => \`<li>\${e}</li>\`).join('')}</ul></div>\`,
            width: '600px'
         });
      } else {
         Swal.fire("Éxito", "Movimientos procesados correctamente.", "success");
      }`;
content = content.replace(alertStr, alertRep);

// There was another place I added debug `hasErrors = true;` wait, let's just make sure all are replaced.
const originalStockErrStr = `         if (terminalForm.tipoMovimiento === 'SALIDA') {
            if (rep && rep.stock < item.cantidad) {
               // hasErrors = true;
               continue;
            }
         }`;
// Wait, I already replaced that in patch_debug.cjs!
// So stockErrStr matches what patch_debug.cjs produced.

fs.writeFileSync('src/pages/logistica/GestionSuministros.tsx', content);
