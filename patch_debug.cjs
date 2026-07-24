const fs = require('fs');
let content = fs.readFileSync('src/pages/logistica/GestionSuministros.tsx', 'utf-8');

const target = `         if (terminalForm.tipoMovimiento === 'SALIDA') {
            if (rep && rep.stock < item.cantidad) {
               hasErrors = true;
               continue;
            }
         }`;

const replacement = `         if (terminalForm.tipoMovimiento === 'SALIDA') {
            if (rep && Number(rep.stock) < Number(item.cantidad)) {
               hasErrors = true;
               console.log("Stock error: ", rep.stock, item.cantidad);
               continue;
            }
         }
         
         if (!rep) {
            console.log("Rep is null for item", item);
         }`;

content = content.replace(target, replacement);
fs.writeFileSync('src/pages/logistica/GestionSuministros.tsx', content);
