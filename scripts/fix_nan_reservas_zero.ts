import fs from 'fs';
import path from 'path';

const file = path.resolve('src/pages/operaciones/Reservas.tsx');
let content = fs.readFileSync(file, 'utf8');

// Revert previous value={... || ''}
content = content.replace(/value=\{formReserva\.pasajeros\.cantidad \|\| ''\}/g, "value={isNaN(formReserva.pasajeros.cantidad) ? '' : formReserva.pasajeros.cantidad}");
content = content.replace(/value=\{formReserva\.logistica\.maletasGrandes \|\| ''\}/g, "value={isNaN(formReserva.logistica.maletasGrandes) ? '' : formReserva.logistica.maletasGrandes}");
content = content.replace(/value=\{formReserva\.logistica\.maletasChicas \|\| ''\}/g, "value={isNaN(formReserva.logistica.maletasChicas) ? '' : formReserva.logistica.maletasChicas}");
content = content.replace(/value=\{formReserva\.finanzas\.montoBruto \|\| ''\}/g, "value={isNaN(formReserva.finanzas.montoBruto) ? '' : formReserva.finanzas.montoBruto}");
content = content.replace(/value=\{formReserva\.finanzas\.gastosAdicionales \|\| ''\}/g, "value={isNaN(formReserva.finanzas.gastosAdicionales) ? '' : formReserva.finanzas.gastosAdicionales}");

// And for those without || '' initially if they weren't matched:
// If they have no || '', they are already fixed.

fs.writeFileSync(file, content);
console.log("Fixed zero handling");
