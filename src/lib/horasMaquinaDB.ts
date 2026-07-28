import { supabase } from './supabase';

export interface HorasMaquinaRecord {
  id: string;
  fecha: string; // YYYY-MM-DD
  turno: 'a' | 'b' | string; // 'a'=noche, 'b'=día
  equipo: string;
  horometroInicial: number;
  horometroFinal: number;
  operador: string;
  vueltas: number;
  observacion: string; // F/S, Disponible, etc.
  checklist: string; // Ok, Pendiente, etc.
  horasOperativas: number; // Final - Inicial
  horasRedondeadas: number;
  combustibleL: number;
  created_at?: string;
}

const DB_NAME = 'HorasMaquinaDB';
const DB_VERSION = 1;
const STORE_NAME = 'registros_maquina';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB no está soportado en este navegador.'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('fecha', 'fecha', { unique: false });
        store.createIndex('equipo', 'equipo', { unique: false });
        store.createIndex('turno', 'turno', { unique: false });
      }
    };
  });
}

// Convert DB format to Record format
function mapFromSupabase(row: any): HorasMaquinaRecord {
  return {
    id: row.id,
    fecha: row.fecha,
    turno: row.turno || 'b',
    equipo: row.equipo,
    horometroInicial: Number(row.horometro_inicial || 0),
    horometroFinal: Number(row.horometro_final || 0),
    operador: row.operador || 'Sin Operador',
    vueltas: Number(row.vueltas || 0),
    observacion: row.observacion || 'Disponible',
    checklist: row.checklist || 'OK',
    horasOperativas: Number(row.horas_operativas || 0),
    horasRedondeadas: Number(row.horas_redondeadas || 0),
    combustibleL: Number(row.combustible_l || 0),
    created_at: row.created_at
  };
}

// Convert Record format to DB format
function mapToSupabase(rec: HorasMaquinaRecord) {
  return {
    id: rec.id,
    fecha: rec.fecha,
    turno: rec.turno,
    equipo: rec.equipo,
    horometro_inicial: rec.horometroInicial,
    horometro_final: rec.horometroFinal,
    operador: rec.operador,
    vueltas: rec.vueltas,
    observacion: rec.observacion,
    checklist: rec.checklist,
    horas_operativas: rec.horasOperativas,
    horas_redondeadas: rec.horasRedondeadas,
    combustible_l: rec.combustibleL
  };
}

export async function getAllHorasMaquina(): Promise<HorasMaquinaRecord[]> {
  // Try loading from Supabase first
  try {
    const { data, error } = await supabase
      .from('horas_maquina')
      .select('*')
      .order('fecha', { ascending: false });

    if (!error && data) {
      const records = data.map(mapFromSupabase);
      // Cache in IndexedDB for offline / quick load
      await saveLocalIndexedDB(records);
      return records;
    }
  } catch (err) {
    console.warn('Supabase no disponible o error al consultar, leyendo de IndexedDB local:', err);
  }

  // Fallback to IndexedDB
  return getLocalIndexedDB();
}

async function getLocalIndexedDB(): Promise<HorasMaquinaRecord[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result as HorasMaquinaRecord[];
        results.sort((a, b) => (b.fecha > a.fecha ? 1 : b.fecha < a.fecha ? -1 : 0));
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Error abriendo IndexedDB:', err);
    const local = localStorage.getItem('horas_maquina_records');
    return local ? JSON.parse(local) : [];
  }
}

async function saveLocalIndexedDB(records: HorasMaquinaRecord[]): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      for (const rec of records) {
        store.put(rec);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Error guardando en IndexedDB:', err);
  }
}

export async function saveAllHorasMaquina(records: HorasMaquinaRecord[]): Promise<void> {
  // Always update local IndexedDB first for instant UI response
  await saveLocalIndexedDB(records);

  // Bulk upsert to Supabase in chunks of 500
  try {
    const CHUNK_SIZE = 500;
    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
      const chunk = records.slice(i, i + CHUNK_SIZE).map(mapToSupabase);
      await supabase.from('horas_maquina').upsert(chunk, { onConflict: 'id' });
    }
  } catch (err) {
    console.warn('No se pudo sincronizar en lote con Supabase:', err);
  }
}

export async function addHorasMaquinaRecord(record: HorasMaquinaRecord): Promise<void> {
  // Save locally
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(record);
  } catch (e) {
    console.error(e);
  }

  // Sync to Supabase
  try {
    await supabase.from('horas_maquina').upsert([mapToSupabase(record)], { onConflict: 'id' });
  } catch (err) {
    console.warn('Error guardando en Supabase:', err);
  }
}

export async function updateHorasMaquinaRecord(record: HorasMaquinaRecord): Promise<void> {
  return addHorasMaquinaRecord(record);
}

export async function deleteHorasMaquinaRecord(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
  } catch (e) {
    console.error(e);
  }

  try {
    await supabase.from('horas_maquina').delete().eq('id', id);
  } catch (err) {
    console.warn('Error eliminando en Supabase:', err);
  }
}

export async function clearHorasMaquinaRecords(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    localStorage.removeItem('horas_maquina_records');
  } catch (e) {
    console.error(e);
  }

  try {
    await supabase.from('horas_maquina').delete().neq('id', '0');
  } catch (err) {
    console.warn('Error limpiando tabla en Supabase:', err);
  }
}

export function generateSampleDataset(): HorasMaquinaRecord[] {
  return [];
}

