import React, { useState, useEffect } from "react";
import {
  Clock,
  Plus,
  Trash2,
  Search,
  Edit3,
  StopCircle,
  MoreVertical,
  Activity,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import Swal from "sweetalert2";
import { useCompany } from "../../contexts/CompanyContext";
import { supabase } from "../../lib/supabase";

interface TipoPausa {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
  impacto: "Bajo" | "Medio" | "Alto";
  estado: "Activo" | "Inactivo";
}

export default function GestionPausas() {
  const { activeCompanyId } = useCompany();
  const [tiposPausa, setTiposPausa] = useState<TipoPausa[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  // Form state
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [impacto, setImpacto] = useState<"Bajo" | "Medio" | "Alto">("Medio");
  const [color, setColor] = useState("bg-slate-500");
  const [editingPausaId, setEditingPausaId] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setEditingPausaId(null);
    setNombre("");
    setDescripcion("");
    setImpacto("Medio");
    setColor("bg-slate-500");
    setIsModalOpen(true);
  };

  const handleEdit = (pausa: TipoPausa) => {
    setEditingPausaId(pausa.id);
    setNombre(pausa.nombre || "");
    setDescripcion(pausa.descripcion || "");
    setImpacto(pausa.impacto || "Medio");
    setColor(pausa.color || "bg-slate-500");
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (activeCompanyId) {
      fetchPausas();
    }
  }, [activeCompanyId]);

  const fetchPausas = async () => {
    try {
      const { data, error } = await supabase
        .from("tipo_pausa")
        .select("*")
        .eq("empresa_id", activeCompanyId)
        .order("nombre", { ascending: true })
        .limit(10000);

      if (error) throw error;
      setTiposPausa(data || []);
    } catch (err: any) {
      console.error(err);
    }
  };

  const filteredPausas = tiposPausa.filter(
    (p) =>
      (p.nombre || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.descripcion || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredPausas.length / itemsPerPage);
  const paginatedPausas = filteredPausas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre) return;

    try {
      if (editingPausaId) {
        const dbPausa = {
          nombre,
          descripcion,
          color,
          impacto,
        };

        const { error } = await supabase
          .from("tipo_pausa")
          .update(dbPausa)
          .eq("id", editingPausaId);

        if (error) throw error;

        setTiposPausa((prev) =>
          prev.map((p) => (p.id === editingPausaId ? { ...p, ...dbPausa } : p)),
        );

        Swal.fire({
          title: "¡Actualizado!",
          text: "El tipo de pausa ha sido actualizado exitosamente.",
          icon: "success",
          confirmButtonColor: "#4f46e5",
        });
      } else {
        const dbPausa = {
          empresa_id: activeCompanyId,
          nombre,
          descripcion,
          color,
          impacto,
          estado: "Activo",
        };

        const { data, error } = await supabase
          .from("tipo_pausa")
          .insert(dbPausa)
          .select()
          .single();

        if (error) throw error;

        if (data) {
          setTiposPausa((prev) => [...prev, data]);
        }

        Swal.fire({
          title: "¡Guardado!",
          text: "El tipo de pausa ha sido registrado exitosamente.",
          icon: "success",
          confirmButtonColor: "#4f46e5",
        });
      }

      setIsModalOpen(false);
      setEditingPausaId(null);
      setNombre("");
      setDescripcion("");
      setImpacto("Medio");
      setColor("bg-slate-500");
    } catch (err: any) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const handleDelete = (id: string, name: string) => {
    Swal.fire({
      title: "¿Confirmar eliminación?",
      text: `Se eliminará permanentemente el tipo de pausa: "${name}"`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const { error } = await supabase
          .from("tipo_pausa")
          .delete()
          .eq("id", id);
        if (error) {
          Swal.fire("Error", error.message, "error");
        } else {
          setTiposPausa(tiposPausa.filter((f) => f.id !== id));
          Swal.fire(
            "Eliminado!",
            "El tipo de pausa fue borrado exitosamente.",
            "success",
          );
        }
      }
    });
  };

  const colors = [
    "bg-slate-500",
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-emerald-500",
    "bg-cyan-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-fuchsia-500",
    "bg-rose-500",
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
            <StopCircle className="w-8 h-8 text-indigo-600 dark:text-indigo-500" />
            Gestión de Pausas
          </h1>
          <p className="text-slate-500 font-medium mt-1 uppercase tracking-wider text-sm">
            Causas de interrupción de Órdenes de Trabajo.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            className="flex items-center gap-2 font-bold px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
            onClick={handleOpenCreate}
          >
            <Plus className="w-5 h-5" /> Nuevo Tipo
          </Button>
        </div>
      </div>

      {/* Toolbox */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all dark:text-white"
          />
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <div className="px-4 py-1.5 text-sm font-bold text-slate-500 dark:text-slate-400">
            Total:{" "}
            <span className="text-indigo-600 dark:text-indigo-400">
              {tiposPausa.length}
            </span>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-xs font-bold">
              <tr>
                <th className="px-6 py-4">Nombre / ID</th>
                <th className="px-6 py-4">Descripción</th>
                <th className="px-6 py-4 text-center">Impacto</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPausas.map((pausa) => (
                <tr
                  key={pausa.id}
                  className="border-b last:border-0 border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${pausa.color} shadow-sm border border-white dark:border-slate-800`}
                      ></div>
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {pausa.nombre}
                        </div>
                        <div className="text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-500">
                          ID: {pausa.id.slice(0, 5)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td
                    className="px-6 py-3 text-slate-600 dark:text-slate-400 max-w-sm truncate"
                    title={pausa.descripcion}
                  >
                    {pausa.descripcion}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        pausa.impacto === "Alto" || pausa.impacto === "ALTO"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400"
                          : pausa.impacto === "Medio" ||
                              pausa.impacto === "MEDIO"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                      }`}
                    >
                      {pausa.impacto}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        pausa.estado === "Activo"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {pausa.estado}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(pausa)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors inline-block"
                      title="Editar"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(pausa.id, pausa.nombre)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors inline-block"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <span className="text-sm font-medium text-slate-500">
              Página {currentPage} de {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>

      {filteredPausas.length === 0 && (
        <div className="bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center">
          <StopCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-black text-slate-700 dark:text-slate-200 mb-1">
            No hay pausas
          </h3>
          <p className="text-slate-500 text-sm font-medium">
            No se encontraron resultados para tu búsqueda.
          </p>
        </div>
      )}

      {/* Modal - Nuevo Tipo / Editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPausaId ? "Editar Tipo de Pausa" : "Crear Tipo de Pausa"}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
              Nombre de la Pausa *
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none dark:text-white transition-all"
              placeholder="Ej. Falta de Repuestos"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
              Descripción
            </label>
            <textarea
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none dark:text-white transition-all resize-none"
              placeholder="Breve explicación de cuándo usar esta pausa..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                Impacto en Tiempos
              </label>
              <select
                value={impacto}
                onChange={(e) => setImpacto(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none dark:text-white transition-all"
              >
                <option value="Bajo">Bajo</option>
                <option value="Medio">Medio</option>
                <option value="Alto">Alto</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                Color Base
              </label>
              <div className="flex gap-2 bg-slate-50 dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 flex-wrap justify-between items-center h-[42px]">
                {colors.slice(0, 7).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-5 h-5 rounded-full ${c} ${color === c ? "ring-2 ring-offset-1 ring-slate-800 dark:ring-white dark:ring-offset-slate-900" : ""}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-sm shadow-indigo-600/20"
            >
              {editingPausaId ? "Guardar Cambios" : "Crear Pausa"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
