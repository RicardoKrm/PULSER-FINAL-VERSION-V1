import * as xlsx from 'xlsx';
import fs from 'fs';

try {
  const buf = fs.readFileSync('test.xlsx');
  const workbook = xlsx.read(buf, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json<any[][]>(worksheet, { header: 1 });

  for (let r = 0; r < 50; r++) {
      if (!data[r]) continue;
      console.log(`Row ${r}:`, data[r].map(c => typeof c === 'string' ? c.substring(0, 10) : c));
  }
} catch(e){}
