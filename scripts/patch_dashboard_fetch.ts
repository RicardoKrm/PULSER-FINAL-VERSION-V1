import fs from 'fs';
import path from 'path';

const file = path.resolve('src/pages/Dashboard.tsx');
let content = fs.readFileSync(file, 'utf8');

// Add imports if they don't exist
if (!content.includes("import { useCompany } from '../contexts/CompanyContext';")) {
  content = content.replace("import { useAppContext }", "import { useAppContext }\nimport { useCompany } from '../contexts/CompanyContext';\nimport { supabase } from '../lib/supabase';");
}


// Replace the old vehiculos usage in useMemo
const oldSaludLogic = `    // Salud Flota utilizando calcularDatosPizarra para coherencia
    let vencidos = 0;
    let proximos = 0;
    let alDia = 0;
    
    (vehiculos || []).forEach((v: any) => {
       try {
         const calculo = calcularDatosPizarra(v);
         if (calculo.estatus === 'VENCIDO') {
           vencidos++;
         } else if (calculo.estatus === 'PROXIMO') {
           proximos++;
         } else {
           alDia++;
         }
       } catch (err) {
         alDia++; // Fallback
       }
    });`;

const newSaludLogic = `    // Salud Flota utilizando calcularDatosPizarra real de DB
    let vencidos = 0;
    let proximos = 0;
    let alDia = 0;
    
    (dbVehiculos || []).forEach((v: any) => {
       try {
         const calculo = calcularDatosPizarra(v);
         if (calculo.estatus === 'VENCIDO') {
           vencidos++;
         } else if (calculo.estatus === 'PROXIMO') {
           proximos++;
         } else {
           alDia++;
         }
       } catch (err) {
         alDia++; // Fallback
       }
    });`;

content = content.replace(oldSaludLogic, newSaludLogic);

// Add state and effect for dbVehiculos
if (!content.includes('const [dbVehiculos, setDbVehiculos]')) {
  const insertIndex = content.indexOf('const [fechaDesde');
  content = content.slice(0, insertIndex) + 
  `const { currentCompany } = useCompany();
  const [dbVehiculos, setDbVehiculos] = useState<any[]>([]);

  React.useEffect(() => {
    if (!currentCompany?.id) return;
    const fetchVehs = async () => {
      const { data } = await supabase.from('vehiculo').select('*').eq('empresa_id', currentCompany.id);
      if (data) {
        // Map fields to what calcularDatosPizarra expects
        const mapped = data.map(v => {
          const detalles = v.detalles || {};
          const kmUltMant = typeof v.km_ultima_mantencion === 'number' ? v.km_ultima_mantencion : (detalles.km_ultima_mantencion || 0);
          const kmInterv = typeof v.intervalo_km === 'number' ? v.intervalo_km : (detalles.intervalo_km || 10000);
          
          return {
            id: v.id,
            numeroInterno: v.numero_interno || '',
            patente: v.patente || v.numero_interno || 'Sin PPU',
            kilometrajeActual: typeof v.kilometraje_actual === 'number' ? v.kilometraje_actual : parseFloat(String(v.kilometraje_actual).replace(/[^0-9.-]+/g, '')) || 0,
            kmUltimaMantencion: kmUltMant,
            intervaloMantencionKm: kmInterv,
            kmPromedioDia: v.km_promedio_dia || detalles.km_promedio_dia || 150,
            fechaUltimaMantencion: (v.fecha_ultima_mantencion || detalles.fecha_ultima_mantencion) ? new Date(v.fecha_ultima_mantencion || detalles.fecha_ultima_mantencion) : null,
            fechaActualizacionKm: v.fecha_actualizacion_km ? new Date(v.fecha_actualizacion_km) : new Date(),
            pautasSecuenciaMapeada: [] // Not strictly needed for basic status if we assume simplistic calculation
          };
        });
        setDbVehiculos(mapped);
      }
    };
    fetchVehs();
  }, [currentCompany?.id]);\n  ` + content.slice(insertIndex);
}

// Ensure dbVehiculos is in the dependency array of useMemo
content = content.replace("  }, [ordenesTrabajo, vehiculos]);", "  }, [ordenesTrabajo, vehiculos, dbVehiculos]);");

fs.writeFileSync(file, content);
console.log('Fixed DB fetch in dashboard');
