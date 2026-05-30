const fs = require('fs');

const file = 'src/pages/operaciones/Reservas.tsx';
let data = fs.readFileSync(file, 'utf-8');

const b2Start = data.indexOf('{/* Bloque 2: Pasajeros y Maletas */}');
const b3Start = data.indexOf('{/* Bloque 3: Ruta y Horario */}');
const b4Start = data.indexOf('{/* Bloque 4: Finanzas y Cobranza */}');

if (b2Start === -1 || b3Start === -1 || b4Start === -1) {
  console.error("Couldn't find block markers");
  process.exit(1);
}

const b2Str = data.substring(b2Start, b3Start);
const b3Str = data.substring(b3Start, b4Start);

let newB3Str = b3Str.replace('TEMPORALIDAD', 'DÍA Y HORA DE RESERVA');

// Now, swap them
data = data.substring(0, b2Start) + newB3Str + b2Str + data.substring(b4Start);

fs.writeFileSync(file, data, 'utf-8');
console.log("Blocks swapped successfully");
