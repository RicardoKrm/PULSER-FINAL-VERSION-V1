import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { supabase, logActividad } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { Search, Filter, FileText, Download, ExternalLink, Bookmark, Clock, Tag, ChevronRight, Hash } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

interface Documento {
  id: string;
  titulo: string;
  descripcion: string;
  archivo_url: string;
  tipo_documento: string;
  marca: string;
  modelo: string;
  anio: number;
  categoria: string;
  etiquetas: string[];
  created_at: string;
  visitas: number;
  empresa_id?: string;
}

export default function BibliotecaExplorador() {
  const [docs, setDocs] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('all');
  const [filterMarca, setFilterMarca] = useState('all');
  
  const { currentCompany } = useCompany();

  useEffect(() => {
    fetchDocs();
  }, [currentCompany]);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      let query = supabase.from('biblioteca_documento').select('*').order('created_at', { ascending: false });
      
      if (currentCompany) {
        query = query.eq('empresa_id', currentCompany.id);
      }
      
      const { data, error } = await query;
      
      if (error) {
        // Table might not exist yet, set empty docs to avoid crash
        console.error("No se pudo cargar la biblioteca. ¿Corriste el script de sql?", error);
        setDocs([]);
      } else {
        setDocs(data as Documento[]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDoc = async (doc: Documento) => {
    // 1. Log activity natively
    logActividad('Biblioteca', 'Consultó Documento', `Abrió "${doc.titulo}" (${doc.tipo_documento})`, currentCompany?.id);
    
    // 2. Increment visitas
    try {
      await supabase.rpc('increment_visita', { doc_id: doc.id });
      // If RPC doesn't exist, ignore or do traditional update
      await supabase.from('biblioteca_documento').update({ visitas: doc.visitas + 1 }).eq('id', doc.id);
    } catch (e) { }

    window.open(doc.archivo_url, '_blank');
  };

  const filteredDocs = docs.filter(doc => {
    const matchesSearch = 
      doc.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (doc.descripcion && doc.descripcion.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doc.marca && doc.marca.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doc.modelo && doc.modelo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doc.etiquetas && doc.etiquetas.some(e => e.toLowerCase().includes(searchTerm.toLowerCase())));
      
    const matchesTipo = filterTipo === 'all' || doc.tipo_documento === filterTipo;
    const matchesMarca = filterMarca === 'all' || doc.marca === filterMarca;
    
    return matchesSearch && matchesTipo && matchesMarca;
  });

  const uniqueMarcas = Array.from(new Set(docs.map(d => d.marca).filter(Boolean)));
  const uniqueTipos = Array.from(new Set(docs.map(d => d.tipo_documento).filter(Boolean)));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-blue-600" />
            Explorar Biblioteca
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Encuentra manuales y documentación técnica en segundos.
          </p>
        </div>
      </div>

      <Card className="p-4 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por palabra clave, etiqueta o equipo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
            />
          </div>
          <div className="md:col-span-3">
            <select 
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white appearance-none focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
            >
              <option value="all">Tipos de Documento</option>
              {uniqueTipos.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="md:col-span-3">
            <select 
              value={filterMarca}
              onChange={(e) => setFilterMarca(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white appearance-none focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
            >
              <option value="all">Todas las Marcas</option>
              {uniqueMarcas.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 mx-auto border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
          <p className="text-slate-500">Buscando en la biblioteca...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <Card className="p-12 text-center text-slate-500 bg-slate-50 dark:bg-slate-800/50 border-dashed">
          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-lg font-medium text-slate-700 dark:text-slate-300">No se encontraron documentos</p>
          <p className="mt-1">Ajusta los filtros de búsqueda o sube nuevos manuales técnicos.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc) => (
            <Card key={doc.id} className="p-0 overflow-hidden flex flex-col hover:shadow-lg transition-shadow border-slate-200 dark:border-slate-700">
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-100 dark:border-blue-800/50">
                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 uppercase font-semibold text-[10px]">
                    {doc.tipo_documento}
                  </Badge>
                </div>
                
                <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-2 mb-1" title={doc.titulo}>
                  {doc.titulo}
                </h3>
                
                <div className="flex items-center gap-2 mb-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                  {doc.marca && <span>{doc.marca}</span>}
                  {doc.marca && doc.modelo && <span>•</span>}
                  {doc.modelo && <span>{doc.modelo}</span>}
                  {doc.anio && <span>• {doc.anio}</span>}
                </div>

                {doc.descripcion && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                    {doc.descripcion}
                  </p>
                )}

                {doc.etiquetas && doc.etiquetas.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                    {doc.etiquetas.slice(0, 3).map((tag, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 focus:outline-none">
                        <Hash className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                    {doc.etiquetas.length > 3 && (
                      <span className="text-[11px] text-slate-400">+{doc.etiquetas.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center group cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" onClick={() => handleOpenDoc(doc)}>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <Clock className="w-4 h-4" />
                  {new Date(doc.created_at).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2 font-semibold text-blue-600 dark:text-blue-500">
                  <span>Visualizar</span>
                  <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
