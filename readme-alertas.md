{% extends 'flota/base.html' %} 
{% load humanize %} 
{% load format_tags %} 
{% block title %}Alertas{% endblock %} 
{%block extra_head %} <style>
    h2 {
        margin-top: 40px;
        color: #2c3e50;
    }

    .card {
        background: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
        margin-bottom: 40px;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 15px;
    }

    th {
        text-align: left;
        background: #34495e;
        color: white;
        padding: 8px;
    }

    td {
        padding: 8px;
        border-bottom: 1px solid #dcdde1;
    }

    .badge {
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 0.85rem;
        color: white;
    }

    .vencida_letra {
        color: rgb(236, 12, 12);
    }
    .vencida {
        background: #e74c3c;
    }

    .proxima {
        background: #f1c40f;
        color: #2c3e50;
    }

    .critico {
        background: #c0392b;
    }

    .pendiente {
        background: #f39c12;
    }

    .card-header-flex {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 15px;
    }

    .card-header-flex h2 {
        margin: 0;
    }

    .btn-alertas {
        padding: 6px 12px;
        font-size: 14px;
    }
</style> 
{% endblock %} {% block content %} <!-- ========================================================= -->
<!-- VEHÍCULOS CON MANTENCIONES VENCIDAS O PRÓXIMAS -->
<!-- ========================================================= -->
<div class="card">
    <div class="card-header-flex">
        <h2>Vehículos con Mantenciones Pendientes</h2> <a href="{% url 'dashboard_flota' %}?solo_alertas=1"
            class="btn btn-danger btn-alertas"> 🚨 Ver alertas </a>
    </div>
    <table>
        <thead>
            <tr style="background:#f1f1f1;">
                <th style="text-align:center;">Vehículo</th>
                <th style="text-align:center;">Última Mantención</th>
                <th style="text-align:center;">KM Actual</th>
                <th style="text-align:center;">Pauta Vencida o Proxima</th>
                <th style="text-align:center;">Km Pauta</th>
                <th style="text-align:center;">Km Faltantes o pasados</th>
                <th style="text-align:center;">Estado</th>
            </tr>
        </thead>
        <tbody> 
            {% for item in vehiculos_alertas %} 
            <tr>
                <td>{{ item.vehiculo.numero_interno }} - {{ item.vehiculo.patente }}</td>
                <td style="text-align:right;">{{ item.km_ultimo_mant|chile_number:"0" }}</td>
                <td style="text-align:right;">{{ item.km_actual|chile_number:"0" }}</td>
                <td style="text-align:center;">
                        {{ item.pauta_nombre }}
                </td>
                <td style="text-align:right;">
                        {{ item.km_pauta|chile_number:"0" }}
                </td>
                
                <td style="text-align:right;" 
                class="{% if item.estado == 'VENCIDO' or item.estado == 'PROXIMO' and item.km_atraso_faltantes <= 1000 %} vencida_letra {% endif %}">
                        {{ item.km_atraso_faltantes|chile_number:"0" }}
                </td>
                <td style="font-weight:bold;"> 
                    <span
                        class="{% if item.estado == 'VENCIDO' %} badge vencida {% elif item.estado == 'PROXIMO' %} badge proxima {% endif %} ">
                        {{ item.estado }} 
                    </span> 
                </td>
                <td> </td>
            </tr> 
            {% empty %} 
            <tr>
                <td colspan="5" style="text-align:center; padding:15px; color:#777;"> No hay vehículos en alerta. </td>
            </tr> 
            {% endfor %} 
        </tbody>
    </table>
</div> <!-- ========================================================= --> <!-- REPUESTOS CON STOCK CRÍTICO -->
<!-- ========================================================= -->
<div class="card">
    <h2>Repuestos con Stock Crítico</h2>
    <table>
        <thead>
            <tr>
                <th>Repuesto</th>
                <th>Número Parte</th>
                <th>Calidad</th>
                <th>Stock Actual</th>
                <th>Stock Mínimo</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody> {% for r in repuestos_stock_bajo %} <tr>
                <td>{{ r.nombre }}</td>
                <td>{{ r.numero_parte }}</td>
                <td>{{ r.get_calidad_display }}</td>
                <td>{{ r.stock_actual }}</td>
                <td>{{ r.stock_minimo }}</td>
                <td style="padding:8px; border-bottom: 1px solid #eee;"> <a href="{% url 'repuesto_detail' r.pk %}"
                        style="text-decoration:none; background:#0077b6; color:white; padding:6px 10px; border-radius:5px;">
                        Ver </a> </td>
            </tr> {% empty %} <tr>
                <td colspan="5">No hay repuestos con stock crítico.</td>
            </tr> {% endfor %} </tbody>
    </table>
</div> <!-- ========================================================= --> <!-- ORDENES DE TRABAJO SIN FINALIZAR -->
<!-- ========================================================= -->
<div class="card">
    <h2>Órdenes de Trabajo Pendientes</h2>
    <table>
        <thead>
            <tr>
                <th>Folio</th>
                <th>Vehículo</th>
                <th>Tipo</th>
                <th>Prioridad</th>
                <th>Estado</th>
                <th style="padding:8px; border-bottom: 1px solid #ccc;">Fecha</th>
                <th style="padding:8px; border-bottom: 1px solid #ccc;">Acciones</th>
            </tr>
        </thead>
        <tbody> {% for ot in ordenes_pendientes %} <tr>
                <td style="padding:8px; border-bottom: 1px solid #eee;"> {{ ot.folio }} </td>
                <td style="padding:8px; border-bottom: 1px solid #eee;"> {{ ot.vehiculo.patente }} </td>
                <td style="padding:8px; border-bottom: 1px solid #eee;"> {{ ot.tipo }} </td>
                <td
                    style="padding:8px; border-bottom: 1px solid #eee; font-weight:bold; {% if ot.prioridad == 'CRITICA' %} color:#d90429; {% elif ot.prioridad == 'ALTA' %} color:#e85d04; {% elif ot.prioridad == 'MEDIA' %} color:#005f73; {% else %} color:#6c757d; {% endif %} ">
                    {{ ot.prioridad }} </td>
                <td
                    style="padding:8px; border-bottom: 1px solid #eee; {% if ot.estado == 'PENDIENTE' %} color:#d9480f; {% elif ot.estado == 'EN_PROCESO' %} color:#1d3557; {% elif ot.estado == 'PAUSADA' %} color:#6a040f; {% endif %} ">
                    {{ ot.get_estado_display }} </td>
                <td style="padding:8px; border-bottom: 1px solid #eee;"> {{ ot.fecha_creacion|date:"d-m-Y" }} </td>
                <td style="padding:8px; border-bottom: 1px solid #eee;"> <a href="{% url 'ot_detail' ot.pk %}"
                        style="text-decoration:none; background:#0077b6; color:white; padding:6px 10px; border-radius:5px;">
                        Ver </a> </td>
            </tr> {% empty %} <tr>
                <td colspan="7" style="padding:15px; text-align:center; color:#777;"> No hay órdenes de trabajo activas.
                </td>
            </tr> {% endfor %} </tbody>
    </table>
</div> 
{% endblock %}