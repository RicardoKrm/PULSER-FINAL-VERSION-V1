import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardContent } from '../ui/Card';

interface CrearVehiculoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CrearVehiculoModal: React.FC<CrearVehiculoModalProps> = ({ isOpen, onClose }) => {
  const { pautas, modelosVehiculo } = useAppContext();
  
  const [formData, setFormData] = useState({
    numeroInterno: '',
    patente: '',
    normaEuro: '',
    modelo: '',
    tipoAceite: '',
    kilometrajeActual: 0,
    intervaloMantKm: 10000,
    kmUltMant: 0,
    fechaUltMant: '',
    tipoUltPauta: '',
    razonSocial: '',
    rut: '',
    chasis: '',
    motor: '',
    capacidadCarga: '',
    aplicacion: '',
    enOperacionActiva: true
  });

  const [modelosDisponibles, setModelosDisponibles] = useState<string[]>([
    'ACTYON SPORT',
    'MAXUS T60',
    'SPRINTER NCV3',
    'ACTYON SPORT D22',
    'M. BENZ O 500 RS RSD IBC E V'
  ]);

  const [nuevoModeloLocal, setNuevoModeloLocal] = useState('');
  const [showInputModelo, setShowInputModelo] = useState(false);

  const handleAgregarModelo = () => {
    if (showInputModelo) {
      if (nuevoModeloLocal.trim()) {
        setModelosDisponibles([...modelosDisponibles, nuevoModeloLocal.trim()]);
        setFormData(prev => ({ ...prev, modelo: nuevoModeloLocal.trim() }));
        setNuevoModeloLocal('');
      }
      setShowInputModelo(false);
    } else {
      setShowInputModelo(true);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Nuevo Vehículo', formData);
    onClose();
  };

  if (!isOpen) return null;

  const kmDiaAuto = 51.00; // mockup

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800">
        <div className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Crear Nuevo Vehículo</h2>
            <p className="text-sm text-slate-500">Configura los parámetros técnicos y operativos del vehículo.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* INFORMACIÓN BÁSICA */}
            <div>
              <h3 className="text-sm font-bold text-blue-600 mb-4 uppercase">Información Básica</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Número Interno</label>
                  <input type="text" name="numeroInterno" value={formData.numeroInterno} onChange={handleChange} className="w-full px-3 py-2 border rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100 bg-slate-50 border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Patente</label>
                  <input type="text" name="patente" value={formData.patente} onChange={handleChange} className="w-full px-3 py-2 border rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100 bg-slate-50 border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Norma Euro</label>
                  <select name="normaEuro" value={formData.normaEuro} onChange={handleChange} className="w-full px-3 py-2 border rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100 bg-slate-50 border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">---------</option>
                    <option value="EURO V">EURO V</option>
                    <option value="EURO III">EURO III</option>
                    <option value="N/A">N/A</option>
                    <option value="EURO II">EURO II</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Modelo</label>
                  <div className="flex gap-2">
                    {showInputModelo ? (
                      <input 
                        type="text" 
                        placeholder="Nombre nuevo modelo"
                        value={nuevoModeloLocal}
                        onChange={(e) => setNuevoModeloLocal(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100 bg-slate-50 border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAgregarModelo())}
                      />
                    ) : (
                      <select name="modelo" value={formData.modelo} onChange={handleChange} className="w-full px-3 py-2 border rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100 bg-slate-50 border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">---------</option>
                        {modelosDisponibles.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    )}
                    <button type="button" onClick={handleAgregarModelo} className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 w-10 flex items-center justify-center font-bold pb-2">
                      {showInputModelo ? '✓' : '+'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tipo de Aceite</label>
                  <select name="tipoAceite" value={formData.tipoAceite} onChange={handleChange} className="w-full px-3 py-2 border rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100 bg-slate-50 border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">---------</option>
                    <option value="Sintético">Sintético</option>
                    <option value="Mineral">Mineral</option>
                    <option value="Ambos/Mixto">Ambos/Mixto</option>
                  </select>
                </div>
              </div>
            </div>

            <hr className="border-slate-200 dark:border-slate-800" />

            {/* OPERACIÓN Y MANTENIMIENTO */}
            <div>
              <h3 className="text-sm font-bold text-blue-600 mb-4 uppercase">Operación y Mantenimiento</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Kilometraje Actual</label>
                  <input type="number" name="kilometrajeActual" value={formData.kilometrajeActual} onChange={handleChange} className="w-full px-3 py-2 border rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100 bg-slate-50 border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Intervalo Mant. Km</label>
                  <input type="number" name="intervaloMantKm" value={formData.intervaloMantKm} onChange={handleChange} className="w-full px-3 py-2 border rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100 bg-slate-50 border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Km/Día (Auto)</label>
                  <input type="text" readOnly value={kmDiaAuto} className="w-full px-3 py-2 border border-transparent rounded-md bg-slate-100 dark:bg-slate-800/50 dark:text-slate-400 text-slate-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Km Últ. Mant.</label>
                  <input type="number" name="kmUltMant" value={formData.kmUltMant} onChange={handleChange} className="w-full px-3 py-2 border rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100 bg-slate-50 border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Fecha Últ. Mant.</label>
                  <input type="date" name="fechaUltMant" value={formData.fechaUltMant} onChange={handleChange} className="w-full px-3 py-2 border rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100 bg-slate-50 border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tipo Últ. Pauta (Buscador)</label>
                  <select name="tipoUltPauta" value={formData.tipoUltPauta} onChange={handleChange} className="w-full px-3 py-2 border rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100 bg-slate-50 border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Escribe para buscar...</option>
                    {pautas?.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre} - {(p as any).tipoAceite || ''}</option>
                    )) || (
                      <>
                        <option value="SM5-MINERAL">SM5-MINERAL</option>
                        <option value="SI-MINERAL">SI-MINERAL</option>
                        <option value="SM1-MINERAL">SM1-MINERAL</option>
                        <option value="SS1-SINTETICO">SS1-SINTETICO</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
            </div>

            <hr className="border-slate-200 dark:border-slate-800" />

            {/* DATOS ADMINISTRATIVOS */}
            <div>
              <h3 className="text-sm font-bold text-blue-600 mb-4 uppercase">Datos Administrativos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Razón Social</label>
                  <input type="text" name="razonSocial" value={formData.razonSocial} onChange={handleChange} className="w-full px-3 py-2 border rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100 bg-slate-50 border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Rut</label>
                  <input type="text" name="rut" value={formData.rut} onChange={handleChange} className="w-full px-3 py-2 border rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100 bg-slate-50 border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Chasis</label>
                  <input type="text" name="chasis" value={formData.chasis} onChange={handleChange} className="w-full px-3 py-2 border rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100 bg-slate-50 border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Motor</label>
                  <input type="text" name="motor" value={formData.motor} onChange={handleChange} className="w-full px-3 py-2 border rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100 bg-slate-50 border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Capacidad de Carga (m³ / Ton)</label>
                  <input type="number" name="capacidadCarga" value={formData.capacidadCarga} onChange={handleChange} className="w-full px-3 py-2 border rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100 bg-slate-50 border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Opcional" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Aplicación</label>
                  <input type="text" name="aplicacion" value={formData.aplicacion} onChange={handleChange} className="w-full px-3 py-2 border rounded-md dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100 bg-slate-50 border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Opcional (Ej: Urbano, Carretera)" />
                </div>
              </div>
            </div>
            
            <hr className="border-slate-200 dark:border-slate-800" />

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center space-x-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                <input type="checkbox" name="enOperacionActiva" checked={formData.enOperacionActiva} onChange={handleChange} className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4" />
                <span>Vehículo en operación activa</span>
              </label>

              <div className="flex justify-end space-x-3">
                <button type="button" onClick={onClose} className="px-4 py-2 font-bold text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors uppercase">
                  Cancelar
                </button>
                <button type="submit" className="px-6 py-2 bg-[#00B4F0] hover:bg-[#009ccc] text-white font-bold rounded-lg transition-colors uppercase">
                  Guardar Vehículo
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
