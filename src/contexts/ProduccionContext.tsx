import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface MetasObjetivos {
  daily: number;
  weekly: number;
  monthly: number;
}

export interface GlobalStats {
  rajoTotal: number;
  millingTotal: number;
  stockpile: number;
  transported: number;
  dispatchesCount: number;
  arrivedCount: number;
  inTransitCount: number;
  alertsCount: number;
}

export interface TruckDispatch {
  id: string;
  patente: string;
  chofer: string;
  carga: number;
  tipo: string;
  salida: string;
  eta: string;
  progress: number;
  status: 'arrived' | 'transit' | 'alert';
  arribo?: string;
}

export interface HistoryLogItem {
  fecha: string;
  hora: string;
  unidad: string;
  vuelta: number | string;
  toneladas: number;
  tipoSal: string;
  chofer: string;
  suceso: string;
  notas: string;
}

interface ProduccionContextData {
  metas: MetasObjetivos;
  setMetas: React.Dispatch<React.SetStateAction<MetasObjetivos>>;
  stats: GlobalStats;
  trucks: TruckDispatch[];
  history: HistoryLogItem[];
  handleReporteProduccion: (ext: number, mol: number, stock: number, fecha: string, hora: string) => void;
  handleReporteTransporte: (camion: string, chofer: string, vuelta: number, ton: number, tipo: string, suceso: string, notas: string, fecha: string, hora: string) => void;
}

const ProduccionContext = createContext<ProduccionContextData>({} as ProduccionContextData);

export function ProduccionProvider({ children }: { children: ReactNode }) {
  const [metas, setMetas] = useState<MetasObjetivos>({
    daily: 5000,
    weekly: 18000,
    monthly: 75000,
  });

  const [stats, setStats] = useState<GlobalStats>({
    rajoTotal: 4850,
    millingTotal: 3200,
    stockpile: 15400,
    transported: 2650,
    dispatchesCount: 85,
    arrivedCount: 82,
    inTransitCount: 2,
    alertsCount: 1,
  });

  const [trucks, setTrucks] = useState<TruckDispatch[]>([
    { id: "TR-12", patente: "FL-TY-88", chofer: "Manuel Colque", carga: 32, tipo: "Sal Fina", salida: "13:10", eta: "14:23", progress: 100, status: "arrived", arribo: "14:23" },
    { id: "TR-05", patente: "GK-RE-94", chofer: "Hugo Flores", carga: 30, tipo: "Sal Gruesa", salida: "13:45", eta: "15:02", progress: 65, status: "transit" },
    { id: "TR-09", patente: "HY-TR-15", chofer: "Claudio Carrizo", carga: 32, tipo: "Sal Gruesa", salida: "12:45", eta: "14:15", progress: 100, status: "alert" }
  ]);

  const [history, setHistory] = useState<HistoryLogItem[]>([
    { fecha: "2026-06-09", hora: "13:10", unidad: "TR-12", vuelta: 3, toneladas: 32, tipoSal: "Sal Fina", chofer: "Manuel Colque", suceso: "Normal", notas: "Despacho sin novedades en ruta." },
    { fecha: "2026-06-09", hora: "13:45", unidad: "TR-05", vuelta: 2, toneladas: 30, tipoSal: "Sal Gruesa", chofer: "Hugo Flores", suceso: "Normal", notas: "Tránsito regular por ruta costera." },
    { fecha: "2026-06-09", hora: "12:45", unidad: "TR-09", vuelta: 1, toneladas: 32, tipoSal: "Sal Gruesa", chofer: "Claudio Carrizo", suceso: "Panne Mecánica", notas: "Falla de presión neumática en rampa." },
    { fecha: "2026-06-08", hora: "10:30", unidad: "TR-03", vuelta: 2, toneladas: 35, tipoSal: "Sal Fina", chofer: "Jorge Vera", suceso: "Espera de Carguío", notas: "Demora de 15 minutos en frente de carga." },
    { fecha: "2026-06-08", hora: "15:20", unidad: "TR-11", vuelta: 4, toneladas: 31, tipoSal: "Sal Gruesa", chofer: "Carlos Barraza", suceso: "Normal", notas: "Vuelta óptima." },
    { fecha: "2026-05-28", hora: "08:15", unidad: "TR-05", vuelta: 1, toneladas: 30, tipoSal: "Sal Gruesa", chofer: "Hugo Flores", suceso: "Panne Eléctrica", notas: "Falla de alternador solucionada en taller móvil." }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTrucks(prev => prev.map(truck => {
        if (truck.status === 'transit') {
          const newProgress = Math.min(100, truck.progress + Math.floor(Math.random() * 5) + 2);
          if (newProgress === 100) {
            const ahora = new Date();
            const arribo = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
            setStats(s => ({ ...s, inTransitCount: Math.max(0, s.inTransitCount - 1), arrivedCount: s.arrivedCount + 1 }));
            return { ...truck, progress: 100, status: 'arrived', arribo };
          }
          return { ...truck, progress: newProgress };
        }
        return truck;
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleReporteProduccion = (extraccion: number, molienda: number, stock: number, fecha: string, hora: string) => {
    setStats(s => ({
      ...s,
      rajoTotal: s.rajoTotal + extraccion,
      millingTotal: s.millingTotal + molienda,
      stockpile: stock
    }));
    
    setHistory(prev => [{
      fecha, hora,
      unidad: "PL-CHANC",
      vuelta: 0,
      toneladas: molienda,
      tipoSal: "Sal Gruesa",
      chofer: "Supervisor AOM",
      suceso: "Normal",
      notas: `Producción de Planta: Extracción de ${extraccion} T y molienda de ${molienda} T.`
    }, ...prev]);
  };

  const handleReporteTransporte = (camionId: string, chofer: string, vuelta: number, toneladas: number, tipoSal: string, suceso: string, notas: string, fecha: string, hora: string) => {
    const isPanne = suceso.includes("Panne");
    
    setStats(s => ({
      ...s,
      transported: s.transported + toneladas,
      dispatchesCount: s.dispatchesCount + 1,
      inTransitCount: isPanne ? s.inTransitCount : s.inTransitCount + 1,
      alertsCount: isPanne ? s.alertsCount + 1 : s.alertsCount
    }));

    const ahora = new Date();
    const etaTime = new Date(ahora.getTime() + 75 * 60000);
    const etaStr = `${String(etaTime.getHours()).padStart(2, '0')}:${String(etaTime.getMinutes()).padStart(2, '0')}`;

    setTrucks(prev => [{
      id: camionId,
      patente: "INS-OP-26",
      chofer,
      carga: toneladas,
      tipo: tipoSal,
      salida: hora,
      eta: etaStr,
      progress: 10,
      status: isPanne ? 'alert' : 'transit'
    }, ...prev]);

    setHistory(prev => [{
      fecha, hora,
      unidad: camionId,
      vuelta,
      toneladas,
      tipoSal,
      chofer,
      suceso,
      notas: notas || "Registro estándar de despacho."
    }, ...prev]);
  };

  return (
    <ProduccionContext.Provider value={{ metas, setMetas, stats, trucks, history, handleReporteProduccion, handleReporteTransporte }}>
      {children}
    </ProduccionContext.Provider>
  );
}

export function useProduccion() {
  return useContext(ProduccionContext);
}
