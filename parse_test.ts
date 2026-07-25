import * as xlsx from 'xlsx';
import fs from 'fs';

const buf = fs.readFileSync('test.xlsx');
const workbook = xlsx.read(buf, { type: 'buffer' });
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json<any[][]>(worksheet, { header: 1 });

console.log("Total rows:", data.length);
for (let i = 25; i < 40; i++) {
   console.log(`Row ${i}:`, data[i]);
}
