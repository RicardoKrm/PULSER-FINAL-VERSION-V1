import fs from 'fs';

let content = fs.readFileSync('src/pages/produccion/PruebaMina.tsx', 'utf8');

// Replace ProcessedRow interface
const interfaceRegex = /interface ProcessedRow \{[\s\S]*?raw: any\[\]; \/\/ Store the full 39 columns for raw view\n\}/;
const newInterface = `interface ProcessedRow {
  dia: number;
  supervisor: string;
  dia_mes: string;
  
  // Turno Día
  cantidad_caex_dia: number;
  caex_dia: number;
  operadores_dia: number;
  acopio_dia: number;
  caex_acopio_dia: number;
  planta_dia: number;
  caex_planta_dia: number;
  vueltas_dia: number;
  pases_cf_dia: number;
  pases_totales_dia: number;
  toneladas_caex_dia: number;
  equipo_cf_dia: string;
  produccion_dia: number;
  produccion_cmc_dia: number;
  traspasos_dia: number;

  // Turno Noche
  cantidad_caex_noche: number;
  caex_noche: number;
  operadores_noche: number;
  acopio_noche: number;
  caex_acopio_noche: number;
  planta_noche: number;
  caex_planta_noche: number;
  vueltas_noche: number;
  pases_cf_noche: number;
  pases_totales_noche: number;
  toneladas_caex_noche: number;
  equipo_cf_noche: string;
  produccion_caex_noche: number;
  produccion_noche: number;
  traspasos_noche: number;

  // Totales
  total_imperia: number;
  total_cmc: number;
  diferencia: number;
  
  raw: any[]; 
}`;
content = content.replace(interfaceRegex, newInterface);

const hookRegex = /const fileInputRef = useRef<HTMLInputElement>\(null\);/;
const newHooks = `const { currentCompany } = useCompany();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);`;
content = content.replace(hookRegex, newHooks);

// Replace mapping logic
const mapLogicRegex = /const processed: ProcessedRow\[\] = targetRows\.map\(\(row, index\) => \{[\s\S]*?raw: row\n          \};\n        \}\);/;
const newMapLogic = `const processed: ProcessedRow[] = targetRows.map((row, index) => {
          let supervisor = row[1] !== null && row[1] !== undefined ? String(row[1]).trim() : lastPozo;
          let dia_mes = row[2] !== null && row[2] !== undefined ? String(row[2]).trim() : lastSubPozo;
          
          if (row[1] !== null && row[1] !== undefined) lastPozo = supervisor;
          if (row[2] !== null && row[2] !== undefined) lastSubPozo = dia_mes;

          const getNum = (val: any) => {
            const num = Number(val);
            return isNaN(num) ? 0 : num;
          };

          return {
            dia: index + 1, // 1 to 31
            supervisor,
            dia_mes,

            // Turno Día
            cantidad_caex_dia: getNum(row[3]), // Col 4
            caex_dia: getNum(row[4]), // Col 5
            operadores_dia: getNum(row[5]), // Col 6
            acopio_dia: getNum(row[6]), // Col 7
            caex_acopio_dia: getNum(row[7]), // Col 8
            planta_dia: getNum(row[8]), // Col 9
            caex_planta_dia: getNum(row[9]), // Col 10
            vueltas_dia: getNum(row[10]), // Col 11
            pases_cf_dia: getNum(row[11]), // Col 12
            pases_totales_dia: getNum(row[12]), // Col 13
            toneladas_caex_dia: getNum(row[13]), // Col 14
            equipo_cf_dia: row[14] ? String(row[14]) : '', // Col 15
            produccion_dia: getNum(row[15]), // Col 16
            produccion_cmc_dia: getNum(row[16]), // Col 17
            traspasos_dia: getNum(row[17]), // Col 18

            // Turno Noche
            cantidad_caex_noche: getNum(row[19]), // Col 20
            caex_noche: getNum(row[20]), // Col 21
            operadores_noche: getNum(row[21]), // Col 22
            acopio_noche: getNum(row[22]), // Col 23
            caex_acopio_noche: getNum(row[23]), // Col 24
            planta_noche: getNum(row[24]), // Col 25
            caex_planta_noche: getNum(row[25]), // Col 26
            vueltas_noche: 0, // Not mentioned
            pases_cf_noche: getNum(row[26]), // Col 27
            pases_totales_noche: getNum(row[27]), // Col 28
            toneladas_caex_noche: getNum(row[28]), // Col 29
            equipo_cf_noche: row[29] ? String(row[29]) : '', // Col 30
            produccion_caex_noche: getNum(row[30]), // Col 31
            produccion_noche: getNum(row[31]), // Col 32
            traspasos_noche: getNum(row[32]), // Col 33

            // Totales
            total_imperia: getNum(row[34]), // Col 35
            total_cmc: getNum(row[35]), // Col 36
            diferencia: getNum(row[36]), // Col 37

            raw: row
          };
        });`;
content = content.replace(mapLogicRegex, newMapLogic);

// Add save to DB function
const saveFunction = `  const handleSaveToDB = async () => {
    if (!currentCompany || !data.length) return;
    setSaving(true);
    setError(null);
    try {
      const recordsToInsert = data.map((row) => {
        const { raw, ...rest } = row;
        return {
          empresa_id: currentCompany.id,
          mes: 7, // Defaulting to July for now
          anio: 2026,
          ...rest
        };
      });

      // Clear previous for the month? For now just insert.
      const { error: dbError } = await supabase.from('produccion_mina_mensual').insert(recordsToInsert);
      
      if (dbError) throw dbError;
      alert('Datos guardados exitosamente en la base de datos.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al guardar en la base de datos.");
    } finally {
      setSaving(false);
    }
  };`;
  
const filteredDataRegex = /const filteredData = useMemo\(\(\) => \{/;
content = content.replace(filteredDataRegex, saveFunction + "\n\n  const filteredData = useMemo(() => {");

// Fix filteredData search
content = content.replace(/r\.pozo\.toLowerCase\(\)\.includes\(lower\) \|\|\s*r\.subPozo\.toLowerCase\(\)\.includes\(lower\)/, "r.supervisor.toLowerCase().includes(lower) || r.dia_mes.toLowerCase().includes(lower)");

// Fix totals names
content = content.replace(/acc\.produccionDia \+ curr\.produccionDia/g, "acc.produccion_dia + curr.produccion_dia");
content = content.replace(/acc\.produccionNoche \+ curr\.produccionNoche/g, "acc.produccion_noche + curr.produccion_noche");
content = content.replace(/acc\.totalImperia \+ curr\.totalImperia/g, "acc.total_imperia + curr.total_imperia");
content = content.replace(/acc\.totalCmc \+ curr\.total_cmc/g, "acc.total_cmc + curr.total_cmc"); // wait
content = content.replace(/acc\.totalCmc \+ curr\.totalCmc/g, "acc.total_cmc + curr.total_cmc");
content = content.replace(/\{ produccionDia: 0, produccionNoche: 0, totalImperia: 0, totalCmc: 0, diferencia: 0 \}/, "{ produccion_dia: 0, produccion_noche: 0, total_imperia: 0, total_cmc: 0, diferencia: 0 }");

// Update JSX table headers and fields
// Summary tab
content = content.replace(/row\.pozo/g, "row.supervisor");
content = content.replace(/row\.subPozo/g, "row.dia_mes");
content = content.replace(/row\.produccionDia/g, "row.produccion_dia");
content = content.replace(/row\.produccionNoche/g, "row.produccion_noche");
content = content.replace(/row\.totalImperia/g, "row.total_imperia");
content = content.replace(/row\.totalCmc/g, "row.total_cmc");

// Day tab
content = content.replace(/row\.cantidadCaexDia/g, "row.cantidad_caex_dia");
content = content.replace(/row\.caexDia/g, "row.caex_dia");
content = content.replace(/row\.operadoresDia/g, "row.operadores_dia");
content = content.replace(/row\.acopioDia/g, "row.acopio_dia");
content = content.replace(/row\.caexAcopioDia/g, "row.caex_acopio_dia");
content = content.replace(/row\.plantaDia/g, "row.planta_dia");
content = content.replace(/row\.caexPlantaDia/g, "row.caex_planta_dia");
content = content.replace(/row\.vueltasDia/g, "row.vueltas_dia");
content = content.replace(/row\.pasesCfDia/g, "row.pases_cf_dia");
content = content.replace(/row\.pasesTotalesDia/g, "row.pases_totales_dia");
content = content.replace(/row\.horasCfDia/g, "row.toneladas_caex_dia");
// Add equipo_cf_dia instead of whatever was there
content = content.replace(/row\.produccionCmcDia/g, "row.produccion_cmc_dia");
content = content.replace(/row\.traspasosDia/g, "row.traspasos_dia");

// Night tab
content = content.replace(/row\.cantidadCaexNoche/g, "row.cantidad_caex_noche");
content = content.replace(/row\.caexNoche/g, "row.caex_noche");
content = content.replace(/row\.operadoresNoche/g, "row.operadores_noche");
content = content.replace(/row\.acopioNoche/g, "row.acopio_noche");
content = content.replace(/row\.caexAcopioNoche/g, "row.caex_acopio_noche");
content = content.replace(/row\.plantaNoche/g, "row.planta_noche");
content = content.replace(/row\.caexPlantaNoche/g, "row.caex_planta_noche");
content = content.replace(/row\.vueltasNoche/g, "row.vueltas_noche");
content = content.replace(/row\.pasesCfNoche/g, "row.pases_cf_noche");
content = content.replace(/row\.pasesTotalesNoche/g, "row.pases_totales_noche");
content = content.replace(/row\.horasCfNoche/g, "row.toneladas_caex_noche");
content = content.replace(/row\.produccionCmcNoche/g, "row.produccion_caex_noche");
content = content.replace(/row\.traspasosNoche/g, "row.traspasos_noche");


fs.writeFileSync('src/pages/produccion/PruebaMina.tsx', content, 'utf8');
