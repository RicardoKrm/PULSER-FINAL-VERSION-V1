import * as XLSX from 'xlsx';

export const exportToExcel = (data: any[], fileName: string, sheetName: string = 'Sheet1') => {
  const worksheet = XLSX.utils.json_to_sheet(data);

  if (data && data.length > 0) {
    const keys = Object.keys(data[0]);
    const colWidths = keys.map((key) => {
      const headerLength = key.length;
      const maxContentLength = data.reduce((max, row) => {
        const val = row[key];
        const len = val !== null && val !== undefined ? String(val).length : 0;
        return Math.max(max, len);
      }, 0);
      return { wch: Math.min(Math.max(headerLength, maxContentLength) + 4, 60) };
    });
    worksheet['!cols'] = colWidths;
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};
