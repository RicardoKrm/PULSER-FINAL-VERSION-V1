import React, { useState, useRef } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';
import { UploadCloud, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function BibliotecaSubir() {
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo_documento: 'Manual de Uso',
    marca: '',
    modelo: '',
    anio: '',
    categoria: 'Mecánica',
    etiquetas: ''
  });
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorInfo, setErrorInfo] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { currentCompany } = useCompany();
  const navigate = useNavigate();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
      } else {
        alert('Solo se permiten archivos PDF.');
      }
    }
  };

  const getSupaUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id;
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert("Debes seleccionar un archivo PDF");
      return;
    }
    
    setUploading(true);
    setErrorInfo('');
    setSuccess(false);

    try {
      // 1. Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
      const filePath = `documentos/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('biblioteca')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Error al subir archivo al Storage. Asegúrate de tener el bucket "biblioteca" creado en Supabase: ${uploadError.message}`);
      }

      // 2. Get Public URL
      const { data: urlData } = supabase.storage
        .from('biblioteca')
        .getPublicUrl(filePath);

      // 3. Insert metadata to postgres
      const supaId = await getSupaUser(); // If user wants it linked to auth
      
      const tagsArray = formData.etiquetas.split(',').map(t => t.trim()).filter(t => t.length > 0);
      
      const { error: dbError } = await supabase.from('biblioteca_documento').insert([{
        empresa_id: currentCompany?.id || null,
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        tipo_documento: formData.tipo_documento,
        marca: formData.marca.toUpperCase(),
        modelo: formData.modelo.toUpperCase(),
        anio: formData.anio ? parseInt(formData.anio) : null,
        categoria: formData.categoria,
        etiquetas: tagsArray,
        archivo_path: filePath,
        archivo_url: urlData.publicUrl
      }]);

      if (dbError) {
        throw new Error(`Error al guardar los metadatos. Verifica que ejecutaste el script SQL de la biblioteca: ${dbError.message}`);
      }

      setSuccess(true);
      setFile(null);
      setFormData({
        ...formData,
        titulo: '',
        descripcion: '',
        etiquetas: ''
      });
      
    } catch (err: any) {
      setErrorInfo(err.message || 'Error desconocido');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <UploadCloud className="w-6 h-6 text-blue-600" />
          Subir Documento Técnico
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Añade nuevos manuales, fichas y especificaciones técnicas a la biblioteca.
        </p>
      </div>

      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 p-4 rounded-xl flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-emerald-800 dark:text-emerald-400">¡Documento subido con éxito!</h3>
            <p className="text-sm text-emerald-600 dark:text-emerald-500 mt-1">El archivo ha sido indexado correctamente.</p>
            <div className="mt-3">
              <Button size="sm" variant="outline" className="border-emerald-200 text-emerald-700" onClick={() => navigate('/biblioteca/explorador')}>
                Ir al explorador
              </Button>
            </div>
          </div>
        </div>
      )}

      {errorInfo && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800 dark:text-red-400">Error durante la subida</h3>
            <p className="text-sm text-red-600 dark:text-red-500 mt-1">{errorInfo}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className="p-6 h-full flex flex-col justify-center">
            <input 
              type="file" 
              accept=".pdf"
              ref={fileInputRef}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden" 
            />
            
            {!file ? (
              <div 
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-10 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <UploadCloud className="w-10 h-10 text-blue-500" />
                </div>
                <h3 className="font-medium text-slate-900 dark:text-white mb-2">Selecciona o arrastra el PDF</h3>
                <p className="text-sm text-slate-500">Solo archivos PDF soportados (Max 50MB)</p>
              </div>
            ) : (
              <div className="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 relative">
                <button 
                  type="button"
                  onClick={() => setFile(null)}
                  className="absolute top-4 right-4 p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg text-blue-600"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                    <File className="w-8 h-8 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white truncate">{file.name}</p>
                    <p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título del Documento *</label>
                <input 
                  required
                  type="text" 
                  value={formData.titulo}
                  onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  placeholder="Ej. Manual de Servicio Avanzado"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo *</label>
                  <select 
                    value={formData.tipo_documento}
                    onChange={(e) => setFormData({...formData, tipo_documento: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option>Manual de Uso</option>
                    <option>Manual de Reparación</option>
                    <option>Ficha Técnica</option>
                    <option>Diagrama Eléctrico</option>
                    <option>Catálogo de Repuestos</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoría</label>
                  <select 
                    value={formData.categoria}
                    onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option>Mecánica</option>
                    <option>Eléctrica</option>
                    <option>Hidráulica</option>
                    <option>Software/Control</option>
                    <option>Carrocería</option>
                    <option>Neumática</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Marca</label>
                  <input 
                    type="text" 
                    value={formData.marca}
                    onChange={(e) => setFormData({...formData, marca: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    placeholder="Ej. Scania"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Modelo</label>
                  <input 
                    type="text" 
                    value={formData.modelo}
                    onChange={(e) => setFormData({...formData, modelo: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    placeholder="Ej. R450"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Año</label>
                <input 
                  type="number" 
                  value={formData.anio}
                  onChange={(e) => setFormData({...formData, anio: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  placeholder="Ej. 2022"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Etiquetas (Separadas por coma)</label>
                <input 
                  type="text" 
                  value={formData.etiquetas}
                  onChange={(e) => setFormData({...formData, etiquetas: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  placeholder="motor, frenos, transmision"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descripción corta (opcional)</label>
                <textarea 
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white h-24 resize-none"
                  placeholder="Detalles sobre este documento..."
                ></textarea>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <Button type="submit" disabled={uploading || !file}>
                {uploading ? 'Subiendo...' : 'Guardar en Biblioteca'}
                {!uploading && <UploadCloud className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </Card>
        </div>
      </form>
    </div>
  );
}
