const fs = require('fs');
const xlsx = require('xlsx');
const ws = xlsx.utils.json_to_sheet([
  { Fecha: '18-07-2026', Turno: 'Día', Camión: 'CAM-01', Chofer: 'Juan', Tonelaje: 50, Vueltas: 2 }
]);
const wb = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb, ws, "Sheet1");
xlsx.writeFile(wb, 'test.xlsx');
