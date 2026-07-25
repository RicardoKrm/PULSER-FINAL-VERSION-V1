import * as xlsx from 'xlsx';
import fs from 'fs';

try {
  const buf = fs.readFileSync('test.xlsx');
  const workbook = xlsx.read(buf, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json<any[][]>(worksheet, { header: 1 });

  for (let r = 0; r < data.length; r++) {
      const row = data[r];
      if (!row) continue;
      
      let hasEquipo = false;
      let hasVueltas = false;
      for (let c = 0; c < row.length; c++) {
          const val = String(row[c] || '').toUpperCase();
          if (val.includes('EQUIPO')) hasEquipo = true;
          if (val.includes('VUELTAS')) hasVueltas = true;
      }
      if (hasEquipo) {
          console.log(`Found EQUIPO at row ${r}`);
          console.log(data[r]);
          if (data[r+1]) console.log(data[r+1]);
          if (data[r+2]) console.log(data[r+2]);
          if (data[r+3]) console.log(data[r+3]);
          if (data[r+4]) console.log(data[r+4]);
      }
  }
} catch (e) { console.error(e.message); }
