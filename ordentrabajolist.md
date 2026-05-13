{% extends "flota/base.html" %}
{% load static %}
{% load format_tags %}

{% block title %}Órdenes de Trabajo{% endblock %}

{% block extra_head %}
    <style>
        /* Estilos de Estado */
        .ot-status { display: inline-block; padding: 0.25rem 0.75rem; font-size: 0.75rem; font-weight: 700; color: white !important; border-radius: 9999px; text-align: center; min-width: 110px; }
        .status-PENDIENTE { background-color: #f59e0b; } .status-EN_PROCESO { background-color: #3b82f6; } .status-PAUSADA { background-color: #f97316; } .status-CERRADA_MECANICO { background-color: #6b7280; } .status-FINALIZADA { background-color: #16a34a; } .status-POR_ASIGNAR { background-color: #ef444499; }

        /* Estética Premium */
        .premium-modal { border-radius: 2.5rem !important; border: none !important; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25) !important; }
        .section-header-cyan { font-size: 0.75rem; font-weight: 900; color: #0891B2; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1.2rem; display: flex; align-items: center; gap: 10px; margin-top: 1rem; }
        .section-header-cyan::after { content: ''; height: 2px; background: #f1f5f9; flex: 1; }

        /* Inputs Estilizados */
        .modal-body input, .modal-body select, .modal-body textarea {
            background-color: #f8fafc !important; border: 2px solid transparent !important; border-radius: 1rem !important;
            font-weight: 700 !important; font-size: 0.85rem !important; padding: 0.75rem 1rem !important;
        }
        .modal-body input:focus { border-color: #0891B2 !important; background-color: white !important; outline: none !important; }

        /* Tarjetas de Ruedas */
        .rueda-card { background: white; border-radius: 1.5rem; padding: 1.2rem; border: 2px solid #f1f5f9; transition: all 0.2s; }
        .rueda-card:hover { border-color: #0891B2; transform: translateY(-3px); }

        .table-container { overflow: auto; max-height: calc(100vh - 200px); border: 1px solid #e5e7eb; border-radius: 0.5rem; }
        .div-style { background-color: var(--card-base-bg); border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); padding-bottom: 1.5rem; }
    </style>
{% endblock %}

{% block content %}
<div class="space-y-8">
    <!-- CABECERA -->
    <div class="flex flex-wrap items-center justify-between gap-4 border-b border-input-border pb-3 mb-6">
        <div class="flex items-center">
            <h1 class="text-3xl font-bold text-text-primary">{% if es_mecanico %}Mis OTs Asignadas{% else %}Órdenes de Trabajo{% endif %}</h1>
            {% if puede_gestionar_tareas_y_personal %}
                <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center ml-4">
                    <div class="p-3 rounded-full bg-green-100 text-green-600 mr-4"><i class="fas fa-dollar-sign fa-lg"></i></div>
                    <div>
                        <p class="text-sm font-medium text-gray-500">Costo Total OTs</p>
                        <p class="text-2xl font-bold text-gray-800">${{ costo_total_ot|chile_number }}</p>
                    </div>
                </div>
            {% endif %}
        </div>

        <!-- BLOQUE DE ACCIONES (BOTONES) -->
        <div class="flex items-center gap-2">
            {% if puede_gestionar_tareas_y_personal %}
                <a href="{% url 'export_ots_excel' %}?{{ request.GET.urlencode }}" class="btn-secondary inline-flex items-center">
                    <i class="fas fa-file-excel mr-2 text-green-600"></i> Exportar Excel
                </a>
            {% endif %}

            {% if perms.flota.add_ordendetrabajo %}
                <button type="button" class="btn-primary" data-bs-toggle="modal" data-bs-target="#modalCrearOT">
                    <i class="fas fa-plus-circle mr-2"></i> Crear Nueva Orden de Trabajo
                </button>
            {% endif %}
        </div>
    </div>

    <!-- FILTROS -->
    <div class="card-style mb-4">
        <h2 class="text-xl font-semibold text-text-primary flex items-center gap-3 mb-6"><i class="fas fa-filter text-accent"></i> Filtros</h2>
        <form id="ot-filter-form" method="get">
            <div class="flex flex-wrap items-end gap-3">
                <div class="flex-grow min-w-[180px]">{{ filtro_form.vehiculo }}</div>
                <div class="flex-grow min-w-[150px]">{{ filtro_form.tipo }}</div>
                <div class="flex-grow min-w-[150px]">{{ filtro_form.estado }}</div>
                <button type="submit" class="btn-primary">Aplicar</button>
                <a href="{% url 'ot_list' %}" class="btn-secondary">Limpiar</a>
                <button type="button" id="toggle-advanced-filters" class="btn-secondary">Avanzados</button>
            </div>
        </form>
    </div>

    <!-- TABLA DE LISTADO -->
    <div class="table-container div-style">
        <table class="w-full text-sm text-left text-text-secondary">
            <thead class="text-xs text-text-secondary uppercase bg-bg-secondary">
                <tr>
                    <th class="px-6 py-3">Folio</th>
                    <th class="px-6 py-3">Vehículo</th>
                    <th class="px-6 py-3">Tipo</th>
                    <th class="px-6 py-3">Estado</th>
                    <th class="px-6 py-3">Acciones</th>
                </tr>
            </thead>
            <tbody>
                {% for ot in ordenes %}
                <tr class="bg-card-base-bg border-b border-input-border hover:bg-bg-secondary">
                    <td class="px-6 py-4 font-bold text-text-primary">{{ ot.folio }}</td>
                    <td class="px-6 py-4">{{ ot.vehiculo.numero_interno }} - {{ ot.vehiculo.patente }}</td>
                    <td class="px-6 py-4">{{ ot.get_tipo_display }}</td>
                    <td class="px-6 py-4"><span class="ot-status status-{{ ot.estado }}">{{ ot.get_estado_display }}</span></td>
                    <td class="px-6 py-4 flex gap-2">
                        <a href="{% url 'ot_detail' pk=ot.pk %}" class="btn-primary !py-1 !px-3 !text-xs">Ver</a>
                        {% if perms.flota.change_ordendetrabajo %}
                            <a href="{% url 'ot_edit' pk=ot.pk %}" class="btn-secondary !py-1 !px-3 !text-xs">Editar</a>
                        {% endif %}
                        <!-- COMANDO ELIMINAR RESTAURADO -->
                        {% if perms.flota.delete_ordendetrabajo %}
                            <form action="{% url 'ot_delete' pk=ot.pk %}" method="post" class="inline" onsubmit="return confirm('¿Está seguro de eliminar permanentemente la OT {{ ot.folio }}?');">
                                {% csrf_token %}
                                <button type="submit" class="bg-red-500 hover:bg-red-600 text-white font-bold !py-1 !px-3 !text-xs rounded-lg transition-colors">
                                    Eliminar
                                </button>
                            </form>
                        {% endif %}
                    </td>
                </tr>
                {% endfor %}
            </tbody>
        </table>
    </div>
</div>

<!-- MODAL CREAR OT (CON MEJORAS DE PIZARRA) -->
<div class="modal fade" id="modalCrearOT" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content premium-modal">
            <form method="post" id="form-crear-ot" enctype="multipart/form-data" novalidate>
                {% csrf_token %}
                <div class="modal-header border-0 p-5 pb-0">
                    <h5 class="text-2xl font-black text-gray-800"><i class="fas fa-plus-circle text-cyan-600 mr-2"></i> Crear Orden de Trabajo</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>

                <div class="modal-body p-5" style="max-height: 75vh; overflow-y: auto;">
                    <div class="space-y-8">

                        <!-- SECCIÓN 1: IDENTIFICACIÓN -->
                        <div>
                            <div class="section-header-cyan">Identificación del Trabajo</div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Vehículo</label>{{ form.vehiculo }}</div>
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Tipo de OT</label>{{ form.tipo }}</div>
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Kilometraje Apertura</label>{{ form.kilometraje_apertura }}</div>
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Prioridad</label>{{ form.prioridad }}</div>
                            </div>
                        </div>

                        <!-- SECCIÓN DINÁMICA: NEUMÁTICOS -->
                        <div id="seccion-neumaticos-ot" class="hidden bg-slate-50 p-6 rounded-[2rem] border-2 border-dashed border-slate-200">
                            <div class="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                                <div>
                                    <h4 class="text-sm font-black text-cyan-700 uppercase">Inspección Tren Motriz</h4>
                                    <p class="text-[9px] text-slate-400 font-bold uppercase">Define ejes y captura datos mecánicos</p>
                                </div>
                                <select id="selector-tren-motriz" class="form-select form-select-sm w-auto font-black rounded-xl border-cyan-600 text-cyan-600 shadow-sm">
                                    <option value="">Configuración Ejes...</option>
                                    <option value="4x2">4x2 (6 Ruedas)</option>
                                    <option value="6x2">6x2 (8 Ruedas)</option>
                                    <option value="6x4">6x4 (10 Ruedas)</option>
                                    <option value="8x4">8x4 (12 Ruedas)</option>
                                </select>
                            </div>
                            <div id="contenedor-ruedas-dinamico" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <p class="text-center text-slate-300 text-xs font-bold py-6 col-span-full italic">Seleccione la configuración para dibujar el camión.</p>
                            </div>
                        </div>

                        <!-- SECCIÓN 2: DATOS TÉCNICOS -->
                        <div id="campos-especificos-ot">
                            <div class="section-header-cyan">Detalles Técnicos</div>
                            <div class="space-y-4">
                                <div id="container-pauta_mantenimiento" class="hidden">
                                    <label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Pauta Mantenimiento</label>
                                    {{ form.pauta_mantenimiento }}
                                </div>
                                <div id="container-kit_de_repuestos" class="hidden">
                                    <label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Kit Repuestos</label>
                                    {{ form.kit_de_repuestos }}
                                </div>
                                <div id="container-tipo_falla" class="hidden">
                                    <label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Tipo de Falla</label>
                                    {{ form.tipo_falla }}
                                </div>
                                <div id="container-sintomas_reportados" class="hidden">
                                    <label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Síntomas</label>
                                    {{ form.sintomas_reportados }}
                                </div>
                            </div>
                        </div>

                        <!-- SECCIÓN 3: PERSONAL Y PROGRAMACIÓN -->
                        <div>
                            <div class="section-header-cyan">Asignación y Tiempo</div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div class="md:col-span-2"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Personal Operativo</label>{{ form.personal_asignado }}</div>
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Fecha Programada</label>{{ form.fecha_programada }}</div>
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Fecha Apertura</label>{{ form.fecha_creacion }}</div>
                            </div>
                        </div>

                        <!-- SECCIÓN 4: PROVEEDOR Y COSTOS -->
                        <div>
                            <div class="section-header-cyan">Gestión Administrativa</div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Proveedor</label>{{ form.formato }}</div>
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Empresa Externa</label>{{ form.empresa_manual }}</div>
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1">RUT Empresa</label>{{ form.rut_empresa_manual }}</div>
                                <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Valor HH</label>{{ form.valor_hh_manual }}</div>
                                <div class="md:col-span-2"><label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Presupuesto Aprobado</label>{{ form.presupuesto_manual }}</div>
                            </div>
                        </div>

                        <div><label class="block text-[10px] font-black text-gray-400 uppercase mb-1">Observaciones</label>{{ form.observacion_inicial }}</div>

                    </div>
                </div>

                <div class="modal-footer border-0 p-5 pt-0">
                    <button type="button" class="btn btn-link text-gray-400 font-bold text-decoration-none" data-bs-dismiss="modal">Cancelar</button>
                    <button type="submit" class="btn-primary !py-4 !px-12 !rounded-2xl shadow-xl">GENERAR ORDEN DE TRABAJO</button>
                </div>
            </form>
        </div>
    </div>
</div>
{% endblock %}

{% block extra_scripts %}
    {{ block.super }}
    <script>
        $(document).ready(function() {
            const modal = $('#modalCrearOT');
            const selectVehiculo = modal.find('select[name="vehiculo"]');
            const selectTipo = modal.find('select[name="tipo"]');
            const selectorTren = $('#selector-tren-motriz');
            const containerNeum = $('#seccion-neumaticos-ot');
            const gridNeum = $('#contenedor-ruedas-dinamico');

            function toggleFields() {
                const tipo = selectTipo.val();
                $('#container-pauta_mantenimiento, #container-kit_de_repuestos, #container-tipo_falla, #container-sintomas_reportados').hide();

                if (tipo === 'PREVENTIVA') { $('#container-pauta_mantenimiento, #container-kit_de_repuestos').show(); }
                else if (tipo === 'CORRECTIVA') { $('#container-tipo_falla').show(); }
                else if (tipo === 'EVALUATIVA') { $('#container-tipo_falla, #container-sintomas_reportados').show(); }

                if (tipo === 'EVALUATIVA') containerNeum.slideDown();
                else containerNeum.slideUp();
            }

            function dibujarRuedas() {
                const config = selectorTren.val();
                if (!config) { gridNeum.html('<p class="col-span-full text-center text-slate-300 text-xs py-4">Seleccione configuración.</p>'); return; }

                const configuraciones = { '4x2': [2, 4], '6x2': [2, 2, 4], '6x4': [2, 4, 4], '8x4': [2, 2, 4, 4] };
                const ejes = configuraciones[config];
                let html = '';
                let ruedaNum = 1;

                ejes.forEach((numRuedas, indexEje) => {
                    html += `<div class="col-span-full text-[9px] font-black text-slate-400 uppercase mt-4 mb-1">Eje ${indexEje + 1}</div>`;
                    for (let i = 0; i < numRuedas; i++) {
                        html += `
                            <div class="rueda-card">
                                <div class="flex justify-between items-center mb-3">
                                    <span class="text-[10px] font-black text-cyan-600 uppercase">Posición ${ruedaNum}</span>
                                    <input type="text" name="neum_dot_${ruedaNum}" placeholder="N° Fuego" class="form-control form-control-sm w-32 font-bold !text-[9px]">
                                </div>
                                <div class="grid grid-cols-2 gap-2 mb-3">
                                    <input type="number" name="neum_psi_${ruedaNum}" placeholder="PSI" class="form-control form-control-sm text-center font-bold">
                                    <input type="number" step="0.1" name="neum_mm_${ruedaNum}" placeholder="mm" class="form-control form-control-sm text-center font-bold">
                                </div>
                                <div class="relative">
                                    <input type="file" name="neum_foto_${ruedaNum}" class="form-control form-control-sm !py-1 !text-[8px]">
                                </div>
                            </div>
                        `;
                        ruedaNum++;
                    }
                });
                gridNeum.html(html);
            }

            modal.on('shown.bs.modal', function () {
                modal.find('.select2-field, select').select2({ theme: "default", width: '100%', dropdownParent: modal });
                toggleFields();
            });

            selectTipo.on('change', toggleFields);
            selectorTren.on('change', dibujarRuedas);
        });
    </script>
{% endblock %}
