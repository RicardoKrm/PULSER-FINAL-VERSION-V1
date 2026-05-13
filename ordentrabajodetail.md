{% extends "flota/base.html" %}
{% load humanize %}
{% load format_tags %}
{% load l10n %}
{% block title %}Detalle OT #{{ ot.folio }}{% endblock %}

{% block extra_head %}
    <style>
        .accordion-content { overflow: hidden; transition: max-height 0.4s ease-out; max-height: 0; }
        .hidden-field { display: none; }
        #kit-validation-results ul { list-style-position: inside; }
        #kit-validation-results li.ok { color: #16a34a; }
        #kit-validation-results li.warning { color: #f59e0b; }
        #kit-validation-results li.error { color: #ef4444; font-weight: bold; }
    </style>
{% endblock %}

{% block content %}
<div class="space-y-6">

    <!-- Encabezado de la página -->
    <div class="flex flex-wrap justify-between items-center gap-4">
        <div>
            <a href="{% url 'ot_list' %}" class="text-sm text-text-secondary hover:text-accent transition-colors"><i class="fas fa-arrow-left mr-2"></i>Volver al listado</a>
            <div class="flex">
                <h1 class="text-3xl font-bold text-text-primary mt-1">Orden de Trabajo #{{ ot.folio }}</h1>
                <span class="inline-block px-4 py-2 text-sm font-bold text-white rounded-lg shadow-md
                    {% if ot.estado == 'PENDIENTE' %}bg-yellow-500{% elif ot.estado == 'EN_PROCESO' %}bg-blue-500{% elif ot.estado == 'PAUSADA' %}bg-orange-500{% elif ot.estado == 'CERRADA_MECANICO' %}bg-gray-500{% elif ot.estado == 'FINALIZADA' %}bg-green-600{% else %}bg-gray-400{% endif %}">
                    {{ ot.get_estado_display }}
                </span>
            </div>
            <div class="flex items-center gap-4 mt-2">
                <p class="text-lg text-text-secondary">{{ ot.vehiculo.numero_interno }} - {{ ot.vehiculo.patente }}</p>
                <a href="{% url 'historial_vehiculo' pk=ot.vehiculo.pk %}" class="text-xs font-semibold text-accent hover:underline">
                    <i class="fas fa-history mr-1"></i> Ver Historial del Vehículo
                </a>
            </div>
        </div>
        <div class="flex items-center gap-3">
            <!-- Botones de Acción Principales -->
            <div class="flex flex-wrap gap-3">
                {% if puede_realizar_acciones_criticas and ot.estado != 'PAUSADA' and ot.estado != 'FINALIZADA' and ot.estado != 'POR_ASIGNAR' and ot.estado != 'CERRADA_MECANICO'%}
                    <button type="button" class="btn-primary !bg-yellow-500 hover:!bg-yellow-600" onclick="openModal('pausarOTModal')"><i class="fas fa-pause mr-2"></i>Pausar OT</button>
                {% endif %}
                {% if puede_realizar_acciones_criticas and ot.estado == 'PAUSADA' %}
                    <form method="post" class="inline">{% csrf_token %}<input type="hidden" name="estado" value="EN_PROCESO"><button type="submit" name="cambiar_estado" class="btn-primary !bg-green-600 hover:!bg-green-700"><i class="fas fa-play mr-2"></i>Reanudar OT</button></form>
                {% endif %}
            </div>
            {% if ot.estado != 'EN_PROCESO' and ot.estado != 'FINALIZADA' and ot.estado != 'PAUSADA' and ot.estado != 'CERRADA_MECANICO'%}
            <form method="post" class="inline">
                {% csrf_token %}
                <button type="submit" name="iniciar_trabajo"
                    class="btn-primary !bg-blue-600 hover:!bg-blue-700">
                    <i class="fas fa-play mr-2"></i>Iniciar trabajos
                </button>
            </form>
            {% endif %}
            {% if ot.estado == 'EN_PROCESO'%}
            <button type="button"
                    class="btn-primary !bg-purple-600 hover:!bg-purple-700"
                    onclick="openModal('solicitudModal')">
                <i class="fas fa-file-alt mr-2"></i> Crear Solicitud
            </button>
            <form method="post" class="inline">
                {% csrf_token %}
                <button type="submit" name="finalizar_trabajo"
                    class="btn-primary !bg-blue-600 hover:!bg-blue-700">
                    <i class="fas fa-play mr-2"></i>Finalizar trabajos
                </button>
            </form>
            {% endif %}
            {% if puede_gestionar_tareas_y_personal %}
                <a href="{% url 'orden_trabajo_edit' pk=ot.pk %}" class="btn-primary inline-flex items-center">
                    <i class="fas fa-edit mr-2"></i> Editar OT
                </a>
                {% if not ot.responsableFirma %}
                    <a href="{% url 'firmar_certificado' pk=ot.pk %}" class="btn-primary inline-flex items-center">
                        <i class="fas fa-edit mr-2"></i> Firmar Certificado
                    </a>
                {% endif %}
            {% endif %}
            <a href="{% url 'generar_ot_pdf' pk=ot.pk %}" target="_blank" class="btn-danger inline-flex items-center">
                <i class="fas fa-file-pdf mr-2"></i> Imprimir OT
            </a>
            {% if ot.responsableFirma %}
                <a href="{% url 'generar_certificado_pdf' pk=ot.pk %}" target="_blank" class="btn-danger inline-flex items-center">
                    <i class="fas fa-file-pdf mr-2"></i> Certificado
                </a>
            {% endif %}
            {% if puede_gestionar_tareas_y_personal %}
            <div class="text-right">
                <p class="text-xs text-text-secondary mt-1">Costo Total: <strong class="text-lg text-green-400">${{ ot.costo_total|chile_number }}</strong></p>
            </div>
            {% endif %}
        </div>
    </div>

    <!-- Alerta de OT Pausada -->
    {% if ot.estado == 'PAUSADA' %}
    <div class="p-4 rounded-lg bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
        <p class="font-bold"><i class="fas fa-exclamation-triangle mr-2"></i>¡OT Pausada!</p>
        <p class="text-sm"><strong>Motivo:</strong> {{ ot.motivo_pausa.nombre|default:"No especificado" }}. {{ ot.notas_pausa }}</p>
    </div>
    {% endif %}
    <div>
        <strong>Tiempo trabajado:</strong>
        <span id="cronometro"></span>
    </div>
    {% if solicitud_pendiente %}
    <div class="p-4 rounded-lg bg-red-100 border-l-4 border-red-500 text-red-700">
        <p class="font-bold">
            <i class="fas fa-exclamation-triangle mr-2"></i>
            Solicitud pendiente
        </p>
    </div>
    {% endif %}
    <!-- Layout principal de dos columnas -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- Columna Izquierda (Principal) -->
        <div class="lg:col-span-2 space-y-6">

            <div class="card-style">
                <h4 class="text-lg font-semibold mb-3"><i class="fas fa-info-circle mr-2 text-accent"></i>Información General</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div class="md:col-span-2">
                        <strong class="block text-sm text-text-secondary">Vehículo (Máquina):</strong>
                        <span class="text-lg font-medium text-text-primary">
                            {{ ot.vehiculo.modelo.nombre|default:"N/A" }} - N° Interno: {{ ot.vehiculo.numero_interno }} ({{ ot.vehiculo.patente }})
                        </span>
                    </div>
                    <div>
                        <strong class="block text-sm text-text-secondary">Técnico Responsable:</strong>
                        <span>
                            {% if ot.responsable %}
                                {{ ot.responsable.get_full_name|default:ot.responsable.username }}
                            {% else %}
                                <span class="italic text-gray-500">Sin Asignar</span>
                            {% endif %}
                        </span>
                    </div>
                    <div>
                        <strong class="block text-sm text-text-secondary">Tipo:</strong>
                        <span>{{ ot.get_tipo_display }}</span>
                    </div>
                    <div>
                        <strong class="block text-sm text-text-secondary">Prioridad:</strong>
                        <span>{{ ot.get_prioridad_display }}</span>
                    </div>
                    <div>
                        <strong class="block text-sm text-text-secondary">Fecha Creación:</strong>
                        <span>{{ ot.fecha_creacion|date:"d M Y, H:i" }}</span>
                    </div>
                    {% if ot.fecha_programada %}
                    <div>
                        <strong class="block text-sm text-text-secondary">Fecha Programación:</strong>
                        <span>{{ ot.fecha_programada|date:"d M Y" }}</span>
                    </div>
                    <div>
                        <strong class="block text-sm text-text-secondary">Hora de Inicio Programada:</strong>
                        <span>{{ ot.hora_programada|time:"H:i" }}</span>
                    </div>
                    <div>
                        <strong class="block text-sm text-text-secondary">Hora de Termino Programada:</strong>
                        <span>{{ ot.hora_finalizacion|time:"H:i" }}</span>
                    </div>
                    {% endif %}
                     <div>
                        <strong class="block text-sm text-text-secondary">KM Apertura:</strong>
                        <span>{{ ot.kilometraje_apertura|chile_number }}</span>
                    </div>
                    <div class="md:col-span-2 mt-2 pt-2 border-t border-input-border">
                        <strong class="block text-sm text-text-secondary">Motivo de Apertura / Observación Inicial:</strong>
                        <p class="text-text-primary whitespace-pre-wrap">{{ ot.observacion_inicial|default:"No se especificó un motivo." }}</p>
                    </div>
                </div>
            </div>

            {% if puede_gestionar_tareas_y_personal %}
            <div class="card-style"><h4 class="text-lg font-semibold mb-3"><i class="fas fa-dollar-sign mr-2 text-accent">
                </i>Desglose de Costos</h4>
                <div class="space-y-2">
                    <div class="flex justify-between">
                        <span><i class="fas fa-cogs w-6 text-blue-400"></i>Costo en Insumos</span>
                        <span class="font-mono">${{ desglose_costos.insumos|chile_number }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span><i class="fas fa-hard-hat w-6 text-yellow-400"></i>M. Obra (Tareas)</span>
                        <span class="font-mono">${{ desglose_costos.mano_obra_tareas|chile_number }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span><i class="fas fa-clock w-6 text-orange-400"></i>M. Obra (HH)</span>
                        <span class="font-mono">${{ desglose_costos.mano_obra_hh|chile_number }}</span>
                    </div>
                    <hr class="border-input-border my-2">
                    <div class="flex justify-between font-bold text-lg">
                        <span>Costo Total OT</span>
                        <span class="font-mono text-green-400">${{ ot.costo_total|chile_number }}</span>
                    </div>
                </div>
            </div>
            {% endif %}

            <div class="card-style">
                <h4 class="text-lg font-semibold mb-3"><i class="fas fa-stethoscope mr-2 text-accent"></i>Diagnóstico y Evaluación</h4>
                {% if ot.diagnostico_evaluacion %}
                    <p class="text-text-primary whitespace-pre-wrap">{{ ot.diagnostico_evaluacion }}</p>
                {% else %}
                    <p class="text-sm text-text-secondary italic">Aún no se ha registrado un diagnóstico.</p>
                {% endif %}
            </div>

            <div class="card-style">
                <h4 class="text-lg font-semibold mb-3"><i class="fas fa-tasks mr-2 text-accent"></i>Tareas Realizadas</h4>
                {% if ot.tareas_realizadas.all %}
                <ul class="space-y-2">
                    {% for tarea in ot.tareas_realizadas.all %}
                    <li class="flex justify-between items-center p-2 rounded-md hover:bg-gray-50">
                        <span>{{ tarea.descripcion }}</span>
                        <span class="font-mono text-text-secondary">${{ tarea.costo_base|chile_number }}
                            {% if puede_gestionar_tareas_y_personal %}
                            <form action="{% url 'eliminar_tarea_ot' ot.pk tarea.pk %}" method="post" class="inline" onsubmit="return confirm('¿Eliminar esta tarea?');">
                                {% csrf_token %}
                                <button type="submit" class="text-red-500 hover:text-red-400 ml-3"><i class="fas fa-trash-alt"></i></button>
                            </form>
                            {% endif %}
                        </span>
                    </li>
                    {% endfor %}
                </ul>
                {% else %}
                <p class="text-sm text-text-secondary italic">Aún no se han añadido tareas.</p>
                {% endif %}
            </div>

            <div class="card-style">
                <h4 class="text-lg font-semibold mb-3">
                    <i class="fas fa-boxes mr-2 text-accent"></i>Insumos y Repuestos</h4>
                    {% if ot.detalles_insumos_ot.all %}
                    <ul class="space-y-2">
                        {% for detalle in ot.detalles_insumos_ot.all %}
                        <li class="flex justify-between items-center p-2 rounded-md hover:bg-gray-50">
                            <span>
                                {{ detalle.cantidad|floatformat }} x {% if detalle.repuesto_inventario %}{{ detalle.repuesto_inventario.nombre }}{% else %}{{ detalle.insumo.nombre }}{% endif %}
                            </span>
                            {% if puede_gestionar_tareas_y_personal %}
                            <span class="font-mono text-text-secondary">
                                ${% if detalle.repuesto_inventario %}{{ detalle.repuesto_inventario.precio_unitario|chile_number }}{% else %}{{ detalle.insumo.precio_unitario|chile_number }}{% endif %} c/u
                                <form action="{% url 'eliminar_insumo_ot' ot.pk detalle.pk %}" method="post" class="inline" onsubmit="return confirm('¿Eliminar este insumo/repuesto?');">
                                    {% csrf_token %}
                                    <button type="submit" class="text-red-500 hover:text-red-400 ml-3"><i class="fas fa-trash-alt"></i></button>
                                </form>
                            </span>
                            {% endif %}
                        </li>
                        {% endfor %}
                    </ul>
                    {% else %}
                        <p class="text-sm text-text-secondary italic">Aún no se han añadido insumos.</p>
                    {% endif %}
            </div>

            <div class="card-style"><h4 class="text-lg font-semibold mb-3"><i class="fas fa-history mr-2 text-accent"></i>Historial de la OT</h4>
                <ul class="space-y-4">
                    {% for evento in ot.historial.all %}
                    <li class="flex items-start"><i class="fas fa-info-circle text-accent mt-1 mr-3"></i>
                        <div>
                            <p class="text-text-primary">{{ evento.descripcion }}</p>
                            <p class="text-xs text-text-secondary">
                                Por
                                {% if evento.usuario %}
                                    {{ evento.usuario.get_full_name|default:evento.usuario.username }}
                                {% else %}
                                    Sistema
                                {% endif %}
                                - {{ evento.fecha_evento|date:"d/m/Y H:i" }}
                            </p>
                        </div>
                    </li>
                    {% empty %}
                    <p class="text-sm text-text-secondary italic">No hay eventos registrados.</p>
                    {% endfor %}
                </ul>
            </div>
        </div>

        <!-- Columna Derecha (Acciones) -->
        <div class="lg:col-span-1 space-y-4">

            {% if solicitudes and puede_gestionar_tareas_y_personal%}
            <div class="accordion-item card-style overflow-hidden">
                <div class="accordion-header flex justify-between items-center cursor-pointer p-4">
                    <h4 class="text-lg font-semibold text-text-primary">Solicitudes</h4>
                    <i class="fas fa-chevron-down transition-transform text-text-secondary"></i>
                </div>
                <div class="accordion-content">
                    <div class="p-4 border-t border-input-border">
                        {% for solicitud in solicitudes %}
                        <div class="p-3 rounded-lg border border-input-border flex flex-col gap-2 mb-2">
                            <div>
                                <p class="text-sm font-semibold">
                                    {{ solicitud.get_estado_display }}
                                </p>
                                <p class="text-xs text-text-secondary">
                                    {{ solicitud.motivo }}
                                </p>
                                {% if solicitud.estado == 'RECHAZADA' %}
                                    <p class="text-xs text-red-500">
                                        Motivo: {{ solicitud.motivo_rechazo }}
                                    </p>
                                {% endif %}
                                <p class="text-xs text-gray-400">
                                    {{ solicitud.fecha_creacion|date:"d/m/Y H:i" }}
                                </p>
                            </div>
                            {% if solicitud.estado == 'EN_PROCESO' and puede_realizar_acciones_criticas %}
                            <div class="flex gap-2">
                                <form method="post">
                                    {% csrf_token %}
                                    <input type="hidden" name="solicitud_id" value="{{ solicitud.id }}">
                                    <button type="submit" name="aprobar_solicitud"
                                        class="btn-primary !text-xs !py-1 !bg-green-600 hover:!bg-green-700">
                                        Aprobar
                                    </button>
                                </form>
                                <button type="button" class="btn-danger !text-xs !py-1"
                                        onclick="abrirModalRechazo({{ solicitud.id }})">
                                    Rechazar
                                </button>
                            </div>
                            {% endif %}
                        </div>
                        {% endfor %}
                    </div>
                </div>
            </div>
            {% endif %}

            <div class="accordion-item card-style overflow-hidden">
                <div class="accordion-header flex justify-between items-center cursor-pointer p-4">
                    <h4 class="text-lg font-semibold text-text-primary">Diagnóstico / Evaluación</h4>
                    <i class="fas fa-chevron-down transition-transform text-text-secondary"></i>
                </div>
                <div class="accordion-content">
                    <div class="p-4 border-t border-input-border">
                        <form method="post" class="space-y-3">
                            {% csrf_token %}
                            <div>
                                <label for="{{ diagnostico_form.diagnostico_evaluacion.id_for_label }}" class="block text-sm font-medium text-text-secondary mb-1">
                                    {{ diagnostico_form.diagnostico_evaluacion.label }}
                                </label>
                                {{ diagnostico_form.diagnostico_evaluacion }}
                            </div>
                            <button type="submit" name="guardar_diagnostico" class="btn-primary w-full justify-center">
                                <i class="fas fa-save mr-2"></i>Guardar Diagnóstico
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {% if puede_gestionar_tareas_y_personal and ot.tipo == 'PREVENTIVA' %}
            <div class="accordion-item card-style overflow-hidden">
                <div class="accordion-header flex justify-between items-center cursor-pointer p-4">
                    <h4 class="text-lg font-semibold text-text-primary">Pauta de Mantenimiento</h4>
                    <i class="fas fa-chevron-down transition-transform text-text-secondary"></i>
                </div>
                <div class="accordion-content">
                    <div class="p-4 border-t border-input-border">
                        {% if ot.pauta_mantenimiento %}
                        <p class="text-sm text-text-secondary mb-3">Asociada a: <strong>{{ ot.pauta_mantenimiento.nombre }}</strong></p>
                        <div class="flex flex-col sm:flex-row gap-2">
                            <form method="post" class="flex-1">
                                {% csrf_token %}
                                <button type="submit" name="cargar_tareas_pauta" class="btn-primary w-full justify-center">Cargar Tareas</button>
                            </form>
                            {% if ot.pauta_mantenimiento.archivo_pdf %}
                                <a href="{% url 'ver_pauta_pdf' pk=ot.pauta_mantenimiento.pk %}" target="_blank" class="btn-secondary w-full sm:w-auto justify-center"><i class="fas fa-file-pdf mr-2"></i>Ver PDF</a>
                            {% endif %}
                        </div>
                        {% else %}
                            <p class="text-sm text-yellow-400 italic">No hay pauta de mantenimiento asociada a esta OT.</p>
                        {% endif %}
                    </div>
                </div>
            </div>
            {% endif %}

            {% if puede_gestionar_tareas_y_personal %}
            <div class="accordion-item card-style overflow-hidden">
                <div class="accordion-header flex justify-between items-center cursor-pointer p-4">
                    <h4 class="text-lg font-semibold text-text-primary">Añadir Tarea</h4><i class="fas fa-chevron-down transition-transform text-text-secondary"></i>
                </div>
                <div class="accordion-content">
                    <div class="p-4 border-t border-input-border">
                        <form method="post" class="space-y-3">
                            {% csrf_token %}
                            <div>
                                <label for="{{ asignar_tarea_form.tarea.id_for_label }}" class="block text-sm font-medium text-text-secondary">
                                    {{ asignar_tarea_form.tarea.label }}
                                </label>
                                {{ asignar_tarea_form.tarea }}
                            </div>
                            <button type="submit" name="asignar_tarea_existente" class="btn-primary w-full justify-center"><i class="fas fa-plus-circle mr-2"></i>Añadir Tarea Seleccionada</button>
                        </form>
                        <hr class="my-4 border-input-border">
                        <button type="button" class="btn-secondary w-full justify-center" onclick="openModal('modalCrearTarea')">
                            <i class="fas fa-plus mr-2"></i> Crear Tarea Nueva
                        </button>
                    </div>
                </div>
            </div>

            <div class="accordion-item card-style overflow-hidden">
                <div class="accordion-header flex justify-between items-center cursor-pointer p-4">
                    <h4 class="text-lg font-semibold text-text-primary">Gestión de Insumos</h4>
                    <i class="fas fa-chevron-down transition-transform text-text-secondary"></i>
                </div>
                <div class="accordion-content">
                    <div class="p-4 border-t border-input-border space-y-4">
                        <button type="button" class="btn-primary w-full justify-center" onclick="openModal('modalBuscarRepuesto')">
                            <i class="fas fa-search mr-2"></i>Buscar Repuesto Individual
                        </button>
                        <button type="button" class="btn-secondary w-full justify-center" onclick="openModal('modalBuscarKit')">
                            <i class="fas fa-box-open mr-2"></i>Añadir desde Kit
                        </button>
                        <hr class="border-input-border">
                        <h5 class="text-base font-semibold text-center">Registrar Insumo Manual Nuevo</h5>
                        <form method="post" class="space-y-3">
                            {% csrf_token %}
                            <div>
                                <label class="block text-sm font-medium text-text-secondary">{{ manual_insumo_form.nombre.label }}</label>
                                {{ manual_insumo_form.nombre }}
                            </div>
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="block text-sm font-medium text-text-secondary">{{ manual_insumo_form.cantidad.label }}</label>
                                    {{ manual_insumo_form.cantidad }}
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-text-secondary">{{ manual_insumo_form.precio_unitario.label }}</label>
                                    {{ manual_insumo_form.precio_unitario }}
                                </div>
                            </div>
                            <button type="submit" name="add_manual_insumo" class="btn-primary !bg-green-600 hover:!bg-green-700 w-full justify-center">Guardar Insumo</button>
                        </form>
                    </div>
                </div>
            </div>

            <div class="accordion-item card-style overflow-hidden">
                <div class="accordion-header flex justify-between items-center cursor-pointer p-4">
                    <h4 class="text-lg font-semibold text-text-primary">Asignar Personal</h4>
                    <i class="fas fa-chevron-down transition-transform text-text-secondary"></i>
                </div>
                <div class="accordion-content">
                    <div class="p-4 border-t border-input-border">
                        <h5 class="text-base font-medium text-text-secondary mb-2">Personal Actual</h5>
                        {% if ot.responsable or ot.personal_asignado.all %}
                        <ul class="text-sm space-y-1 mb-4">
                            {% if ot.responsable %}
                                <li><span class="font-bold text-yellow-400">Responsable:</span> {{ ot.responsable.get_full_name|default:ot.responsable.username }}</li>
                            {% endif %}
                            {% for ayudante in ot.personal_asignado.all %}
                                {% if ayudante != ot.responsable %}
                                    <li><span class="font-bold text-text-secondary">Ayudante:</span> {{ ayudante.get_full_name|default:ayudante.username }}</li>
                                {% endif %}
                            {% endfor %}
                        </ul>
                        {% else %}
                            <p class="text-sm text-text-secondary italic mb-4">No hay personal asignado.</p>
                        {% endif %}
                        <hr class="border-input-border"><h5 class="text-base font-semibold my-3">Modificar Asignación</h5>
                        <form method="post" class="space-y-3">
                            {% csrf_token %}
                            <div><label class="block text-sm font-medium text-text-secondary">{{ asignar_form.responsable.label }}</label>{{ asignar_form.responsable }}</div>
                            <div><label class="block text-sm font-medium text-text-secondary">{{ asignar_form.personal_asignado.label }}</label>{{ asignar_form.personal_asignado }}</div>
                            <button type="submit" name="asignar_personal" class="btn-primary w-full justify-center"><i class="fas fa-save mr-2"></i>Guardar</button>
                        </form>
                    </div>
                </div>
            </div>
            {% endif %}

            {% if puede_realizar_acciones_criticas %}
                <div class="accordion-item card-style overflow-hidden">
                    <div class="accordion-header flex justify-between items-center cursor-pointer p-4">
                        <h4 class="text-lg font-semibold text-text-primary">Cambiar Estado (Admin)</h4>
                        <i class="fas fa-chevron-down transition-transform text-text-secondary"></i>
                    </div>
                    <div class="accordion-content">
                        <div class="p-4 border-t border-input-border">
                            <form id="formCambiarEstado" method="post" class="space-y-3">
                                {% csrf_token %}
                                <div>
                                    <label for="{{ cambiar_estado_form.estado.id_for_label }}" class="block text-sm font-medium text-text-secondary">{{ cambiar_estado_form.estado.label }}</label>
                                    {{ cambiar_estado_form.estado }}
                                </div>
                                <div id="motivo-pausa-wrapper" class="hidden-field">
                                    <label for="{{ cambiar_estado_form.motivo_pausa.id_for_label }}" class="block text-sm font-medium text-text-secondary">{{ cambiar_estado_form.motivo_pausa.label }}</label>
                                    {{ cambiar_estado_form.motivo_pausa }}
                                </div>
                                <div id="km-cierre-wrapper" class="hidden-field">
                                    <label for="{{ cambiar_estado_form.kilometraje_cierre.id_for_label }}" class="block text-sm font-medium text-text-secondary">{{ cambiar_estado_form.kilometraje_cierre.label }}</label>
                                    {{ cambiar_estado_form.kilometraje_cierre }}
                                </div>
                                <input type="hidden" name="cambiar_estado" value="1">
                                <button type="submit" class="btn-primary w-full justify-center">Actualizar Estado</button>
                            </form>
                        </div>
                    </div>
                </div>
            {% endif %}
        </div>
    </div>
</div>

<!-- Modales -->
<div id="pausarOTModal" class="hidden fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"><div class="card-style w-full max-w-md"><h3 class="text-lg font-bold mb-4">Pausar Orden de Trabajo</h3><form method="post">{% csrf_token %}<div class="space-y-4"><div><label for="{{ pausar_form.motivo_pausa.id_for_label }}" class="block text-sm font-medium text-text-secondary">{{ pausar_form.motivo_pausa.label }}</label>{{ pausar_form.motivo_pausa }}</div><div><label for="{{ pausar_form.notas_pausa.id_for_label }}" class="block text-sm font-medium text-text-secondary">{{ pausar_form.notas_pausa.label }}</label>{{ pausar_form.notas_pausa }}</div></div><div class="flex justify-end gap-3 mt-6"><button type="button" class="btn-secondary" onclick="closeModal('pausarOTModal')">Cancelar</button><button type="submit" name="pausar_ot" class="btn-primary !bg-yellow-500 hover:!bg-yellow-600">Confirmar Pausa</button></div></form></div></div>

<!-- MODAL BÚSQUEDA DE REPUESTO MEJORADO -->
<div id="modalBuscarRepuesto" class="hidden fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
    <div class="card-style w-full max-w-3xl p-6">
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-2xl font-bold text-text-primary"><i class="fas fa-search mr-2 text-accent"></i>Buscar Repuesto en Inventario</h3>
            <button type="button" class="text-text-secondary hover:text-red-500 transition-colors" onclick="closeModal('modalBuscarRepuesto')"><i class="fas fa-times fa-lg"></i></button>
        </div>
        <input type="text" id="repuesto-search-input" placeholder="Buscar por nombre o número de parte..." class="w-full mb-4 text-lg">
        <div id="repuesto-search-results" class="max-h-96 overflow-y-auto space-y-2 bg-bg-secondary p-2 rounded-md">
            <p class="text-sm text-text-secondary text-center py-4">Los resultados aparecerán aquí.</p>
        </div>
        <div class="flex justify-end mt-6">
            <button type="button" class="btn-secondary" onclick="closeModal('modalBuscarRepuesto')">Cerrar</button>
        </div>
    </div>
</div>

<div id="modalCrearTarea" class="hidden fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"><div class="card-style w-full max-w-md"><h3 class="text-lg font-bold mb-4">Crear y Añadir Nueva Tarea</h3><form method="post">{% csrf_token %}<div class="space-y-4"><div><label for="{{ manual_tarea_form.descripcion.id_for_label }}" class="block text-sm font-medium text-text-secondary">{{ manual_tarea_form.descripcion.label }}</label>{{ manual_tarea_form.descripcion }}</div><div class="grid grid-cols-2 gap-4"><div><label for="{{ manual_tarea_form.tiempo_estandar_minutos.id_for_label }}" class="block text-sm font-medium text-text-secondary">{{ manual_tarea_form.tiempo_estandar_minutos.label }}</label>{{ manual_tarea_form.tiempo_estandar_minutos }}</div><div><label for="{{ manual_tarea_form.costo_base.id_for_label }}" class="block text-sm font-medium text-text-secondary">{{ manual_tarea_form.costo_base.label }}</label>{{ manual_tarea_form.costo_base }}</div></div></div><div class="flex justify-end gap-3 mt-6"><button type="button" class="btn-secondary" onclick="closeModal('modalCrearTarea')">Cancelar</button><button type="submit" name="crear_y_asignar_tarea" class="btn-primary !bg-green-600 hover:!bg-green-700"><i class="fas fa-save mr-2"></i>Crear y Añadir</button></div></form></div></div>

<div id="solicitudModal" class="hidden fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
    <div class="card-style w-full max-w-md">
        <h3 class="text-lg font-bold mb-4"><i class="fas fa-cart-plus mr-2 text-purple-400"></i>Nueva Solicitud de Repuesto</h3>
        <form method="post">
            {% csrf_token %}
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-text-secondary mb-1">¿Qué repuesto necesitas?</label>
                    {{ solicitud_form.repuesto_nombre }}
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-text-secondary mb-1">Cantidad</label>
                        {{ solicitud_form.cantidad }}
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-text-secondary mb-1">Urgencia</label>
                        {{ solicitud_form.prioridad }}
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-text-secondary mb-1">Justificación / Notas</label>
                    {{ solicitud_form.motivo }}
                </div>
                {{ solicitud_form.repuesto_referencia }}
            </div>
            <div class="flex justify-end gap-3 mt-6">
                <button type="button" class="btn-secondary" onclick="closeModal('solicitudModal')">Cancelar</button>
                <button type="submit" name="crear_solicitud" class="btn-primary !bg-purple-600 hover:!bg-purple-700 font-bold">Enviar Pedido a Compras</button>
            </div>
        </form>
    </div>
</div>

<div id="modalBuscarKit" class="hidden fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
    <div class="card-style w-full max-w-4xl p-6">
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-2xl font-bold text-text-primary"><i class="fas fa-box-open mr-2 text-accent"></i>Añadir Kit de Repuestos a la OT</h3>
            <button type="button" class="text-text-secondary hover:text-red-500 transition-colors" onclick="closeModal('modalBuscarKit')"><i class="fas fa-times fa-lg"></i></button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label for="kit-search-select" class="block text-sm font-medium text-text-secondary mb-2">Buscar Kit</label>
                <select id="kit-search-select" class="w-full"></select>
            </div>
            <div id="kit-validation-panel" class="hidden bg-gray-50 p-4 rounded-md border border-gray-200">
                <h4 id="kit-validation-title" class="font-bold text-lg mb-3">Validación de Stock</h4>
                <div id="kit-validation-results" class="text-sm space-y-2 max-h-64 overflow-y-auto">
                    <p class="text-gray-500">Seleccione un kit para ver la disponibilidad de sus componentes.</p>
                </div>
                <div class="flex justify-end mt-6 pt-4 border-t border-gray-200">
                    <button type="button" class="btn-secondary mr-2" onclick="closeModal('modalBuscarKit')">Cancelar</button>
                    <button type="button" id="btn-confirmar-carga-kit" class="btn-primary" disabled>
                        <i class="fas fa-check-circle mr-2"></i>Confirmar y Cargar Kit
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>

<div id="rechazoSolicitudModal" class="hidden fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
    <div class="card-style w-full max-w-md">
        <h3 class="text-lg font-bold mb-4">Rechazar Solicitud</h3>
        <form method="post" id="formRechazoSolicitud">
            {% csrf_token %}
            <input type="hidden" name="solicitud_id" id="rechazoSolicitudId">
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-text-secondary">Motivo de rechazo *</label>
                    <textarea name="motivo_rechazo" required class="w-full form-control" placeholder="Ingrese el motivo del rechazo"></textarea>
                </div>
            </div>
            <div class="flex justify-end gap-3 mt-6">
                <button type="button" class="btn-secondary" onclick="closeModal('rechazoSolicitudModal')">Cancelar</button>
                <button type="submit" name="rechazar_solicitud" class="btn-danger">Confirmar rechazo</button>
            </div>
        </form>
    </div>
</div>
{% endblock content %}

{% block extra_scripts %}
<script>
$(document).ready(function() {
    let segundosGuardados = {{ ot.tiempo_trabajado_segundos|default:0|unlocalize }};
    let inicioProceso = "{{ ot.inicio_proceso|date:'c' }}";
    let estadoOT = "{{ ot.estado }}";
    let inicio = inicioProceso ? new Date(inicioProceso) : null;

    function formatearTiempo(seg) {
        let h = Math.floor(seg / 3600);
        let m = Math.floor((seg % 3600) / 60);
        let s = seg % 60;
        return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    }

    function calcularSegundos() {
        if (estadoOT === "EN_PROCESO" && inicio) {
            let ahora = new Date();
            let transcurrido = Math.floor((ahora - inicio) / 1000);
            return segundosGuardados + transcurrido;
        }
        return segundosGuardados;
    }

    function actualizarCronometro() {
        let segundosActuales = calcularSegundos();
        document.getElementById("cronometro").innerText = formatearTiempo(segundosActuales);
    }

    setInterval(actualizarCronometro, 1000);
    actualizarCronometro();

    // Inicializar Select2
    $('#id_responsable, #id_personal_asignado, {{ asignar_tarea_form.tarea.auto_id }}, {{ cerrar_mecanico_form.motivo_pendiente.auto_id }}, {{ cambiar_estado_form.estado.auto_id }}, {{ pausar_form.motivo_pausa.auto_id }}').select2({ theme: "default", width: '100%' });

    // Lógica del Acordeón
    function setupAccordions() {
        const accordionItems = $('.accordion-item');
        accordionItems.find('.accordion-content').css('max-height', '0px');
        accordionItems.find('.accordion-header i.fa-chevron-down').css('transform', 'rotate(0deg)');
        const firstAccordion = accordionItems.first();
        if (firstAccordion.length) {
            const firstContent = firstAccordion.find('.accordion-content');
            const firstIcon = firstAccordion.find('.accordion-header i.fa-chevron-down');
            firstContent.css('max-height', firstContent[0].scrollHeight + 'px');
            firstIcon.css('transform', 'rotate(180deg)');
        }
        $('.accordion-header').on('click', function() {
            const parentItem = $(this).closest('.accordion-item');
            const content = parentItem.find('.accordion-content');
            const icon = $(this).find('i.fa-chevron-down');
            const isOpening = content.css('max-height') === '0px';
            $('.accordion-item').not(parentItem).find('.accordion-content').css('max-height', '0px');
            $('.accordion-item').not(parentItem).find('i.fa-chevron-down').css('transform', 'rotate(0deg)');
            if (isOpening) {
                content.css('max-height', content[0].scrollHeight + 'px');
                icon.css('transform', 'rotate(180deg)');
            } else {
                content.css('max-height', '0px');
                icon.css('transform', 'rotate(0deg)');
            }
        });
    }
    setupAccordions();

    // Lógica para los modales
    window.abrirModalRechazo = function(solicitudId) {
        document.getElementById("rechazoSolicitudId").value = solicitudId;
        openModal('rechazoSolicitudModal');
    }
    window.openModal = function(modalId) { $('#' + modalId).removeClass('hidden'); }
    window.closeModal = function(modalId) { $('#' + modalId).addClass('hidden'); }
    $('.fixed.inset-0').on('click', function(event) { if (event.target === this) { $(this).addClass('hidden'); } });

    // === LÓGICA DE BÚSQUEDA DE REPUESTOS ACTUALIZADA CON STOCK TOTAL ===
    const searchInput = $('#repuesto-search-input');
    const resultsContainer = $('#repuesto-search-results');
    const searchUrl = "{% url 'repuesto_search_api' %}";
    let searchTimeout;

    searchInput.on('keyup', function() {
        clearTimeout(searchTimeout);
        const query = $(this).val();
        if (query.length < 2) {
            resultsContainer.html('<p class="text-center p-4">Escriba al menos 2 letras para buscar.</p>');
            return;
        }
        resultsContainer.html('<p class="text-center p-4"><i class="fas fa-spinner fa-spin mr-2"></i>Buscando...</p>');
        searchTimeout = setTimeout(function() {
            $.ajax({
                url: searchUrl,
                data: { 'q': query },
                success: function(data) {
                    resultsContainer.empty();
                    if (data.length === 0) {
                        resultsContainer.html('<p class="text-center p-4">No se encontraron repuestos.</p>');
                        return;
                    }
                    const list = $('<ul class="space-y-2"></ul>');
                    data.forEach(function(repuesto) {
                        // Sincronización con stock_total de views.py
                        const stock = repuesto.stock_total || 0;
                        const stockClass = stock > 0 ? 'text-green-400' : 'text-red-400';
                        const stockIcon = stock > 0 ? 'fa-check-circle' : 'fa-times-circle';
                        const nombreLimpio = repuesto.text.split('|')[0].trim();

                        const listItem = `
                            <li class="flex justify-between items-center p-3 rounded-md bg-white text-sm shadow-sm border border-input-border">
                                <div>
                                    <strong class="text-text-primary">${nombreLimpio}</strong><br>
                                    <small class="text-text-secondary">
                                        SKU: ${repuesto.sku} | 
                                        Stock: <span class="font-bold ${stockClass}">${stock} disponibles <i class="fas ${stockIcon}"></i></span>
                                    </small>
                                </div>
                                <div class="flex items-center gap-2">
                                    <input type="number" 
                                           class="w-16 text-center form-control !py-1" 
                                           value="1" min="1" 
                                           max="${stock}" 
                                           id="cantidad-repuesto-${repuesto.id}">
                                    <button class="btn-primary !text-xs !py-1 !px-3" 
                                            data-repuesto-id="${repuesto.id}" 
                                            data-ot-id="{{ ot.pk }}" 
                                            onclick="addRepuesto(this)" 
                                            ${stock <= 0 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
                                        Añadir
                                    </button>
                                </div>
                            </li>`;
                        list.append(listItem);
                    });
                    resultsContainer.append(list);
                },
                error: function() {
                    resultsContainer.html('<p class="text-red-400 text-center p-4">Error al realizar la búsqueda.</p>');
                }
            });
        }, 300);
    });

    window.addRepuesto = function(button) { 
        const repuestoId = parseInt(button.dataset.repuestoId, 10) || 0; 
        const otId = parseInt(button.dataset.otId, 10) || 0; 
        const cantidad = parseInt($(`#cantidad-repuesto-${repuestoId}`).val(), 10) || 0; 
        if (repuestoId === 0 || otId === 0 || cantidad <= 0) { alert('Error: Datos inválidos.'); return; } 
        const csrfToken = '{{ csrf_token }}', addUrl = "{% url 'add_repuesto_a_ot_api' %}"; 
        button.disabled = true; 
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; 
        fetch(addUrl, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken }, 
            body: JSON.stringify({ ot_id: otId, repuesto_id: repuestoId, cantidad: cantidad }) 
        }).then(response => response.json().then(data => ({ok: response.ok, data}))).then(({ok, data}) => { 
            if (!ok) throw new Error(data.message || 'Error desconocido.'); 
            button.classList.remove('btn-primary'); button.classList.add('!bg-green-600'); 
            button.innerHTML = '<i class="fas fa-check"></i>'; 
            setTimeout(() => { location.reload(); }, 800); 
        }).catch(error => { 
            alert(`Ocurrió un error: ${error.message}`); 
            button.disabled = false; 
            button.innerHTML = 'Añadir'; 
        }); 
    };

    // Lógica para Gestión de Kits
    const kitSearchSelect = $('#kit-search-select');
    const validationPanel = $('#kit-validation-panel');
    const validationResults = $('#kit-validation-results');
    const validationTitle = $('#kit-validation-title');
    const btnConfirmarCarga = $('#btn-confirmar-carga-kit');
    kitSearchSelect.select2({ theme: "default", width: '100%', placeholder: "Buscar un kit por nombre...", allowClear: true, dropdownParent: $('#modalBuscarKit'), ajax: { url: "{% url 'api_kits_search' %}", dataType: 'json', delay: 250, data: function (params) { return { q: params.term }; }, processResults: function (data) { return { results: data }; }, cache: true } });
    kitSearchSelect.on('select2:select', function(e) { const kitId = e.params.data.id; validationPanel.show(); validationTitle.text(`Validando Kit: ${e.params.data.text}`); validationResults.html('<p><i class="fas fa-spinner fa-spin mr-2"></i>Validando stock...</p>'); btnConfirmarCarga.prop('disabled', true).data('kit-id', kitId); fetch("{% url 'api_validar_stock_kit' %}", { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRFToken': '{{ csrf_token }}' }, body: JSON.stringify({ kit_id: kitId }) }).then(response => response.json()).then(data => { if(data.status === 'ok') { let html = ''; const { disponibles, bajo_stock, sin_stock } = data.resumen; if(sin_stock.length > 0) { html += '<h5 class="font-bold text-red-600 mb-1">Quiebre de Stock (No se puede cargar):</h5><ul>'; sin_stock.forEach(r => { html += `<li class="error"><strong>${r.nombre}</strong>: Se necesitan ${r.requerido}, hay ${r.stock_actual}.</li>`; }); html += '</ul>'; btnConfirmarCarga.prop('disabled', true); } else { btnConfirmarCarga.prop('disabled', false); } if(bajo_stock.length > 0) { html += '<h5 class="font-bold text-yellow-600 mt-3 mb-1">Alerta de Stock Mínimo:</h5><ul>'; bajo_stock.forEach(r => { html += `<li class="warning"><strong>${r.nombre}</strong>: Quedarán ${r.stock_restante} unidades.</li>`; }); html += '</ul>'; } if(disponibles.length > 0) { html += '<h5 class="font-bold text-green-600 mt-3 mb-1">Repuestos Disponibles:</h5><ul>'; disponibles.forEach(r => { html += `<li class="ok"><strong>${r.nombre}</strong>: OK</li>`; }); html += '</ul>'; } validationResults.html(html || '<p class="text-green-600">Todos los repuestos están disponibles.</p>'); } else { validationResults.html(`<p class="text-red-500">${data.message}</p>`); } }).catch(err => validationResults.html(`<p class="text-red-500">Error de conexión: ${err.message}</p>`)); });
    kitSearchSelect.on('select2:unselect', function() { validationPanel.hide(); validationResults.html('<p class="text-text-secondary">Seleccione un kit para ver la disponibilidad.</p>'); btnConfirmarCarga.prop('disabled', true).data('kit-id', null); });
    btnConfirmarCarga.on('click', function() { const kitId = $(this).data('kit-id'); const otId = {{ ot.pk }}; if (!kitId) return; $(this).prop('disabled', true).html('<i class="fas fa-spinner fa-spin mr-2"></i>Cargando...'); fetch("{% url 'api_cargar_kit_a_ot' %}", { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRFToken': '{{ csrf_token }}' }, body: JSON.stringify({ kit_id: kitId, ot_id: otId }) }).then(response => response.json().then(data => { if (!response.ok) throw new Error(data.message || 'Error desconocido.'); return data; })).then(data => { alert(data.message); location.reload(); }).catch(err => { alert(`Error al cargar el kit: ${err.message}`); $(this).prop('disabled', false).html('<i class="fas fa-check-circle mr-2"></i>Confirmar y Cargar Kit'); }); });

    // Lógica para campos dinámicos de Admin
    const estadoAdminSelect = document.getElementById("{{ cambiar_estado_form.estado.id_for_label }}"); if(estadoAdminSelect) { const kmCierreWrapper = document.getElementById("km-cierre-wrapper"); const motivoPausaWrapper = document.getElementById("motivo-pausa-wrapper"); function toggleAdminFields() { const selectedState = estadoAdminSelect.value; kmCierreWrapper.classList.toggle('hidden-field', selectedState !== "FINALIZADA"); motivoPausaWrapper.classList.toggle('hidden-field', selectedState !== "PAUSADA"); } toggleAdminFields(); estadoAdminSelect.addEventListener("change", toggleAdminFields); }
});
</script>
{% endblock extra_scripts %}
