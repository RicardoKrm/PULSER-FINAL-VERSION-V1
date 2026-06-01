import fs from 'fs';
import path from 'path';

const file = path.resolve('src/pages/operaciones/Reservas.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/value=\{formReserva\.pasajeros\.cantidad\}/g, "value={formReserva.pasajeros.cantidad || ''}");
content = content.replace(/cantidad: parseInt\(e\.target\.value\)/g, "cantidad: parseInt(e.target.value) || 0");

content = content.replace(/value=\{formReserva\.logistica\.maletasGrandes\}/g, "value={formReserva.logistica.maletasGrandes || ''}");
content = content.replace(/maletasGrandes: parseInt\(e\.target\.value\)/g, "maletasGrandes: parseInt(e.target.value) || 0");

content = content.replace(/value=\{formReserva\.logistica\.maletasChicas\}/g, "value={formReserva.logistica.maletasChicas || ''}");
content = content.replace(/maletasChicas: parseInt\(e\.target\.value\)/g, "maletasChicas: parseInt(e.target.value) || 0");

content = content.replace(/value=\{formReserva\.finanzas\.montoBruto\}/g, "value={formReserva.finanzas.montoBruto || ''}");
content = content.replace(/montoBruto: parseInt\(e\.target\.value\)/g, "montoBruto: parseInt(e.target.value) || 0");

content = content.replace(/value=\{formReserva\.finanzas\.gastosAdicionales\}/g, "value={formReserva.finanzas.gastosAdicionales || ''}");
content = content.replace(/gastosAdicionales: parseInt\(e\.target\.value\)/g, "gastosAdicionales: parseInt(e.target.value) || 0");

fs.writeFileSync(file, content);
console.log("Fixed NaN");
