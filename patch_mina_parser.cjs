const fs = require('fs');
let code = fs.readFileSync('src/pages/produccion/PruebaMina.tsx', 'utf-8');

const newParser = `        const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null }) as any[][];
        
        // Find header row (the one that contains TOTAL_PRODUCCION_IMPERIA or similar)
        let headerRowIdx = 6; // Default to 6 (row 7)
        let headers: string[] = [];
        for (let i = 0; i < Math.min(10, jsonData.length); i++) {
          const rowStr = jsonData[i].join(' ').toUpperCase();
          if (rowStr.includes('PRODUCCION_IMPERIA') || rowStr.includes('SUPERVISOR')) {
            headerRowIdx = i;
            headers = jsonData[i].map(h => String(h || '').toUpperCase().trim());
            break;
          }
        }

        // Helper to find column index by partial match
        const findCol = (keywords: string[], defaultIdx: number) => {
          if (!headers || headers.length === 0) return defaultIdx;
          for (let i = 0; i < headers.length; i++) {
             const h = headers[i];
             if (keywords.every(kw => h.includes(kw))) {
               return i;
             }
          }
          return defaultIdx;
        };

        // Dynamically find column indices
        const colDia = findCol(['DIA'], 0);
        const colSup = findCol(['SUPERVISOR'], 1);
        const colDiaMes = findCol(['DIA_MES'], 2);

        // Turno Dia
        const d_cant_caex = findCol(['TURNO_DIA', 'CANTIDAD_CAEX'], 3);
        const d_caex = findCol(['TURNO_DIA', 'CAEX'], 4);
        const d_operadores = findCol(['TURNO_DIA', 'OPERADORES'], 5);
        const d_acopio = findCol(['TURNO_DIA', 'ACOPIO'], 6);
        const d_caex_acopio = findCol(['TURNO_DIA', 'CAEX_ACOPIO'], 7);
        const d_planta = findCol(['TURNO_DIA', 'PLANTA'], 8);
        const d_caex_planta = findCol(['TURNO_DIA', 'CAEX_PLANTA'], 9);
        const d_vueltas = findCol(['TURNO_DIA', 'VUELTAS'], 10);
        const d_pases_cf = findCol(['TURNO_DIA', 'PASES_CF'], 11);
        const d_pases_totales = findCol(['TURNO_DIA', 'PASES_TOTALES'], 12);
        const d_toneladas = findCol(['TURNO_DIA', 'TONELADAS'], 13);
        const d_prod_imperia = findCol(['TURNO_DIA', 'PRODUCCION_IMPERIA'], 15);
        const d_equipo_cf = findCol(['TURNO_DIA', 'EQUIPO_CF'], 14);
        const d_prod_ajustada = findCol(['TURNO_DIA', 'PRODUCCION_AJUSTADA'], 16);
        const d_prod_cmc = findCol(['TURNO_DIA', 'PRODUCCION_CMC'], 16);
        const d_traspasos = findCol(['TURNO_DIA', 'TRASPASOS'], 17);

        // Turno Noche
        const n_cant_caex = findCol(['TURNO_NOCHE', 'CANTIDAD_CAEX'], 19);
        const n_caex = findCol(['TURNO_NOCHE', 'CAEX'], 20);
        const n_operadores = findCol(['TURNO_NOCHE', 'OPERADORES'], 21);
        const n_acopio = findCol(['TURNO_NOCHE', 'ACOPIO'], 22);
        const n_caex_acopio = findCol(['TURNO_NOCHE', 'CAEX_ACOPIO'], 23);
        const n_planta = findCol(['TURNO_NOCHE', 'PLANTA'], 24);
        const n_caex_planta = findCol(['TURNO_NOCHE', 'CAEX_PLANTA'], 25);
        const n_pases_cf = findCol(['TURNO_NOCHE', 'PASES_CF'], 26);
        const n_pases_totales = findCol(['TURNO_NOCHE', 'PASES_TOTALES'], 27);
        const n_toneladas = findCol(['TURNO_NOCHE', 'TONELADAS'], 28);
        const n_prod_imperia = findCol(['TURNO_NOCHE', 'PRODUCCION_IMPERIA'], 27); // From screenshot
        const n_equipo_cf = findCol(['TURNO_NOCHE', 'EQUIPO_CF'], 28);
        const n_prod_ajustada = findCol(['TURNO_NOCHE', 'PRODUCCION_AJUSTADA'], 29);
        const n_prod_cmc = findCol(['TURNO_NOCHE', 'PRODUCCION_CMC'], 30);
        const n_traspasos = findCol(['TURNO_NOCHE', 'TRASPASOS'], 31);

        // Totals
        const t_imperia = findCol(['TOTAL_PRODUCCION_IMPERIA'], 32);
        const t_cmc = findCol(['TOTAL_PRODUCCION_CMC'], 33);
        const t_dif = findCol(['DIFERENCIA_CMC_IMPERIA'], 34);

        // We need data rows (usually starting right after headers)
        // Find the first row that starts with a number (dia 1)
        let dataStartRow = headerRowIdx + 1;
        for (let i = headerRowIdx + 1; i < Math.min(headerRowIdx + 10, jsonData.length); i++) {
           if (jsonData[i][0] == 1 || String(jsonData[i][0]).trim() === '1') {
             dataStartRow = i;
             break;
           }
        }
        
        const targetRows = jsonData.slice(dataStartRow, dataStartRow + 31);
        
        if (targetRows.length === 0) {
          throw new Error("La hoja no contiene datos en las filas esperadas.");
        }

        let lastPozo = '';
        let lastSubPozo = '';

        const processed: ProcessedRow[] = targetRows.map((row, index) => {
          let supervisor = row[colSup] !== null && row[colSup] !== undefined ? String(row[colSup]).trim() : lastPozo;
          let dia_mes = row[colDiaMes] !== null && row[colDiaMes] !== undefined ? String(row[colDiaMes]).trim() : lastSubPozo;
          
          if (row[colSup] !== null && row[colSup] !== undefined && String(row[colSup]).trim() !== '') lastPozo = supervisor;
          if (row[colDiaMes] !== null && row[colDiaMes] !== undefined && String(row[colDiaMes]).trim() !== '') lastSubPozo = dia_mes;

          const getNum = (val: any) => {
            if (val === null || val === undefined || val === '') return 0;
            if (typeof val === 'number') return isNaN(val) ? 0 : val;
            if (typeof val === 'string') {
               const parsed = Number(val.replace(/,/g, ''));
               return isNaN(parsed) ? 0 : parsed;
            }
            if (typeof val === 'object' && val !== null) {
                if (val.v !== undefined) {
                    const parsed = Number(val.v);
                    return isNaN(parsed) ? 0 : parsed;
                }
            }
            return 0;
          };

          return {
            dia: index + 1, // 1 to 31
            supervisor,
            dia_mes,

            // Turno Día
            cantidad_caex_dia: getNum(row[d_cant_caex]),
            caex_dia: getNum(row[d_caex]),
            operadores_dia: getNum(row[d_operadores]),
            acopio_dia: getNum(row[d_acopio]),
            caex_acopio_dia: getNum(row[d_caex_acopio]),
            planta_dia: getNum(row[d_planta]),
            caex_planta_dia: getNum(row[d_caex_planta]),
            vueltas_dia: getNum(row[d_vueltas]),
            pases_cf_dia: getNum(row[d_pases_cf]),
            pases_totales_dia: getNum(row[d_pases_totales]),
            toneladas_caex_dia: getNum(row[d_toneladas]),
            equipo_cf_dia: row[d_equipo_cf] ? String(row[d_equipo_cf]) : '',
            produccion_dia: getNum(row[d_prod_imperia]),
            produccion_cmc_dia: getNum(row[d_prod_cmc]),
            traspasos_dia: getNum(row[d_traspasos]),

            // Turno Noche
            cantidad_caex_noche: getNum(row[n_cant_caex]),
            caex_noche: getNum(row[n_caex]),
            operadores_noche: getNum(row[n_operadores]),
            acopio_noche: getNum(row[n_acopio]),
            caex_acopio_noche: getNum(row[n_caex_acopio]),
            planta_noche: getNum(row[n_planta]),
            caex_planta_noche: getNum(row[n_caex_planta]),
            vueltas_noche: 0,
            pases_cf_noche: getNum(row[n_pases_cf]),
            pases_totales_noche: getNum(row[n_pases_totales]),
            toneladas_caex_noche: getNum(row[n_toneladas]),
            equipo_cf_noche: row[n_equipo_cf] ? String(row[n_equipo_cf]) : '',
            produccion_caex_noche: getNum(row[n_prod_ajustada]), // or whatever
            produccion_noche: getNum(row[n_prod_imperia]),
            traspasos_noche: getNum(row[n_traspasos]),

            // Totales
            total_imperia: getNum(row[t_imperia]),
            total_cmc: getNum(row[t_cmc]),
            diferencia: getNum(row[t_dif]),
            
            raw: row
          };
        });`;

code = code.replace(
  /const jsonData = XLSX\.utils\.sheet_to_json[\s\S]*?raw: row\n          };\n        }\);/m,
  newParser
);

fs.writeFileSync('src/pages/produccion/PruebaMina.tsx', code);
