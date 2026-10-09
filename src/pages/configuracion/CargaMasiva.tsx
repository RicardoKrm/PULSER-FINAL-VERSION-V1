import React, { useState } from 'react';
import { 
  Upload, 
  FileText, 
  Truck, 
  Package, 
  ClipboardList, 
  AlertCircle, 
  Users,
  CheckCircle2,
  XCircle,
  Loader2,
  Building2,
  Wrench,
  Route,
  Fuel,
  Disc,
  FolderOpen,
  Warehouse,
  CalendarCheck,
  FileSignature,
  Box,
  PauseCircle
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { exportToExcel } from '../../lib/excelExport';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';

import { useCompany } from '../../contexts/CompanyContext';

interface UploadModule {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  template?: any[];
}

const parseExcelDate = (excelDate: any) => {
  if (excelDate === null || excelDate === undefined || excelDate === '') return undefined;
  if (typeof excelDate === 'number') {
    const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
    return date.toISOString().split('T')[0]; // Return YYYY-MM-DD
  }
  if (typeof excelDate === 'string') {
    const cleanStr = excelDate.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(cleanStr)) {
       // Si ya tiene el formato ISO
       const parsed = new Date(cleanStr);
       if (!isNaN(parsed.getTime())) return parsed.toISOString();
       return cleanStr.substring(0, 10);
    }
    
    const dateTimeParts = cleanStr.split(/[\sT]+/);
    const datePart = dateTimeParts[0];
    const timePart = dateTimeParts.length > 1 ? dateTimeParts.slice(1).join('') : '';

    const parts = datePart.split(/[-/]/);
    if (parts.length === 3) {
      let [d, m, y] = parts;
      if (d.length === 4) { // Formato YYYY-MM-DD
         let temp = d;
         d = y;
         y = temp;
      }
      if (y.length === 2) y = `20${y}`;
      
      const isoDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      if (timePart) {
         return `${isoDate}T${timePart.length === 5 ? timePart + ':00' : timePart}Z`;
      }
      return isoDate;
    }
    return excelDate;
  }
  return undefined;
};

const parseCurrencyCLP = (val: any) => {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return Math.round(val);
  let str = String(val).trim();
  
  // Keep only digits, dots, commas, and minus signs
  str = str.replace(/[^\d.,-]/g, '');

  const lastDot = str.lastIndexOf('.');
  const lastComma = str.lastIndexOf(',');

  if (lastDot > lastComma) {
    if (lastComma === -1 && str.length - lastDot - 1 === 3) {
      str = str.replace(/\./g, '');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (lastComma > lastDot) {
    if (lastDot === -1 && str.length - lastComma - 1 === 3) {
      str = str.replace(/,/g, '');
    } else {
      str = str.replace(/\./g, '');
      str = str.replace(/,/g, '.');
    }
  } else {
    str = str.replace(/[.,]/g, '');
  }

  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : Math.round(parsed);
};

const normalizeKey = (k: string) => String(k || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

const getValByKey = (obj: any, possibleKeys: string[]) => {
  if (!obj || typeof obj !== 'object') return undefined;
  const keys = Object.keys(obj);
  for (const pk of possibleKeys) {
    const normPk = normalizeKey(pk);
    const foundKey = keys.find(k => normalizeKey(k) === normPk);
    if (foundKey) return obj[foundKey];
  }
  return undefined;
};

const UPLOAD_MAPPING: Record<string, { table: string, matchKey: string | string[], mapConfig: (r: any) => any }> = {
  empleados: { 
    table: 'colaborador', 
    matchKey: 'rut',
    mapConfig: (r: any) => {
      const findKey = (possible: string[]) => {
        const k = Object.keys(r).find(key => possible.some(p => key.toUpperCase().includes(p)));
        return k ? r[k] : undefined;
      };

      const nombre = findKey(['TRABAJADOR', 'NOMBRE', 'NOMBRES']) || '';
      const rut = r.Rut || r.RUT || '';
      const cargo = findKey(['CARGO', 'ROL']) || '';
      
      // Manejo de duplicados en F. CONTRATO
      const fContratoKeys = Object.keys(r).filter(k => k.toUpperCase().includes('F. CONTRATO') || k.toUpperCase().includes('CONTRATO'));
      let fechaContrato;
      let tipoContrato;
      
      if (fContratoKeys.length >= 2) {
        // Asumimos que el primero que parece fecha es la fecha, o el primero es fecha y el segundo tipo
        fechaContrato = parseExcelDate(r[fContratoKeys[0]]);
        tipoContrato = r[fContratoKeys[1]];
      } else if (fContratoKeys.length === 1) {
        // Solo hay uno
        const val = String(r[fContratoKeys[0]]).toUpperCase();
        if (val.includes('INDEFINIDO') || val.includes('FIJO') || val.includes('PLAZO') || val.includes('ART')) {
          tipoContrato = r[fContratoKeys[0]];
        } else {
          fechaContrato = parseExcelDate(r[fContratoKeys[0]]);
        }
      }

      return {
        rut: rut,
        nombre: nombre,
        rol: cargo,
        estado: r.Estado || 'ACTIVO',
        detalles: {
          nombres: r.Nombre || r.Nombres || nombre,
          apellido_paterno: r.Ap_Paterno || '',
          apellido_materno: r.Ap_Materno || '',
          cargo: cargo,
          fecha_contrato: fechaContrato,
          tipo_contrato: tipoContrato || r['TIPO CONTRATO'] || '',
          vencimiento: parseExcelDate(findKey(['VENCIMIENTO', 'VENCE'])),
          turno_asignado: findKey(['TURNO ASIGNADO', 'TURNO']) || '',
          empresa_asignada: findKey(['EMPRESA', 'RAZON SOCIAL']) || '',
          direccion: findKey(['DIRECCION', 'DIRECCIÓN']) || '',
          telefono: findKey(['TELEFONO', 'TELÉFONO', 'CELULAR']) || '',
          sexo: r.Sexo || 'HOMBRE',
          departamento: r.Departament || r.Departamento || '',
          sueldo_base: parseCurrencyCLP(r.Sueldo_Base),
          valor_hh: parseCurrencyCLP(r['HH_$'] || r.Valor_HH),
          hh_extras: parseFloat((r.HH_Extras || '0').toString().replace(/[^0-9.-]+/g,"")),
          prestador_de_servicio: r.Prestador_de_servicio || r.Prestador_de_s || '',
          tipoLicencia: r['TIPO LICENCIA'] || r['TIPO DE LICENCIA'] || '',
          vencimientoLicencia: parseExcelDate(findKey(['VENCIMIENTO LICENCIA', 'VENC. LICENCIA'])),
          vencimientoExamenes: parseExcelDate(findKey(['EXAMEN PREOCUPACIONAL', 'VENC. EXAMEN PREOC.'])),
          estadoExamen: findKey(['ESTADO EXAMEN', 'ESTADO EXAMEN MEDICO']) || 'APTO',
          fechaVacaciones: parseExcelDate(findKey(['INGRESO EMPRESA', 'FECHA INGRESO', 'INGRESO A LA EMPRESA']))
        }
      };
    }
  },
  vehiculos: { 
    table: 'vehiculo', 
    matchKey: 'patente',
    mapConfig: (r: any) => {
      let marca = getValByKey(r, ['marca', 'Marca', 'MARCA']);
      let modelo = getValByKey(r, ['modelo', 'Modelo', 'MODELO']);
      const marcaModeloCombined = getValByKey(r, [
        'marca_modelo', 'marca / modelo', 'marca/modelo', 'marcamodelo', 
        'marca y modelo', 'MARCA / MODELO', 'MARCA/MODELO', 'MARCA Y MODELO'
      ]);

      if (marcaModeloCombined) {
        const str = String(marcaModeloCombined).trim();
        if (str.includes('/')) {
          const parts = str.split('/');
          if (!marca) marca = parts[0]?.trim();
          if (!modelo) modelo = parts.slice(1).join('/').trim();
        } else if (str.includes('-')) {
          const parts = str.split('-');
          if (!marca) marca = parts[0]?.trim();
          if (!modelo) modelo = parts.slice(1).join('-').trim();
        } else {
          if (!modelo) modelo = str;
        }
      }

      // Desacoplar modelo si contiene '/' o la marca al inicio
      if (modelo && String(modelo).includes('/')) {
        const parts = String(modelo).split('/');
        if (!marca) marca = parts[0]?.trim();
        modelo = parts.slice(1).join('/').trim();
      } else if (modelo && marca && String(modelo).toLowerCase().startsWith(String(marca).toLowerCase())) {
        modelo = String(modelo).substring(String(marca).length).replace(/^[-/:\s]+/, '').trim();
      }

      const finalMarca = (marca || r.marca || '').toString().trim();
      const finalModelo = (modelo || r.modelo || '').toString().trim();

      return {
        numero_interno: (getValByKey(r, ['numero_interno', 'numero interno', 'interno', 'NumeroInterno', 'n_interno']) || r.numero_interno)?.toString() || '',
        patente: getValByKey(r, ['patente', 'Patente', 'PATENTE', 'ppu', 'PPU']) || r.patente,
        tipo_vehiculo: getValByKey(r, ['tipo_vehiculo', 'tipo_vehículo', 'tipo', 'TipoVehiculo', 'Tipo']) || r.tipo_vehiculo || r.tipo_vehículo || r.tipo,
        tipo: getValByKey(r, ['tipo_vehiculo', 'tipo_vehículo', 'tipo', 'TipoVehiculo', 'Tipo']) || r.tipo_vehiculo || r.tipo_vehículo || r.tipo,
        marca: finalMarca,
        modelo: finalModelo,
        estado: getValByKey(r, ['estado', 'Estado']) || r.estado || 'OPERATIVO',
        kilometraje_actual: r.kilometraje_actual ? parseFloat(r.kilometraje_actual.toString().replace(/[^0-9.-]+/g,"")) : undefined,
        norma_euro: getValByKey(r, ['norma_euro', 'norma', 'NormaEuro', 'norma euro']) || r.norma_euro,
        tipo_aceite: getValByKey(r, ['tipo_aceite', 'aceite', 'TipoAceite', 'tipo aceite']) || r.tipo_aceite,
        chasis: getValByKey(r, ['chasis', 'vin', 'Chasis', 'VIN', 'n_chasis']) || r.chasis,
        motor: getValByKey(r, ['motor', 'Motor', 'n_motor']) || r.motor,
        razon_social: getValByKey(r, ['razon_social', 'empresa', 'RazonSocial', 'Empresa']) || r.razon_social || r.empresa,
        empresa_nombre: getValByKey(r, ['empresa', 'razon_social', 'Empresa']) || r.empresa || r.razon_social,
        rut: getValByKey(r, ['rut', 'RUT', 'Rut']) || r.rut,
        capacidad_carga: getValByKey(r, ['capacidad_carga', 'CapacidadCarga', 'capacidad']) || r.capacidad_carga,
        aplicacion: getValByKey(r, ['aplicacion', 'Aplicacion', 'operacion']) || r.aplicacion,
        intervalo_km: r.intervalo_km ? parseFloat(r.intervalo_km.toString().replace(/[^0-9.-]+/g,"")) : undefined,
        km_ultima_mantencion: r.km_ultima_mantencion ? parseFloat(r.km_ultima_mantencion.toString().replace(/[^0-9.-]+/g,"")) : undefined,
        km_ult_mantencion: r.km_ultima_mantencion ? parseFloat(r.km_ultima_mantencion.toString().replace(/[^0-9.-]+/g,"")) : undefined,
        fecha_ultima_mantencion: parseExcelDate(r.fecha_ultima_mantencion),
        fecha_ult_mantencion: parseExcelDate(r.fecha_ultima_mantencion),
        tipo_ultimo_mant: r.tipo_ultimo_mant || r.tipo_ult_pauta,
        tipo_ult_pauta: r.tipo_ultimo_mant || r.tipo_ult_pauta,
        detalles: {
          marca: finalMarca,
          modelo: finalModelo,
          vencimientoRev: parseExcelDate(getValByKey(r, ['VENC. REVISION TECNICA', 'REVISION TECNICA', 'REV. TECNICA'])),
          vencimientoPermisoCirculacion: parseExcelDate(getValByKey(r, ['VENC. PERMISO CIRCULACION', 'PERMISO CIRCULACION', 'VENC. PERMISO CIRC.'])),
          vencimientoSeguro: parseExcelDate(getValByKey(r, ['VENC. SEGURO OBLIGATORIO', 'SEGURO OBLIGATORIO', 'VENC. SEGURO']))
        }
      };
    }
  },
  inventario: { 
    table: 'logistica_repuestos', 
    matchKey: 'sku',
    mapConfig: (r: any) => {
      const stock = Number(getValByKey(r, ['stock_actual', 'StockInicial', 'Stock', 'stockinicial', 'stock'])) || 0;
      const minStockRaw = getValByKey(r, ['stock_minim', 'stock_minimo', 'StockMinimo', 'minimo', 'min', 'stock_min']);
      const min_stock = minStockRaw !== undefined && minStockRaw !== '' ? (Number(minStockRaw) || 0) : 0;
      const rawUbic = getValByKey(r, ['ubicacion', 'Ubicacion', 'posicion', 'estante']);
      const rawPos = getValByKey(r, ['posicion', 'Posicion']);
      const ubicacion = (rawUbic || rawPos || '').toString().trim() || 'Sin Ubicación';
      const precio = parseCurrencyCLP(getValByKey(r, ['precio_unitario', 'PrecioUnitario', 'Precio Un.', 'precio_un', 'Precio', 'precio', 'valor_unitario', 'costo_unitario', 'valor', 'costo']));
      return {
        sku: String(getValByKey(r, ['numero_parte', 'Codigo', 'SKU', 'numero', 'parte', 'nro_parte', 'codigo']) || '').trim(),
        nombre: String(getValByKey(r, ['nombre', 'Repuesto', 'descripcion']) || '').trim(),
        calidad: String(getValByKey(r, ['calidad']) || 'ORIGINAL').trim().toUpperCase(),
        stock,
        min_stock,
        ubicacion,
        proveedor: String(getValByKey(r, ['proveedor_habitua', 'proveedor_habitual', 'ProveedorPrincipal', 'Proveedor']) || 'GENERAL').trim(),
        precio,
        valor_total: stock * precio,
        estado: 'ACTIVO'
      };
    }
  },
  bodegas: { 
    table: 'logistica_bodegas', 
    matchKey: 'nombre',
    mapConfig: (r: any) => ({ nombre: r.Nombre, descripcion: r.Descripcion, tipo: r.Tipo, identificador: r.Identificador, proveedor: r.Proveedor, responsable: r.Responsable, ubicacion: r.Ubicacion, estado: r.Estado || 'Activo' }) 
  },
  pautas: { 
    table: 'mantenimiento_pauta', 
    matchKey: 'nombre',
    mapConfig: (r: any) => {
      const rawKm = r.kilometraje_pauta !== undefined ? r.kilometraje_pauta : (r.cronograma_en_km !== undefined ? r.cronograma_en_km : (r.KilometrajeInicial !== undefined ? r.KilometrajeInicial : (r.kilometraje_inicial !== undefined ? r.kilometraje_inicial : 0)));
      const parsedKm = typeof rawKm === 'number' ? rawKm : parseFloat(String(rawKm).replace(/[^0-9.-]+/g, '')) || 0;
      return { 
        nombre: r.nombre_pauta || r.NombrePauta || r.Nombre, 
        kilometraje_inicial: parsedKm,
        intervalo_1: r.intervalo_km || r.Intervalo1 || 0,
        intervalo_2: r['intervalo_km 2'] || r.intervalo_km_2 || r.Intervalo2 || null,
        tipo_aplicacion: r.tipo_aplicacion || r['tipo_aplicación'] || r.TipoAplicacion || r['descrip_1°_pauta'] || r.descrip_1_pauta,
        tipo_aceite: r.tipo_aceite || r.TipoAceite,
        _modelo_nombre: r.nombre_modelo_vehiculo || r.ModeloVehiculo
      };
    }
  },
  tareas: { 
    table: 'mantenimiento_tarea', 
    matchKey: 'descripcion',
    mapConfig: (r: any) => ({ 
      descripcion: r.descripcion || r.Descripcion || r.DescripcionTarea, 
      tiempo_estandar_minutos: r.tiempo_minutos || r.TiempoEstimadoMinutos || 60, 
      costo_mano_obra: r.costo_mano_obra || r.CostoBaseManoObra || 0 
    }) 
  },
  fallas: { 
    table: 'tipo_falla', 
    matchKey: 'descripcion',
    mapConfig: (r: any) => {
      const tfsVal = r.tfs_predeterminado_min !== undefined ? r.tfs_predeterminado_min : (r.tfs_predeterminado_horas !== undefined ? r.tfs_predeterminado_horas : r.tfs_predeterminado_n);
      return {
        descripcion: r.descripcion,
        modelo_afectado: r.modelo_afectado,
        criticidad: r.criticidad,
        causa: r.causa,
        tfs_predeterminado_horas: tfsVal !== undefined ? parseFloat(tfsVal.toString().replace(',', '.')) : 0,
        nombre: r.descripcion
      };
    } 
  },
  pausas: { 
    table: 'tipo_pausa', 
    matchKey: 'nombre',
    mapConfig: (r: any) => ({
      nombre: r['Nombre del Motivo'] || r.nombre_del_motivo || r.nombre || r.NombreDelMotivo,
      descripcion: r.Descripción || r.descripcion || '',
      color: 'bg-slate-500',
      impacto: 'Medio',
      estado: 'Activo'
    }) 
  },
  proveedores: { 
    table: 'proveedores_directorio', 
    matchKey: 'rut',
    mapConfig: (r: any) => ({ rut: r.Rut, nombre: r.RazonSocial || r.Nombre, telefono: r.Telefono, email: r.Email }) 
  },
  kits: { 
    table: 'kit_repuesto', 
    matchKey: 'codigo_kit',
    mapConfig: (r: any) => ({ codigo_kit: r.CodigoKit, nombre: r.Nombre }) 
  },
  rutas: { 
    table: 'ruta', 
    matchKey: 'codigo_ruta',
    mapConfig: (r: any) => ({ codigo_ruta: r.CodigoRuta, origen: r.Origen, destino: r.Destino, distancia_km: r.DistanciaKM, tiempo_estimado_horas: r.TiempoEstimadoHoras, tarifa_base: r.TarifaBase }) 
  },
  neumaticos: { 
    table: 'neumatico', 
    matchKey: 'codigo_interno',
    mapConfig: (r: any) => ({ codigo_interno: r.CodigoInterno, marca: r.Marca, modelo: r.Modelo, medida: r.Medida, estado: r.Estado, patente_asignada: r.PatenteAsignada, posicion: r.Posicion }) 
  },
  combustible: { 
    table: 'registro_combustible', 
    matchKey: 'NONE', // Special case, no matching key
    mapConfig: (r: any) => ({ 
      fecha: r.Fecha ? new Date(r.Fecha).toISOString() : new Date().toISOString(), 
      patente: r.Patente, odometro: r.Odometro, litros: r.Litros, costo_total: r.CostoTotal, proveedor: r.Proveedor, conductor: r.Conductor 
    }) 
  },
  contratos: { 
    table: 'operacion_contrato', 
    matchKey: 'codigo_contrato',
    mapConfig: (r: any) => ({ codigo_contrato: r.CodigoContrato, cliente: r.Cliente, fecha_inicio: r.FechaInicio, fecha_fin: r.FechaFin, monto_mensual: r.MontoMensual }) 
  },
  documental: { 
    table: 'operacion_documento', 
    matchKey: 'referencia',
    mapConfig: (r: any) => ({ entidad: r.Entidad, referencia: r.Referencia, tipo_documento: r.TipoDocumento, fecha_emision: r.FechaEmision, fecha_vencimiento: r.FechaVencimiento }) 
  },
  suministros: { 
    table: 'suministro', 
    matchKey: 'codigo_suministro',
    mapConfig: (r: any) => ({ codigo_suministro: getValByKey(r, ['CodigoSuministro', 'codigo']), nombres: getValByKey(r, ['Nombres', 'nombre']), tipo: getValByKey(r, ['Tipo', 'tipo']), stock: getValByKey(r, ['Stock', 'stock_actual', 'stock']), min_stock: getValByKey(r, ['StockMinimo', 'stock_minimo', 'minimo']) || 0, precio_unitario: parseCurrencyCLP(getValByKey(r, ['PrecioUnitario', 'precio_unitario', 'precio', 'valor'])) }) 
  },
  ots: { 
    table: 'orden_de_trabajo', 
    matchKey: 'folio',
    mapConfig: (r: any) => {
      const getVal = (keywords: string[]) => {
        const key = Object.keys(r).find(k => keywords.some(kw => k.toUpperCase().includes(kw)));
        return key ? r[key] : undefined;
      };
      
      const isPreventive = String(r.Tipo || getVal(['TIPO']) || '').toUpperCase().includes('PREVENTIV');
      
      let kmA = getVal(['APERTURA', 'KILOMETRA']); 
      let kmC = getVal(['CIERRE', 'KILOMETRA (1)']);
      // Si ambos tomaron la misma columna pero había dos de km
      const keysKm = Object.keys(r).filter(k => k.toUpperCase().includes('KILOMETRA'));
      if (keysKm.length >= 2) {
          kmA = r[keysKm[0]];
          kmC = r[keysKm[1]];
      }

      return {
        folio: getVal(['FOLIO']) || r.NumeroOT || r.numero_ot || ("OT-" + Math.floor(Math.random()*1000)),
        _patente: getVal(['PATENTE', 'PATE', 'VEHICULO P']),
        _numero_interno: getVal(['INTERNO', 'VEHICULO I']),
        estado: getVal(['ESTADO']) ? String(getVal(['ESTADO'])).toUpperCase() : 'ABIERTA',
        tipo: isPreventive ? 'PREVENTIVA' : 'CORRECTIVA',
        fecha_creacion: parseExcelDate(getVal(['CREACION', 'CREA'])),
        fecha_programada: parseExcelDate(getVal(['CREACION', 'CREA'])),
        inicio_proceso: parseExcelDate(getVal(['CREACION', 'CREA'])),
        termino_proceso: parseExcelDate(getVal(['CIERRE', 'CIE'])),
        kilometraje_apertura: parseFloat(String(kmA || 0).replace(/[^0-9.-]+/g,"")),
        kilometraje_cierre: kmC ? parseFloat(String(kmC).replace(/[^0-9.-]+/g,"")) : undefined,
        tecnico_responsable: getVal(['RESPONS', 'TECNI']),
        costo_insumos: parseCurrencyCLP(getVal(['INSUM'])),
        costo_mano_obra_tareas: parseCurrencyCLP(getVal(['MANO', 'COSTO MA'])),
        observacion_inicial: getVal(['TAREA', 'OBSERV']),
        tipo_falla: getVal(['FALLA'])
      };
    }
  },
  reservas: { 
    table: 'operacion_reserva', 
    matchKey: 'codigo_reserva',
    mapConfig: (r: any) => ({ codigo_reserva: r.CodigoReserva, cliente: r.Cliente, fecha_servicio: r.FechaServicio, origen: r.Origen, destino: r.Destino, pasajeros: r.Pasajeros }) 
  }
};

// Fix table name just in case
UPLOAD_MAPPING.suministros.table = 'suministro';


const MODULES: UploadModule[] = [
  {
    id: 'empleados',
    title: 'Personal y Cargos',
    description: 'Carga masiva de conductores, técnicos y administrativos desde archivo Excel.',
    icon: Users,
    template: [
      { TRABAJADOR: 'Acuña Villagrán Claudio Andrés', RUT: '11.572.766-4', 'F. CONTRATO': '6/17/2026', CARGO: 'CONDUCTOR', 'F. CONTRATO_1': 'PLAZO FIJO', VENCIMIENTO: '10/31/2026', 'TURNO ASIGNADO': '7X7', DIRECCION: 'Av. Siempre Viva 742', TELEFONO: '+56912345678', EMPRESA: 'INVERSIONES IMPERIA SpA', 'TIPO LICENCIA': 'A4', 'VENCIMIENTO LICENCIA': '12/31/2026', 'EXAMEN PREOCUPACIONAL': '12/31/2026', 'ESTADO EXAMEN': 'APTO', 'INGRESO EMPRESA': '06/17/2026' }
    ]
  },
  {
    id: 'vehiculos',
    title: 'Vehículos de Flota',
    description: 'Importar vehículos nuevos y actualizar flota existente con su información base.',
    icon: Truck,
    template: [
      {
        numero_interno: 1,
        patente: 'SXDR14',
        tipo_vehiculo: 'MINIBUS',
        empresa: 'Transportes alvimar',
        marca: 'M. BENZ',
        modelo: 'SPRINTER VS30.2',
        norma_euro: 'EURO V',
        tipo_aceite: 'SINTÉTICO',
        chasis: '8AC907645RE232278',
        motor: '651958W0153260',
        razon_social: '76.506.145-8', 
        kilometraje_actual: 153304,
        aplicacion: 'CARRETERA',
        intervalo_km: 10000,
        km_ultima_mantencion: 136100,
        fecha_ultima_mantencion: '15-07-25',
        tipo_ultimo_mant: 'SM1',
          'VENC. REVISION TECNICA': '12/31/2026',
          'VENC. PERMISO CIRCULACION': '03/31/2027',
          'VENC. SEGURO OBLIGATORIO': '03/31/2027'
      }
    ]
  },
  {
    id: 'inventario',
    title: 'Inventario de Repuestos',
    description: 'Carga de catálogo de repuestos, precios, stock inicial y proveedores.',
    icon: Package,
    template: [
      { nombre: 'ABRAZADERA 1 PULGADA', numero_parte: 'N3540319:MBB', calidad: 'ORIGINAL', stock_actual: 100, stock_minimo: 2, ubicacion: 'Estante A-4', proveedor_habitual: 'KAUFMANN', precio_unitario: 2000 }
    ]
  },
  {
    id: 'pautas',
    title: 'Pautas de Mantenimiento',
    description: 'Creación de pautas y reglas de mantenimiento preventivo por modelo y kilometraje.',
    icon: FileText,
    template: [
      {
        nombre_pauta: 'SM1',
        ['descrip_1°_pauta']: 'INICIAL X ÚNICA VEZ',
        nombre_modelo_vehiculo: 'O 500 RS E III',
        tipo_aceite: 'MINERAL',
        cronograma_en_km: 5000,
        intervalo_km: 30000,
        intervalo_km_2: ''
      }
    ]
  },
  {
    id: 'tareas',
    title: 'Catálogo de Tareas',
    description: 'Listado de tareas estándar de mantenimiento, con tiempos y costos predeterminados.',
    icon: ClipboardList,
    template: [
      { descripcion: 'Cambio de Aceite Motor', tiempo_minutos: 45, costo_mano_obra: 25000 }
    ]
  },
  {
    id: 'fallas',
    title: 'Tipos de Falla',
    description: 'Carga del catálogo de fallas comunes, sistemas afectados y criticidad.',
    icon: AlertCircle,
    template: [
      { descripcion: 'MOTOR AGRIPADO', modelo_afectado: 'O 500 RS E III', criticidad: 'ALTA', causa: 'MECÁNICA', tfs_predeterminado_min: 20.00 }
    ]
  },
  {
    id: 'pausas',
    title: 'Motivos de Pausa',
    description: 'Carga de motivos para pausar ordenes de trabajo.',
    icon: PauseCircle,
    template: [
      { 'Nombre del Motivo': 'A la espera de Especialista Externo', 'Descripción': 'Esperando personal externo.' }
    ]
  },
  {
    id: 'proveedores',
    title: 'Directorio de Proveedores',
    description: 'Carga de empresas, contactos, condiciones comerciales y evaluaciones base.',
    icon: Building2,
    template: [
      { Rut: '76123456-7', RazonSocial: 'Neumáticos del Sur S.A.', Contacto: 'Ventas', Telefono: '555-1234', Email: 'ventas@neumaticosdelsur.cl', TipoServicio: 'Insumos' }
    ]
  },
  {
    id: 'kits',
    title: 'Kits y Herramientas',
    description: 'Carga de herramientas asignables o kits de mantenimiento prediseñados.',
    icon: Wrench,
    template: [
      { CodigoKit: 'KIT-01', Nombre: 'Kit Cambio Aceite Básico', Componente: 'Filtro Aceite', Cantidad: 1 },
      { CodigoKit: 'KIT-01', Nombre: 'Kit Cambio Aceite Básico', Componente: 'Aceite 15W40 (Lts)', Cantidad: 20 }
    ]
  },
  {
    id: 'bodegas',
    title: 'Directorio de Bodegas',
    description: 'Creación de múltiples sucursales, almacenes y sus datos de ubicación.',
    icon: Warehouse,
    template: [
      { Nombre: 'Bodega Central Antofagasta', Descripcion: 'Bodega principal', Tipo: 'Principal', Identificador: 1, Proveedor: '', Responsable: 'Carlos Silva', Ubicacion: 'Av. Pedro Aguirre Cerda 1234' }
    ]
  },
  {
    id: 'suministros',
    title: 'Catálogo de Suministros',
    description: 'Carga de EPP, consumibles y materiales varios que requiere la operación.',
    icon: Box,
    template: [
      { CodigoSuministro: 'EPP-001', Nombres: 'Casco de Seguridad', Tipo: 'EPP', Stock: 100, StockMinimo: 10, PrecioUnitario: 5000 }
    ]
  },
  {
    id: 'ots',
    title: 'Historial de Órdenes de Trabajo',
    description: 'Importar backlog u órdenes pasadas, cerradas o en curso con costos pre-calculados.',
    icon: ClipboardList,
    template: [
      { NumeroOT: 'OT-1005', Patente: 'AB-CD-12', FechaCreacion: '2023-10-20', Estado: 'Cerrada', TipoMantenimiento: 'Preventivo', CostoTotal: 150000 }
    ]
  }
];

export default function CargaMasiva() {
  const { currentCompany } = useCompany();
  const [draggedOver, setDraggedOver] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, { success: boolean, message: string }>>({});

  const handleDragOver = (e: React.DragEvent, moduleId: string) => {
    e.preventDefault();
    setDraggedOver(moduleId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedOver(null);
  };

  const handleDrop = (e: React.DragEvent, moduleId: string) => {
    e.preventDefault();
    setDraggedOver(null);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
        setSelectedFiles(prev => ({ ...prev, [moduleId]: file }));
        setResults(prev => {
          const newResults = { ...prev };
          delete newResults[moduleId];
          return newResults;
        });
      } else {
        setResults(prev => ({ ...prev, [moduleId]: { success: false, message: "Por favor suba un archivo Excel (.xlsx, .xls) o CSV." } }));
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, moduleId: string) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(prev => ({ ...prev, [moduleId]: files[0] }));
      setResults(prev => {
        const newResults = { ...prev };
        delete newResults[moduleId];
        return newResults;
      });
    }
  };

  const handleUpload = async (moduleId: string) => {
    const file = selectedFiles[moduleId];
    if (!file) return;

    setUploading(prev => ({ ...prev, [moduleId]: true }));
    setResults(prev => {
      const newResults = { ...prev };
      delete newResults[moduleId];
      return newResults;
    });

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (!jsonData || jsonData.length === 0) {
        throw new Error("El archivo está vacío o no se pudo leer correctamente.");
      }

      const config = UPLOAD_MAPPING[moduleId];
      if (!config) {
        throw new Error("Módulo no configurado para carga masiva en el sistema.");
      }

      const mappedData = jsonData.map(config.mapConfig);

      // Limpieza de undefined properties que fallen en Supabase
      let cleanData = mappedData.map(row => {
        const newRow: any = {};
        if (currentCompany) {
          newRow.empresa_id = currentCompany.id;
        }
        for(const [key, val] of Object.entries(row)) {
          if (val !== undefined) newRow[key] = val;
        }
        return newRow;
      });

      if (moduleId === 'pautas') {
        const { data: modelos } = await supabase.from('mantenimiento_modelo_vehiculo')
          .select('id, nombre')
          .eq('empresa_id', currentCompany?.id);
        const modeloMap = new Map();
        if (modelos) {
          modelos.forEach(m => modeloMap.set(m.nombre.toUpperCase(), m.id));
        }

        for (const row of cleanData) {
          const modeloNombre = row._modelo_nombre;
          delete row._modelo_nombre; // Eliminamos la propiedad temporal
          if (modeloNombre) {
            const upperName = String(modeloNombre).toUpperCase();
            if (modeloMap.has(upperName)) {
              row.modelo_vehiculo_id = modeloMap.get(upperName);
            } else {
              // Si no existe el modelo, lo creamos dinámicamente
              const { data: newModelo } = await supabase.from('mantenimiento_modelo_vehiculo')
                .insert({ empresa_id: currentCompany?.id, nombre: modeloNombre })
                .select()
                .single();
              if (newModelo) {
                 modeloMap.set(upperName, newModelo.id);
                 row.modelo_vehiculo_id = newModelo.id;
              }
            }
          }
        }
      }

      if (moduleId === 'ots') {
           let vehiculos: any[] = [];
           let fromV = 0;
           let fetchMoreV = true;
           while (fetchMoreV) {
             const { data: vData } = await supabase.from('vehiculo').select('id, patente, numero_interno').eq('empresa_id', currentCompany?.id).range(fromV, fromV + 999);
             if (vData && vData.length > 0) {
               vehiculos.push(...vData);
               if (vData.length < 1000) fetchMoreV = false;
               else fromV += 1000;
             } else {
               fetchMoreV = false;
             }
           }
           const vMapPatente = new Map();
           const vMapInterno = new Map();
           if (vehiculos) {
               vehiculos.forEach(v => {
                   if (v.patente) vMapPatente.set(v.patente.toUpperCase().trim(), v.id);
                   if (v.numero_interno) vMapInterno.set(String(v.numero_interno).toUpperCase().trim(), v.id);
               });
           }
           
           for (let i = cleanData.length - 1; i >= 0; i--) {
               const row = cleanData[i];
               const p = row._patente ? String(row._patente).toUpperCase().trim() : '';
               const ni = row._numero_interno ? String(row._numero_interno).toUpperCase().trim() : '';
               
               let vId = null;
               const searchKeys = [ni, p, ni.replace(/-/g, ''), p.replace(/-/g, '')].filter(Boolean);
               for (const k of searchKeys) {
                  if (vMapInterno.has(k)) { vId = vMapInterno.get(k); break; }
                  if (vMapPatente.has(k)) { vId = vMapPatente.get(k); break; }
                  
                  if (k.startsWith('DEMO')) {
                    const demoNum = k.replace('DEMO', '');
                    if (vMapInterno.has(demoNum)) { vId = vMapInterno.get(demoNum); break; }
                  }
               }
               
               if (vId) {
                 row.vehiculo_id = vId;
               } else {
                 cleanData.splice(i, 1);
                 console.warn(`Omitiendo OT sin vehículo mapeado: Patente=${p}, Interno=${ni}`);
               }
               
               delete row._patente;
               delete row._numero_interno;
           }
           
           if (cleanData.length === 0) {
             throw new Error("No se pudo asociar ninguna OT a los vehículos existentes. Revise las patentes y números internos.");
           }
      }

      let insertCount = 0;
      let updateCount = 0;

      if (config.matchKey && config.matchKey !== 'NONE') {
        const matchKeyStr = config.matchKey as string;
        const isPautas = moduleId === 'pautas';
        
        let existingRecords: any[] = [];
        let fromIdx = 0;
        let keepFetching = true;

        while (keepFetching) {
          const selectFields = isPautas ? 'id, nombre, modelo_vehiculo_id' : `id, "${matchKeyStr}"`;
          const { data, error: fetchErr } = await supabase
            .from(config.table)
            .select(selectFields)
            .eq('empresa_id', currentCompany?.id)
            .range(fromIdx, fromIdx + 999);
            
          if (fetchErr) break;
          
          if (data && data.length > 0) {
            existingRecords.push(...data);
            if (data.length < 1000) keepFetching = false;
            else fromIdx += 1000;
          } else {
            keepFetching = false;
          }
        }
        
        const normalizeMatchKey = (val: any) => {
           if (val === null || val === undefined) return '';
           return String(val)
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "") // Remove accents
              .toUpperCase()
              .replace(/[^A-Z0-9]/g, ''); // Keep only alphanumeric
        };

        const buildRecordKey = (r: any) => {
          if (isPautas) {
            const modId = r.modelo_vehiculo_id || '';
            const nom = normalizeMatchKey(r.nombre);
            return `${modId}_${nom}`;
          }
          return normalizeMatchKey(r[matchKeyStr]);
        };

        const existingMap = new Map();
        if (existingRecords) {
           existingRecords.forEach(r => {
              const key = buildRecordKey(r);
              if (key) {
                existingMap.set(key, r.id);
              }
           });
        }

        const toInsert = [];
        const toUpdate = [];

        for (const row of cleanData) {
           const key = buildRecordKey(row);
           
           if (key && existingMap.has(key)) {
              toUpdate.push({ ...row, id: existingMap.get(key) });
           } else {
              toInsert.push(row);
           }
        }

        // Dividir inserciones en lotes de 500 para evitar límites de payload
        const chunkSize = 500;
        
        for (let i = 0; i < toInsert.length; i += chunkSize) {
           const chunk = toInsert.slice(i, i + chunkSize);
           const { error: insError } = await supabase.from(config.table).insert(chunk);
           if (insError) throw new Error("Error insertando registros nuevos: " + insError.message);
           insertCount += chunk.length;
        }

        for (let i = 0; i < toUpdate.length; i += chunkSize) {
           const chunk = toUpdate.slice(i, i + chunkSize);
           const { error: updError } = await supabase.from(config.table).upsert(chunk, { onConflict: 'id' });
           if (updError) {
              console.warn("Bulk upsert failed, falling back to sequential update", updError);
              for (const uRow of chunk) {
                 const { id, ...updateData } = uRow;
                 const { error } = await supabase.from(config.table).update(updateData).eq('id', id);
                 if (error) console.error(`Error updating record ${id}:`, error);
              }
           }
           updateCount += chunk.length;
        }

      } else {
        // Dividir en lotes para inserción sin key
        const chunkSize = 500;
        for (let i = 0; i < cleanData.length; i += chunkSize) {
           const chunk = cleanData.slice(i, i + chunkSize);
           const { error } = await supabase.from(config.table).insert(chunk);
           if (error) {
             console.error("Supabase insert error:", error);
             throw new Error(error.message);
           }
           insertCount += chunk.length;
        }
      }

      let otsInicialesCreadas = 0;

      if (moduleId === 'vehiculos' && currentCompany?.id) {
        try {
          // 1. Obtener vehículos de la empresa con km_ultima_mantencion > 0
          const { data: vehsConMant } = await supabase
            .from('vehiculo')
            .select('id, numero_interno, patente, km_ultima_mantencion, fecha_ultima_mantencion, tipo_ultimo_mant')
            .eq('empresa_id', currentCompany.id)
            .gt('km_ultima_mantencion', 0);

          if (vehsConMant && vehsConMant.length > 0) {
            // 2. Obtener OTs existentes para no duplicar si el vehículo ya tiene OT
            const { data: otsExistentes } = await supabase
              .from('orden_de_trabajo')
              .select('id, vehiculo_id, folio')
              .eq('empresa_id', currentCompany.id);

            const vehiculosConOT = new Set((otsExistentes || []).map(o => String(o.vehiculo_id)));
            const vehiculosSinOT = vehsConMant.filter(v => !vehiculosConOT.has(String(v.id)));

            if (vehiculosSinOT.length > 0) {
              // 3. Determinar el mayor número correlativo de folio existente
              let maxFolioNum = 0;
              (otsExistentes || []).forEach(o => {
                const match = String(o.folio || '').match(/OT-(\d+)/i);
                if (match) {
                  const num = parseInt(match[1], 10);
                  if (!isNaN(num)) maxFolioNum = Math.max(maxFolioNum, num);
                }
              });

              // 4. Construir las OTs de línea base
              const otsNuevas = vehiculosSinOT.map(v => {
                maxFolioNum++;
                const folio = `OT-${String(maxFolioNum).padStart(4, '0')}`;
                
                let fechaOT = new Date().toISOString();
                if (v.fecha_ultima_mantencion) {
                  const d = new Date(v.fecha_ultima_mantencion);
                  if (!isNaN(d.getTime())) {
                    fechaOT = d.toISOString();
                  }
                }

                const kmMant = Number(v.km_ultima_mantencion) || 0;
                const pautaNombre = v.tipo_ultimo_mant || 'Mantenimiento Preventivo Inicial';

                return {
                  empresa_id: currentCompany.id,
                  vehiculo_id: v.id,
                  folio: folio,
                  tipo: 'PREVENTIVA',
                  estado: 'FINALIZADA',
                  prioridad: 'NORMAL',
                  kilometraje_apertura: kmMant,
                  kilometraje_cierre: kmMant,
                  fecha_creacion: fechaOT,
                  fecha_programada: fechaOT,
                  inicio_proceso: fechaOT,
                  termino_proceso: fechaOT,
                  pauta: pautaNombre,
                  observacion_inicial: `Línea Base: Mantención ${pautaNombre} registrada a los ${kmMant.toLocaleString('es-CL')} km.`,
                  observaciones: `Orden de trabajo generada automáticamente desde Carga Masiva de Flota para trazabilidad y línea base histórica.`,
                  costo_insumos: 0,
                  costo_mano_obra_tareas: 0,
                  costo_mano_obra_hh: 0,
                  tiempo_trabajado_segundos: 0
                };
              });

              // 5. Insertar OTs iniciales en lotes
              const chunkSizeOT = 500;
              for (let i = 0; i < otsNuevas.length; i += chunkSizeOT) {
                const chunkOT = otsNuevas.slice(i, i + chunkSizeOT);
                const { error: otErr } = await supabase.from('orden_de_trabajo').insert(chunkOT);
                if (otErr) {
                  console.warn("Aviso al crear OTs iniciales de línea base:", otErr);
                } else {
                  otsInicialesCreadas += chunkOT.length;
                }
              }
            }
          }
        } catch (otGenErr) {
          console.error("Error en proceso de generación de OTs iniciales:", otGenErr);
        }
      }

      const msgParts = [];
      if (insertCount > 0) msgParts.push(`${insertCount} nuevos creados`);
      if (updateCount > 0) msgParts.push(`${updateCount} existentes actualizados`);
      if (otsInicialesCreadas > 0) msgParts.push(`${otsInicialesCreadas} OTs iniciales de línea base generadas`);
      if (msgParts.length === 0) msgParts.push("No se modificaron datos");

      setResults(prev => ({ 
        ...prev, 
        [moduleId]: { 
          success: true, 
          message: `Carga completada: ${msgParts.join(' y ')}.` 
        } 
      }));
      
      setSelectedFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[moduleId];
        return newFiles;
      });

    } catch (error: any) {
      setResults(prev => ({ 
        ...prev, 
        [moduleId]: { 
          success: false, 
          message: error.message || "Error al procesar el archivo. Revisa el formato." 
        } 
      }));
    } finally {
      setUploading(prev => ({ ...prev, [moduleId]: false }));
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
          Carga <span className="text-cyan-600">Masiva</span>
        </h1>
        <p className="text-slate-500 font-medium italic mt-1">Importa datos estructurados en lote mediante archivos Excel o CSV.</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {MODULES.map((mod) => {
          const Icon = mod.icon;
          const isDragging = draggedOver === mod.id;
          const selectedFile = selectedFiles[mod.id];
          const isUploading = uploading[mod.id];
          const result = results[mod.id];

          return (
            <div key={mod.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col h-full">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-cyan-600" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg">{mod.title}</h3>
                  <p className="text-slate-500 text-sm font-medium mt-1">{mod.description}</p>
                </div>
              </div>

              <div className="flex flex-col flex-1 gap-4">
                {/* Upload Area */}
                <div 
                  className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 transition-colors relative
                    ${isDragging ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-900/10' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'}
                  `}
                  onDragOver={(e) => handleDragOver(e, mod.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, mod.id)}
                >
                  <input 
                    type="file" 
                    id={`file-${mod.id}`} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    onChange={(e) => handleFileChange(e, mod.id)}
                    disabled={isUploading}
                  />
                  
                  <Upload className={`w-8 h-8 mb-3 ${isDragging ? 'text-cyan-500' : 'text-slate-400'}`} />
                  
                  {selectedFile ? (
                    <div className="text-center">
                      <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                        <span>{selectedFile.name}</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
                      </p>
                    </div>
                  ) : (
                    <div className="text-center pointer-events-none">
                      <p className="font-bold text-slate-600 dark:text-slate-300 text-sm">
                        <span>Arrastra tu archivo aquí</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        <span>o haz click para buscar (.xlsx, .csv)</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Status / Submit */}
                {result && (
                  <div className={`flex items-start gap-3 p-3 rounded-xl text-sm font-bold ${result.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                    {result.success ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <XCircle className="w-5 h-5 flex-shrink-0" />}
                    <span>{result.message}</span>
                  </div>
                )}

                <div className="flex justify-between items-center gap-4 mt-auto pt-2">
                  <button 
                    onClick={() => {
                      if (mod.template) {
                        exportToExcel(mod.template, `Plantilla_${mod.title.replace(/ /g, '_')}`);
                      } else {
                        setResults(prev => ({ ...prev, [mod.id]: { success: false, message: "Plantilla no disponible para este módulo" } }));
                      }
                    }}
                    className="text-xs font-bold text-cyan-600 hover:text-cyan-700 hover:underline bg-transparent border-none cursor-pointer"
                  >
                    Descargar Plantilla
                  </button>
                  <Button 
                    disabled={!selectedFile || isUploading}
                    onClick={() => handleUpload(mod.id)}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl px-6 py-2 h-auto flex items-center gap-2 disabled:opacity-50"
                  >
                    {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span className={isUploading ? 'hidden' : ''}>Cargar Datos</span>
                    <span className={!isUploading ? 'hidden' : ''}>Procesando...</span>
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
