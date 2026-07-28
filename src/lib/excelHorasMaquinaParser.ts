import * as XLSX from 'xlsx';
import { HorasMaquinaRecord } from './horasMaquinaDB';

export interface ParseResult {
  records: HorasMaquinaRecord[];
  totalRows: number;
  parsedCount: number;
  skippedCount: number;
  sheetsProcessed: string[];
  columnsFound: string[];
}

export function parseExcelDate(val: any, fallbackDateStr?: string): string {
  if (val === null || val === undefined || val === '') {
    return fallbackDateStr || new Date().toISOString().split('T')[0];
  }

  // If it's a JS Date object
  if (val instanceof Date) {
    if (!isNaN(val.getTime())) {
      // Use UTC components to prevent timezone offset shifts
      const y = val.getUTCFullYear();
      const m = String(val.getUTCMonth() + 1).padStart(2, '0');
      const d = String(val.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  // If it's a number (Excel date serial number, e.g. 45292 or 46200)
  if (typeof val === 'number') {
    // Excel base date epoch adjustment
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, '0');
      const d = String(date.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  // If string
  if (typeof val === 'string') {
    const cleanStr = val.trim();
    if (!cleanStr) return fallbackDateStr || new Date().toISOString().split('T')[0];

    // DD.MM.YYYY or DD/MM/YYYY or DD-MM-YYYY
    const ddmmyyyy = cleanStr.match(/^(\d{1,2})[\.\/-](\d{1,2})[\.\/-](\d{2,4})$/);
    if (ddmmyyyy) {
      let day = parseInt(ddmmyyyy[1], 10);
      let month = parseInt(ddmmyyyy[2], 10);
      let year = parseInt(ddmmyyyy[3], 10);
      if (year < 100) year += 2000;
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    // YYYY-MM-DD
    const yyyymmdd = cleanStr.match(/^(\d{4})[\.\/-](\d{1,2})[\.\/-](\d{1,2})/);
    if (yyyymmdd) {
      return `${yyyymmdd[1]}-${String(yyyymmdd[2]).padStart(2, '0')}-${String(yyyymmdd[3]).padStart(2, '0')}`;
    }

    const parsed = new Date(cleanStr);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const d = String(parsed.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  return fallbackDateStr || new Date().toISOString().split('T')[0];
}

export function parseNumber(val: any, defaultVal = 0): number {
  if (val === null || val === undefined || val === '') return defaultVal;
  if (typeof val === 'number') return isNaN(val) ? defaultVal : val;
  const str = String(val).trim().replace(',', '.');
  const parsed = parseFloat(str);
  return isNaN(parsed) ? defaultVal : parsed;
}

// Helper to normalize and clean equipment names
export function cleanEquipmentName(raw: string): string {
  if (!raw) return '';
  let cleaned = String(raw)
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .replace(/[\:\;]/g, '');

  // Standardize common patterns
  cleaned = cleaned.replace(/\s*[\-\_]\s*/g, '-');

  return cleaned;
}

// Check if string is a summary row or non-machine noise
function isInvalidEquipment(equipoUpper: string): boolean {
  if (!equipoUpper || equipoUpper.length < 2) return true;

  const noiseKeywords = [
    'TOTAL', 'SUBTOTAL', 'PROMEDIO', 'SUMA', 'RESUMEN', 'OBSERVAC', 
    'FECHA', 'EQUIPO', 'OPERADOR', 'DISPONIBLE', 'FIRMA', 'CONSOLIDADO', 
    'TURNO', 'TOTALES', 'MANTENIMIENTO', 'REPORTE', 'HOJA', 'SEMANA', 
    'MES', 'CHECKLIST', 'HOROMETRO', 'HORAS', 'NOTAS', 'LEYENDA', 'KILOMETRAJE',
    'GUARDIA', 'TALLER', 'VALOR', 'SISTEMA', 'MAQUINA'
  ];

  for (const kw of noiseKeywords) {
    if (equipoUpper.includes(kw) && !equipoUpper.match(/(EXC|CAEX|CAM|MOT|BUL|PER|CARG|VOLVO|CAT|CAT-|SCANIA|MERCEDES|KOMATSU|SANDVIK|\d{3})/i)) {
      return true;
    }
  }

  // Pure numbers like "1", "2"
  if (/^\d{1,2}$/.test(equipoUpper)) return true;

  return false;
}

export function parseHorasMaquinaExcel(fileData: ArrayBuffer): ParseResult {
  const workbook = XLSX.read(fileData, { 
    type: 'array', 
    cellDates: true, 
    cellNF: false, 
    cellText: false 
  });
  
  const records: HorasMaquinaRecord[] = [];
  let totalRowsAcrossSheets = 0;
  let skipped = 0;
  const sheetsProcessed: string[] = [];
  let allColumnsFound: string[] = [];

  // PROCESS ALL WORKSHEETS IN THE WORKBOOK (e.g. Enero, Febrero, Julio, etc.)
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    // Convert to 2D array matrix
    const rawMatrix: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (!rawMatrix || rawMatrix.length === 0) continue;

    sheetsProcessed.push(sheetName);
    totalRowsAcrossSheets += rawMatrix.length;

    // Scan first 20 rows to locate header row
    let headerRowIdx = -1;
    let colIndices: { [key: string]: number } = {};

    for (let r = 0; r < Math.min(rawMatrix.length, 25); r++) {
      const row = rawMatrix[r];
      if (!Array.isArray(row)) continue;

      const rowText = row.map(cell => String(cell).toLowerCase().trim()).join(' ');

      if (rowText.includes('fecha') || rowText.includes('equipo') || rowText.includes('inicia') || rowText.includes('operador') || rowText.includes('turno')) {
        headerRowIdx = r;
        break;
      }
    }

    if (headerRowIdx === -1) {
      headerRowIdx = 0;
    }

    const headerRow = rawMatrix[headerRowIdx] || [];
    const columnsFound = headerRow.map(c => String(c).trim());
    if (columnsFound.length > allColumnsFound.length) {
      allColumnsFound = columnsFound;
    }

    // Map header columns to fields
    columnsFound.forEach((colName, idx) => {
      const lower = colName.toLowerCase().trim();
      if (lower.includes('fecha') || lower.includes('date')) colIndices['fecha'] = idx;
      else if (lower.includes('turno')) colIndices['turno'] = idx;
      else if (lower.includes('equipo') || lower.includes('maquina') || lower.includes('unidad')) colIndices['equipo'] = idx;
      else if (lower.includes('inicia') || lower.includes('inicial') || lower.includes('hor_ini') || lower.includes('horometro_inicio')) colIndices['inicia'] = idx;
      else if (lower.includes('final') || lower.includes('hor_fin') || lower.includes('horometro_fin')) colIndices['final'] = idx;
      else if (lower.includes('operador') || lower.includes('chofer')) colIndices['operador'] = idx;
      else if (lower.includes('vuelta') || lower.includes('pase') || lower.includes('#vueltas')) colIndices['vueltas'] = idx;
      else if (lower.includes('observacion') || lower.includes('f/s') || lower.includes('estado')) colIndices['observacion'] = idx;
      else if (lower.includes('checklist') || lower.includes('preuso')) colIndices['checklist'] = idx;
      else if (lower === 'horas' || lower.includes('hora equipo') || lower.includes('horas equipo') || lower.includes('hrs')) colIndices['horas'] = idx;
      else if (lower.includes('redondear') || lower.includes('redondeo')) colIndices['redondear'] = idx;
      else if (lower.includes('combustible') || lower.includes('petroleo') || lower.includes('litro') || lower.includes('galon')) colIndices['combustible'] = idx;
    });

    // Default column fallbacks if indices not matched by keyword
    if (colIndices['fecha'] === undefined) colIndices['fecha'] = 0;
    if (colIndices['turno'] === undefined) colIndices['turno'] = 1;
    if (colIndices['equipo'] === undefined) colIndices['equipo'] = 2;
    if (colIndices['inicia'] === undefined) colIndices['inicia'] = 3;
    if (colIndices['final'] === undefined) colIndices['final'] = 4;
    if (colIndices['operador'] === undefined) colIndices['operador'] = 5;
    if (colIndices['vueltas'] === undefined) colIndices['vueltas'] = 6;
    if (colIndices['observacion'] === undefined) colIndices['observacion'] = 7;
    if (colIndices['checklist'] === undefined) colIndices['checklist'] = 8;
    if (colIndices['horas'] === undefined) colIndices['horas'] = 9;
    if (colIndices['redondear'] === undefined) colIndices['redondear'] = 10;

    let lastValidFecha = '';

    // Process data rows
    for (let r = headerRowIdx + 1; r < rawMatrix.length; r++) {
      const row = rawMatrix[r];
      if (!row || !Array.isArray(row) || row.length === 0) {
        skipped++;
        continue;
      }

      // Extract values
      const fechaRaw = row[colIndices['fecha']];
      const equipoRaw = row[colIndices['equipo']];
      const inicRaw = row[colIndices['inicia']];
      const finRaw = row[colIndices['final']];
      const operadorRaw = row[colIndices['operador']];

      // If empty row across main fields
      if (!fechaRaw && !equipoRaw && !inicRaw && !finRaw && !operadorRaw) {
        skipped++;
        continue;
      }

      // Get or inherit date
      const fechaStr = parseExcelDate(fechaRaw, lastValidFecha);
      if (fechaStr) {
        lastValidFecha = fechaStr;
      }

      const equipoCleaned = cleanEquipmentName(String(equipoRaw || ''));

      // Skip invalid equipment / summary noise rows
      if (isInvalidEquipment(equipoCleaned)) {
        skipped++;
        continue;
      }

      const equipoName = equipoCleaned || 'Equipo Sin Nombre';

      const turnoRaw = String(row[colIndices['turno']] || 'b').toLowerCase().trim();
      let turno = 'b'; // default dia
      if (turnoRaw.includes('a') || turnoRaw.includes('noche')) turno = 'a';
      else if (turnoRaw.includes('b') || turnoRaw.includes('dia') || turnoRaw.includes('día')) turno = 'b';
      else turno = turnoRaw || 'b';

      const inic = parseNumber(inicRaw, 0);
      const fin = parseNumber(finRaw, 0);
      const operador = String(operadorRaw || 'Sin Operador').trim();
      const vueltas = parseNumber(row[colIndices['vueltas']], 0);
      const obs = String(row[colIndices['observacion']] || 'Disponible').trim();
      const checklist = String(row[colIndices['checklist']] || 'OK').trim();

      // Horas calculadas or read
      let horasOp = 0;
      if (fin > inic && inic > 0) {
        horasOp = Math.round((fin - inic) * 100) / 100;
      } else if (colIndices['horas'] !== undefined && row[colIndices['horas']] !== undefined) {
        horasOp = parseNumber(row[colIndices['horas']], 0);
      }

      const horasRed = colIndices['redondear'] !== undefined && row[colIndices['redondear']] !== undefined
        ? parseNumber(row[colIndices['redondear']], Math.round(horasOp)) 
        : Math.round(horasOp);

      let combustible = colIndices['combustible'] !== undefined && row[colIndices['combustible']] !== undefined
        ? parseNumber(row[colIndices['combustible']], 0) 
        : 0;

      if (combustible === 0 && horasOp > 0) {
        combustible = Math.round(horasOp * 22);
      }

      records.push({
        id: `EXCEL-${sheetName.replace(/\s+/g, '_')}-${r}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        fecha: fechaStr,
        turno,
        equipo: equipoName,
        horometroInicial: inic,
        horometroFinal: fin,
        operador: operador || 'Sin Operador',
        vueltas,
        observacion: obs || 'Disponible',
        checklist: checklist || 'OK',
        horasOperativas: horasOp,
        horasRedondeadas: horasRed,
        combustibleL: combustible,
        created_at: new Date().toISOString()
      });
    }
  }

  return {
    records,
    totalRows: totalRowsAcrossSheets,
    parsedCount: records.length,
    skippedCount: skipped,
    sheetsProcessed,
    columnsFound: allColumnsFound
  };
}
