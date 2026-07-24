const fs = require('fs');
let content = fs.readFileSync('src/pages/logistica/GestionSuministros.tsx', 'utf-8');

const target = `            let found = [];
            if (item.repuestoId) {
                found = reps.filter((r: any) => r.id === item.repuestoId);
            } else {
                found = reps.filter((r: any) => r.sku === item.sku);
            }`;

const replacement = `            let found = [];
            if (item.repuestoId) {
                found = reps.filter((r: any) => String(r.id) === String(item.repuestoId));
            }
            if (found.length === 0) {
                found = reps.filter((r: any) => {
                   const qSku = (item.sku || '').toUpperCase().trim();
                   const qNom = (item.nombre || '').toUpperCase().trim();
                   const rSku = (r.sku || '').toUpperCase().trim();
                   const rNom = (r.nombre || '').toUpperCase().trim();
                   
                   if (qSku && rSku === qSku) return true;
                   if (qSku && rNom === qSku) return true;
                   if (qNom && rNom === qNom) return true;
                   if (qNom && rSku === qNom) return true;
                   return false;
                });
            }`;

content = content.replace(target, replacement);

const target2 = `                if (terminalForm.tipoMovimiento === 'ENTRADA') {
                    rep = found.find((r: any) => r.bodega_id === item.bodegaId) || found[0];
                } else {
                    rep = found.find((r: any) => r.bodega_id === item.bodegaId);
                    if (!rep) {
                        rep = found.find((r: any) => r.stock >= item.cantidad) || found[0];
                    }
                }`;

const replacement2 = `                if (terminalForm.tipoMovimiento === 'ENTRADA') {
                    rep = found.find((r: any) => String(r.bodega_id) === String(item.bodegaId)) || found[0];
                } else {
                    if (item.bodegaId) {
                       rep = found.find((r: any) => String(r.bodega_id) === String(item.bodegaId));
                    }
                    if (!rep) {
                        rep = found.find((r: any) => Number(r.stock) >= Number(item.cantidad)) || found[0];
                    }
                }`;

content = content.replace(target2, replacement2);
fs.writeFileSync('src/pages/logistica/GestionSuministros.tsx', content);
console.log("Patched search");
