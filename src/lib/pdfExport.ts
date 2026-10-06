import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToPDF = (data: any[], fileName: string, title: string) => {
  if (!data || data.length === 0) return;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  // Título
  doc.setFontSize(16);
  doc.setTextColor(40);
  doc.text(title, 40, 40);

  // Fecha de exportación
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generado el: ${new Date().toLocaleString()}`, 40, 60);

  // Columnas y filas
  const columns = Object.keys(data[0]);
  const rows = data.map(row => columns.map(col => row[col]));

  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: 80,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [79, 70, 229], // indigo-600
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    margin: { top: 80 },
  });

  doc.save(`${fileName}.pdf`);
};
