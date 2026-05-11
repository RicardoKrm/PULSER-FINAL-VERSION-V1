# flota/views.py

import base64
from itertools import chain
import json
import os
import random
from datetime import date, datetime, time, timedelta
import re
from openpyxl.styles import Font, numbers
import pandas as pd
from weasyprint import HTML

from django.contrib import messages
from django.contrib.auth.decorators import login_required, user_passes_test, permission_required
from django.db.models.functions import Coalesce
from django.db.models.functions import Cast

from django.contrib.auth.models import User
from django.db import connection, transaction, models
from django.db.models import Min, Sum, Count, F, Q, DecimalField, ExpressionWrapper, Avg, Max, IntegerField, Value
from django.db.models.functions import TruncMonth
from django.http import HttpResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.template.loader import render_to_string
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.http import JsonResponse
from django.urls import reverse
from dateutil.relativedelta import relativedelta
#Esto se debe habilitar ========================================
#from langchain.memory import ConversationBufferWindowMemory # NUEVO: Para la memoria conversacional
#from langchain_core.messages import SystemMessage # Ya debería estar, si no, añádelo
#from langchain.agents.agent_types import AgentType # Nuevo
#from langchain.agents.agent import AgentOutputParser # Nuevo
from decimal import Decimal
# Agrégalo cerca de los otros imports de .models
#from langchain_core.agents import AgentAction, AgentFinish # Nuevo
from django.db.models import OuterRef, Subquery, Avg
from django.contrib.auth.models import User, Group
from .decorators import es_mecanico, es_personal_operativo
from django.db.models import Q
from django.core.exceptions import PermissionDenied
from django.shortcuts import redirect
from django.db.models import Sum, Count, F, Q # Asegúrate de que todas estas estén
from .decorators import es_administrador, es_gerente # Importamos los decoradores de rol
from datetime import timedelta # Para manejar fechas
from django.db.models.functions import TruncMonth
from django.http import FileResponse, Http404
import math
import csv
from django.http import HttpResponse
from django.views.decorators.http import require_POST
from .models import (
    PrecioCombustible, Solicitud, Vehiculo, PautaMantenimiento, OrdenDeTrabajo, BitacoraDiaria, ModeloVehiculo,
    Tarea, Insumo, TipoFalla, Proveedor, DetalleInsumoOT, HistorialOT, Repuesto,
    MovimientoStock, RepuestoRequeridoPorTarea,
    Ruta, CondicionAmbiental, CargaCombustible, transaction, transaction, NormaEuro, Notificacion,
    ConfiguracionEmpresa, TipoPausa, Personal, KitDeRepuestos, RegistroContableVehiculo, Contrato,
    DisenoBanda, MedidaNeumatico, TrenMotriz, Neumatico, HistorialParametrosNeumatico,
    Personal, Empresa, Departamento, Cargo, TareaDiariaTaller, RegistroChecklistDiario, Bodega, StockBodega, OrdenDeCompra, LineaOrdenCompra,
    CentroDeCosto, FacturaProcesada, PresupuestoMensual, HistorialAlertaIgnorada, Bodega, AuditoriaInventario, DetalleAuditoria
)
from .forms import (
    CargoForm, ConfiguracionEmpresaForm, OrdenDeTrabajoForm, CambiarEstadoOTForm, BitacoraDiariaForm, CargaMasivaForm,
    CerrarOtMecanicoForm, AsignarPersonalOTForm, ManualTareaForm, ManualInsumoForm, FiltroPizarraForm, AsignarTareaForm,
    PausarOTForm, DiagnosticoEvaluacionForm, OTFiltroForm, CalendarioFiltroForm, PrecioCombustibleForm, RepuestoForm, MovimientoStockForm, CargaCombustibleForm, SolicitudForm,
    UsuarioCreacionForm, UsuarioEdicionForm, VehiculoCreateForm, VehiculoUpdateForm, TipoPausaForm, PautaMantenimientoForm,
    KitDeRepuestosForm, DetalleKitRepuestoFormSet, RegistroContableVehiculoForm, ContratoForm,
    NeumaticoForm, HistorialParametrosForm, RutaForm, ModeloVehiculoRendimientoForm, HistorialParametrosForm, MontarNeumaticoForm,
    TareaForm, BodegaForm, OrdenDeCompraManualForm, LineaOCFormSet, SolicitudRepuestoForm, ProveedorForm, AuditoriaInventarioForm
)

from flota.services.gps_service import actualizar_km_vehiculo_gps, actualizar_vehiculo_gps2, obtener_datos_gps2
from django.db.models import F, Sum, DecimalField, ExpressionWrapper

from openpyxl import Workbook
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt




################################################################################
# --- DASHBOARDS ---
################################################################################

@login_required
def dashboard_alertas(request):
    connection.set_tenant(request.tenant)

    vehiculos_alertas, kpi_nivel_cumplimiento = obtener_alertas_flota()

    repuestos_stock_bajo = Repuesto.objects.filter(
        stock_actual__lte=F('stock_minimo'),
        ocultar=False
    ).order_by('stock_actual')

    ordenes_pendientes = OrdenDeTrabajo.objects.filter(
        estado__in=['PENDIENTE', 'EN_PROCESO', 'PAUSADA']
    )

    context = {
        'repuestos_stock_bajo': repuestos_stock_bajo,
        'ordenes_pendientes': ordenes_pendientes,
        'vehiculos_alertas': vehiculos_alertas,
        'kpi_nivel_cumplimiento': kpi_nivel_cumplimiento,
        'full_width_content': False
    }

    return render(request, 'flota/dashboard_alertas.html', context)


@login_required
def dashboard_combustible(request):
    """
    Dashboard principal del módulo de combustible. Muestra los KPIs globales
    y una tabla detallada con el rendimiento de cada vehículo.
    VERSIÓN CORREGIDA Y OPTIMIZADA.
    """
    connection.set_tenant(request.tenant)

    # --- 1. CÁLCULO DE KPIs GLOBALES (Últimos 30 días) ---
    end_date = timezone.now()
    start_date_30d = end_date - timedelta(days=30)

    # Filtramos las cargas del período UNA SOLA VEZ para eficiencia
    cargas_periodo = CargaCombustible.objects.filter(fecha_carga__date__range=[start_date_30d.date(), end_date.date()])

    # CORRECCIÓN: Usamos las cargas del período para los KPIs globales
    costo_total_flota = cargas_periodo.aggregate(total=Sum('costo_total_carga'))['total'] or 0
    
    # CORRECCIÓN: El rendimiento promedio también debe ser del período
    rendimiento_flota_agg = cargas_periodo.filter(
        rendimiento_calculado_kml__isnull=False, rendimiento_calculado_kml__gt=0
    ).aggregate(promedio=Avg('rendimiento_calculado_kml'))
    rendimiento_promedio_flota = rendimiento_flota_agg['promedio'] or 0

    # --- 2. PREPARACIÓN DE DATOS PARA LA TABLA DE VEHÍCULOS ---
    vehiculos_activos = Vehiculo.objects.filter(esta_activo=True).select_related('modelo')
    data_tabla_flota = []
    vehiculos_criticos_count = 0

    for vehiculo in vehiculos_activos:
        datos_vehiculo = {
            'objeto': vehiculo,
            'rendimiento_promedio': None,
            'rendimiento_objetivo': vehiculo.modelo.rendimiento_optimo_kml if vehiculo.modelo else 0,
            'costo_km_30d': 0,
            'estado': 'SIN_DATOS',
            'alerta_texto': 'Sin datos de combustible'
        }

        # Usamos el rendimiento histórico de todas las cargas para una evaluación más estable
        rendimiento_historico_agg = vehiculo.cargas_combustible.filter(
            rendimiento_calculado_kml__isnull=False, rendimiento_calculado_kml__gt=0
        ).aggregate(promedio=Avg('rendimiento_calculado_kml'))
        
        datos_vehiculo['rendimiento_promedio'] = rendimiento_historico_agg['promedio']

        # Lógica para el costo/km en los últimos 30 días
        cargas_vehiculo_30d = cargas_periodo.filter(vehiculo=vehiculo)
        
        # CORRECCIÓN DE LÓGICA DE CÁLCULO DE DISTANCIA Y COSTO
        if cargas_vehiculo_30d.exists():
            costo_30d = cargas_vehiculo_30d.aggregate(total=Sum('costo_total_carga'))['total'] or 0
            
            # Para la distancia, necesitamos al menos dos puntos (cargas)
            if cargas_vehiculo_30d.count() > 1:
                stats_km = cargas_vehiculo_30d.aggregate(
                    km_max=Max('kilometraje_en_carga'),
                    km_min=Min('kilometraje_en_carga')
                )
                distancia_recorrida = (stats_km['km_max'] or 0) - (stats_km['km_min'] or 0)
                if distancia_recorrida > 0:
                    datos_vehiculo['costo_km_30d'] = costo_30d / distancia_recorrida
            else:
                 datos_vehiculo['costo_km_30d'] = 0 # No se puede calcular con una sola carga

        # Lógica de estado (basada en el rendimiento histórico)
        if datos_vehiculo['rendimiento_promedio'] and vehiculo.modelo and vehiculo.modelo.rendimiento_optimo_kml > 0:
            rendimiento_actual = datos_vehiculo['rendimiento_promedio']
            if rendimiento_actual >= vehiculo.modelo.rendimiento_optimo_kml:
                datos_vehiculo['estado'] = 'Óptimo'
                datos_vehiculo['alerta_texto'] = 'Rendimiento Óptimo'
            elif rendimiento_actual >= vehiculo.modelo.rendimiento_regular_kml:
                datos_vehiculo['estado'] = 'Regular'
                datos_vehiculo['alerta_texto'] = 'Rendimiento Regular'
            else:
                datos_vehiculo['estado'] = 'Crítico'
                datos_vehiculo['alerta_texto'] = 'Rendimiento Crítico'
                vehiculos_criticos_count += 1
        
        data_tabla_flota.append(datos_vehiculo)

    # Cálculo del costo/km promedio de la flota
    costos_validos = [d['costo_km_30d'] for d in data_tabla_flota if d['costo_km_30d'] > 0]
    costo_km_promedio_flota = sum(costos_validos) / len(costos_validos) if costos_validos else 0

    # --- 3. PREPARAR EL FORMULARIO PARA EL MODAL ---
    carga_form = CargaCombustibleForm()

    context = {
        'costo_total_flota': costo_total_flota,
        'rendimiento_promedio_flota': rendimiento_promedio_flota,
        'costo_km_promedio_flota': costo_km_promedio_flota,
        'vehiculos_criticos_count': vehiculos_criticos_count,
        'data_tabla_flota': data_tabla_flota,
        'form': carga_form, # Pasamos el formulario al template
    }
    return render(request, 'flota/dashboard_combustible.html', context)





@login_required
@user_passes_test(es_supervisor_o_admin)
def dashboard_comercial(request):
    connection.set_tenant(request.tenant)

    today = timezone.now().date()

    def get_clean_int(key, default):
        val = request.GET.get(key)
        if not val: return default
        clean_val = str(val).replace('\xa0', '').replace(' ', '').replace('.', '').replace(',', '')
        try: return int(clean_val)
        except ValueError: return default

    month_selected = get_clean_int('month', today.month)
    year_selected = get_clean_int('year', today.year)
    search_query = request.GET.get('q', '')

    start_date = date(year_selected, month_selected, 1)
    if month_selected == 12:
        end_date = date(year_selected + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = date(year_selected, month_selected + 1, 1) - timedelta(days=1)

    abonos_presupuesto = PresupuestoMensual.objects.filter(
        mes__month=month_selected,
        mes__year=year_selected
    ).select_related('autorizado_por').order_by('-fecha_autorizacion')

    monto_presupuesto = abonos_presupuesto.aggregate(total=Sum('monto_total'))['total'] or 0
    gasto_total_mes = RegistroContableVehiculo.objects.filter(
        fecha__range=[start_date, end_date],
        tipo_registro='COSTO'
    ).aggregate(total=Sum('monto'))['total'] or 0

    disponible = float(monto_presupuesto) - float(gasto_total_mes)

    # Alertas Críticas
    ignorados_ids = HistorialAlertaIgnorada.objects.values_list('repuesto_id', flat=True)
    hace_30_dias = timezone.now() - timedelta(days=30)
    alertas_criticas = []
    repuestos = Repuesto.objects.filter(ocultar=False).exclude(id__in=ignorados_ids).prefetch_related('movimientos')
    for r in repuestos:
        uso = abs(r.movimientos.filter(tipo_movimiento='SALIDA_OT', fecha_movimiento__gte=hace_30_dias).aggregate(total=Sum('cantidad'))['total'] or 0)
        consumo_diario = float(uso) / 30
        if consumo_diario > 0:
            dias_restantes = r.stock_actual / consumo_diario
            if dias_restantes <= 7:
                alertas_criticas.append({'repuesto': r, 'dias': round(dias_restantes, 1), 'consumo_mes': uso})

    # TCO
    vehiculos_qs = Vehiculo.objects.filter(esta_activo=True).select_related('modelo')
    if search_query:
        vehiculos_qs = vehiculos_qs.filter(Q(numero_interno__icontains=search_query) | Q(patente__icontains=search_query))

    flota_performance = []
    for v in vehiculos_qs:
        gasto_v = v.registros_contables.filter(fecha__range=[start_date, end_date]).aggregate(total=Sum('monto'))['total'] or 0
        flota_performance.append({
            'vehiculo': v,
            'costo_km': float(gasto_v / v.kilometraje_actual) if v.kilometraje_actual > 0 else 0,
            'gasto_total': float(gasto_v),
            'detalles': v.registros_contables.filter(fecha__range=[start_date, end_date]).order_by('-fecha')[:5]
        })

    context = {
        'monto_presupuesto': float(monto_presupuesto),
        'gasto_total_mes': float(gasto_total_mes),
        'disponible': disponible,
        'valor_bodega': Repuesto.objects.filter(ocultar=False).annotate(v=F('stock_actual')*F('precio_unitario')).aggregate(t=Sum('v'))['t'] or 0,
        'abonos_presupuesto': abonos_presupuesto,
        'alertas_criticas': sorted(alertas_criticas, key=lambda x: x['dias']),
        'flota_performance': sorted(flota_performance, key=lambda x: x['costo_km'], reverse=True),
        'month_selected': month_selected,
        'year_selected': year_selected,
        'start_date': start_date.strftime('%Y-%m-%d'),
        'end_date': end_date.strftime('%Y-%m-%d'), # <--- ESTA LÍNEA FALTABA
        'meses_filtro': [(1,'Enero'),(2,'Febrero'),(3,'Marzo'),(4,'Abril'),(5,'Mayo'),(6,'Junio'),(7,'Julio'),(8,'Agosto'),(9,'Septiembre'),(10,'Octubre'),(11,'Noviembre'),(12,'Diciembre')],
        'años_filtro': range(2024, today.year + 2),
        'full_width_content': True
    }
    return render(request, 'flota/reportes/dashboard_comercial.html', context)





@login_required
def dashboard_flota(request):
    if request.user.groups.filter(name='Mecánico').exists():
        return redirect('ot_list')

    connection.set_tenant(request.tenant)
    config = ConfiguracionEmpresa.load()
    sort_param = request.GET.get('sort', 'numero_interno_asc')
    vehiculos_qs = Vehiculo.objects.filter(esta_activo=True).annotate(
        numero_interno_int=Cast('numero_interno', output_field=IntegerField())
    ).select_related('modelo', 'norma_euro')

    if sort_param == '-numero_interno_desc':
        vehiculos_qs = vehiculos_qs.order_by('-numero_interno_int')
        sort_param_template = '-numero_interno'
    else:
        vehiculos_qs = vehiculos_qs.order_by('numero_interno_int')
        sort_param_template = 'numero_interno'

    latest_ot_ids_subquery = OrdenDeTrabajo.objects.filter(
        vehiculo_id=OuterRef('id'),
        tipo='PREVENTIVA',
        estado='FINALIZADA'
    ).order_by('-kilometraje_cierre').values('id')[:1]

    vehiculos_con_latest_ot_id = vehiculos_qs.annotate(latest_ot_id=Subquery(latest_ot_ids_subquery, output_field=models.IntegerField()))
    latest_ot_pks = [v.latest_ot_id for v in vehiculos_con_latest_ot_id if v.latest_ot_id is not None]
    latest_ots_by_id = OrdenDeTrabajo.objects.filter(pk__in=latest_ot_pks).select_related('pauta_mantenimiento').in_bulk()
    ultima_ot_por_vehiculo_id = {ot.vehiculo_id: ot for ot in latest_ots_by_id.values()}

    all_pautas_rules = list(PautaMantenimiento.objects.select_related('modelo_vehiculo').order_by('modelo_vehiculo__nombre', 'kilometraje_inicial'))
    filtro_form = FiltroPizarraForm(request.GET or None)
    data_flota_completa = []
    today = timezone.now().date()
    INITIAL_PAUTA_NAMES = ['SI', 'R']
    nivel_de_cumplimiento_normal = 0

    for vehiculo in vehiculos_con_latest_ot_id:
        km_actual = vehiculo.kilometraje_actual
        ultima_ot_preventiva_data = ultima_ot_por_vehiculo_id.get(vehiculo.pk)
        ot_km_ultimo_mant = ultima_ot_preventiva_data.kilometraje_cierre if ultima_ot_preventiva_data and ultima_ot_preventiva_data.kilometraje_cierre else None
        ot_fecha_ultimo_mant = ultima_ot_preventiva_data.fecha_cierre.date() if ultima_ot_preventiva_data and ultima_ot_preventiva_data.fecha_cierre else None
        ot_tipo_ultimo_mant = ultima_ot_preventiva_data.pauta_mantenimiento.nombre.split('-')[0].strip() if ultima_ot_preventiva_data and ultima_ot_preventiva_data.pauta_mantenimiento else None
        km_ultimo_mant_display = ot_km_ultimo_mant if ot_km_ultimo_mant is not None else vehiculo.km_ultima_mantencion
        fecha_ultimo_mant_display = ot_fecha_ultimo_mant if ot_fecha_ultimo_mant is not None else vehiculo.fecha_ultima_mantencion
        tipo_ultimo_mant_display = ot_tipo_ultimo_mant if ot_tipo_ultimo_mant is not None else (vehiculo.nombre_ultima_pauta_aplicada if vehiculo.nombre_ultima_pauta_aplicada else "N/A")
        if km_ultimo_mant_display is None: km_ultimo_mant_display = 0
        if fecha_ultimo_mant_display is None: fecha_ultimo_mant_display = None

        datos = {
            'vehiculo': vehiculo,
            'marca': vehiculo.modelo.marca if vehiculo.modelo else 'N/A', 'modelo': vehiculo.modelo.nombre if vehiculo.modelo else 'N/A',
            'km_ultimo_mant': km_ultimo_mant_display, 
            'fecha_ultimo_mant': fecha_ultimo_mant_display,
            'tipo_ultimo_mant': tipo_ultimo_mant_display, 
            'intervalo_km': vehiculo.intervalo_mantenimiento_km,
            'km_prox_mant': None, 
            'kms_faltantes': None, 
            'mant_vencido': None, 
            'estado': 'SIN_INFO',
            'estatus_display': 'SIN INFORMACIÓN', 
            'tipo_prox_mant': 'N/A', 
            'km_prom_dia': round(float(vehiculo.km_promedio_para_display or 0), 2),
            'fecha_prox_mant': None, 
            'acum_prox_mat': None, 
            'semaforo_10_dias': False,
            'desviacion_ult_mant': None, 
            'fecha_km_actual': vehiculo.fecha_actualizacion_km,
            'mantenimientos_vencidos_str': '--', 'desviacion_status': 'N/A',
        }

        if not vehiculo.modelo:
            datos['estatus_display'] = 'MODELO NO ASIGNADO'; data_flota_completa.append(datos); continue
        if not vehiculo.tipo_aceite:
            datos['estatus_display'] = 'TIPO ACEITE NO DEF.'; data_flota_completa.append(datos); continue

        pautas_rules_del_modelo = [p for p in all_pautas_rules if p.modelo_vehiculo_id == vehiculo.modelo.id and p.tipo_aceite == vehiculo.tipo_aceite]
        if not pautas_rules_del_modelo:
            pautas_rules_del_modelo = [p for p in all_pautas_rules if p.modelo_vehiculo_id == vehiculo.modelo.id]
        if not pautas_rules_del_modelo:
            display_aceite = f" ({vehiculo.get_tipo_aceite_display()})" if vehiculo.tipo_aceite else ""
            datos['estatus_display'] = f'PAUTAS NO DEF.{display_aceite}'; data_flota_completa.append(datos); continue

        km_realizado = datos['km_ultimo_mant']
        intervalo_vehiculo = datos['intervalo_km']
        if km_realizado is not None and km_realizado > 0 and intervalo_vehiculo and intervalo_vehiculo > 0:
            num_intervalos_base = round(km_realizado / intervalo_vehiculo)
            hito_ideal = num_intervalos_base * intervalo_vehiculo
            datos['desviacion_ult_mant'] = km_realizado - hito_ideal
            tolerancia_km = intervalo_vehiculo * 0.10
            if km_realizado < hito_ideal - tolerancia_km: 
                datos['desviacion_status'] = 'ANTICIPADO'
                nivel_de_cumplimiento_normal += 1
            elif km_realizado > hito_ideal + tolerancia_km: 
                datos['desviacion_status'] = 'RETRASADO'
            else: 
                datos['desviacion_status'] = 'NORMAL'
                nivel_de_cumplimiento_normal += 1
        else:
            datos['desviacion_ult_mant'] = None
            datos['desviacion_status'] = 'N/A'

        try:
            km_ultimo_mant_calc = datos.get('km_ultimo_mant')
            intervalo_calc = datos.get('intervalo_km')
            if isinstance(km_ultimo_mant_calc, (int, float)) and isinstance(intervalo_calc, (int, float)) and intervalo_calc > 0:
                km_ultimo_mant_redondeado = round(km_ultimo_mant_calc / intervalo_calc) * intervalo_calc
                resultado = km_actual - km_ultimo_mant_redondeado - intervalo_calc
                if resultado > 0:
                    datos['mant_vencido'] = resultado
        except (TypeError, ValueError):
            datos['mant_vencido'] = 0

        secuencia_final = {}
        if pautas_rules_del_modelo:
            pautas_iniciales_obj = [p for p in pautas_rules_del_modelo if 'INICIAL' in (getattr(p, 'tipo_aplicacion', '') or '').upper()]
            max_km_inicial = max(p.kilometraje_inicial for p in pautas_iniciales_obj) if pautas_iniciales_obj else 0
            is_past_initial_phase = (datos['km_ultimo_mant'] > max_km_inicial) or (km_actual > max_km_inicial + 5000)

            limite_km = km_actual + 500000
            for regla in pautas_rules_del_modelo:
                nombre_base = regla.nombre.split('-')[0].strip()
                km_inicial = regla.kilometraje_inicial
                es_inicial = 'INICIAL' in (getattr(regla, 'tipo_aplicacion', '') or '').upper()

                if km_inicial and km_inicial not in secuencia_final:
                    secuencia_final[km_inicial] = {'tipo': nombre_base, 'es_inicial': es_inicial}

                intervalo1, intervalo2 = regla.intervalo_1_km, regla.intervalo_2_km
                if intervalo1 and intervalo1 > 0 and not es_inicial:
                    km_pauta_actual = km_inicial
                    alt = True
                    while km_pauta_actual < limite_km:
                        if intervalo2 and intervalo2 > 0:
                             km_pauta_actual += intervalo1 if alt else intervalo2
                             alt = not alt
                        else:
                            km_pauta_actual += intervalo1
                        if km_pauta_actual < limite_km:
                            if km_pauta_actual not in secuencia_final or len(secuencia_final[km_pauta_actual]['tipo']) < len(nombre_base):
                                secuencia_final[km_pauta_actual] = {'tipo': nombre_base, 'es_inicial': es_inicial}

            secuencia_ordenada = sorted(secuencia_final.items())

            pautas_vencidas_detectadas = []
            #km_inicio_busqueda = datos.get('km_ultimo_mant') or 0
            if vehiculo.kilometraje_actual and datos.get('mant_vencido'):
                km_inicio_busqueda = vehiculo.kilometraje_actual - datos.get('mant_vencido')
                for km_pauta, pauta_info in secuencia_ordenada:
                    if is_past_initial_phase and pauta_info['es_inicial']:
                        continue

                    if km_inicio_busqueda <= km_pauta <= km_actual:
                        if pauta_info['tipo'] not in pautas_vencidas_detectadas:
                            pautas_vencidas_detectadas.append(pauta_info['tipo'])

            if pautas_vencidas_detectadas:
                datos['mantenimientos_vencidos_str'] = ", ".join(pautas_vencidas_detectadas)

        pautas_iniciales_orig = [p for p in pautas_rules_del_modelo if p.nombre.split('-')[0] in INITIAL_PAUTA_NAMES]
        max_km_inicial_orig = max(p.kilometraje_inicial for p in pautas_iniciales_orig) if pautas_iniciales_orig else 0
        is_past_initial_phase_orig = (datos['km_ultimo_mant'] > 0) or (km_actual > (max_km_inicial_orig + 5000))
        secuencia_orig, limite_km_orig = [], km_actual + 500000
        for regla in pautas_rules_del_modelo:
            km_pauta = regla.kilometraje_inicial
            if km_pauta < limite_km_orig: secuencia_orig.append({'km': km_pauta, 'tipo': regla.nombre})
            if regla.intervalo_1_km:
                if km_pauta < km_actual:
                    if regla.intervalo_2_km:
                        ciclo = regla.intervalo_1_km + regla.intervalo_2_km
                        saltos = max(0, (km_actual - km_pauta) // ciclo) if ciclo > 0 else 0
                        km_pauta += saltos * ciclo
                    else:
                        saltos = max(0, (km_actual - km_pauta) // regla.intervalo_1_km) if regla.intervalo_1_km > 0 else 0
                        km_pauta += saltos * regla.intervalo_1_km
                i1, i2 = regla.intervalo_1_km, regla.intervalo_2_km
                alt = True
                while km_pauta < limite_km_orig:
                    if i2:
                        km_pauta += i1 if alt else i2
                        alt = not alt
                    else:
                        km_pauta += i1
                    if km_pauta < limite_km_orig: secuencia_orig.append({'km': km_pauta, 'tipo': regla.nombre})

        secuencia_ordenada_orig = sorted(list({v['km']:v for v in secuencia_orig}.values()), key=lambda x: x['km'])

        prox_pauta = next((p for p in secuencia_ordenada_orig if p['km'] > km_actual and not (is_past_initial_phase_orig and p['tipo'].split('-')[0].strip() in INITIAL_PAUTA_NAMES)), None)
        if prox_pauta:
            datos['km_prox_mant'], datos['tipo_prox_mant'] = prox_pauta['km'], prox_pauta['tipo'].split('-')[0].strip()
        else:
            datos['tipo_prox_mant'] = "FIN DE PAUTA"

        if datos['km_ultimo_mant'] is not None:
            datos['acum_prox_mat'] = km_actual - datos['km_ultimo_mant']
        else:
            datos['acum_prox_mat'] = km_actual

        ### INICIO DE LA LÓGICA DE ESTATUS DEFINITIVA (V2) ###

        datos['estado'] = 'NORMAL'
        datos['estatus_display'] = 'NORMALIDAD'

        km_ultimo_mant_v2 = datos.get('km_ultimo_mant')
        intervalo_v2 = datos.get('intervalo_km')

        if isinstance(km_ultimo_mant_v2, (int, float)) and isinstance(intervalo_v2, (int, float)) and intervalo_v2 > 0:
            hito_ideal = round(km_ultimo_mant_v2 / intervalo_v2) * intervalo_v2
            proximo_hito_vencimiento = hito_ideal + intervalo_v2
    
            if km_ultimo_mant_v2 > (proximo_hito_vencimiento - (intervalo_v2*0.1)) and km_ultimo_mant_v2 <= proximo_hito_vencimiento:
                datos['estado'] = 'NORMAL'
                datos['estatus_display'] = 'NORMALIDAD'

            elif km_actual >= proximo_hito_vencimiento:
                datos['estado'] = 'VENCIDO'
                datos['estatus_display'] = 'VENCIDO'
            else:
                umbral_alerta = intervalo_v2 * 0.25
                kms_faltantes_para_hito = proximo_hito_vencimiento - km_actual
                if 0 < kms_faltantes_para_hito <= umbral_alerta:
                    datos['estado'] = 'PROXIMO'
                    datos['estatus_display'] = 'MANT. PRÓX.'

           
        ### FIN DE LA LÓGICA DE ESTATUS DEFINITIVA (V2) ###

        kms_faltantes_calc = None
        if datos['km_prox_mant']:
            kms_faltantes_calc = datos['km_prox_mant'] - km_actual
            datos['kms_faltantes'] = kms_faltantes_calc

        if datos['km_prom_dia'] > 0 and kms_faltantes_calc and kms_faltantes_calc > 0:
            dias = kms_faltantes_calc / datos['km_prom_dia']
            datos['fecha_prox_mant'] = today + timedelta(days=round(dias))
        elif kms_faltantes_calc is not None and kms_faltantes_calc <= 0:
            datos['fecha_prox_mant'] = today
        if datos['fecha_prox_mant'] and 0 <= (datos['fecha_prox_mant'] - today).days <= 10:
            datos['semaforo_10_dias'] = True

        data_flota_completa.append(datos)

    solo_alertas = request.GET.get('solo_alertas')

    if solo_alertas:
        data_flota_completa = [
            d for d in data_flota_completa
            if d['estado'] in ['VENCIDO', 'PROXIMO']
        ]

    data_flota_filtrada = data_flota_completa
    if filtro_form.is_valid():
        modelo_obj = filtro_form.cleaned_data.get('modelo')
        if modelo_obj: data_flota_filtrada = [d for d in data_flota_filtrada if d['vehiculo'].modelo_id == modelo_obj.id]
        if request.GET.get('proximos_alerta') == 'true': data_flota_filtrada = [d for d in data_flota_filtrada if d['estado'] == 'PROXIMO']
        tipo_mant = filtro_form.cleaned_data.get('tipo_mantenimiento')
        if tipo_mant and str(tipo_mant).strip().lower() not in ['', 'todos los tipos']: data_flota_filtrada = [d for d in data_flota_filtrada if d['tipo_prox_mant'] == tipo_mant]
        numero_interno = filtro_form.cleaned_data.get('numero_interno')
        if numero_interno: data_flota_filtrada = [d for d in data_flota_filtrada if numero_interno.lower() in str(d['vehiculo'].numero_interno).lower()]
        fecha_desde = filtro_form.cleaned_data.get('fecha_desde')
        if fecha_desde: data_flota_filtrada = [d for d in data_flota_filtrada if d.get('fecha_prox_mant') and d['fecha_prox_mant'] >= fecha_desde]
        fecha_hasta = filtro_form.cleaned_data.get('fecha_hasta')
        if fecha_hasta: data_flota_filtrada = [d for d in data_flota_filtrada if d.get('fecha_prox_mant') and d['fecha_prox_mant'] <= fecha_hasta]
        fecha_ult_desde = filtro_form.cleaned_data.get('fecha_ult_mant_desde')
        # --- INICIO DE LA CORRECCIÓN ---
        if fecha_ult_desde: data_flota_filtrada = [d for d in data_flota_filtrada if d.get('fecha_ultimo_mant') and d['fecha_ultimo_mant'] >= fecha_ult_desde]
        fecha_ult_hasta = filtro_form.cleaned_data.get('fecha_ult_mant_hasta')
        if fecha_ult_hasta: data_flota_filtrada = [d for d in data_flota_filtrada if d.get('fecha_ultimo_mant') and d['fecha_ultimo_mant'] <= fecha_ult_hasta]
        # --- FIN DE LA CORRECCIÓN ---

    kpi_costo_total, kpi_costo_km = 0.0, 0.0
    try:
        ids = [item['vehiculo'].pk for item in data_flota_filtrada]
        if ids:
            kpi_costo_total = OrdenDeTrabajo.objects.filter(estado='FINALIZADA', vehiculo_id__in=ids).aggregate(Sum('costo_total'))['costo_total__sum'] or 0
            km_total = sum(item['vehiculo'].kilometraje_actual for item in data_flota_filtrada)
            if km_total > 0: kpi_costo_km = kpi_costo_total / km_total
    except Exception as e: print(f"Error calculando KPIs: {e}")

    total_activos = Vehiculo.objects.filter(esta_activo=True).count()
    kpi_porcentaje_flota = (len(data_flota_filtrada) / total_activos * 100) if total_activos > 0 else 0
    kpi_nivel_cumplimiento = (nivel_de_cumplimiento_normal / len(data_flota_completa)) * 100 if data_flota_completa else 0


    if solo_alertas:
        kpi_nivel_cumplimiento = 0

    config_gps = False
    if config.gps_api_token:
        config_gps = True

    context = {
        'data_flota': data_flota_filtrada, 'tenant_name': request.tenant.nombre, 'filtro_form': filtro_form,
        'kpi_total_filtrado': len(data_flota_filtrada), 'kpi_porcentaje_flota': kpi_porcentaje_flota,
        'kpi_costo_total': kpi_costo_total, 'kpi_costo_km': kpi_costo_km, 'full_width_content': True,
        'config_porcentaje_alerta': config.porcentaje_alerta_mantenimiento,
        'config_gps': config_gps,
        'sort_param': sort_param_template, 'today_date': today.strftime('%Y-%m-%d'),
        'kpi_nivel_cumplimiento': kpi_nivel_cumplimiento
    }
    return render(request, 'flota/dashboard.html', context)


@login_required
def dashboard_neumaticos(request):
    """
    Dashboard principal del módulo de neumáticos con KPIs reales.
    VERSIÓN FINAL, ALINEADA CON LOS MODELOS.
    """
    connection.set_tenant(request.tenant)

    # --- KPIs que ya tenías ---
    kpi_neumaticos_almacen = Neumatico.objects.filter(estado__in=['NUEVO', 'USADO']).count()
    
    ultimas_inspecciones = HistorialParametrosNeumatico.objects.filter(
        neumatico=OuterRef('pk')
    ).order_by('-fecha_inspeccion')

    neumaticos_montados = Neumatico.objects.filter(estado='MONTADO').annotate(
        ultimo_remanente=Subquery(ultimas_inspecciones.values('remanente_mm')[:1])
    ).filter(ultimo_remanente__isnull=False)

    UMBRAL_CRITICO_MM = 3.0
    kpi_alertas_criticas = neumaticos_montados.filter(
        ultimo_remanente__lte=UMBRAL_CRITICO_MM
    ).count()

    neumaticos_retirados = Neumatico.objects.filter(estado='BAJA', km_acumulados__gt=0)
    agregado_cpk = neumaticos_retirados.aggregate(
        total_costo=Sum('costo_inicial'),
        total_km=Sum('km_acumulados')
    )
    if agregado_cpk['total_km'] and agregado_cpk['total_km'] > 0:
        kpi_cpk_promedio = agregado_cpk['total_costo'] / agregado_cpk['total_km']
    else:
        kpi_cpk_promedio = 0

    # --- KPI de Inspecciones Atrasadas (Usando el campo correcto) ---
    UMBRAL_KM_INSPECCION = 1000 
    
    neumaticos_con_km_inspeccion = Neumatico.objects.filter(estado='MONTADO').annotate(
        km_ultima_inspeccion=Subquery(ultimas_inspecciones.values('km_vehiculo_inspeccion')[:1])
    ).select_related('vehiculo_montado')

    vehiculos_con_inspeccion_atrasada = set()
    for neumatico in neumaticos_con_km_inspeccion:
        if neumatico.vehiculo_montado and neumatico.km_ultima_inspeccion:
            km_recorridos_sin_inspeccion = neumatico.vehiculo_montado.kilometraje_actual - neumatico.km_ultima_inspeccion
            if km_recorridos_sin_inspeccion > UMBRAL_KM_INSPECCION:
                vehiculos_con_inspeccion_atrasada.add(neumatico.vehiculo_montado.id)
    
    kpi_inspecciones_atrasadas = len(vehiculos_con_inspeccion_atrasada)
    
    # --- CORRECCIÓN: Ordenación numérica de vehículos ---
    vehiculos_activos = Vehiculo.objects.filter(esta_activo=True).annotate(
        numero_interno_int=Cast('numero_interno', output_field=IntegerField())
    ).order_by('numero_interno_int')

    # --- Tablas de rendimiento (sin cambios) ---
    top_peor_cpk = neumaticos_retirados.annotate(
        cpk=F('costo_inicial') / F('km_acumulados')
    ).order_by('-cpk')[:5]
    top_mejor_cpk = neumaticos_retirados.annotate(
        cpk=F('costo_inicial') / F('km_acumulados')
    ).order_by('cpk')[:5]
    proximos_a_reemplazo = neumaticos_montados.filter(
        ultimo_remanente__lte=UMBRAL_CRITICO_MM + 1.5
    ).order_by('ultimo_remanente')[:5]

    # --- Cálculo de datos para los gráficos (Usando los campos correctos) ---
    causas_desecho_data = list(Neumatico.objects.filter(estado='BAJA', motivo_baja__isnull=False)
        .values('motivo_baja')
        .annotate(count=Count('id'))
        .order_by('-count'))
    
    # Mapeamos los códigos a texto legible
    motivo_baja_display_map = dict(Neumatico.MOTIVO_BAJA_CHOICES)
    causas_desecho_labels = [motivo_baja_display_map.get(d['motivo_baja'], d['motivo_baja']) for d in causas_desecho_data]
    
    cpk_por_marca_data = list(Neumatico.objects.filter(estado='BAJA', km_acumulados__gt=0, diseno__marca__isnull=False)
        .values('diseno__marca')
        .annotate(avg_cpk=Avg(F('costo_inicial') / F('km_acumulados')))
        .order_by('avg_cpk'))

    context = {
        'kpi_cpk_promedio': kpi_cpk_promedio,
        'kpi_alertas_criticas': kpi_alertas_criticas,
        'kpi_neumaticos_almacen': kpi_neumaticos_almacen,
        'kpi_inspecciones_atrasadas': kpi_inspecciones_atrasadas,
        'vehiculos': vehiculos_activos,
        'top_peor_cpk': top_peor_cpk,
        'top_mejor_cpk': top_mejor_cpk,
        'proximos_a_reemplazo': proximos_a_reemplazo,
        # Pasamos los datos del gráfico como JSON
        'causas_desecho_json': json.dumps({'labels': causas_desecho_labels, 'data': [d['count'] for d in causas_desecho_data]}),
        'cpk_por_marca_json': json.dumps({'labels': [d['diseno__marca'] for d in cpk_por_marca_data], 'data': [float(d['avg_cpk'] or 0) for d in cpk_por_marca_data]}),
    }

    return render(request, 'flota/neumaticos/dashboard_neumaticos.html', context)





@login_required
@user_passes_test(lambda u: es_administrador(u) or es_gerente(u))
def dashboard_rendimiento_tecnicos(request):
    connection.set_tenant(request.tenant)

    # 1. GESTIÓN DE FECHAS (Sin cambios)
    today = timezone.now().date()
    start_date_default = today - timedelta(days=180)
    start_date_str = request.GET.get('start_date', start_date_default.strftime('%Y-%m-%d'))
    end_date_str = request.GET.get('end_date', today.strftime('%Y-%m-%d'))
    try:
        start_date = timezone.datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = timezone.datetime.strptime(end_date_str, '%Y-%m-%d').date()
    except (ValueError, TypeError):
        start_date, end_date = start_date_default, today

    # 2. QUERIES BASE (Sin cambios)
    ots_finalizadas = OrdenDeTrabajo.objects.filter(
        estado='FINALIZADA',
        fecha_cierre__date__range=[start_date, end_date]
    ).exclude(tfs_minutos=0, tfs_minutos__isnull=True).select_related('responsable__personal')

    # 3. CÁLCULO DE KPIs PRINCIPALES (Sin cambios)
    agregados_tiempo = ots_finalizadas.aggregate(
        total_minutos_reales=Sum('tfs_minutos'),
        total_minutos_estandar=Sum('tareas_realizadas__tiempo_estandar_minutos')
    )
    total_reales = agregados_tiempo.get('total_minutos_reales') or 0
    total_estandar = agregados_tiempo.get('total_minutos_estandar') or 0
    kpi_productividad = (total_estandar / total_reales * 100) if total_reales > 0 else 0

    ots_programadas = OrdenDeTrabajo.objects.filter(fecha_programada__range=[start_date, end_date])
    total_programadas = ots_programadas.count()
    ots_a_tiempo = ots_programadas.filter(
        estado='FINALIZADA',
        fecha_cierre__date__lte=F('fecha_programada')
    ).count()
    kpi_cumplimiento_plazos = (ots_a_tiempo / total_programadas * 100) if total_programadas > 0 else 0

    config = ConfiguracionEmpresa.load()
    horas_mes_persona = config.horas_laborales_mes_por_persona
    tecnicos_activos = User.objects.filter(groups__name='Mecánico', personal__estado='ACTIVO')
    num_tecnicos_activos = tecnicos_activos.count()
    dias_periodo = (end_date - start_date).days
    minutos_disponibles_periodo = (num_tecnicos_activos * horas_mes_persona * 60) * (dias_periodo / 30.4)
    kpi_utilizacion = (total_reales / minutos_disponibles_periodo * 100) if minutos_disponibles_periodo > 0 else 0

    # 4. PREPARAR DATOS PARA GRÁFICOS (ESTA ES LA PARTE CORREGIDA Y MÁS ROBUSTA)
    
    # Obtenemos los datos agrupados por ID de responsable
    datos_por_tecnico_id = ots_finalizadas.values('responsable_id').annotate(
        min_reales=Sum('tfs_minutos'),
        min_estandar=Sum('tareas_realizadas__tiempo_estandar_minutos')
    )

    # Creamos un diccionario para buscar fácilmente
    mapa_datos_tecnicos = {item['responsable_id']: item for item in datos_por_tecnico_id}
    
    # Obtenemos los usuarios que realmente trabajaron en OTs
    ids_tecnicos_con_trabajo = [item['responsable_id'] for item in datos_por_tecnico_id if item['responsable_id']]
    usuarios_tecnicos = User.objects.filter(id__in=ids_tecnicos_con_trabajo).select_related('personal')

    # Inicializamos las listas para los gráficos
    labels_graficos = []
    data_productividad = []
    data_carga_trabajo = []

    # Iteramos sobre los usuarios para construir los datos de forma segura
    for user in usuarios_tecnicos:
        datos = mapa_datos_tecnicos.get(user.id)
        if not datos:
            continue

        # Construir nombre de forma segura
        nombre_completo = user.get_full_name()
        if not nombre_completo and hasattr(user, 'personal') and user.personal:
            nombre_completo = f"{user.personal.nombre} {user.personal.apellido_paterno}".strip()
        if not nombre_completo:
            nombre_completo = user.username # Fallback al username

        labels_graficos.append(nombre_completo)

        # Calcular productividad
        min_reales = datos.get('min_reales', 0)
        min_estandar = datos.get('min_estandar', 0) or 0
        productividad = (min_estandar / min_reales * 100) if min_reales > 0 else 0
        data_productividad.append(round(productividad, 1))
        
        # Carga de trabajo en horas
        data_carga_trabajo.append(round((min_reales or 0) / 60, 1))

    # Gráfico: Evolución Mensual (Sin cambios, ya era seguro)
    evolucion = ots_finalizadas.annotate(
        month=TruncMonth('fecha_cierre')
    ).values('month').annotate(
        reales=Sum('tfs_minutos'),
        estandar=Sum('tareas_realizadas__tiempo_estandar_minutos')
    ).order_by('month')

    horas_evolucion_data = {
        "labels": [e['month'].strftime('%b %Y') for e in evolucion],
        "reales": [round((e['reales'] or 0) / 60, 1) for e in evolucion],
        "estandar": [round((e['estandar'] or 0) / 60, 1) for e in evolucion]
    }

    # 5. DATOS DEL RESUMEN (Sin cambios)
    ots_atrasadas_count = total_programadas - ots_a_tiempo

    # 6. CONTEXTO FINAL
    context = {
        'start_date_str': start_date_str,
        'end_date_str': end_date_str,
        'kpi_productividad': kpi_productividad,
        'kpi_cumplimiento_plazos': kpi_cumplimiento_plazos,
        'kpi_utilizacion': kpi_utilizacion,
        'tecnicos_activos_count': num_tecnicos_activos,
        'total_horas_registradas': (total_reales or 0) / 60,
        'total_horas_estandar': (total_estandar or 0) / 60,
        'ots_finalizadas_count': ots_finalizadas.count(),
        'ots_con_atraso_count': ots_atrasadas_count,
        
        # Empaquetamos los datos de los gráficos con los nuevos nombres de variables
        'chart_data_json': json.dumps({
            "productividadTecnicos": {"labels": labels_graficos, "data": data_productividad},
            "cargaTrabajo": {"labels": labels_graficos, "data": data_carga_trabajo},
            "horasEvolucion": horas_evolucion_data
        })
    }
    return render(request, 'flota/dashboard_rendimiento_tecnicos.html', context)




@login_required
def indicadores_dashboard(request):
    connection.set_tenant(request.tenant)

    # --- 1. GESTIÓN DEL FILTRO DE FECHAS ---
    end_date_default = datetime.now().date()
    start_date_default = (end_date_default.replace(day=1) - relativedelta(months=5)).replace(day=1)
    start_date_str = request.GET.get('start_date', start_date_default.strftime('%Y-%m-%d'))
    end_date_str = request.GET.get('end_date', end_date_default.strftime('%Y-%m-%d'))
    selected_marca = request.GET.get('marca', '')
    selected_modelo = request.GET.get('modelo', '')
    try:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
    except (ValueError, TypeError):
        start_date, end_date = start_date_default, end_date_default
    
    # Obtenemos todas las marcas únicas para el dropdown de Marcas
    all_marcas = ModeloVehiculo.objects.values_list('marca', flat=True).distinct().order_by('marca')
    print(all_marcas)
    modelos_query = ModeloVehiculo.objects.all()

    if selected_marca:
        modelos_query = modelos_query.filter(marca=selected_marca)
    
    all_modelos = modelos_query.order_by('nombre')
    

    # --- 2. CONSULTAS Y PARÁMETROS BASE ---
    ots_en_periodo = OrdenDeTrabajo.objects.filter(fecha_creacion__date__range=[start_date, end_date])
    if selected_marca:
        # Filtramos por la marca del modelo del vehículo
        ots_en_periodo = ots_en_periodo.filter(vehiculo__modelo__marca=selected_marca)
    
    if selected_modelo:
        # Filtramos por el ID del modelo del vehículo
        ots_en_periodo = ots_en_periodo.filter(vehiculo__modelo_id=selected_modelo)
        
    total_vehiculos_activos = Vehiculo.objects.filter(esta_activo=True).count()
    MINUTOS_TOTALES_MES = 30 * 24 * 60

    # --- 3. CÁLCULO DE KPIs PARA TARJETAS Y GRÁFICOS DE DONA ---
    counts = ots_en_periodo.aggregate(
        total_preventivas=Count('id', filter=Q(tipo='PREVENTIVA')),
        total_correctivas=Count('id', filter=Q(tipo='CORRECTIVA')),
        preventivas_finalizadas=Count('id', filter=Q(tipo='PREVENTIVA', estado='FINALIZADA')),
        correctivas_finalizadas=Count('id', filter=Q(tipo='CORRECTIVA', estado='FINALIZADA'))
    )
    total_preventivas, total_correctivas = counts.get('total_preventivas', 0), counts.get('total_correctivas', 0)
    preventivas_ok, correctivas_ok = counts.get('preventivas_finalizadas', 0), counts.get('correctivas_finalizadas', 0)
    preventivas_pendientes, correctivas_pendientes = total_preventivas - preventivas_ok, total_correctivas - correctivas_ok
    total_ots = total_preventivas + total_correctivas

    # --- 4. CÁLCULO DE KPIs MENSUALES ---
    labels_mes, meses_para_iterar = [], []
    current_date = start_date.replace(day=1)
    while current_date <= end_date:
        labels_mes.append(current_date.strftime("%b %Y")); meses_para_iterar.append(current_date)
        current_date += relativedelta(months=1)

    paradas_por_mes_q = ots_en_periodo.annotate(month=TruncMonth('fecha_creacion')).values('month').annotate(total_minutos_parada=Sum('tfs_minutos')).order_by('month')
    paradas_por_mes = {item['month'].date(): item['total_minutos_parada'] for item in paradas_por_mes_q}
    fallas_por_mes_q = ots_en_periodo.filter(tipo='CORRECTIVA').annotate(month=TruncMonth('fecha_creacion')).values('month').annotate(vehiculos_con_falla=Count('vehiculo_id', distinct=True)).order_by('month')
    fallas_por_mes = {item['month'].date(): item['vehiculos_con_falla'] for item in fallas_por_mes_q}

    disponibilidad_data, confiabilidad_data, utilizacion_data = [], [], []
    count = 0
    for mes in meses_para_iterar:
        minutos_parada = paradas_por_mes.get(mes, 0) or 0
        disponibilidad = ((MINUTOS_TOTALES_MES - minutos_parada) / MINUTOS_TOTALES_MES * 100) if MINUTOS_TOTALES_MES > 0 else 100
        disponibilidad_data.append(round(disponibilidad, 1))
        vehiculos_con_falla = fallas_por_mes.get(mes, 0)
        confiabilidad = ((total_vehiculos_activos - vehiculos_con_falla) / total_vehiculos_activos * 100) if total_vehiculos_activos > 0 else 100
        confiabilidad_data.append(round(confiabilidad, 1))
        base_utilizacion = 80; actividad_mes = len([ot for ot in ots_en_periodo if ot.fecha_creacion.year == mes.year and ot.fecha_creacion.month == mes.month])
        utilizacion_simulada = base_utilizacion + (actividad_mes / 10) + random.uniform(-2, 2)
        utilizacion_data.append(round(max(0, min(100, utilizacion_simulada)), 1))

    # --- 5. CÁLCULO PARA GRÁFICO DE MOTIVOS DE PAUSA ---
    pausas_q = ots_en_periodo.filter(motivo_pausa__isnull=False).values('motivo_pausa__nombre').annotate(count=Count('id')).order_by('-count')
    pausa_labels = [item['motivo_pausa__nombre'] for item in pausas_q]
    pausa_data = [item['count'] for item in pausas_q]

    # --- 6. PREPARAR DICCIONARIOS PARA LA PLANTILLA ---
    kpi_data = {
        'total_preventivas': total_preventivas, 'total_correctivas': total_correctivas,
        'porcentaje_preventivas': round((total_preventivas / total_ots * 100), 1) if total_ots > 0 else 0,
        'total_ots': total_ots, 'preventivas_ok': preventivas_ok, 'preventivas_pendientes': preventivas_pendientes,
        'cumplimiento_preventivas': round((preventivas_ok / total_preventivas * 100), 1) if total_preventivas > 0 else 0,
        'total_planificadas': total_preventivas, 'correctivas_ok': correctivas_ok, 'correctivas_pendientes': correctivas_pendientes,
        'cumplimiento_correctivas': round((correctivas_ok / total_correctivas * 100), 1) if total_correctivas > 0 else 0,
        'total_fallas': total_correctivas,
    }

    chart_data = {
        "labelsMes": labels_mes, "disponibilidadData": disponibilidad_data, "confiabilidadData": confiabilidad_data,
        "utilizacionData": utilizacion_data, "totalPreventivas": total_preventivas, "totalCorrectivas": total_correctivas,
        "preventivasOk": preventivas_ok, "preventivasPendientes": preventivas_pendientes,
        "correctivasOk": correctivas_ok, "correctivasPendientes": correctivas_pendientes,
        "pausaLabels": pausa_labels, "pausaData": pausa_data,
    }

    # --- 7. CONSTRUIR EL CONTEXTO FINAL ---
    context = {
        'start_date_value': start_date.strftime('%Y-%m-%d'), 
        'end_date_value': end_date.strftime('%Y-%m-%d'),
        'kpi_data': kpi_data,
        'all_marcas': all_marcas,
        'all_modelos': all_modelos,
        'selected_marca': selected_marca,
        'selected_modelo': selected_modelo,
        
        ### --- CAMBIO REALIZADO --- ###
        # Antes pasabas una cadena JSON ('chart_data_json').
        # Ahora pasamos el diccionario de Python directamente ('chart_data').
        'chart_data': chart_data,
    }
    return render(request, 'flota/indicadores_dashboard.html', context)





@login_required
@user_passes_test(lambda u: es_administrador(u) or es_gerente(u))
def kpi_rrhh_dashboard(request):
    """
    Dashboard para mostrar los KPIs de Recursos Humanos.
    """
    connection.set_tenant(request.tenant)

    # --- Lógica de Filtro de Fechas ---
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=30)
    if request.GET.get('start_date') and request.GET.get('end_date'):
        try:
            start_date_str = request.GET.get('start_date')
            end_date_str = request.GET.get('end_date')
            start_date = timezone.datetime.strptime(start_date_str, '%Y-%m-%d').date()
            end_date = timezone.datetime.strptime(end_date_str, '%Y-%m-%d').date()
        except (ValueError, TypeError):
            pass

    # --- Cálculos para el período seleccionado ---
    ots_finalizadas_periodo = OrdenDeTrabajo.objects.filter(estado='FINALIZADA', fecha_cierre__date__range=[start_date, end_date])

    # KPI 1: Productividad (lógica existente)
    minutos_estandar_totales = ots_finalizadas_periodo.aggregate(total=Sum('tareas_realizadas__tiempo_estandar_minutos'))['total'] or 0
    minutos_reales_trabajados = ots_finalizadas_periodo.aggregate(total=Sum('tfs_minutos'))['total'] or 0
    kpi_productividad = (minutos_estandar_totales / minutos_reales_trabajados) * 100 if minutos_reales_trabajados > 0 else 0

    # KPI 2: Cumplimiento (lógica existente)
    ots_programadas_en_periodo = OrdenDeTrabajo.objects.filter(fecha_programada__range=[start_date, end_date])
    total_programadas = ots_programadas_en_periodo.count()
    finalizadas_a_tiempo = ots_programadas_en_periodo.filter(estado='FINALIZADA', fecha_cierre__date__lte=F('fecha_programada')).count()
    kpi_cumplimiento = (finalizadas_a_tiempo / total_programadas) * 100 if total_programadas > 0 else 0

    # === INICIO DE LA NUEVA LÓGICA PARA EL KPI 3 ===
    # KPI 3: Utilización de Recursos

    # 1. Obtener los parámetros de configuración
    config = ConfiguracionEmpresa.load()
    horas_mes_persona = config.horas_laborales_mes_por_persona

    # 2. Contar el número de técnicos activos
    numero_de_tecnicos = User.objects.filter(groups__name='Mecánico', is_active=True).count()

    # 3. Calcular los minutos disponibles totales del equipo para el período
    #    (Es una aproximación. Una versión más avanzada calcularía los días laborables exactos)
    num_dias_periodo = (end_date - start_date).days + 1
    # Asumimos un mes de ~30.4 días para la proporción
    proporcion_mes = num_dias_periodo / 30.4
    minutos_disponibles_totales = (numero_de_tecnicos * horas_mes_persona * 60) * proporcion_mes

    # 4. Calcular el KPI de Utilización
    kpi_utilizacion = (minutos_reales_trabajados / minutos_disponibles_totales) * 100 if minutos_disponibles_totales > 0 else 0
    # === FIN DE LA NUEVA LÓGICA ===

    # --- Datos para Gráficos (sin cambios por ahora) ---
    # ... tu lógica de gráficos existente ...

    context = {
        'start_date': start_date.strftime('%Y-%m-%d'),
        'end_date': end_date.strftime('%Y-%m-%d'),

        # KPI 1
        'kpi_productividad': kpi_productividad,
        # KPI 2
        'kpi_cumplimiento': kpi_cumplimiento,

        # KPI 3 (nuevos datos)
        'numero_de_tecnicos': numero_de_tecnicos,
        'minutos_disponibles_totales': minutos_disponibles_totales,
        'minutos_reales_trabajados': minutos_reales_trabajados, # Ya lo teníamos, pero lo pasamos de nuevo para esta tarjeta
        'kpi_utilizacion': kpi_utilizacion,

        # ... tus otros datos de contexto para tarjetas y gráficos ...
    }

    return render(request, 'flota/kpi_rrhh_dashboard.html', context)


@login_required
@user_passes_test(lambda u: es_administrador(u) or es_gerente(u))
def reportes_dashboard(request):
    """
    Página principal para la generación de reportes.
    Inicialmente, permite exportar OTs a CSV.
    """
    connection.set_tenant(request.tenant)

    # --- Lógica para manejar la petición de exportación (se mantiene) ---
    if request.method == 'POST':
        # ... (tu código POST existente para exportación) ...
        # Asegúrate de que aquí los nombres sean 'start_date' y 'end_date'
        start_date_str = request.POST.get('start_date')
        end_date_str = request.POST.get('end_date')

        try:
            start_date = timezone.datetime.strptime(start_date_str, '%Y-%m-%d').date()
            end_date = timezone.datetime.strptime(end_date_str, '%Y-%m-%d').date()
        except (ValueError, TypeError, AttributeError):
            messages.error(request, "Formato de fecha inválido. Por favor, seleccione un rango de fechas.")
            return redirect('reportes_dashboard')

        # Si descomentas los filtros de vehiculo, estado, tipo en la plantilla,
        # aquí deberías procesarlos también. Por ejemplo:
        # vehiculo_ids = request.POST.getlist('vehiculo_ot')
        # if vehiculo_ids:
        #     ordenes = ordenes.filter(vehiculo__pk__in=vehiculo_ids)
        # etc.

        ordenes = OrdenDeTrabajo.objects.filter(
            fecha_cierre__date__range=[start_date, end_date]
        ).select_related(
            'vehiculo', 'vehiculo__modelo', 'responsable', 'tipo_falla'
        ).prefetch_related('tareas_realizadas', 'detalles_insumos_ot')

        if not ordenes.exists():
            messages.warning(request, "No se encontraron Órdenes de Trabajo en el período seleccionado para exportar.")
            return redirect('reportes_dashboard')

        # ... (tu lógica de generación de CSV existente) ...
        response = HttpResponse(
            content_type='text/csv',
            headers={'Content-Disposition': f'attachment; filename="reporte_ots_{start_date_str}_a_{end_date_str}.csv"'},
        )
        response.write(u'\ufeff'.encode('utf8'))

        writer = csv.writer(response, delimiter=';')

        writer.writerow([
            'Folio OT', 'Estado', 'Tipo', 'Vehiculo Numero', 'Vehiculo Patente',
            'Fecha Creacion', 'Fecha Cierre', 'Kilometraje Apertura', 'Kilometraje Cierre',
            'Responsable', 'Costo Total', 'TFS (Minutos)', 'Tipo de Falla', 'Tareas'
        ])

        for ot in ordenes:
            tareas_str = ", ".join([tarea.descripcion for tarea in ot.tareas_realizadas.all()])

            writer.writerow([
                ot.folio,
                ot.get_estado_display(),
                ot.get_tipo_display(),
                ot.vehiculo.numero_interno,
                ot.vehiculo.patente,
                ot.fecha_creacion.strftime('%d-%m-%Y %H:%M') if ot.fecha_creacion else '',
                ot.fecha_cierre.strftime('%d-%m-%Y %H:%M') if ot.fecha_cierre else '',
                ot.kilometraje_apertura,
                ot.kilometraje_cierre,
                ot.responsable.username if ot.responsable else 'N/A',
                f"{ot.costo_total:.2f}".replace('.',','),
                ot.tfs_minutos,
                ot.tipo_falla.descripcion if ot.tipo_falla else 'N/A',
                tareas_str
            ])

        return response

    # Lógica para mostrar la página si la petición es GET
    # PASAMOS LOS DATOS NECESARIOS PARA LOS SELECTORES DE LA PLANTILLA
    vehiculos = Vehiculo.objects.all().order_by('numero_interno')
    estados_ot = OrdenDeTrabajo.ESTADO_CHOICES
    tipos_ot = OrdenDeTrabajo.TIPO_CHOICES

    context = {
        'vehiculos': vehiculos,
        'estados_ot': estados_ot,
        'tipos_ot': tipos_ot,
    }
    return render(request, 'flota/reportes_dashboard.html', context)





################################################################################
# --- INVENTARIO Y BODEGAS ---
################################################################################

@login_required
def add_repuesto_a_ot_api(request):
    """
    API para añadir un repuesto a una OT y descontar el stock.
    Espera una petición POST con JSON.
    """
    connection.set_tenant(request.tenant)

    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Método no permitido'}, status=405)

    try:
        data = json.loads(request.body)
        ot_id = int(data.get('ot_id'))
        repuesto_id = int(data.get('repuesto_id'))
        cantidad = int(data.get('cantidad'))

        if cantidad <= 0:
            return JsonResponse({'status': 'error', 'message': 'La cantidad debe ser mayor que cero.'}, status=400)

        with transaction.atomic():
            ot = get_object_or_404(OrdenDeTrabajo, pk=ot_id)
            repuesto = get_object_or_404(Repuesto, pk=repuesto_id)

            if repuesto.stock_actual < cantidad:
                return JsonResponse({'status': 'error', 'message': f'Stock insuficiente. Stock actual: {repuesto.stock_actual}'}, status=400)

            # Verificar si ya existe un DetalleInsumoOT para este repuesto_inventario en esta OT.
            # Si existe, actualizamos la cantidad en lugar de crear una nueva entrada.
            detalle_existente = DetalleInsumoOT.objects.filter(
                orden_de_trabajo=ot, repuesto_inventario=repuesto
            ).first()

            if detalle_existente:
                detalle_existente.cantidad += cantidad
                detalle_existente.save()
                messages_info = f'Cantidad de "{repuesto.nombre}" actualizada en la OT. Total: {detalle_existente.cantidad}.'
            else:
                # Crear un nuevo DetalleInsumoOT vinculando directamente al Repuesto del inventario
                DetalleInsumoOT.objects.create(
                    orden_de_trabajo=ot,
                    repuesto_inventario=repuesto, # <--- ¡Este es el cambio clave!
                    insumo=None, # Asegúrate de que el campo 'insumo' quede vacío para los de inventario
                    cantidad=cantidad
                )
                messages_info = f'Repuesto "{repuesto.nombre}" añadido a la OT con éxito.'

            # Descontar el stock y registrar el movimiento de stock.
            MovimientoStock.objects.create(
                repuesto=repuesto,
                tipo_movimiento='SALIDA_OT',
                cantidad=-cantidad,
                usuario_responsable=request.user,
                orden_de_trabajo=ot,
                notas=f"Salida automática para OT #{ot.folio}"
            )

            # Recalcular el costo total de la OT después de añadir el insumo
            ot.save()

        return JsonResponse({'status': 'ok', 'message': messages_info})

    except KeyError:
        return JsonResponse({'status': 'error', 'message': 'Faltan datos en la petición (ot_id, repuesto_id, cantidad).'}, status=400)
    except (ValueError, TypeError):
        return JsonResponse({'status': 'error', 'message': 'Los IDs y la cantidad deben ser números enteros.'}, status=400)
    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'JSON mal formado en el cuerpo de la petición.'}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': f'Ha ocurrido un error inesperado en el servidor: {e}'}, status=500)




@login_required
@require_POST
def api_asignar_consumo_a_gasto_general(request):
    """Registra la salida como Gasto General (ConsumoInterno)."""
    try:
        data = json.loads(request.body)
        mov_id = str(data.get('movimiento_id', '')).replace('\xa0', '').strip()
        cat = data.get('categoria', 'OTROS')

        with transaction.atomic():
            movimiento = MovimientoStock.objects.get(id=int(mov_id))
            repuesto = movimiento.repuesto

            # 1. Crear el registro en el modelo ConsumoInterno (que sí tienes en tu models.py)
            monto = abs(movimiento.cantidad) * repuesto.precio_unitario
            ConsumoInterno.objects.create(
                repuesto=repuesto,
                cantidad=abs(movimiento.cantidad),
                categoria=cat,
                usuario_validador=request.user,
                monto_total=monto
            )

            # 2. CAMBIO DE MARCA: Cambiamos TERMINAL por VALIDADO
            # Así el filtro exclude() de la vista lo ignorará en la próxima recarga
            movimiento.notas = movimiento.notas.replace("TERMINAL", "VALIDADO GASTO")
            movimiento.notas += f" | Validado como {cat} por {request.user.username}"
            movimiento.save()

        return JsonResponse({'status': 'ok'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)



@login_required
@require_POST
def api_asignar_consumo_a_ot(request):
    """Asigna una salida de terminal a una Orden de Trabajo real."""
    try:
        data = json.loads(request.body)
        mov_id = str(data.get('movimiento_id', '')).replace('\xa0', '').strip()
        ot_id = data.get('ot_id')

        with transaction.atomic():
            movimiento = MovimientoStock.objects.get(id=int(mov_id))
            ot = OrdenDeTrabajo.objects.get(id=int(ot_id))

            # 1. Vincular a la OT
            movimiento.orden_de_trabajo = ot
            
            # 2. CAMBIO DE MARCA: Reemplazamos TERMINAL por VALIDADO
            # Esto es lo que hace que desaparezca de la lista al recargar
            movimiento.notas = movimiento.notas.replace("TERMINAL", "VALIDADO")
            movimiento.notas += f" | Cargado a OT-{ot.folio} por {request.user.username}"
            movimiento.save()

            # 3. Crear el detalle en la OT para que sume al costo total
            DetalleInsumoOT.objects.create(
                orden_de_trabajo=ot,
                repuesto_inventario=movimiento.repuesto,
                cantidad=abs(movimiento.cantidad)
            )
            ot.save() # Recalcula el costo total de la OT

        return JsonResponse({'status': 'ok'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)


@login_required
@user_passes_test(es_supervisor_o_admin)
@require_POST
def api_autorizar_ajuste_auditoria(request, pk):
    """
    FASE 4: El Motor de Ajuste.
    Toma los conteos físicos y reemplaza el stock del sistema.
    """
    connection.set_tenant(request.tenant)
    auditoria = get_object_or_404(AuditoriaInventario, pk=pk, estado='ESPERANDO')

    try:
        with transaction.atomic():
            detalles = auditoria.detalles.select_related('repuesto').all()
            
            for d in detalles:
                # Solo procesamos si hay una diferencia
                if d.diferencia != 0:
                    # 1. Obtener o crear el registro de Stock en esa Bodega específica
                    sb, _ = StockBodega.objects.get_or_create(
                        repuesto=d.repuesto, 
                        bodega=auditoria.bodega
                    )
                    
                    # 2. Determinar si el ajuste es positivo o negativo para el historial
                    tipo_ajuste = 'AJUSTE_POSITIVO' if d.diferencia > 0 else 'AJUSTE_NEGATIVO'
                    
                    # 3. Registrar el Movimiento de Stock para trazabilidad
                    # IMPORTANTE: Al crear este movimiento, tu modelo MovimientoStock.save() 
                    # actualizará automáticamente el Repuesto.stock_actual global.
                    MovimientoStock.objects.create(
                        repuesto=d.repuesto,
                        tipo_movimiento=tipo_ajuste,
                        cantidad=d.diferencia,
                        usuario_responsable=request.user,
                        notas=f"AJUSTE POR AUDITORÍA #{auditoria.id} - Bodega: {auditoria.bodega.nombre}"
                    )
                    
                    # 4. Actualizar el stock local de la bodega para que coincida con el físico
                    sb.cantidad = d.stock_fisico
                    sb.save()

            # 5. Cerrar la auditoría permanentemente
            auditoria.estado = 'FINALIZADA'
            auditoria.fecha_termino = timezone.now()
            auditoria.save()

        messages.success(request, f"¡Éxito! El inventario de la bodega {auditoria.bodega.nombre} ha sido sincronizado.")
        return redirect('detalle_auditoria', pk=auditoria.id)

    except Exception as e:
        messages.error(request, f"Error crítico al ajustar stock: {str(e)}")
        return redirect('detalle_auditoria', pk=auditoria.id)






@login_required
@require_POST
def api_cargar_kit_a_ot(request):
    """
    API para añadir todos los repuestos de un Kit a una Orden de Trabajo.
    Realiza una validación de stock final y, si es exitosa, descuenta el stock
    y añade los insumos a la OT de forma atómica.
    """
    connection.set_tenant(request.tenant)
    try:
        data = json.loads(request.body)
        kit_id = data.get('kit_id')
        ot_id = data.get('ot_id')

        if not kit_id or not ot_id:
            return JsonResponse({'status': 'error', 'message': 'Faltan datos (kit_id u ot_id).'}, status=400)

        with transaction.atomic():
            # Usamos select_for_update para bloquear los registros de repuestos y evitar
            # que otro proceso los modifique mientras hacemos la validación y el descuento.
            kit = get_object_or_404(KitDeRepuestos, pk=kit_id)
            ot = get_object_or_404(OrdenDeTrabajo, pk=ot_id)

            detalles_kit = kit.detallekitrepuesto_set.select_related('repuesto').all()

            # --- Validación final de stock (crítica para evitar inconsistencias) ---
            for detalle in detalles_kit:
                # Bloqueamos la fila del repuesto para la transacción
                repuesto = Repuesto.objects.select_for_update().get(pk=detalle.repuesto.pk)
                if repuesto.stock_actual < detalle.cantidad:
                    # Si el stock cambió desde la validación inicial, detenemos todo.
                    raise Exception(f'Quiebre de stock de último momento para "{repuesto.nombre}". Operación cancelada.')

            # --- Si la validación pasa, procedemos a cargar los repuestos ---
            repuestos_cargados = 0
            for detalle in detalles_kit:
                # Crear el detalle de insumo en la OT
                DetalleInsumoOT.objects.create(
                    orden_de_trabajo=ot,
                    repuesto_inventario=detalle.repuesto,
                    cantidad=detalle.cantidad
                )

                # Crear el movimiento de stock para descontar del inventario
                MovimientoStock.objects.create(
                    repuesto=detalle.repuesto,
                    tipo_movimiento='SALIDA_OT',
                    cantidad=-detalle.cantidad, # Negativo para salida
                    usuario_responsable=request.user,
                    orden_de_trabajo=ot,
                    notas=f"Salida automática por Kit '{kit.nombre}' para OT #{ot.folio}"
                )
                repuestos_cargados += 1

            # Forzamos el recálculo del costo total de la OT
            ot.save()

        return JsonResponse({
            'status': 'ok',
            'message': f'¡Éxito! {repuestos_cargados} tipos de repuestos del kit "{kit.nombre}" han sido añadidos a la OT.'
        })

    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)




@login_required
@require_POST
def api_eliminar_repuesto_temporal(request, pk):
    """
    Permite eliminar un repuesto que se encuentre en la bandeja de validación.
    """
    connection.set_tenant(request.tenant)
    repuesto = get_object_or_404(Repuesto, pk=pk)
    
    # Eliminamos el repuesto directamente. 
    # Si el usuario pulsó el botón desde la bandeja, procedemos.
    try:
        repuesto.delete()
        return JsonResponse({'status': 'ok'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)



@login_required
@require_POST
def api_finalizar_conteo_auditoria(request, pk):
    """Cambia el estado y REDIRIGE de vuelta al panel (Corregido)"""
    connection.set_tenant(request.tenant)
    auditoria = get_object_or_404(AuditoriaInventario, pk=pk)
    auditoria.estado = 'ESPERANDO'
    auditoria.fecha_termino = timezone.now()
    auditoria.save()
    
    messages.success(request, "Captura cerrada. Ahora puedes revisar el cruce y autorizar el ajuste.")
    return redirect('detalle_auditoria', pk=auditoria.pk) # <--- CAMBIO CLAVE


@login_required
def api_kits_search(request):
    """ API para buscar Kits de Repuestos para Select2. """
    connection.set_tenant(request.tenant)
    query = request.GET.get('q', '')
    if len(query) < 2:
        return JsonResponse([], safe=False)

    kits = KitDeRepuestos.objects.filter(nombre__icontains=query)[:10]
    results = [{'id': kit.pk, 'text': kit.nombre} for kit in kits]
    return JsonResponse(results, safe=False)




from django.contrib.auth.decorators import user_passes_test # Asegúrate que este import esté al inicio del archivo
from django.views.decorators.http import require_POST # Y también este
from .decorators import es_administrador # Y este, si no está


@login_required
@require_POST
def api_procesar_conteo_auditoria(request):
    try:
        data = json.loads(request.body)
        sku = data.get('sku', '').strip()
        cantidad = int(data.get('cantidad', 1))
        auditoria_id = data.get('auditoria_id')
        ubicacion = data.get('ubicacion_conteo', 'Sin Ubicación') # PUNTO 3

        with transaction.atomic():
            auditoria = get_object_or_404(AuditoriaInventario, id=auditoria_id, estado='EN_PROCESO')
            repuesto = Repuesto.objects.filter(numero_parte=sku).first()
            if not repuesto:
                # Si no existe, creamos SKU temporal (PUNTO 6)
                repuesto = Repuesto.objects.create(numero_parte=sku, nombre=f"NUEVO SKU: {sku}", stock_actual=0, precio_unitario=0)

            sb = StockBodega.objects.filter(repuesto=repuesto, bodega=auditoria.bodega).first()
            teorico = sb.cantidad if sb else 0
            
            detalle, _ = DetalleAuditoria.objects.get_or_create(
                auditoria=auditoria, repuesto=repuesto,
                defaults={'stock_teorico': teorico, 'stock_fisico': 0}
            )
            detalle.stock_fisico += cantidad
            detalle.ubicacion_conteo = ubicacion # Guardamos el rack
            detalle.save()
            
        return JsonResponse({'status': 'ok', 'nombre': repuesto.nombre, 'total': detalle.stock_fisico})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)



@login_required
@require_POST
def api_rechazar_salida_terminal(request, pk):
    """
    Borra un movimiento de stock que fue erróneo en el terminal.
    Al borrarlo, el stock_actual del repuesto se recupera automáticamente
    gracias al método .save() del modelo MovimientoStock.
    """
    connection.set_tenant(request.tenant)
    movimiento = get_object_or_404(MovimientoStock, pk=pk)
    
    with transaction.atomic():
        # Al eliminar el movimiento, necesitamos ajustar el stock manualmente 
        # o el modelo lo hará si tienes lógica en el delete. 
        # Como tu modelo ajusta en el save, aquí revertimos y borramos:
        repuesto = movimiento.repuesto
        repuesto.stock_actual -= movimiento.cantidad # Si cant era -1, resta -1 (osea suma 1)
        repuesto.save()
        movimiento.delete()
        
    return JsonResponse({'status': 'ok'})


@login_required
@require_POST
def api_validar_stock_kit(request):
    """
    API que valida el stock de todos los repuestos dentro de un kit.
    Devuelve un detalle de disponibilidad.
    """
    connection.set_tenant(request.tenant)
    try:
        data = json.loads(request.body)
        kit_id = data.get('kit_id')
        if not kit_id:
            return JsonResponse({'status': 'error', 'message': 'No se proporcionó ID de kit.'}, status=400)

        kit = get_object_or_404(KitDeRepuestos.objects.prefetch_related('detallekitrepuesto_set__repuesto'), pk=kit_id)

        disponibles = []
        bajo_stock = []
        sin_stock = []

        for detalle in kit.detallekitrepuesto_set.all():
            repuesto = detalle.repuesto
            cantidad_requerida = detalle.cantidad
            stock_restante = repuesto.stock_actual - cantidad_requerida

            info_repuesto = {
                'nombre': repuesto.nombre,
                'numero_parte': repuesto.numero_parte,
                'stock_actual': repuesto.stock_actual,
                'requerido': cantidad_requerida,
                'stock_restante': stock_restante,
            }

            if repuesto.stock_actual < cantidad_requerida:
                sin_stock.append(info_repuesto)
            elif stock_restante < repuesto.stock_minimo:
                bajo_stock.append(info_repuesto)
            else:
                disponibles.append(info_repuesto)

        return JsonResponse({
            'status': 'ok',
            'kit_nombre': kit.nombre,
            'resumen': {
                'disponibles': disponibles,
                'bajo_stock': bajo_stock,
                'sin_stock': sin_stock,
            }
        })

    except KitDeRepuestos.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'El Kit no fue encontrado.'}, status=404)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': f'Error interno del servidor: {e}'}, status=500)









@login_required
@require_POST
def api_vincular_codigo_repuesto(request):
    """
    PUNTO 8: El Cruce Inteligente.
    Vincula un código de barras nuevo a un repuesto viejo del catálogo.
    """
    try:
        data = json.loads(request.body)
        repuesto_id = data.get('repuesto_id')
        nuevo_codigo = data.get('nuevo_codigo')
        
        repuesto = get_object_or_404(Repuesto, id=repuesto_id)
        # Guardamos el código nuevo en el número de parte para que sea reconocible siempre
        repuesto.numero_parte = nuevo_codigo
        repuesto.save()
        
        return JsonResponse({'status': 'ok', 'message': f'Código {nuevo_codigo} vinculado a {repuesto.nombre}'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)


from django.db.models import Max, OuterRef, Subquery # Asegúrate de tener estos imports


@login_required
@user_passes_test(es_supervisor_o_admin)
def bandeja_validacion_inventario(request):
    connection.set_tenant(request.tenant)
    from django.db.models import Q

    # Un producto está pendiente si:
    # 1. Su nombre aún contiene la marca temporal del scanner.
    # 2. O su precio es 0 o nulo (lo que indica que no ha sido valorizado).
    pendientes = Repuesto.objects.filter(
        Q(nombre__icontains="NUEVO SKU:") | 
        Q(precio_unitario__lte=0) | 
        Q(precio_unitario__isnull=True)
    ).filter(ocultar=False).order_by('-id')

    return render(request, 'flota/inventario/bandeja_validacion.html', {
        'pendientes': pendientes,
        'full_width_content': True
    })



@login_required
@user_passes_test(es_supervisor_o_admin)
def crear_auditoria(request):
    """Inicia una nueva sesión de auditoría."""
    connection.set_tenant(request.tenant)
    if request.method == 'POST':
        form = AuditoriaInventarioForm(request.POST)
        if form.is_valid():
            auditoria = form.save(commit=False)
            auditoria.responsable = request.user
            auditoria.save()
            messages.success(request, f"Auditoría #{auditoria.id} iniciada. Ya pueden escanear en la bodega {auditoria.bodega.nombre}.")
            return redirect('detalle_auditoria', pk=auditoria.id)
    else:
        form = AuditoriaInventarioForm()
    
    return render(request, 'flota/inventario/auditoria_form.html', {'form': form, 'titulo': 'Iniciar Inventario Físico'})








# /opt/pulser_app/flota/views.py


@login_required
def crear_bodega(request):
    connection.set_tenant(request.tenant)
    if request.method == 'POST':
        form = BodegaForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('lista_bodegas')
    else:
        form = BodegaForm()
    return render(request, 'flota/administracion/bodega_form.html', {'form': form, 'titulo': 'Crear Nueva Bodega'})


@login_required
@user_passes_test(es_supervisor_o_admin)
def crear_kit(request):
    connection.set_tenant(request.tenant)
    if request.method == 'POST':
        # La línea más importante para depurar:
        print("--- DATOS CRUDOS RECIBIDOS DEL FORMULARIO ---", request.POST)

        form = KitDeRepuestosForm(request.POST)
        formset = DetalleKitRepuestoFormSet(request.POST, prefix='detalles')

        if form.is_valid() and formset.is_valid():
            try:
                with transaction.atomic():
                    kit_instance = form.save()
                    formset.instance = kit_instance
                    formset.save()
                    messages.success(request, f'¡Kit "{kit_instance.nombre}" creado con éxito!')
                    return redirect('lista_kits')
            except Exception as e:
                messages.error(request, f"Ocurrió un error al crear el kit: {e}")
        else:
            # Si la validación falla, lo mostramos en el frontend
            if not form.is_valid():
                messages.error(request, f"Error en datos del kit: {form.errors.as_text()}")
            if not formset.is_valid():
                messages.error(request, f"Error en los repuestos: {formset.errors}")

    else: # Si es GET
        form = KitDeRepuestosForm()
        formset = DetalleKitRepuestoFormSet(prefix='detalles')

    context = {
        'form': form,
        'formset': formset,
        'titulo': "Crear Nuevo Kit de Repuestos",
        'full_width_content': True
    }
    return render(request, 'flota/kit_form.html', context)





@login_required
@user_passes_test(es_supervisor_o_admin)
def detalle_auditoria(request, pk):
    connection.set_tenant(request.tenant)
    auditoria = get_object_or_404(AuditoriaInventario.objects.select_related('bodega'), pk=pk)
    
    # 1. Capturar parámetros de búsqueda y páginas
    query = request.GET.get('q', '')
    page_h = request.GET.get('page', 1)      # Página para Hallados
    page_i = request.GET.get('page_inv', 1)  # Página para Invisibles

    # 2. Consultas Base (Sin paginar para cálculos financieros)
    detalles_qs = auditoria.detalles.select_related('repuesto').all()
    ids_auditados_totales = detalles_qs.values_list('repuesto_id', flat=True)

    ultima_salida_subq = MovimientoStock.objects.filter(
        repuesto=OuterRef('repuesto_id'),
        tipo_movimiento='SALIDA_OT'
    ).order_by('-fecha_movimiento').values('fecha_movimiento')[:1]

    invisibles_qs = StockBodega.objects.filter(
        bodega=auditoria.bodega, 
        cantidad__gt=0
    ).exclude(
        repuesto_id__in=ids_auditados_totales
    ).select_related('repuesto').annotate(
        fecha_ultima_salida=Subquery(ultima_salida_subq)
    )

    # 3. Aplicar Filtro de Búsqueda si existe
    if query:
        detalles_qs = detalles_qs.filter(
            Q(repuesto__nombre__icontains=query) | Q(repuesto__numero_parte__icontains=query)
        )
        invisibles_qs = invisibles_qs.filter(
            Q(repuesto__nombre__icontains=query) | Q(repuesto__numero_parte__icontains=query)
        )

    # 4. Cálculos Financieros (sobre lo filtrado o sobre el total, según prefieras)
    # Aquí los dejo sobre el total de la auditoría para que Bruno no pierda de vista el balance global
    valor_perdida = 0
    valor_ganancia = 0
    for d in auditoria.detalles.select_related('repuesto').all():
        val = d.diferencia * d.repuesto.precio_unitario
        if val < 0: valor_perdida += abs(val)
        else: valor_ganancia += val
    
    # Sumar mermas de invisibles totales (los 236 de tu foto)
    invisibles_totales = StockBodega.objects.filter(bodega=auditoria.bodega, cantidad__gt=0).exclude(repuesto_id__in=ids_auditados_totales)
    for inv in invisibles_totales:
        valor_perdida += (inv.cantidad * inv.repuesto.precio_unitario)

    # 5. PAGINACIÓN (Límite 50)
    paginator_h = Paginator(detalles_qs, 50)
    detalles_paginados = paginator_h.get_page(page_h)

    paginator_i = Paginator(invisibles_qs, 50)
    invisibles_paginados = paginator_i.get_page(page_i)

    # Pre-calcular valor individual para la página actual de invisibles
    for inv in invisibles_paginados:
        inv.valor_perdida_total = inv.cantidad * inv.repuesto.precio_unitario

    # Pre-calcular valor individual para la página actual de hallados
    for d in detalles_paginados:
        d.valor_dif = d.diferencia * d.repuesto.precio_unitario

    return render(request, 'flota/inventario/detalle_auditoria.html', {
        'auditoria': auditoria,
        'detalles': detalles_paginados,
        'invisibles': invisibles_paginados,
        'query': query,
        'resumen': {
            'contados': auditoria.detalles.count(),
            'invisibles_count': invisibles_totales.count(),
            'perdida': valor_perdida,
            'ganancia': valor_ganancia,
            'balance': valor_ganancia - valor_perdida
        },
        'full_width_content': True
    })



# ACTUALIZA TAMBIÉN EL PROCESADO PARA RECIBIR LA UBICACIÓN

@login_required
@user_passes_test(es_supervisor_o_admin)
def editar_bodega(request, pk):
    """Permite editar una bodega existente"""
    connection.set_tenant(request.tenant)
    bodega = get_object_or_404(Bodega, pk=pk)
    if request.method == 'POST':
        form = BodegaForm(request.POST, instance=bodega)
        if form.is_valid():
            form.save()
            messages.success(request, 'Bodega actualizada correctamente.')
            return redirect('lista_bodegas')
    else:
        form = BodegaForm(instance=bodega)
    return render(request, 'flota/administracion/bodega_form.html', {
        'form': form, 
        'titulo': f'Editando: {bodega.nombre}'
    })



@login_required
@user_passes_test(es_supervisor_o_admin)
def editar_kit(request, pk):
    connection.set_tenant(request.tenant)
    kit = get_object_or_404(KitDeRepuestos, pk=pk)
    if request.method == 'POST':
        form = KitDeRepuestosForm(request.POST, instance=kit)
        formset = DetalleKitRepuestoFormSet(request.POST, instance=kit, prefix='detalles')
        if form.is_valid() and formset.is_valid():
            try:
                with transaction.atomic():
                    form.save()
                    formset.save()
                    messages.success(request, f'¡Kit "{kit.nombre}" actualizado con éxito!')
                    return redirect('lista_kits')
            except Exception as e:
                messages.error(request, f"Ocurrió un error al actualizar el kit: {e}")
    else:
        form = KitDeRepuestosForm(instance=kit)
        formset = DetalleKitRepuestoFormSet(instance=kit, prefix='detalles')
    context = {
        'form': form,
        'formset': formset,
        'kit': kit,
        'titulo': f"Editando Kit: {kit.nombre}"
    }
    # Nota: Esta vista usa 'kit_form_editar.html', asegúrate de que ese archivo exista
    # o renómbralo a 'flota/kit_form.html' si quieres reutilizar la misma plantilla.
    return render(request, 'flota/kit_form_editar.html', context)


@login_required
@user_passes_test(es_supervisor_o_admin)
def editar_kit(request, pk):
    connection.set_tenant(request.tenant)
    kit = get_object_or_404(KitDeRepuestos, pk=pk)
    if request.method == 'POST':
        form = KitDeRepuestosForm(request.POST, instance=kit)
        formset = DetalleKitRepuestoFormSet(request.POST, instance=kit, prefix='detalles')
        if form.is_valid() and formset.is_valid():
            try:
                with transaction.atomic():
                    form.save()
                    formset.save()
                    messages.success(request, f'¡Kit "{kit.nombre}" actualizado con éxito!')
                    return redirect('lista_kits')
            except Exception as e:
                messages.error(request, f"Ocurrió un error al actualizar el kit: {e}")
    else:
        form = KitDeRepuestosForm(instance=kit)
        formset = DetalleKitRepuestoFormSet(instance=kit, prefix='detalles')
    context = {
        'form': form,
        'formset': formset,
        'kit': kit,
        'titulo': f"Editando Kit: {kit.nombre}"
    }
    return render(request, 'flota/kit_form_editar.html', context)


@login_required
def eliminar_bodega(request, pk):
    connection.set_tenant(request.tenant)
    bodega = get_object_or_404(Bodega, pk=pk)
    bodega.delete()
    return redirect('lista_bodegas')



@login_required
@user_passes_test(es_supervisor_o_admin)
def eliminar_kit(request, pk):
    connection.set_tenant(request.tenant)
    kit = get_object_or_404(KitDeRepuestos, pk=pk)

    if request.method == 'POST':
        nombre_kit = kit.nombre
        kit.delete()
        messages.warning(request, f'El kit "{nombre_kit}" ha sido eliminado.')
        return redirect('lista_kits')

    return redirect('lista_kits')


@login_required
@user_passes_test(es_supervisor_o_admin)
def eliminar_kit(request, pk):
    connection.set_tenant(request.tenant)
    kit = get_object_or_404(KitDeRepuestos, pk=pk)

    if request.method == 'POST':
        nombre_kit = kit.nombre
        kit.delete()
        messages.warning(request, f'El kit "{nombre_kit}" ha sido eliminado.')
        return redirect('lista_kits')

    return redirect('lista_kits')


@login_required
def export_repuestos_csv(request):
    connection.set_tenant(request.tenant)
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="reporte_repuestos.csv"'
    response.write(u'\ufeff'.encode('utf8')) # BOM para Excel

    writer = csv.writer(response, delimiter=';')
    writer.writerow([
        'Nombre', 'Numero de Parte', 'Calidad', 'Stock Actual',
        'Stock Minimo', 'Ubicacion', 'Proveedor Habitual', 'Precio Unitario'
    ])

    repuestos_qs = Repuesto.objects.filter(ocultar=False).select_related('proveedor_habitual').order_by('nombre')

    # Aplicar filtro de búsqueda si viene en la petición
    query = request.GET.get('q', '')
    if query:
        repuestos_qs = repuestos_qs.filter(
            Q(nombre__icontains=query) | Q(numero_parte__icontains=query)
        )

    for repuesto in repuestos_qs:
        writer.writerow([
            repuesto.nombre,
            repuesto.numero_parte,
            repuesto.get_calidad_display(),
            repuesto.stock_actual,
            repuesto.stock_minimo,
            repuesto.ubicacion or '',
            repuesto.proveedor_habitual.nombre if repuesto.proveedor_habitual else '',
            f"{repuesto.precio_unitario:.2f}".replace('.',','),
        ])
    return response



@login_required
def export_repuestos_excel(request):
    """Genera el Excel de inventario para el Bodeguero o Jefe."""
    connection.set_tenant(request.tenant)
    
    # Verificación rápida de seguridad
    if request.user.groups.filter(name='Mecánico').exists() and not request.user.is_staff:
        return HttpResponseForbidden()

    response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response['Content-Disposition'] = 'attachment; filename="inventario_pulser.xlsx"'

    wb = Workbook()
    ws = wb.active
    ws.title = "Suministros"

    # Encabezados
    headers = ['Nombre', 'SKU / N° Parte', 'Calidad', 'Origen', 'Stock Actual', 'Ubicación', 'Proveedor', 'Precio Unitario', 'Valor Total']
    ws.append(headers)
    for cell in ws[1]: cell.font = Font(bold=True)

    # Datos
    repuestos = Repuesto.objects.filter(ocultar=False).select_related('proveedor_habitual')
    for r in repuestos:
        ws.append([
            r.nombre, r.numero_parte, r.get_calidad_display(), r.get_origen_display(),
            r.stock_actual, r.ubicacion or '', 
            r.proveedor_habitual.nombre if r.proveedor_habitual else 'N/A',
            float(r.precio_unitario),
            float(r.stock_actual * r.precio_unitario)
        ])

    wb.save(response)
    return response





@login_required
@user_passes_test(es_supervisor_o_admin)
def generar_reporte_auditoria_pdf(request, pk):
    connection.set_tenant(request.tenant)
    auditoria = get_object_or_404(AuditoriaInventario.objects.select_related('bodega', 'responsable'), pk=pk)
    
    detalles = auditoria.detalles.select_related('repuesto').all()
    ids_auditados = detalles.values_list('repuesto_id', flat=True)
    invisibles = StockBodega.objects.filter(bodega=auditoria.bodega, cantidad__gt=0).exclude(repuesto_id__in=ids_auditados).select_related('repuesto')

    # HACEMOS EL CÁLCULO AQUÍ PARA QUE EL PDF NO FALLE
    for d in detalles:
        d.valor_dif = d.diferencia * d.repuesto.precio_unitario

    for inv in invisibles:
        inv.valor_perdida_total = inv.cantidad * inv.repuesto.precio_unitario

    context = {
        'auditoria': auditoria,
        'detalles': detalles,
        'invisibles': invisibles,
        'fecha_emision': timezone.now(),
        'tenant_name': request.tenant.nombre,
    }

    html_string = render_to_string('flota/inventario/auditoria_pdf_template.html', context)
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'inline; filename="Acta-Auditoria-{auditoria.id}.pdf"'
    HTML(string=html_string, base_url=request.build_absolute_uri()).write_pdf(response)
    return response




@login_required
def historial_movimientos_inventario(request):
    from django.db.models.functions import Abs
    connection.set_tenant(request.tenant)
    
    # IMPORTANTE: Añadimos .filter(repuesto__isnull=False) para evitar errores en el HTML
    movimientos = MovimientoStock.objects.filter(repuesto__isnull=False).select_related(
        'repuesto', 'usuario_responsable', 'orden_de_trabajo'
    ).annotate(
        abs_cantidad=Abs('cantidad')
    ).order_by('-fecha_movimiento')

    # ... (el resto del código de filtros de esta función se queda igual)
    q = request.GET.get('q', '')
    if q:
        movimientos = movimientos.filter(Q(repuesto__nombre__icontains=q) | Q(repuesto__numero_parte__icontains=q))
    
    usuarios = User.objects.filter(is_active=True).order_by('first_name')
    return render(request, 'flota/inventario/historial_movimientos.html', {
        'movimientos': movimientos[:150],
        'usuarios': usuarios,
        'full_width_content': True
    })




@login_required
@user_passes_test(es_supervisor_o_admin)
def historial_movimientos_inventario(request):
    """
    Vista de auditoría para Bruno. 
    Muestra quién sacó qué, de dónde y a qué hora.
    """
    from django.db.models.functions import Abs # Importación local rápida
    connection.set_tenant(request.tenant)
    
    q = request.GET.get('q', '')
    usuario_id = request.GET.get('usuario')
    tipo = request.GET.get('tipo')

    # Anotamos 'abs_cantidad' para evitar el error del filtro en el HTML
    movimientos = MovimientoStock.objects.select_related(
        'repuesto', 'usuario_responsable', 'orden_de_trabajo'
    ).annotate(
        abs_cantidad=Abs('cantidad')
    ).all().order_by('-fecha_movimiento')

    if q:
        movimientos = movimientos.filter(
            Q(repuesto__nombre__icontains=q) | 
            Q(repuesto__numero_parte__icontains=q) |
            Q(notas__icontains=q)
        )
    
    if usuario_id:
        movimientos = movimientos.filter(usuario_responsable_id=usuario_id)
    
    if tipo:
        movimientos = movimientos.filter(tipo_movimiento=tipo)

    usuarios = User.objects.filter(is_active=True).order_by('first_name')

    context = {
        'movimientos': movimientos[:150],
        'usuarios': usuarios,
        'tipos_movimiento': MovimientoStock.TIPO_MOVIMIENTO_CHOICES,
        'full_width_content': True
    }
    return render(request, 'flota/inventario/historial_movimientos.html', context)


@login_required
def inventario_neumaticos(request, vehiculo_pk=None):
    """
    Vista para mostrar la lista de neumáticos.
    Ahora puede filtrar por un vehículo específico.
    """
    connection.set_tenant(request.tenant)

    query = request.GET.get('q', '')
    estado_filter = request.GET.get('estado', '')
    vehiculo_filtrado = None

    neumaticos_list = Neumatico.objects.select_related('medida', 'diseno', 'vehiculo_montado').order_by('dot')

    # Si la URL nos pasa un ID de vehículo, filtramos por él
    if vehiculo_pk:
        vehiculo_filtrado = get_object_or_404(Vehiculo, pk=vehiculo_pk)
        neumaticos_list = neumaticos_list.filter(vehiculo_montado=vehiculo_filtrado)

    if query:
        neumaticos_list = neumaticos_list.filter(
            Q(dot__icontains=query) |
            Q(medida__medida__icontains=query) |
            Q(diseno__nombre__icontains=query) |
            Q(vehiculo_montado__numero_interno__icontains=query)
        )

    if estado_filter:
        neumaticos_list = neumaticos_list.filter(estado=estado_filter)

    paginator = Paginator(neumaticos_list, 20)
    page_number = request.GET.get('page')
    neumaticos = paginator.get_page(page_number)

    context = {
        'neumaticos': neumaticos,
        'query': query,
        'estado_filter': estado_filter,
        'estado_choices': Neumatico.ESTADO_CHOICES,
        'vehiculo_filtrado': vehiculo_filtrado,
    }
    return render(request, 'flota/neumaticos/inventario_neumaticos.html', context)

# /opt/pulser_app/flota/views.py


@login_required
@user_passes_test(es_supervisor_o_admin)
def kit_detail(request, pk):
    """
    Vista para mostrar el detalle de solo lectura de un Kit de Repuestos.
    """
    connection.set_tenant(request.tenant)
    # Usamos prefetch_related para cargar los detalles y repuestos eficientemente
    kit = get_object_or_404(KitDeRepuestos.objects.prefetch_related('detallekitrepuesto_set__repuesto'), pk=pk)
    context = {
        'kit': kit,
        'titulo': f"Detalle del Kit: {kit.nombre}"
    }
    return render(request, 'flota/kit_detail.html', context)









@login_required
@user_passes_test(es_supervisor_o_admin)
def kit_detail(request, pk):
    """
    Vista para mostrar el detalle de solo lectura de un Kit de Repuestos.
    """
    connection.set_tenant(request.tenant)
    # Usamos prefetch_related para cargar los detalles y repuestos eficientemente


    kit = get_object_or_404(KitDeRepuestos.objects.prefetch_related('detallekitrepuesto_set__repuesto'), pk=pk)
    context = {
        'kit': kit,
        'titulo': f"Detalle del Kit: {kit.nombre}"
    }
    # Esta vista usará una nueva plantilla que crearemos después.
    return render(request, 'flota/kit_detail.html', context)






@login_required
@user_passes_test(es_supervisor_o_admin)
def lista_auditorias(request):
    """Lista histórica y actual de sesiones de inventario."""
    connection.set_tenant(request.tenant)
    auditorias = AuditoriaInventario.objects.select_related('bodega', 'responsable').order_by('-fecha_inicio')
    return render(request, 'flota/inventario/lista_auditorias.html', {
        'auditorias': auditorias,
        'full_width_content': True
    })


@login_required
def lista_bodegas(request):
    connection.set_tenant(request.tenant)
    bodegas = Bodega.objects.all().order_by('numero_identificador')
    return render(request, 'flota/administracion/lista_bodegas.html', {'bodegas': bodegas})


@login_required
@user_passes_test(es_supervisor_o_admin)
def lista_kits(request):
    connection.set_tenant(request.tenant)

    # Lógica de búsqueda
    query = request.GET.get('q', '')
    if query:
        kits_list = KitDeRepuestos.objects.filter(
            nombre__icontains=query
        ).order_by('nombre')
    else:
        kits_list = KitDeRepuestos.objects.all().order_by('nombre')

    # Paginación con el nuevo límite de 25
    paginator = Paginator(kits_list, 25)
    page = request.GET.get('page')
    try:
        kits = paginator.page(page)
    except PageNotAnInteger:
        kits = paginator.page(1)
    except EmptyPage:
        kits = paginator.page(paginator.num_pages)

    context = {
        'kits': kits,
        'query': query,
    }
    return render(request, 'flota/lista_kits.html', context)





@require_POST
@csrf_exempt  # si usas CSRF token por JS, luego lo quitamos
def ocultar_repuesto(request, pk):
    repuesto = get_object_or_404(Repuesto, pk=pk)
    repuesto.ocultar = True
    repuesto.save(update_fields=['ocultar'])

    return JsonResponse({
        'success': True,
        'message': 'Repuesto ocultado correctamente'
    })

########################## Solicitudes

@login_required
@user_passes_test(es_supervisor_o_admin)
def panel_validacion_inventario_general(request):
    """
    Repositorio temporal de 24 horas. 
    Muestra todas las salidas de bodega que no tienen una OT vinculada aún.
    """
    connection.set_tenant(request.tenant)
    
    # Filtramos movimientos de salida que NO tienen OT y vienen del Terminal
    consumos_pendientes = MovimientoStock.objects.filter(
        Q(notas__icontains="TERMINAL DÍA") | Q(notas__icontains="TERMINAL NOCHE"),
        orden_de_trabajo__isnull=True,
        cantidad__lt=0
    ).select_related('repuesto', 'usuario_responsable').order_by('-fecha_movimiento')

    ots_abiertas = OrdenDeTrabajo.objects.filter(
        estado__in=['POR_ASIGNAR', 'PENDIENTE', 'EN_PROCESO', 'PAUSADA']
    ).select_related('vehiculo').order_by('-fecha_creacion')

    return render(request, 'flota/inventario/panel_validacion_noche.html', {
        'consumos': consumos_pendientes,
        'ots': ots_abiertas,
        'full_width_content': True,
        'titulo_panel': 'Validación de Salidas de Bodega (24 Horas)'
    })





@login_required
@user_passes_test(es_supervisor_o_admin)
def panel_validacion_inventario_general(request):
    """
    Panel de Auditoría. Muestra solo movimientos con 'TERMINAL' 
    que NO hayan sido validados todavía.
    """
    connection.set_tenant(request.tenant)

    # Filtramos: Notas que tengan "TERMINAL" pero que NO tengan "VALIDADO"
    # Esto asegura que una vez gestionado, desaparezca del panel para siempre.
    consumos_pendientes = MovimientoStock.objects.filter(
        notas__icontains="TERMINAL",
        orden_de_trabajo__isnull=True,
        cantidad__lt=0
    ).exclude(
        notas__icontains="VALIDADO"
    ).select_related('repuesto', 'usuario_responsable').order_by('-fecha_movimiento')

    ots_abiertas = OrdenDeTrabajo.objects.filter(
        estado__in=['POR_ASIGNAR', 'PENDIENTE', 'EN_PROCESO', 'PAUSADA']
    ).select_related('vehiculo').order_by('-fecha_creacion')

    return render(request, 'flota/inventario/panel_validacion_noche.html', {
        'consumos': consumos_pendientes,
        'ots': ots_abiertas,
        'full_width_content': True
    })


def predecir_consumo_para_ruta(vehiculo, ruta, distancia_personalizada=None):
    if distancia_personalizada:
        try:
            distancia_a_recorrer = float(distancia_personalizada)
        except (ValueError, TypeError):
            return {'error': 'La distancia personalizada debe ser un número válido.'}
    else:
        distancia_a_recorrer = float(ruta.distancia_km)

    rendimiento_en_ruta = CargaCombustible.objects.filter(
        vehiculo=vehiculo, ruta=ruta, rendimiento_calculado_kml__isnull=False
    ).aggregate(promedio=Avg('rendimiento_calculado_kml'))['promedio']

    if not rendimiento_en_ruta:
        rendimiento_general = CargaCombustible.objects.filter(
            vehiculo=vehiculo, rendimiento_calculado_kml__isnull=False
        ).aggregate(promedio=Avg('rendimiento_calculado_kml'))['promedio']
        if not rendimiento_general:
            return {'error': 'No hay suficientes datos de rendimiento para este vehículo.'}
        rendimiento_base = float(rendimiento_general)
        fuente_rendimiento = "promedio general del vehículo"
    else:
        rendimiento_base = float(rendimiento_en_ruta)
        fuente_rendimiento = f"histórico en la ruta '{ruta.nombre}'"

    rendimiento_ajustado = rendimiento_base
    if rendimiento_ajustado <= 0:
        return {'error': 'El rendimiento calculado es cero o negativo, no se puede predecir.'}

    consumo_predicho_litros = distancia_a_recorrer / rendimiento_ajustado

    return {
        'error': None, 'vehiculo': vehiculo, 'ruta': ruta, 'distancia_utilizada': distancia_a_recorrer,
        'rendimiento_base_kml': rendimiento_base, 'fuente_del_rendimiento': fuente_rendimiento,
        'consumo_predicho_litros': consumo_predicho_litros
    }


@login_required
@user_passes_test(es_supervisor_o_admin)
def reporte_maestro_consumos(request):
    connection.set_tenant(request.tenant)
    
    today = timezone.now().date()
    fecha_desde = request.GET.get('fecha_desde', (today - timedelta(days=30)).strftime('%Y-%m-%d'))
    fecha_hasta = request.GET.get('fecha_hasta', today.strftime('%Y-%m-%d'))

    # --- FUENTE 1: COMPRAS MANUALES (Líneas de O.C.) ---
    compras_cc = LineaOrdenCompra.objects.filter(
        orden__fecha_creacion__date__range=[fecha_desde, fecha_hasta]
    ).select_related('orden', 'orden__proveedor', 'centro_de_costo', 'repuesto')

    # --- FUENTE 2: MANTENIMIENTO (OTs Finalizadas) ---
    ots_finalizadas = OrdenDeTrabajo.objects.filter(
        estado='FINALIZADA',
        fecha_cierre__date__range=[fecha_desde, fecha_hasta]
    ).select_related('vehiculo', 'proveedor')

    # --- PROCESAMIENTO PARA GRÁFICOS (Mismo que antes pero más limpio) ---
    resumen_grafico = {}
    bitacora_detallada = []

    # Procesar Compras Manuales para la bitácora
    for linea in compras_cc:
        nombre_cc = linea.centro_de_costo.nombre if linea.centro_de_costo else "Bodega/Taller"
        monto = float(linea.precio_total)
        
        resumen_grafico[nombre_cc] = resumen_grafico.get(nombre_cc, 0) + monto
        
        bitacora_detallada.append({
            'fecha': linea.orden.fecha_creacion,
            'documento': f"O.C. #{linea.orden.id}",
            'url': reverse('orden_compra_detail', args=[linea.orden.id]),
            'categoria': nombre_cc,
            'item': linea.repuesto.nombre if linea.repuesto else linea.descripcion_manual,
            'proveedor': linea.orden.proveedor.nombre,
            'monto': monto
        })

    # Procesar OTs para la bitácora
    for ot in ots_finalizadas:
        monto_ot = float(ot.costo_total)
        resumen_grafico["Mantenimiento (OTs)"] = resumen_grafico.get("Mantenimiento (OTs)", 0) + monto_ot
        
        bitacora_detallada.append({
            'fecha': ot.fecha_cierre,
            'documento': f"OT-{ot.folio}",
            'url': reverse('ot_detail', args=[ot.id]),
            'categoria': "Mantenimiento (OTs)",
            'item': f"Mantención Vehículo {ot.vehiculo.numero_interno}",
            'proveedor': ot.proveedor.nombre if ot.proveedor else "Taller Interno",
            'monto': monto_ot
        })

    # Ordenar bitácora por fecha (más reciente primero)
    bitacora_detallada.sort(key=lambda x: x['fecha'], reverse=True)

    # Preparar datos para Chart.js
    total_periodo = sum(resumen_grafico.values())
    chart_labels = list(resumen_grafico.keys())
    chart_data = [round(v, 2) for v in resumen_grafico.values()]

    context = {
        'fecha_desde': fecha_desde,
        'fecha_hasta': fecha_hasta,
        'total_periodo': total_periodo,
        'bitacora': bitacora_detallada,
        'chart_labels_js': json.dumps(chart_labels),
        'chart_data_js': json.dumps(chart_data),
        'full_width_content': True
    }
    return render(request, 'flota/reportes/maestro_consumos.html', context)




@login_required
def repuesto_create(request):
    connection.set_tenant(request.tenant)
    from .models import Bodega, StockBodega
    bodegas = Bodega.objects.all().order_by('numero_identificador')

    if request.method == 'POST':
        form = RepuestoForm(request.POST)
        if form.is_valid():
            with transaction.atomic():
                # Guardar el repuesto
                repuesto = form.save()

                # Capturar la bodega elegida y crear el stock por bodega
                bodega_id = request.POST.get('bodega_id')
                if bodega_id:
                    bodega = Bodega.objects.get(id=bodega_id)
                    StockBodega.objects.create(
                        repuesto=repuesto,
                        bodega=bodega,
                        cantidad=repuesto.stock_actual
                    )

                messages.success(request, f'Repuesto {repuesto.nombre} creado con éxito.')
                return redirect('repuesto_list')
    else:
        form = RepuestoForm()

    # SOLUCIÓN: Enviamos todas las variables que la plantilla shared espera
    return render(request, 'flota/repuesto_form.html', {
        'form': form,
        'bodegas': bodegas,
        'repuesto': None,             # Al ser nuevo, se pasa como None
        'bodega_actual_id': None,     # No hay bodega previa
        'full_width_content': True    # Para que mantenga el diseño ancho
    })


@login_required
def repuesto_detail(request, pk):
    """
    Vista para ver el detalle y el historial de movimientos de un repuesto.
    """
    connection.set_tenant(request.tenant)
    repuesto = get_object_or_404(Repuesto, pk=pk)
    movimientos = repuesto.movimientos.all()

    context = {
        'repuesto': repuesto,
        'movimientos': movimientos,
    }
    return render(request, 'flota/repuesto_detail.html', context)



@login_required
def repuesto_list(request):
    """
    Vista principal de Gestión de Suministros.
    Bloqueada para Mecánicos (Requerimiento Gabriel).
    """
    connection.set_tenant(request.tenant)
    
    # --- 1. VALIDACIÓN DE PERMISOS (REUNIÓN GABRIEL) ---
    user_groups = set(request.user.groups.values_list('name', flat=True))
    es_mecanico = 'Mecánico' in user_groups
    # Consideramos Bodeguero a quien tenga el grupo o el cargo específico
    es_bodeguero = 'Bodeguero' in user_groups or 'Encargado de Bodega' in user_groups
    es_admin_sup = 'Administrador' in user_groups or 'Supervisor' in user_groups

    # Bloqueo: Si es mecánico, no entra (a menos que sea staff/superusuario)
    if es_mecanico and not request.user.is_staff:
        messages.error(request, "Acceso denegado. El panel de Suministros es de uso exclusivo para Bodega y Jefatura.")
        return redirect('ot_list')

    # --- 2. LÓGICA DE FILTROS Y CONSULTA ---
    query = request.GET.get('q', '')
    calidad = request.GET.get('calidad', '')
    proveedor_id = request.GET.get('proveedor')
    bodega_id = request.GET.get('bodega')

    # Subconsulta para la fecha de última salida (para el semáforo de rotación)
    ultima_salida_subq = MovimientoStock.objects.filter(
        repuesto=OuterRef('pk'),
        tipo_movimiento='SALIDA_OT'
    ).order_by('-fecha_movimiento').values('fecha_movimiento')[:1]

    # Consulta Base
    if bodega_id:
        repuestos_ids = StockBodega.objects.filter(bodega_id=bodega_id).values_list('repuesto_id', flat=True)
        repuestos_queryset = Repuesto.objects.filter(id__in=repuestos_ids, ocultar=False)
    else:
        repuestos_queryset = Repuesto.objects.filter(ocultar=False)

    repuestos_queryset = repuestos_queryset.select_related('proveedor_habitual').annotate(
        ultima_salida_fecha=Subquery(ultima_salida_subq)
    ).order_by('nombre')

    # Aplicación de filtros
    if query:
        repuestos_queryset = repuestos_queryset.filter(
            Q(nombre__icontains=query) |
            Q(numero_parte__icontains=query) |
            Q(codigos_equivalentes__icontains=query)
        )
    if calidad:
        repuestos_queryset = repuestos_queryset.filter(calidad=calidad)
    if proveedor_id:
        repuestos_queryset = repuestos_queryset.filter(proveedor_habitual_id=proveedor_id)

    # Contador de Validaciones (Badge en la interfaz)
    pendientes_count = Repuesto.objects.filter(
        Q(nombre__icontains="NUEVO SKU:") |
        Q(precio_unitario__lte=0) |
        Q(precio_unitario__isnull=True)
    ).filter(ocultar=False).count()

    # Construcción de data para la tabla (Mezcla Repuesto + StockBodega)
    items_para_tabla = []
    for r in repuestos_queryset:
        current_sb_id = None
        if bodega_id:
            sb = StockBodega.objects.filter(repuesto=r, bodega_id=bodega_id).first()
            cantidad_mostrar = sb.cantidad if sb else 0
            bodega_nombre = sb.bodega.nombre if sb else "Sin Stock"
            if sb: current_sb_id = sb.id
        else:
            cantidad_mostrar = r.stock_actual
            sb_first = StockBodega.objects.filter(repuesto=r).first()
            bodega_nombre = sb_first.bodega.nombre if sb_first else "Sin Ubicación"
            if sb_first: current_sb_id = sb_first.id

        items_para_tabla.append({
            'repuesto': r,
            'sb_id': current_sb_id, 
            'bodega_nombre': bodega_nombre,
            'cantidad': cantidad_mostrar,
            'ultima_salida_fecha': r.ultima_salida_fecha,
            'total_fila': cantidad_mostrar * r.precio_unitario
        })

    context = {
        'repuestos_data': items_para_tabla,
        'bodegas': Bodega.objects.all().order_by('numero_identificador'),
        'proveedores': Proveedor.objects.all().order_by('nombre'),
        'calidades': Repuesto.CALIDAD_CHOICES,
        'query': query,
        'pendientes_count': pendientes_count,
        'es_bodeguero': es_bodeguero or es_admin_sup,
        'full_width_content': True
    }
    return render(request, 'flota/repuesto_list.html', context)




# ADEMÁS: Corrige esta función para evitar el crash del 'NoneType' en el Historial

@login_required
def repuesto_search_api(request):
    """Buscador optimizado para mostrar stock real en OTs y Terminal"""
    connection.set_tenant(request.tenant)
    query = request.GET.get('q', '')
    bodega_id = request.GET.get('bodega_id') 

    if len(query) < 2:
        return JsonResponse([], safe=False)

    repuestos = Repuesto.objects.filter(
        Q(numero_parte__icontains=query) |
        Q(nombre__icontains=query) |
        Q(codigos_equivalentes__icontains=query),
        ocultar=False
    ).distinct()[:15]

    results = []
    for r in repuestos:
        # Stock de una bodega específica (si se pide)
        stock_local = 0
        if bodega_id and bodega_id != 'undefined' and bodega_id != 'null':
            sb = r.stocks_bodega.filter(bodega_id=bodega_id).first()
            if sb:
                stock_local = sb.cantidad
        
        # Stock global (el que importa en la OT)
        stock_total = r.stock_actual

        results.append({
            'id': r.id,
            # Mejoramos el texto para que el mecánico vea el stock inmediatamente en la lista
            'text': f"{r.nombre} | SKU: {r.numero_parte} | Stock: {stock_total}",
            'sku': r.numero_parte,
            'stock_total': stock_total, # Enviamos el número puro para el JS
        })
    return JsonResponse(results, safe=False)





@login_required
def repuesto_update(request, pk):
    """
    Actualiza un repuesto, maneja stock en bodegas y redirige inteligentemente 
    si el producto proviene de la bandeja de validación.
    """
    connection.set_tenant(request.tenant)
    from .models import Bodega, StockBodega, Proveedor
    from django.db import transaction

    repuesto = get_object_or_404(Repuesto, pk=pk)
    bodegas = Bodega.objects.all()

    # --- LÓGICA DE VALIDACIÓN: Detectamos si es un producto "crudo" antes de guardar ---
    # Capturamos este estado para decidir la redirección al final
    era_pendiente = (
        "NUEVO SKU:" in (repuesto.nombre or "") or 
        (repuesto.precio_unitario is None or repuesto.precio_unitario <= 0)
    )

    if request.method == 'POST':
        form = RepuestoForm(request.POST, instance=repuesto)
        nueva_bodega_id = request.POST.get('bodega_id')
        id_prov = request.POST.get('proveedor_habitual')

        if form.is_valid():
            try:
                with transaction.atomic():
                    obj = form.save(commit=False)
                    if id_prov:
                        obj.proveedor_habitual_id = id_prov
                    obj.save()

                    if nueva_bodega_id:
                        nueva_bodega = Bodega.objects.get(id=nueva_bodega_id)
                        stock_actual_registro = StockBodega.objects.filter(repuesto=obj).first()
                        if stock_actual_registro:
                            stock_actual_registro.bodega = nueva_bodega
                            stock_actual_registro.save()
                        else:
                            StockBodega.objects.create(
                                repuesto=obj, 
                                bodega=nueva_bodega, 
                                cantidad=obj.stock_actual
                            )

                    messages.success(request, f'¡{obj.nombre} actualizado con éxito!')

                    # --- REDIRECCIÓN INTELIGENTE ---
                    if era_pendiente:
                        return redirect('inventario_validacion')
                    
                    return redirect('repuesto_list')

            except Exception as e:
                messages.error(request, f"Error al guardar: {str(e)}")
        else:
            # Mostrar errores de validación del formulario
            for field, errors in form.errors.items():
                messages.error(request, f"Error en {field}: {errors[0]}")
    else:
        form = RepuestoForm(instance=repuesto)

    # Preparar datos de bodega para el template (GET)
    stock_actual = StockBodega.objects.filter(repuesto=repuesto).first()
    bodega_actual_id = stock_actual.bodega.id if stock_actual else None

    return render(request, 'flota/repuesto_form.html', {
        'form': form, 
        'repuesto': repuesto, 
        'bodegas': bodegas,
        'bodega_actual_id': bodega_actual_id, 
        'full_width_content': True
    })



@login_required
def terminal_bodega(request):
    """
    Muestra la interfaz para escanear con la cámara del celular.
    Ahora incluye las auditorías activas para el modo Inventario Físico.
    """
    # Importamos los modelos necesarios
    from .models import Bodega, AuditoriaInventario

    connection.set_tenant(request.tenant)
    
    # 1. Obtenemos todas las bodegas
    bodegas = Bodega.objects.all().order_by('numero_identificador')
    
    # 2. Obtenemos solo las auditorías que están en proceso (Abiertas)
    # Usamos select_related para traer el nombre de la bodega de una vez
    auditorias_activas = AuditoriaInventario.objects.filter(
        estado='EN_PROCESO'
    ).select_related('bodega').order_by('-fecha_inicio')

    return render(request, 'flota/inventario/terminal_pistola.html', {
        'bodegas': bodegas,
        'auditorias_activas': auditorias_activas, # <-- Esta es la variable que espera el HTML
        'full_width_content': True
    })




import re
import json
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from .models import Repuesto, Bodega, StockBodega, MovimientoStock




################################################################################
# --- ORDENES DE TRABAJO Y TAREAS ---
################################################################################

@login_required
def actualizar_fecha_ot_api(request, pk):
    """
    API para actualizar la fecha_programada de una OT cuando se arrastra
    en el calendario.
    """
    connection.set_tenant(request.tenant)
    if request.method == 'POST':
        try:
            ot = OrdenDeTrabajo.objects.get(pk=pk)
            data = json.loads(request.body)
            nueva_fecha_str = data.get('fecha_programada')

            if nueva_fecha_str:
                ot.fecha_programada = datetime.fromisoformat(nueva_fecha_str.split('T')[0]).date()
                ot.save(update_fields=['fecha_programada'])

                HistorialOT.objects.create(
                    orden_de_trabajo=ot, usuario=request.user, tipo_evento='MODIFICACION',
                    descripcion=f"OT reprogramada para el {ot.fecha_programada.strftime('%d/%m/%Y')}."
                )
                return JsonResponse({'status': 'ok', 'message': 'Fecha actualizada con éxito.'})
            else:
                return JsonResponse({'status': 'error', 'message': 'No se proporcionó una nueva fecha.'}, status=400)
        except OrdenDeTrabajo.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'OT no encontrada.'}, status=404)
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            return JsonResponse({'status': 'error', 'message': f'Datos inválidos: {e}'}, status=400)

    return JsonResponse({'status': 'error', 'message': 'Método no permitido.'}, status=405)





@login_required
def analisis_fallas(request):
    connection.set_tenant(request.tenant)

    end_date_str = request.GET.get('end_date', datetime.now().strftime('%Y-%m-%d'))
    start_date_str = request.GET.get('start_date', (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d'))
    try:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
    except (ValueError, TypeError):
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=30)

    # 1. Obtenemos las OTs que cumplen los criterios
    ots_periodo = OrdenDeTrabajo.objects.filter(
        tipo='CORRECTIVA',
        tipo_falla__isnull=False,
        fecha_creacion__date__range=[start_date, end_date]
    ).select_related('tipo_falla') # Usamos select_related para eficiencia

    # 2. Agrupamos y calculamos en Python para tener más control
    fallas_agrupadas = {}
    for ot in ots_periodo:
        key = ot.tipo_falla.id
        if key not in fallas_agrupadas:
            fallas_agrupadas[key] = {
                'descripcion': ot.tipo_falla.descripcion,
                'criticidad': ot.tipo_falla.get_criticidad_display(), # Obtenemos el texto legible
                'causa': ot.tipo_falla.get_causa_display(),
                'tfs_total_falla': 0,
                'frecuencia': 0
            }
        fallas_agrupadas[key]['tfs_total_falla'] += ot.tfs_minutos
        fallas_agrupadas[key]['frecuencia'] += 1

    # Convertimos el diccionario a una lista y la ordenamos
    lista_fallas = sorted(fallas_agrupadas.values(), key=lambda x: x['tfs_total_falla'], reverse=True)

    # 3. Calculamos el Pareto
    tfs_gran_total = sum(item['tfs_total_falla'] for item in lista_fallas)
    base_calculo = 'tfs_total_falla'
    total_calculo = tfs_gran_total

    # Si no hay TFS, basamos el Pareto en la frecuencia
    if total_calculo == 0:
        base_calculo = 'frecuencia'
        total_calculo = sum(item['frecuencia'] for item in lista_fallas)

    frec_acumulada = 0
    data_pareto = []
    for item in lista_fallas:
        valor_item = item.get(base_calculo, 0)
        frec_relativa = (valor_item / total_calculo) * 100 if total_calculo > 0 else 0
        frec_acumulada += frec_relativa
        item['frecuencia_relativa'] = round(frec_relativa, 2)
        item['frecuencia_acumulada'] = round(frec_acumulada, 2)
        data_pareto.append(item)

    context = {
        'data_pareto_tabla': data_pareto,
        'labels': json.dumps([item['descripcion'] for item in data_pareto]),
        'frecuencia_data': json.dumps([item['frecuencia_relativa'] for item in data_pareto]),
        'acumulada_data': json.dumps([item['frecuencia_acumulada'] for item in data_pareto]),
        'start_date': start_date.strftime('%Y-%m-%d'),
        'end_date': end_date.strftime('%Y-%m-%d'),
    }
    return render(request, 'flota/analisis_fallas.html', context)







@require_POST
@login_required
def api_actualizar_ot(request, pk):
    """
    API central para actualizar OT.
    VERSIÓN CORREGIDA: Utiliza el modelo HistorialOT en lugar de un campo 'fecha_inicio_real' inexistente.
    """
    try:
        ot = get_object_or_404(OrdenDeTrabajo, pk=pk)
        data = json.loads(request.body)

        # --- Lógica para actualizar el estado ---
        nuevo_estado = data.get('estado')
        if nuevo_estado and nuevo_estado in [choice[0] for choice in OrdenDeTrabajo.ESTADO_CHOICES]:
            estado_anterior = ot.get_estado_display()
            ot.estado = nuevo_estado

            # --- LÓGICA DE HISTORIAL CORREGIDA ---
            tipo_evento_historial = 'MODIFICACION' # Por defecto

            if nuevo_estado == 'EN_PROCESO':
                # Si estamos iniciando o reanudando el trabajo
                if estado_anterior == 'Pendiente':
                    tipo_evento_historial = 'INICIO'
                else:
                    tipo_evento_historial = 'REANUDACION'

            elif nuevo_estado == 'PAUSADA':
                tipo_evento_historial = 'PAUSA'
            elif nuevo_estado == 'CERRADA_MECANICO':
                tipo_evento_historial = 'CIERRE_MECANICO'
            elif nuevo_estado == 'FINALIZADA':
                ot.fecha_cierre = timezone.now() # Asignamos la fecha de cierre al finalizar
                tipo_evento_historial = 'FINALIZACION'

            descripcion_historial = f"Estado cambiado de '{estado_anterior}' a '{ot.get_estado_display()}' por {request.user.username}."
            HistorialOT.objects.create(orden_de_trabajo=ot, usuario=request.user, tipo_evento=tipo_evento_historial, descripcion=descripcion_historial)

        # --- Lógica para actualizar responsable (Drag & Drop) ---
        nuevo_responsable_id = data.get('responsable_id')
        if nuevo_responsable_id:
            try:
                nuevo_responsable = get_object_or_404(User, pk=nuevo_responsable_id)
                ot.responsable = nuevo_responsable
                descripcion_historial = f"OT asignada al técnico '{nuevo_responsable.username}'."
                HistorialOT.objects.create(orden_de_trabajo=ot, usuario=request.user, tipo_evento='ASIGNACION', descripcion=descripcion_historial)
            except User.DoesNotExist:
                return JsonResponse({'status': 'error', 'message': 'El técnico seleccionado no existe.'}, status=404)

        ot.save()
        return JsonResponse({'status': 'ok', 'message': 'OT actualizada con éxito.'})

    except Exception as e:
        return JsonResponse({'status': 'error', 'message': f"Error interno del servidor: {e}"}, status=400)






@require_POST
@login_required
def api_actualizar_ot_pizarra(request, pk):
    """
    API central para la Pizarra.
    VERSIÓN FINAL: Maneja responsable, hora Y DURACIÓN.
    """
    try:
        ot = get_object_or_404(OrdenDeTrabajo, pk=pk)
        data = json.loads(request.body)
        cambios_realizados = []

        # Lógica para actualizar RESPONSABLE (sin cambios)
        if 'responsable_id' in data:
            # ... (la lógica que ya tienes)
            nuevo_responsable_id = data.get('responsable_id')
            if not nuevo_responsable_id:
                if ot.responsable is not None:
                    cambios_realizados.append(f"Desasignado del técnico '{ot.responsable.username}'")
                    ot.responsable = None
            else:
                try:
                    nuevo_responsable = get_object_or_404(User, pk=int(nuevo_responsable_id))
                    if ot.responsable_id != nuevo_responsable.id:
                        ot.responsable = nuevo_responsable
                        cambios_realizados.append(f"Asignado al técnico '{nuevo_responsable.username}'")
                except (ValueError, User.DoesNotExist):
                    return JsonResponse({'status': 'error', 'message': 'El técnico seleccionado no existe.'}, status=400)

        # Lógica para actualizar HORA (sin cambios)
        if 'hora_programada' in data:
            nueva_hora_str = data.get('hora_programada')
            try:
                nueva_hora = timezone.datetime.strptime(nueva_hora_str, '%H:%M').time()
                if ot.hora_programada != nueva_hora:
                    ot.hora_programada = nueva_hora
                    cambios_realizados.append(f"Reprogramada para las {nueva_hora.strftime('%H:%M')}")
            except ValueError:
                 return JsonResponse({'status': 'error', 'message': 'Formato de hora inválido. Debe ser HH:MM.'}, status=400)
        
        if 'hora_finalizacion' in data:
            nueva_hora_fin_str = data.get('hora_finalizacion')
            try:
                nueva_hora_fin = timezone.datetime.strptime(nueva_hora_fin_str, '%H:%M').time()
                if ot.hora_finalizacion != nueva_hora_fin:
                    ot.hora_finalizacion = nueva_hora_fin
                    cambios_realizados.append(
                        f"Hora de término ajustada a {nueva_hora_fin.strftime('%H:%M')}"
                    )
            except ValueError:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Formato de hora de término inválido.'
                }, status=400)
        # Lógica para actualizar FECHA
        if 'fecha_programada' in data:
            nueva_fecha_str = data.get('fecha_programada')
            try:
                nueva_fecha = timezone.datetime.strptime(nueva_fecha_str, '%Y-%m-%d').date()
                if ot.fecha_programada != nueva_fecha:
                    ot.fecha_programada = nueva_fecha
                    cambios_realizados.append(f"Reprogramada para el {nueva_fecha.strftime('%d/%m/%Y')}")
            except ValueError:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Formato de fecha inválido. Debe ser YYYY-MM-DD.'
                }, status=400)
        # ==========================================================
        # --- INICIO: NUEVA LÓGICA PARA DURACIÓN ---
        # ==========================================================
        if 'tfs_minutos' in data:
            try:
                nueva_duracion = int(data.get('tfs_minutos'))
                if nueva_duracion > 0 and ot.tfs_minutos != nueva_duracion:
                    ot.tfs_minutos = nueva_duracion
                    cambios_realizados.append(f"Duración ajustada a {nueva_duracion} minutos")
            except (ValueError, TypeError):
                return JsonResponse({'status': 'error', 'message': 'La duración debe ser un número entero.'}, status=400)
        # ========================================================
        # --- FIN: LÓGICA DE DURACIÓN ---
        # ========================================================

        if cambios_realizados:
            ot.save()
            descripcion_historial = ", ".join(cambios_realizados) + f" por {request.user.username} desde la Pizarra."
            HistorialOT.objects.create(
                orden_de_trabajo=ot, usuario=request.user, tipo_evento='MODIFICACION', descripcion=descripcion_historial
            )
            return JsonResponse({'status': 'ok', 'message': 'OT actualizada con éxito.'})
        else:
            return JsonResponse({'status': 'no-changes', 'message': 'No se realizaron cambios.'})

    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error en api_actualizar_ot para PK {pk}: {e}", exc_info=True)
        return JsonResponse({'status': 'error', 'message': f"Error interno del servidor: {e}"}, status=500)





@login_required
def api_bitacora_diaria(request, fecha_str):
    """
    API que unifica y devuelve todos los eventos relevantes de un día específico
    para mostrarlos en el panel de "Detalle Diario". (VERSIÓN FINAL CORREGIDA)
    """
    try:
        fecha = datetime.strptime(fecha_str, '%Y-%m-%d').date()
    except ValueError:
        return JsonResponse({'error': 'Formato de fecha inválido'}, status=400)

    eventos = []

    # 1. Obtener eventos del historial de OTs
    # CORRECCIÓN: Usamos 'fecha_evento__date' que es el campo correcto en tu modelo HistorialOT
    historial_ots = HistorialOT.objects.filter(fecha_evento__date=fecha).select_related('orden_de_trabajo__vehiculo', 'usuario')
    for h in historial_ots:
        eventos.append({
            'timestamp': h.fecha_evento, # CORRECCIÓN: Usamos el campo correcto
            'tipo': 'OT',
            'icon': 'fas fa-wrench', 
            'color': 'text-primary',
            'mensaje': f"<b>OT-{h.orden_de_trabajo.folio} ({h.orden_de_trabajo.vehiculo.numero_interno if h.orden_de_trabajo.vehiculo else 'N/A'})</b>: {h.descripcion}"
        })

    # 2. Obtener eventos de Cargas de Combustible
    cargas_combustible = CargaCombustible.objects.filter(fecha_carga__date=fecha).select_related('vehiculo', 'conductor')
    for c in cargas_combustible:
        eventos.append({
            'timestamp': c.fecha_carga,
            'tipo': 'Combustible',
            'icon': 'fas fa-gas-pump',
            'color': 'text-success',
            'mensaje': f"<b>Carga Combustible</b>: {c.litros_cargados:.2f} Lts al vehículo <b>{c.vehiculo.numero_interno}</b>."
        })

    # 3. Obtener eventos de la revisión del Checklist
    # CORRECCIÓN: Usamos el modelo correcto 'RegistroChecklistDiario' y el campo 'fecha_hora_completo'
    registros_checklist = RegistroChecklistDiario.objects.filter(
        fecha=fecha, 
        completada=True, 
        fecha_hora_completo__isnull=False
    ).select_related('tarea', 'usuario_completo')
    for r in registros_checklist:
         eventos.append({
            'timestamp': r.fecha_hora_completo, # CORRECCIÓN: Usamos el campo correcto
            'tipo': 'Checklist',
            'icon': 'fas fa-check-square',
            'color': 'text-info',
            'mensaje': f"<b>Checklist</b>: Tarea '<i>{r.tarea.descripcion}</i>' completada por <b>{r.usuario_completo.username if r.usuario_completo else 'N/A'}</b>."
        })

    # Ordenar todos los eventos por hora, del más reciente al más antiguo
    eventos_ordenados = sorted(eventos, key=lambda x: x['timestamp'], reverse=True)

    # Formatear el timestamp para el frontend
    for evento in eventos_ordenados:
        evento['hora'] = timezone.localtime(evento['timestamp']).strftime('%H:%M:%S')
        del evento['timestamp'] 

    return JsonResponse(eventos_ordenados, safe=False)





@login_required
def api_checklist_diario(request, fecha_str):
    """
    API que devuelve la lista de tareas del checklist para una fecha específica.
    """
    try:
        fecha = datetime.strptime(fecha_str, '%Y-%m-%d').date()
    except ValueError:
        return JsonResponse({'error': 'Formato de fecha inválido'}, status=400)

    tareas_activas = TareaDiariaTaller.objects.filter(activa=True)
    registros_del_dia = {
        r.tarea_id: r.completada for r in RegistroChecklistDiario.objects.filter(fecha=fecha)
    }

    checklist = []
    for tarea in tareas_activas:
        checklist.append({
            'id': tarea.id,
            'descripcion': tarea.descripcion,
            'completada': registros_del_dia.get(tarea.id, False)
        })

    return JsonResponse(checklist, safe=False)



@require_POST
@login_required
def api_crear_ot(request):
    try:
        data = json.loads(request.body)
        # Aquí va la lógica para crear la OT con los datos del modal
        ot = OrdenDeTrabajo.objects.create(
            vehiculo_id=data['vehiculo'],
            tipo=data['tipo'],
            prioridad=data['prioridad'],
            observacion_inicial=data['observacion'],
            fecha_programada=data['fecha_programada'],
            creada_por=request.user,
            estado='PENDIENTE'
        )
        return JsonResponse({'status': 'ok', 'message': f'OT #{ot.folio} creada con éxito.'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)


@require_POST
@login_required
def api_crear_ot(request):
    """
    API para crear una nueva Orden de Trabajo desde el modal de la pizarra.
    """
    try:
        data = json.loads(request.body)

        # Validación simple de datos
        vehiculo_id = data.get('vehiculo')
        observacion = data.get('observacion')
        if not vehiculo_id or not observacion:
            return JsonResponse({'status': 'error', 'message': 'El vehículo y la observación son obligatorios.'}, status=400)

        ot = OrdenDeTrabajo.objects.create(
            vehiculo_id=int(vehiculo_id),
            tipo=data.get('tipo', 'CORRECTIVA'),
            prioridad=data.get('prioridad', 'MEDIA'),
            observacion_inicial=observacion,
            fecha_programada=data.get('fecha_programada'),
            creada_por=request.user,
            estado='PENDIENTE'
        )
        return JsonResponse({'status': 'ok', 'message': f'OT #{ot.folio} creada con éxito.'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': f'Error al crear la OT: {e}'}, status=400)



@login_required
@require_POST
def api_marcar_checklist(request):
    """
    API para marcar/desmarcar una tarea del checklist.
    """
    try:
        data = json.loads(request.body)
        tarea_id = data['tarea_id']
        fecha_str = data['fecha']
        estado = data['estado']

        fecha = datetime.strptime(fecha_str, '%Y-%m-%d').date()
        tarea = TareaDiariaTaller.objects.get(id=tarea_id)

        registro, created = RegistroChecklistDiario.objects.get_or_create(
            tarea=tarea,
            fecha=fecha,
            defaults={'usuario_completo': request.user}
        )
        
        registro.completada = estado
        if estado:
            registro.usuario_completo = request.user
            registro.fecha_hora_completo = timezone.now()
        else:
            registro.usuario_completo = None
            registro.fecha_hora_completo = None
        
        registro.save()

        return JsonResponse({'status': 'ok', 'message': 'Estado actualizado'})

    except (KeyError, TareaDiariaTaller.DoesNotExist, ValueError) as e:
        print(f"Error al marcar checklist: {e}")
        return JsonResponse({'status': 'error', 'message': f'Datos inválidos: {e}'}, status=654)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': f'Error interno: {e}'}, status=500)



@login_required
@require_POST
def api_registrar_evento_checklist(request):
    """
    API que registra en la BitacoraDiaria el estado final del checklist.
    """
    try:
        data = json.loads(request.body)
        fecha_str = data['fecha']
        fecha = datetime.strptime(fecha_str, '%Y-%m-%d').date()

        tareas_activas = TareaDiariaTaller.objects.filter(activa=True)
        registros_del_dia = RegistroChecklistDiario.objects.filter(fecha=fecha, tarea__in=tareas_activas)

        completadas = registros_del_dia.filter(completada=True).count()
        pendientes = tareas_activas.count() - completadas

        descripcion = f"Checklist diario revisado. Tareas completadas: {completadas}. Tareas pendientes: {pendientes}."

        BitacoraDiaria.objects.create(
            usuario=request.user,
            tipo_evento='REVISION_CHECKLIST',
            descripcion=descripcion
        )

        return JsonResponse({'status': 'ok', 'message': 'Evento de checklist registrado con éxito.'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)





@login_required
def cambiar_estado_ot(request, pk):
    connection.set_tenant(request.tenant)
    ot = get_object_or_404(OrdenDeTrabajo, pk=pk)
    if request.method == 'POST':
        form = CambiarEstadoOTForm(request.POST, instance=ot)
        if form.is_valid():
            form.save()
            messages.success(request, f"Estado de la OT #{ot.folio} actualizado a '{form.cleaned_data['estado']}'.")
    return redirect('ot_detail', pk=ot.pk)


@login_required
@user_passes_test(es_administrador)
def editar_tarea(request, pk):
    """
    Vista para editar una Tarea existente.
    """
    tarea = get_object_or_404(Tarea, pk=pk)
    if request.method == 'POST':
        form = TareaForm(request.POST, instance=tarea)
        if form.is_valid():
            form.save()
            messages.success(request, '¡Tarea actualizada con éxito!')
            return redirect('lista_tareas')
    else:
        form = TareaForm(instance=tarea)

    context = {
        'form': form,
        'tarea': tarea
    }
    return render(request, 'flota/administracion/editar_tarea.html', context)


@login_required
def eliminar_insumo_ot(request, ot_pk, detalle_pk):
    connection.set_tenant(request.tenant)
    ot = get_object_or_404(OrdenDeTrabajo, pk=ot_pk)
    detalle = get_object_or_404(DetalleInsumoOT, pk=detalle_pk)

    if request.method == 'POST':
        # Determinar el nombre del insumo/repuesto para el mensaje
        if detalle.repuesto_inventario:
            item_nombre = f"{detalle.repuesto_inventario.nombre} ({detalle.repuesto_inventario.numero_parte})"
        elif detalle.insumo:
            item_nombre = detalle.insumo.nombre
        else:
            item_nombre = "Insumo Desconocido" # En caso de que ambos sean None (aunque el CheckConstraint lo previene)

        with transaction.atomic():
            if detalle.repuesto_inventario:
                MovimientoStock.objects.create(
                    repuesto=detalle.repuesto_inventario,
                    tipo_movimiento='AJUSTE_POSITIVO', # O 'ENTRADA' si prefieres esa clasificación
                    cantidad=detalle.cantidad, # Cantidad positiva para devolver al stock
                    usuario_responsable=request.user,
                    orden_de_trabajo=ot, # Asociar al OT para trazabilidad
                    notas=f"Devolución de stock por eliminación de insumo '{item_nombre}' de OT #{ot.folio}"
                )

            detalle.delete()
            ot.save() # Para recalcular costos
            messages.warning(request, f'"{item_nombre}" eliminado de la OT. Stock devuelto al inventario si aplica.')

    return redirect('ot_detail', pk=ot_pk)


@login_required
@user_passes_test(es_administrador)
@require_POST # Para mayor seguridad, solo permite borrar vía POST
def eliminar_tarea(request, pk):
    """
    Vista para eliminar una Tarea.
    """
    tarea = get_object_or_404(Tarea, pk=pk)
    # Verificar si la tarea está en uso antes de borrar podría ser una buena mejora
    tarea.delete()
    messages.warning(request, f'La tarea "{tarea.descripcion}" ha sido eliminada.')
    return redirect('lista_tareas')


@login_required
def eliminar_tarea_ot(request, ot_pk, tarea_pk):
    connection.set_tenant(request.tenant)
    ot = get_object_or_404(OrdenDeTrabajo, pk=ot_pk)
    tarea = get_object_or_404(Tarea, pk=tarea_pk)
    if request.method == 'POST':
        ot.tareas_realizadas.remove(tarea)
        ot.save()
        messages.warning(request, f'Tarea "{tarea.descripcion}" eliminada de la OT.')
    return redirect('ot_detail', pk=ot_pk)


@login_required
def export_ots_excel(request):
    connection.set_tenant(request.tenant)

    # ============================
    # SUBQUERIES (SIN DUPLICADOS)
    # ============================

    # Repuestos
    repuestos_subquery = DetalleInsumoOT.objects.filter(
        orden_de_trabajo=OuterRef('pk'),
        repuesto_inventario__isnull=False
    ).values('orden_de_trabajo').annotate(
        total=Sum(
            ExpressionWrapper(
                F('cantidad') * F('repuesto_inventario__precio_unitario'),
                output_field=DecimalField()
            )
        )
    ).values('total')

    # Insumos manuales
    manuales_subquery = DetalleInsumoOT.objects.filter(
        orden_de_trabajo=OuterRef('pk'),
        insumo__isnull=False
    ).values('orden_de_trabajo').annotate(
        total=Sum(
            ExpressionWrapper(
                F('cantidad') * F('insumo__precio_unitario'),
                output_field=DecimalField()
            )
        )
    ).values('total')

    # Tareas (mano de obra base)
    tareas_subquery = Tarea.objects.filter(
        ordenes_de_trabajo=OuterRef('pk')
    ).values('ordenes_de_trabajo').annotate(
        total=Sum('costo_base')
    ).values('total')

    # ============================
    # QUERY PRINCIPAL
    # ============================
    ordenes_qs = OrdenDeTrabajo.objects.filter(
        estado='FINALIZADA'
    ).select_related(
        'vehiculo', 'vehiculo__modelo', 'responsable', 'tipo_falla'
    ).prefetch_related(
        'tareas_realizadas'
    ).annotate(
        total_repuestos=Coalesce(Subquery(repuestos_subquery), Value(0, output_field=DecimalField())),
        total_manuales=Coalesce(Subquery(manuales_subquery), Value(0, output_field=DecimalField())),
        total_tareas=Coalesce(Subquery(tareas_subquery), Value(0, output_field=DecimalField())),
    ).order_by('-fecha_creacion')

    # ============================
    # FILTROS
    # ============================
    vehiculo_id = request.GET.get('vehiculo')
    tipo = request.GET.get('tipo')
    estado = request.GET.get('estado')
    fecha_desde_str = request.GET.get('fecha_desde')
    fecha_hasta_str = request.GET.get('fecha_hasta')

    if vehiculo_id:
        ordenes_qs = ordenes_qs.filter(vehiculo_id=vehiculo_id)

    if tipo:
        ordenes_qs = ordenes_qs.filter(tipo=tipo)

    if estado:
        ordenes_qs = ordenes_qs.filter(estado=estado)

    if fecha_desde_str:
        try:
            fecha_desde = datetime.strptime(fecha_desde_str, '%Y-%m-%d').date()
            ordenes_qs = ordenes_qs.filter(fecha_creacion__date__gte=fecha_desde)
        except ValueError:
            pass

    if fecha_hasta_str:
        try:
            fecha_hasta = datetime.strptime(fecha_hasta_str, '%Y-%m-%d').date()
            ordenes_qs = ordenes_qs.filter(fecha_creacion__date__lte=fecha_hasta)
        except ValueError:
            pass

    # ============================
    # CREAR EXCEL
    # ============================
    wb = Workbook()
    ws = wb.active
    ws.title = "Ordenes de Trabajo"

    headers = [
        'Folio OT', 'Estado', 'Tipo', 'Vehiculo Numero', 'Vehiculo Patente',
        'Fecha Creacion', 'Fecha Cierre', 'Kilometraje Apertura', 'Kilometraje Cierre',
        'Responsable',
        'Costo Insumos', 'Costo Mano Obra Tareas', 'Costo Mano Obra HH',
        'Costo Total', 'TFS (Minutos)', 'Tipo de Falla', 'Tareas'
    ]

    ws.append(headers)

    # Estilo encabezado
    for col in ws[1]:
        col.font = Font(bold=True)

    # ============================
    # DATA
    # ============================
    for ot in ordenes_qs:

        costo_repuestos = ot.total_repuestos or 0
        costo_manuales = ot.total_manuales or 0
        costo_tareas = ot.total_tareas or 0

        costo_insumos = costo_repuestos + costo_manuales

        # Mano de obra HH
        costo_mano_obra_hh = 0
        if ot.responsable and hasattr(ot.responsable, 'personal') and ot.tfs_minutos:
            try:
                valor_hora = ot.responsable.personal.valor_hora_normal
                costo_mano_obra_hh = (ot.tfs_minutos / 60.0) * valor_hora
            except:
                pass

        tareas_str = ", ".join([t.descripcion for t in ot.tareas_realizadas.all()])

        ws.append([
            ot.folio,
            ot.get_estado_display(),
            ot.get_tipo_display(),
            ot.vehiculo.numero_interno,
            ot.vehiculo.patente or '',
            ot.fecha_creacion.strftime('%d-%m-%Y %H:%M') if ot.fecha_creacion else '',
            ot.fecha_cierre.strftime('%d-%m-%Y %H:%M') if ot.fecha_cierre else '',
            ot.kilometraje_apertura or '',
            ot.kilometraje_cierre or '',
            ot.responsable.username if ot.responsable else 'N/A',
            float(costo_insumos),
            float(costo_tareas),
            float(costo_mano_obra_hh),
            float(ot.costo_total),
            ot.tfs_minutos,
            ot.tipo_falla.descripcion if ot.tipo_falla else 'N/A',
            tareas_str
        ])

        # Formato CLP
        fila = ws.max_row
        for col in [11, 12, 13, 14]:
            ws.cell(row=fila, column=col).number_format = '"$"#,##0'

    # ============================
    # RESPONSE
    # ============================
    response = HttpResponse(
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = 'attachment; filename="reporte_ordenes_trabajo.xlsx"'

    wb.save(response)

    return response


# Reemplaza las tres funciones en flota/views.py


def export_ots_pdf_view(request):
    """
    Vista esqueleto para manejar la exportación de OTs a PDF.
    Por ahora, solo devuelve un mensaje para confirmar que la URL funciona.
    """
    # Aquí, más adelante, irá la lógica para generar el archivo PDF.
    # Por ejemplo, usando librerías como ReportLab o WeasyPrint.
    return HttpResponse("La función para exportar a PDF está en desarrollo.", content_type="text/plain")



@login_required
def generar_ot_pdf(request, pk):
    connection.set_tenant(request.tenant)

    ot = get_object_or_404(OrdenDeTrabajo.objects.select_related(
        'vehiculo__modelo',
        'responsable'
    ).prefetch_related(
        'tareas_realizadas',
        'detalles_insumos_ot__repuesto_inventario',
        'detalles_insumos_ot__insumo'
    ), pk=pk)

    # --- CÁLCULOS DE COSTOS DETALLADOS ---
    costo_insumos_inventario = ot.detalles_insumos_ot.filter(repuesto_inventario__isnull=False).aggregate(
        total=Sum(F('cantidad') * F('repuesto_inventario__precio_unitario'), output_field=DecimalField())
    )['total'] or Decimal('0.0') # Usar Decimal para consistencia
    costo_insumos_manuales = ot.detalles_insumos_ot.filter(insumo__isnull=False).aggregate(
        total=Sum(F('cantidad') * F('insumo__precio_unitario'), output_field=DecimalField())
    )['total'] or Decimal('0.0')

    # Guardamos los valores para mostrarlos formateados
    ot.costo_insumos = costo_insumos_inventario + costo_insumos_manuales
    ot.costo_mano_obra = ot.tareas_realizadas.aggregate(total=Sum('costo_base'))['total'] or Decimal('0.0')
    
    # ¡CAMBIO CLAVE! Creamos un contexto separado con valores numéricos puros
    # para los cálculos dentro de la plantilla.
    context = {
        'ot': ot,
        # Valores RAW (sin formato) para cálculos
        'costo_insumos_raw': float(ot.costo_insumos),
        'costo_mano_obra_raw': float(ot.costo_mano_obra),
        'costo_total_raw': float(ot.costo_total) # Asumo que ot.costo_total se calcula en el modelo
    }
    
    html_string = render_to_string('flota/ot_pdf_template.html', context)

    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'inline; filename="OT-{ot.folio}.pdf"'

    HTML(string=html_string, base_url=request.build_absolute_uri()).write_pdf(response)

    return response


@login_required
def lista_notificaciones(request):
    """
    Muestra todas las notificaciones del usuario, paginadas.
    """
    connection.set_tenant(request.tenant)

    # Obtenemos todas las notificaciones del usuario logueado
    notificaciones_list = request.user.notificaciones.all()

    # Paginación
    paginator = Paginator(notificaciones_list, 20) # Muestra 20 notificaciones por página
    page = request.GET.get('page')
    try:
        notificaciones = paginator.page(page)
    except PageNotAnInteger:
        notificaciones = paginator.page(1)
    except EmptyPage:
        notificaciones = paginator.page(paginator.num_pages)

    context = {
        'notificaciones': notificaciones
    }
    return render(request, 'flota/lista_notificaciones.html', context)


@login_required
@user_passes_test(es_administrador) # Solo admins pueden gestionar tareas
def lista_tareas(request):
    """
    Vista para listar todas las Tareas y manejar la creación de una nueva.
    """
    if request.method == 'POST':
        form = TareaForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, '¡Tarea creada con éxito!')
            return redirect('lista_tareas')
    else:
        form = TareaForm()

    tareas = Tarea.objects.all().order_by('descripcion')
    context = {
        'tareas': tareas,
        'form': form
    }
    return render(request, 'flota/administracion/lista_tareas.html', context)


@login_required
def marcar_notificaciones_leidas(request):
    """
    API view que marca todas las notificaciones no leídas del usuario como leídas.
    Se llama vía JavaScript (fetch).
    """
    if request.method == 'POST':
        # Buscamos todas las notificaciones NO leídas del usuario y las actualizamos
        request.user.notificaciones.filter(leida=False).update(leida=True)
        return JsonResponse({'status': 'ok'})

    return JsonResponse({'status': 'error', 'message': 'Método no permitido'}, status=405)


def obtener_alertas_flota():
    """
    Replica exactamente la lógica de dashboard_flota para detectar
    pautas VENCIDAS o PROXIMAS. Devuelve lista de dicts con:
      - vehiculo
      - estado ('VENCIDO'|'PROXIMO')
      - km_actual
      - pauta_nombre  (la pauta detectada)
      - km_pauta (kilometraje de la pauta detectada)
      - km_ultimo_mant
      - intervalo_km
    """

    today = timezone.now().date()
    INITIAL_PAUTA_NAMES = ['SI', 'R']

    # Vehículos activos
    vehiculos_qs = (
        Vehiculo.objects.filter(esta_activo=True)
        .annotate(numero_interno_int=Cast('numero_interno', output_field=IntegerField()))
        .select_related('modelo', 'norma_euro')
    )

    # última OT preventiva finalizada (subquery)
    latest_ot_ids_subquery = OrdenDeTrabajo.objects.filter(
        vehiculo_id=OuterRef('id'),
        tipo='PREVENTIVA',
        estado='FINALIZADA'
    ).order_by('-kilometraje_cierre').values('id')[:1]

    vehiculos = vehiculos_qs.annotate(latest_ot_id=Subquery(latest_ot_ids_subquery))
    latest_ot_pks = [v.latest_ot_id for v in vehiculos if v.latest_ot_id is not None]
    latest_ots_by_id = OrdenDeTrabajo.objects.filter(pk__in=latest_ot_pks).select_related('pauta_mantenimiento').in_bulk()
    ultima_ot_por_vehiculo_id = {ot.vehiculo_id: ot for ot in latest_ots_by_id.values()}

    # Todas las pautas ordenadas (igual que dashboard)
    all_pautas = list(PautaMantenimiento.objects.select_related('modelo_vehiculo').order_by('modelo_vehiculo__nombre', 'kilometraje_inicial'))

    resultados = []
    count_estado_normal = 0
    for veh in vehiculos:
        km_actual = veh.kilometraje_actual or 0

        ultima_ot = ultima_ot_por_vehiculo_id.get(veh.pk)
        ot_km = (ultima_ot.kilometraje_cierre if ultima_ot and ultima_ot.kilometraje_cierre else veh.km_ultima_mantencion) or 0
        # intervalo que usa dashboard para cálculos "v2"
        intervalo_vehiculo = veh.intervalo_mantenimiento_km or 0

        # datos base
        km_ultimo_display = ot_km
        intervalo = intervalo_vehiculo

        # filtrar pautas del modelo (primero por tipo_aceite si aplica, luego fallback)
        pautas_modelo = [p for p in all_pautas if p.modelo_vehiculo_id == getattr(veh, 'modelo_id', None) and getattr(p, 'tipo_aceite', None) == getattr(veh, 'tipo_aceite', None)]
        if not pautas_modelo:
            pautas_modelo = [p for p in all_pautas if p.modelo_vehiculo_id == getattr(veh, 'modelo_id', None)]
        if not pautas_modelo:
            continue  # no hay pautas -> saltar

        # --- CALCULAR mant_vencido igual que en dashboard ---
        mant_vencido = 0
        try:
            if isinstance(km_ultimo_display, (int, float)) and isinstance(intervalo, (int, float)) and intervalo > 0:
                km_ultimo_redondeado = round(km_ultimo_display / intervalo) * intervalo
                resultado = km_actual - km_ultimo_redondeado - intervalo
                if resultado > 0:
                    mant_vencido = resultado
        except Exception:
            mant_vencido = 0

        # Construir secuencia_final a partir de pautas_modelo (respetando INICIAL)
        secuencia_final = {}
        pautas_iniciales_obj = [p for p in pautas_modelo if 'INICIAL' in (getattr(p, 'tipo_aplicacion', '') or '').upper()]
        max_km_inicial = max((p.kilometraje_inicial or 0) for p in pautas_iniciales_obj) if pautas_iniciales_obj else 0
        is_past_initial_phase = (km_ultimo_display > max_km_inicial) or (km_actual > max_km_inicial + 5000)

        limite_km = km_actual + 500000
        for regla in pautas_modelo:
            nombre_base = regla.nombre.split('-')[0].strip()
            km_inicial = regla.kilometraje_inicial or 0
            es_inicial = 'INICIAL' in (getattr(regla, 'tipo_aplicacion', '') or '').upper()

            if km_inicial and km_inicial not in secuencia_final:
                secuencia_final[km_inicial] = {'tipo': nombre_base, 'es_inicial': es_inicial, 'regla': regla}

            intervalo1, intervalo2 = getattr(regla, 'intervalo_1_km', None), getattr(regla, 'intervalo_2_km', None)
            if intervalo1 and intervalo1 > 0 and not es_inicial:
                km_pauta_actual = km_inicial
                alt = True
                # generamos la secuencia alternando si corresponde
                while km_pauta_actual < limite_km:
                    if intervalo2 and intervalo2 > 0:
                        km_pauta_actual += intervalo1 if alt else intervalo2
                        alt = not alt
                    else:
                        km_pauta_actual += intervalo1
                    if km_pauta_actual < limite_km:
                        existing = secuencia_final.get(km_pauta_actual)
                        # mantener la pauta con nombre más largo si hay conflicto (igual que dashboard)
                        if not existing or len(nombre_base) > len(existing['tipo']):
                            secuencia_final[km_pauta_actual] = {'tipo': nombre_base, 'es_inicial': es_inicial, 'regla': regla}

        secuencia_ordenada = sorted(secuencia_final.items())  # lista de (km_pauta, info)

        # detectar pautas vencidas dentro del rango [km_inicio_busqueda, km_actual]
        pautas_vencidas = []
        if km_actual and mant_vencido:
            km_inicio_busqueda = km_actual - mant_vencido
            for km_pauta, info in secuencia_ordenada:
                if is_past_initial_phase and info.get('es_inicial'):
                    continue
                if km_inicio_busqueda <= km_pauta <= km_actual:
                    # devolver la pauta y el km_pauta
                    pautas_vencidas.append( (info['tipo'], km_pauta) )

        # Ahora calcular prox_pauta (secuencia_orig similar al dashboard)
        secuencia_orig = []
        limite_km_orig = km_actual + 500000
        for regla in pautas_modelo:
            km_pauta = regla.kilometraje_inicial or 0
            if km_pauta < limite_km_orig:
                secuencia_orig.append({'km': km_pauta, 'tipo': regla.nombre, 'regla': regla})
            if regla.intervalo_1_km:
                # adelantar según kms actuales
                if km_pauta < km_actual:
                    if regla.intervalo_2_km:
                        ciclo = regla.intervalo_1_km + regla.intervalo_2_km
                        saltos = max(0, (km_actual - km_pauta) // ciclo) if ciclo > 0 else 0
                        km_pauta += saltos * ciclo
                    else:
                        saltos = max(0, (km_actual - km_pauta) // regla.intervalo_1_km) if regla.intervalo_1_km > 0 else 0
                        km_pauta += saltos * regla.intervalo_1_km
                i1, i2 = regla.intervalo_1_km, regla.intervalo_2_km
                alt = True
                while km_pauta < limite_km_orig:
                    if i2:
                        km_pauta += i1 if alt else i2
                        alt = not alt
                    else:
                        km_pauta += i1
                    if km_pauta < limite_km_orig:
                        secuencia_orig.append({'km': km_pauta, 'tipo': regla.nombre, 'regla': regla})

        seq_unique = {v['km']: v for v in secuencia_orig}
        secuencia_ordenada_orig = sorted(seq_unique.values(), key=lambda x: x['km'])

        # elegir prox_pauta respetando iniciales
        is_past_initial_phase_orig = (km_ultimo_display > 0) or (km_actual > (max_km_inicial + 5000))
        prox_pauta = next(
            (p for p in secuencia_ordenada_orig
             if p['km'] > km_actual and not (is_past_initial_phase_orig and p['tipo'].split('-')[0].strip() in INITIAL_PAUTA_NAMES)),
            None
        )

        # Determinar estado final (misma V2)
        estado = 'NORMAL'
        if isinstance(km_ultimo_display, (int, float)) and isinstance(intervalo, (int, float)) and intervalo > 0:
            hito_ideal = round(km_ultimo_display / intervalo) * intervalo
            proximo_hito_vencimiento = hito_ideal + intervalo
            if km_ultimo_display > (proximo_hito_vencimiento - (intervalo * 0.1)) and km_ultimo_display <= proximo_hito_vencimiento:
                estado = 'NORMAL'
            elif km_actual >= proximo_hito_vencimiento:
                estado = 'VENCIDO'
            else:
                umbral_alerta = intervalo * 0.25
                kms_faltantes_para_hito = proximo_hito_vencimiento - km_actual
                if 0 < kms_faltantes_para_hito <= umbral_alerta:
                    estado = 'PROXIMO'
        #if estado == 'NORMAL':
        #    count_estado_normal += 1
        # Si hay pautas_vencidas, crear entrada por cada pauta detectada
        if pautas_vencidas:
            # Tomar SOLO la última pauta vencida (la más cercana al km_actual)
            nombre_pauta, km_pauta = sorted(pautas_vencidas, key=lambda x: x[1])[-1]

            vehiculo_entry = {
                "vehiculo": veh,
                "estado": "VENCIDO",
                "km_actual": km_actual,
                "km_ultimo_mant": km_ultimo_display,
                "intervalo_km": intervalo,
                "pauta_nombre":nombre_pauta,
                "km_pauta": km_pauta,
                "km_atraso_faltantes": km_actual - km_pauta
            }

            resultados.append(vehiculo_entry)
        elif estado == 'PROXIMO' and prox_pauta:
            km_pauta = prox_pauta['km']
            nombre_pauta = prox_pauta['tipo']

            vehiculo_entry = {
                "vehiculo": veh,
                "estado": "PROXIMO",
                "km_actual": km_actual,
                "km_ultimo_mant": km_ultimo_display,
                "intervalo_km": intervalo,
                "pauta_nombre": nombre_pauta,
                "km_pauta": km_pauta,
                "km_atraso_faltantes": km_pauta - km_actual
            }

            resultados.append(vehiculo_entry)

    
        if (
            isinstance(km_ultimo_display, (int, float)) and
            isinstance(intervalo, (int, float)) and
            km_ultimo_display > 0 and
            intervalo > 0
        ):
            num_intervalos_base = round(km_ultimo_display / intervalo)
            hito_ideal = num_intervalos_base * intervalo
            tolerancia_km = intervalo * 0.10

            if km_ultimo_display < hito_ideal - tolerancia_km:
                # ANTICIPADO
                count_estado_normal += 1
            elif km_ultimo_display > hito_ideal + tolerancia_km:
                # RETRASADO
                pass
            else:
                # NORMAL
                count_estado_normal += 1
    kpi_nivel_cumplimiento = (count_estado_normal/len(vehiculos)) * 100
    return resultados, kpi_nivel_cumplimiento


##### ORDENES DE COMPRA ######
"""

@require_POST # Este decorador asegura que la vista solo se puede llamar con un método POST
@login_required
def orden_trabajo_delete(request, pk):
    """
    Vista para eliminar una Orden de Trabajo.
    """
    # Es una buena práctica que solo roles específicos puedan eliminar.
    # Por ejemplo, un administrador o supervisor.
    if not es_personal_operativo(request.user): # O podrías usar es_administrador(request.user)
        raise PermissionDenied("No tienes permiso para eliminar órdenes de trabajo.")

    connection.set_tenant(request.tenant)
    ot = get_object_or_404(OrdenDeTrabajo, pk=pk)

    # REGLA DE NEGOCIO (Opcional pero recomendado):
    # Solo permitir eliminar OTs que están en estado 'PENDIENTE' para evitar problemas.
    if ot.estado != 'PENDIENTE':
        messages.error(request, f'No se puede eliminar la OT #{ot.folio} porque ya está en estado "{ot.get_estado_display()}".')
        return redirect('ot_list')

    folio_ot = ot.folio
    ot.delete()
    messages.warning(request, f'La Orden de Trabajo #{folio_ot} ha sido eliminada correctamente.')
    return redirect('ot_list')







def orden_trabajo_detail(request, pk):
    connection.set_tenant(request.tenant)
    ot = get_object_or_404(OrdenDeTrabajo.objects.select_related('responsable__personal'), pk=pk)

    # --- 1. LÓGICA DE PERMISOS (REQUERIMIENTO GABRIEL) ---
    user_groups = set(request.user.groups.values_list('name', flat=True))
    es_mecanico = 'Mecánico' in user_groups
    es_supervisor = 'Supervisor' in user_groups
    es_administrador = 'Administrador' in user_groups
    es_gerente = 'Gerente' in user_groups

    # BLINDAJE: Solo los jefes pueden gestionar personal, borrar tareas y ver COSTOS.
    puede_gestionar_tareas_y_personal = es_supervisor or es_administrador or es_gerente
    
    # ACCIONES JEFATURA: Solo el Admin o Supervisor puede pausar formalmente o cambiar estados críticos.
    puede_realizar_acciones_criticas = es_administrador or es_supervisor

    # Instanciación de todos los formularios
    asignar_form = AsignarPersonalOTForm(instance=ot)
    cerrar_mecanico_form = CerrarOtMecanicoForm(instance=ot)
    cambiar_estado_form = CambiarEstadoOTForm(instance=ot)
    manual_insumo_form = ManualInsumoForm()
    pausar_form = PausarOTForm(instance=ot)
    diagnostico_form = DiagnosticoEvaluacionForm(instance=ot)
    asignar_tarea_form = AsignarTareaForm()
    manual_tarea_form = ManualTareaForm()
    solicitud_form = SolicitudRepuestoForm()

    # --- 2. PROCESAMIENTO DE ACCIONES (POST) ---
    if request.method == 'POST':

        # Crear y asignar tarea manualmente (Solo Jefes)
        if 'crear_y_asignar_tarea' in request.POST:
            if not puede_gestionar_tareas_y_personal: raise PermissionDenied
            form = ManualTareaForm(request.POST)
            if form.is_valid():
                tarea, created = Tarea.objects.get_or_create(
                    descripcion=form.cleaned_data['descripcion'], 
                    defaults={'tiempo_estandar_minutos': form.cleaned_data['tiempo_estandar_minutos'], 'costo_base': form.cleaned_data['costo_base']}
                )
                ot.tareas_realizadas.add(tarea)
                ot.save()
                messages.success(request, f'Tarea "{tarea.descripcion}" añadida.')
                return redirect('ot_detail', pk=ot.pk)

        # Asignar tarea existente
        elif 'asignar_tarea_existente' in request.POST:
            form = AsignarTareaForm(request.POST)
            if form.is_valid():
                tarea = form.cleaned_data['tarea']
                ot.tareas_realizadas.add(tarea)
                ot.save()
                messages.success(request, f'Tarea "{tarea.descripcion}" añadida.')
                return redirect('ot_detail', pk=ot.pk)

        # Cargar Pauta (Preventivas)
        elif 'cargar_tareas_pauta' in request.POST:
            if ot.tipo == 'PREVENTIVA' and ot.pauta_mantenimiento:
                tareas_pauta = ot.pauta_mantenimiento.tareas.all()
                ot.tareas_realizadas.add(*tareas_pauta)
                ot.save()
                messages.success(request, "Tareas de la pauta cargadas.")
            return redirect('ot_detail', pk=ot.pk)

        # Pausar OT (Admin/Supervisor)
        elif 'pausar_ot' in request.POST:
            if not puede_realizar_acciones_criticas: raise PermissionDenied
            form = PausarOTForm(request.POST, instance=ot)
            if form.is_valid():
                instancia = form.save(commit=False)
                instancia.estado = 'PAUSADA'
                instancia.save()
                HistorialOT.objects.create(orden_de_trabajo=ot, usuario=request.user, tipo_evento='PAUSA', descripcion=f"OT Pausada. Motivo: {instancia.motivo_pausa}")
                messages.warning(request, "OT Pausada.")
                return redirect('ot_detail', pk=ot.pk)

        # Guardar Diagnóstico (Mecánico y Jefes)
        elif 'guardar_diagnostico' in request.POST:
            form = DiagnosticoEvaluacionForm(request.POST, instance=ot)
            if form.is_valid():
                form.save()
                messages.success(request, 'Diagnóstico actualizado.')
                return redirect('ot_detail', pk=ot.pk)

        # Registrar Insumo Manual (Solo Jefes)
        elif 'add_manual_insumo' in request.POST:
            if not puede_gestionar_tareas_y_personal: raise PermissionDenied
            form = ManualInsumoForm(request.POST)
            if form.is_valid():
                insumo, _ = Insumo.objects.get_or_create(nombre=form.cleaned_data['nombre'], defaults={'precio_unitario': form.cleaned_data['precio_unitario']})
                DetalleInsumoOT.objects.create(orden_de_trabajo=ot, insumo=insumo, cantidad=form.cleaned_data['cantidad'])
                ot.save()
                messages.success(request, 'Insumo registrado.')
                return redirect('ot_detail', pk=ot.pk)

        # Asignar Personal (Solo Jefes)
        elif 'asignar_personal' in request.POST:
            if not puede_gestionar_tareas_y_personal: raise PermissionDenied
            form = AsignarPersonalOTForm(request.POST, instance=ot)
            if form.is_valid():
                form.save()
                messages.success(request, 'Personal asignado.')
                return redirect('ot_detail', pk=ot.pk)

        # Cambiar Estado (Admin)
        elif 'cambiar_estado' in request.POST:
            if not puede_realizar_acciones_criticas: raise PermissionDenied
            form = CambiarEstadoOTForm(request.POST, instance=ot)
            if form.is_valid():
                instancia = form.save()
                if instancia.estado == 'FINALIZADA': instancia.fecha_cierre = timezone.now()
                instancia.save()
                messages.success(request, 'Estado actualizado.')
                return redirect('ot_detail', pk=ot.pk)

        # --- BOTONES OPERATIVOS (MECÁNICO) ---
        elif 'iniciar_trabajo' in request.POST:
            ot.estado = 'EN_PROCESO'
            if not ot.inicio_proceso: ot.inicio_proceso = timezone.now()
            ot.save()
            HistorialOT.objects.create(orden_de_trabajo=ot, usuario=request.user, tipo_evento='INICIO_OT', descripcion="Mecánico inició el trabajo.")
            messages.success(request, "Trabajo iniciado.")
            return redirect('ot_detail', pk=ot.pk)

        elif 'finalizar_trabajo' in request.POST:
            ot.estado = 'CERRADA_MECANICO'
            ot.save()
            HistorialOT.objects.create(orden_de_trabajo=ot, usuario=request.user, tipo_evento='CIERRE_MECANICO', descripcion="Mecánico finalizó el trabajo.")
            messages.info(request, "Trabajo finalizado por mecánico.")
            return redirect('ot_detail', pk=ot.pk)

        # --- SOLICITUD DE REPUESTOS (EL BOTÓN PÚRPURA) ---
        elif 'crear_solicitud' in request.POST:
            form = SolicitudRepuestoForm(request.POST)
            if form.is_valid():
                solicitud = form.save(commit=False)
                solicitud.ot = ot
                solicitud.solicitante = request.user
                solicitud.save()
                messages.success(request, f"Pedido de {solicitud.repuesto_nombre} enviado a bodega.")
                return redirect('ot_detail', pk=ot.pk)

        # --- APROBACIÓN/RECHAZO (JEFATURA) ---
        elif "aprobar_solicitud" in request.POST:
            if not puede_realizar_acciones_criticas: raise PermissionDenied
            solicitud = Solicitud.objects.get(id=request.POST.get("solicitud_id"))
            solicitud.estado = "APROBADA"
            solicitud.validado_por = request.user
            solicitud.fecha_validacion = timezone.now()
            solicitud.save()
            return redirect('ot_detail', pk=ot.pk)

        elif "rechazar_solicitud" in request.POST:
            if not puede_realizar_acciones_criticas: raise PermissionDenied
            solicitud = Solicitud.objects.get(id=request.POST.get("solicitud_id"))
            solicitud.estado = "RECHAZADA"
            solicitud.motivo_rechazo = request.POST.get("motivo_rechazo")
            solicitud.validado_por = request.user
            solicitud.save()
            return redirect('ot_detail', pk=ot.pk)

    # --- 3. CÁLCULO DE COSTOS (SOLO PARA JEFES) ---
    desglose_costos = {'insumos': 0, 'mano_obra_tareas': 0, 'mano_obra_hh': 0}
    if puede_gestionar_tareas_y_personal:
        costo_insumos_agg = ot.detalles_insumos_ot.aggregate(
            total_repuestos=Sum(F('cantidad') * F('repuesto_inventario__precio_unitario'), output_field=models.DecimalField()),
            total_manuales=Sum(F('cantidad') * F('insumo__precio_unitario'), output_field=models.DecimalField())
        )
        desglose_costos['insumos'] = (costo_insumos_agg.get('total_repuestos') or 0) + (costo_insumos_agg.get('total_manuales') or 0)
        desglose_costos['mano_obra_tareas'] = ot.tareas_realizadas.aggregate(total=Sum('costo_base'))['total'] or 0
        
        if ot.responsable and hasattr(ot.responsable, 'personal') and ot.tfs_minutos:
            valor_hora = ot.responsable.personal.valor_hora_normal
            desglose_costos['mano_obra_hh'] = Decimal(ot.tfs_minutos / 60.0) * valor_hora

    solicitudes = ot.solicitudes.all().order_by('-fecha_creacion')
    solicitud_pendiente = solicitudes.filter(estado='EN_PROCESO').exists()

    context = {
        'ot': ot,
        'es_mecanico': es_mecanico,
        'puede_gestionar_tareas_y_personal': puede_gestionar_tareas_y_personal,
        'puede_realizar_acciones_criticas': puede_realizar_acciones_criticas,
        'asignar_form': asignar_form,
        'cerrar_mecanico_form': cerrar_mecanico_form,
        'cambiar_estado_form': cambiar_estado_form,
        'manual_insumo_form': manual_insumo_form,
        'pausar_form': pausar_form,
        'diagnostico_form': diagnostico_form,
        'asignar_tarea_form': asignar_tarea_form,
        'manual_tarea_form': manual_tarea_form,
        'solicitud_form': solicitud_form,
        'desglose_costos': desglose_costos,
        'solicitudes': solicitudes,
        'solicitud_pendiente': solicitud_pendiente,
        'full_width_content': False,
    }
    return render(request, 'flota/orden_trabajo_detail.html', context)


@login_required
def orden_trabajo_edit(request, pk):
    """
    Vista para editar una Orden de Trabajo existente.
    """
    # Verificamos que el usuario tenga permisos (puedes ajustar esta lógica si es necesario)
    if not es_personal_operativo(request.user):
        raise PermissionDenied("No tienes permiso para editar órdenes de trabajo.")

    connection.set_tenant(request.tenant)
    ot = get_object_or_404(OrdenDeTrabajo, pk=pk)

    if request.method == 'POST':
        form = OrdenDeTrabajoForm(request.POST, instance=ot)
        if form.is_valid():
            ot_editada = form.save()
            # Creamos un registro en el historial para la trazabilidad
            HistorialOT.objects.create(
                orden_de_trabajo=ot_editada,
                usuario=request.user,
                tipo_evento='MODIFICACION',
                descripcion=f"OT #{ot_editada.folio} ha sido editada."
            )
            messages.success(request, f'Orden de Trabajo #{ot_editada.folio} actualizada con éxito.')
            return redirect('ot_detail', pk=ot_editada.pk) # Redirigimos al detalle de la OT
        else:
            messages.error(request, 'Error al actualizar la OT. Por favor, revise los campos del formulario.')
    else:
        form = OrdenDeTrabajoForm(instance=ot)

    context = {
        'form': form,
        'ot': ot, # Pasamos la OT para poder mostrar su información en el título, etc.
        'es_edicion': True, # Una bandera para diferenciar en la plantilla si es creación o edición
    }
    # Para la edición, es mejor tener una página dedicada en lugar de un modal.
    # Crearemos una plantilla simple llamada 'orden_trabajo_form.html'
    # O, si quieres reutilizar el modal, la lógica sería más compleja con AJAX.
    # Empecemos con una página dedicada que es más robusto.
    return render(request, 'flota/orden_trabajo_form.html', context)


# --- NUEVA VISTA PARA ELIMINAR UNA OT ---

@login_required
def orden_trabajo_list(request):
    connection.set_tenant(request.tenant)
    
    # --- 1. LÓGICA DE PERMISOS (REQUERIMIENTO GABRIEL) ---
    user_groups = set(request.user.groups.values_list('name', flat=True))
    es_mecanico = 'Mecánico' in user_groups
    es_supervisor = 'Supervisor' in user_groups
    es_administrador = 'Administrador' in user_groups
    es_gerente = 'Gerente' in user_groups
    
    # Solo los jefes pueden gestionar personal, tareas y ver el "Costo Total"
    puede_gestionar_tareas_y_personal = es_supervisor or es_administrador or es_gerente

    # Formulario vacío para GET
    form = OrdenDeTrabajoForm()

    # --- 2. PROCESAMIENTO POST (CREACIÓN DE OT) ---
    if request.method == 'POST':
        if not es_personal_operativo(request.user):
            raise PermissionDenied

        # Se agrega request.FILES para recibir las fotos de los neumáticos de la pizarra
        form_post = OrdenDeTrabajoForm(request.POST, request.FILES)

        if form_post.is_valid():
            try:
                with transaction.atomic():
                    kit_seleccionado = form_post.cleaned_data.get('kit_de_repuestos')
                    personal_seleccionado = form_post.cleaned_data.get('personal_asignado')

                    # Crea el objeto OT en memoria
                    ot = form_post.save(commit=False)
                    ot.creada_por = request.user
                    if ot.tipo == 'CORRECTIVA' and ot.tipo_falla:
                        ot.tfs_minutos = ot.tipo_falla.tfs_predeterminado_min

                    # Si se seleccionó personal, el primero de la lista es el RESPONSABLE
                    if personal_seleccionado:
                        ot.responsable = personal_seleccionado.first()

                    # Guarda la OT en la base de datos
                    ot.save()

                    # ==========================================================
                    # >>> LÓGICA PIZARRA: INSPECCIÓN DE NEUMÁTICOS <<<
                    # ==========================================================
                    for i in range(1, 13):  # Soporta hasta 12 ruedas (8x4)
                        dot = request.POST.get(f'neum_dot_{i}')
                        if dot:
                            psi = request.POST.get(f'neum_psi_{i}')
                            mm = request.POST.get(f'neum_mm_{i}')
                            foto = request.FILES.get(f'neum_foto_{i}') 

                            medida_gen, _ = MedidaNeumatico.objects.get_or_create(medida="POR DEFINIR")
                            diseno_gen, _ = DisenoBanda.objects.get_or_create(nombre="POR DEFINIR", marca="GENERICO")

                            neumatico, _ = Neumatico.objects.get_or_create(
                                dot=dot.strip().upper(),
                                defaults={
                                    'medida': medida_gen,
                                    'diseno': diseno_gen,
                                    'estado': 'MONTADO',
                                    'fecha_compra': timezone.now().date(),
                                    'costo_inicial': 0,
                                    'vehiculo_montado': ot.vehiculo,
                                    'posicion_montaje': i
                                }
                            )

                            if psi and mm:
                                HistorialParametrosNeumatico.objects.create(
                                    neumatico=neumatico,
                                    ot=ot,
                                    inspector=request.user,
                                    presion_psi=int(psi),
                                    remanente_mm=float(mm.replace(',', '.')),
                                    km_vehiculo_inspeccion=ot.kilometraje_apertura or 0,
                                    foto_estado=foto
                                )

                    # Guardamos a los AYUDANTES (del segundo en adelante)
                    if personal_seleccionado and len(personal_seleccionado) > 1:
                        ayudantes = personal_seleccionado[1:]
                        ot.personal_asignado.set(ayudantes)

                    # Carga automática de Kit de Repuestos (Preventiva)
                    if ot.tipo == 'PREVENTIVA' and kit_seleccionado:
                        repuestos_cargados = 0
                        for detalle_kit in kit_seleccionado.detallekitrepuesto_set.select_related('repuesto').all():
                            repuesto = detalle_kit.repuesto
                            cantidad_necesaria = detalle_kit.cantidad

                            DetalleInsumoOT.objects.create(
                                orden_de_trabajo=ot,
                                repuesto_inventario=repuesto,
                                cantidad=cantidad_necesaria
                            )
                            MovimientoStock.objects.create(
                                repuesto=repuesto,
                                tipo_movimiento='SALIDA_OT',
                                cantidad=-cantidad_necesaria,
                                usuario_responsable=request.user,
                                orden_de_trabajo=ot,
                                notas=f"Salida automática por Kit '{kit_seleccionado.nombre}' para OT #{ot.folio}"
                            )
                            repuestos_cargados += 1

                        if repuestos_cargados > 0:
                            ot.save() # Recalcula costo total
                            messages.info(request, f"Se cargaron automáticamente {repuestos_cargados} repuestos del kit.")

                    HistorialOT.objects.create(
                        orden_de_trabajo=ot, 
                        usuario=request.user, 
                        tipo_evento='CREACION', 
                        descripcion=f"OT #{ot.folio} creada con registro técnico de neumáticos."
                    )
                    messages.success(request, f'Orden de Trabajo #{ot.folio} creada con éxito.')
                    return redirect('ot_list')

            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error crítico al crear OT: {e}", exc_info=True)
                messages.error(request, f"Error al procesar la OT: {e}")
        else:
            messages.error(request, 'Error al crear la OT. Por favor, revise el formulario.')
            form = form_post

    # --- 3. LÓGICA GET (LISTADO Y FILTROS) ---
    
    # FILTRO DE SEGURIDAD PARA EL MECÁNICO
    if es_mecanico:
        # El mecánico solo ve las OTs donde es responsable directo o parte del personal asignado
        ordenes_list = OrdenDeTrabajo.objects.filter(
            Q(responsable=request.user) | Q(personal_asignado=request.user)
        ).distinct().order_by('-fecha_creacion')
    else:
        # Administradores y Supervisores ven todas las OTs
        ordenes_list = OrdenDeTrabajo.objects.all().order_by('-fecha_creacion')

    # Aplicación de filtros del formulario
    filtro_form = OTFiltroForm(request.GET)
    if filtro_form.is_valid():
        if filtro_form.cleaned_data['vehiculo']:
            ordenes_list = ordenes_list.filter(vehiculo=filtro_form.cleaned_data['vehiculo'])
        if filtro_form.cleaned_data['tipo']:
            ordenes_list = ordenes_list.filter(tipo=filtro_form.cleaned_data['tipo'])
        if filtro_form.cleaned_data['estado']:
            ordenes_list = ordenes_list.filter(estado=filtro_form.cleaned_data['estado'])
        if filtro_form.cleaned_data['fecha_desde']:
            ordenes_list = ordenes_list.filter(fecha_creacion__date__gte=filtro_form.cleaned_data['fecha_desde'])
        if filtro_form.cleaned_data['fecha_hasta']:
            ordenes_list = ordenes_list.filter(fecha_creacion__date__lte=filtro_form.cleaned_data['fecha_hasta'])

    # CÁLCULO DE COSTO TOTAL (Solo se envía si es Jefe)
    suma_de_totales = 0
    if puede_gestionar_tareas_y_personal:
        resultado_suma = ordenes_list.aggregate(total_sum=Sum('costo_total', filter=Q(estado='FINALIZADA')))
        suma_de_totales = resultado_suma['total_sum'] or 0

    # Paginación
    paginator = Paginator(ordenes_list, 10)
    page = request.GET.get('page')
    try:
        ordenes_paginadas = paginator.page(page)
    except:
        ordenes_paginadas = paginator.page(1)

    context = {
        'ordenes': ordenes_paginadas,
        'form': form,
        'filtro_form': filtro_form,
        'costo_total_ot': suma_de_totales,
        'puede_gestionar_tareas_y_personal': puede_gestionar_tareas_y_personal,
        'es_mecanico': es_mecanico,
        'full_width_content': False
    }
    return render(request, 'flota/orden_trabajo_list.html', context)




@login_required
def ot_eventos_api(request):
    """
    Devuelve las OTs en formato JSON para FullCalendar.
    VERSIÓN FINAL, con alertas y NUEVA PALETA DE COLORES.
    """
    connection.set_tenant(request.tenant)

    try:
        start_date = timezone.datetime.fromisoformat(request.GET.get('start').split('T')[0]).date()
        end_date = timezone.datetime.fromisoformat(request.GET.get('end').split('T')[0]).date()
    except:
        start_date = timezone.now().date() - timedelta(days=30)
        end_date = timezone.now().date() + timedelta(days=30)

    ordenes_qs = OrdenDeTrabajo.objects.filter(
        fecha_programada__range=[start_date, end_date]
    ).exclude(
        estado__in=['FINALIZADA', 'CANCELADA'] 
    ).select_related(
        'vehiculo', 'responsable', 'motivo_pausa', 'vehiculo__modelo'
    ).prefetch_related(
        Prefetch('detalles_insumos_ot', queryset=DetalleInsumoOT.objects.select_related('repuesto_inventario'))
    )

    # ===== INICIO DE LA MODIFICACIÓN DE COLORES =====
    colores_por_estado = {
        # Como dijiste, 'PENDIENTE' ya no se verá en el calendario, pero lo dejamos por si acaso.
        'POR_ASIGNAR': "rgb(239 68 68/60%)", 
        'PENDIENTE': 'rgb(234 179 8/60%)',          
        'EN_PROCESO': "rgb(59 130 246/60%)",
        'PAUSADA': 'rgb(249 115 22/60%)',
        'CERRADA_MECANICO': 'rgb(107 114 128/60%)',
        'FINALIZADA': 'rgb(22 163 74/60%)',
    }
    # ===== FIN DE LA MODIFICACIÓN DE COLORES =====

    eventos = []
    for ot in ordenes_qs:
        duracion_minutos = ot.tfs_minutos if ot.tfs_minutos and ot.tfs_minutos > 0 else 120
        if ot.hora_programada:
            start_datetime = timezone.make_aware(datetime.combine(ot.fecha_programada, ot.hora_programada))
        else:
            start_datetime = timezone.make_aware(datetime.combine(ot.fecha_programada, datetime.min.time()).replace(hour=8))
        #end_datetime = start_datetime + timedelta(minutes=duracion_minutos)
        if ot.hora_finalizacion:
            end_datetime = timezone.make_aware(datetime.combine(ot.fecha_programada, ot.hora_finalizacion))
        else:
            end_datetime = start_datetime + timedelta(minutes=duracion_minutos)
        
        alertas = []
        for detalle in ot.detalles_insumos_ot.all():
            if detalle.repuesto_inventario and detalle.repuesto_inventario.stock_actual < detalle.cantidad:
                alertas.append(f"¡STOCK BAJO! {detalle.repuesto_inventario.nombre}")
        if ot.estado == 'PAUSADA':
             alertas.append(f"PAUSADA: {ot.motivo_pausa.nombre if ot.motivo_pausa else 'Sin motivo'}")
        #if ot.vehiculo.alerta_combustible_activa:
        #    alertas.append("¡COMBUSTIBLE! Rendimiento crítico.")

        # calcular tiempo total programado
        tiempo_total_segundos = 0

        if ot.hora_programada and ot.hora_finalizacion:
            inicio = datetime.combine(ot.fecha_programada, ot.hora_programada)
            fin = datetime.combine(ot.fecha_programada, ot.hora_finalizacion)

            inicio = timezone.make_aware(inicio)
            fin = timezone.make_aware(fin)

            tiempo_total_segundos = int((fin - inicio).total_seconds())

        progreso = 0
        if tiempo_total_segundos > 0:
            progreso = min(
                100,
                int((ot.tiempo_trabajado_segundos / tiempo_total_segundos) * 100)
            )

        tiene_solicitud_pendiente = ot.solicitudes.filter(estado='EN_PROCESO').exists()

        eventos.append({
            'id': ot.pk,
            'title': f"{ot.folio} | {ot.vehiculo.patente}",
            'start': start_datetime.isoformat(),
            'end': end_datetime.isoformat(),
            'url': reverse('ot_detail', args=[ot.pk]),
            'backgroundColor': colores_por_estado.get(ot.estado, '#718096'),
            'borderColor': colores_por_estado.get(ot.estado, '#718096'),
            'extendedProps': {
                'vehiculo': ot.vehiculo.numero_interno,
                'patente': ot.vehiculo.patente,
                'observacion': ot.observacion_inicial,
                'estado': ot.get_estado_display(),
                'estado_code': ot.estado,
                'responsable_nombre': ot.responsable.get_full_name() if ot.responsable else "Sin Asignar",
                'alertas': alertas,
                'progreso': progreso,
                "tiempo_trabajado_segundos": ot.tiempo_trabajado_segundos,
                "inicio_proceso": ot.inicio_proceso.isoformat() if ot.inicio_proceso else None,
                "tiempo_estimado_segundos": tiempo_total_segundos,
            }
        })
    return JsonResponse(eventos, safe=False)


@login_required
def pizarra_programacion(request, fecha_str=None):
    """
    Renderiza la Pizarra de Programación.
    Lógica refinada para asegurar que OTs Pendientes vayan a "Sin Asignar".
    """
    connection.set_tenant(request.tenant)
    abrir_modal = False
    if request.method == 'POST':
        form = OrdenDeTrabajoForm(request.POST)
        form.fields['vehiculo'].required = True
        form.fields['fecha_programada'].required = True
        form.fields['hora_programada'].required = True
        form.fields['hora_finalizacion'].required = True
        
        if form.is_valid():
            ot = form.save(commit=False)
            ot.estado = 'POR_ASIGNAR'
            ot.save()
            form.save_m2m()
            return redirect(request.path)
        else:
            print(form.errors)
            abrir_modal = True
    else:
        form = OrdenDeTrabajoForm()
        form.fields['vehiculo'].required = True
        form.fields['fecha_programada'].required = True
        form.fields['hora_programada'].required = True
        form.fields['hora_finalizacion'].required = True
        
    if fecha_str:
        try:
            fecha_actual = timezone.datetime.strptime(fecha_str, '%Y-%m-%d').date()
        except (ValueError, TypeError):
            fecha_actual = timezone.now().date()
    else:
        fecha_actual = timezone.now().date()

    fecha_anterior_str = (fecha_actual - timedelta(days=3)).strftime('%Y-%m-%d')
    fecha_siguiente_str = (fecha_actual + timedelta(days=3)).strftime('%Y-%m-%d')

    # Buscamos TODAS las OTs que no estén finalizadas o canceladas
    ots_relevantes = OrdenDeTrabajo.objects.exclude(
        estado__in=['FINALIZADA', 'CANCELADA']
    ).select_related('vehiculo', 'responsable')

    ots_sin_asignar = []
    
    for ot in ots_relevantes:
        # ===== INICIO DE LA LÓGICA REFINADA =====
        # Una OT se considera "Para Programar" si:
        # 1. Está PENDIENTE.
        # 2. Está PAUSADA.
        # 3. No tiene un responsable asignado.
        # 4. No tiene una fecha programada.
        if ot.estado == 'PENDIENTE' or ot.estado == 'PAUSADA' or not ot.responsable or not ot.fecha_programada or ot.estado == 'POR_ASIGNAR' :
            evento_base = {
                'id': f'ot_{ot.pk}',
                'title': f"{ot.folio} ({ot.vehiculo.patente})",
                'url': reverse('ot_detail', args=[ot.pk]),
                'extendedProps': {
                    'estado': ot.get_estado_display(), # Le pasamos el estado para mostrarlo en la tarjeta
                }
            }
            ots_sin_asignar.append(evento_base)
        # El resto de OTs (En Proceso, Cerrada por Mecánico) que sí tienen fecha y responsable
        # se dibujarán en el calendario a través de la llamada a la API `ot_eventos_api`.
        # ===== FIN DE LA LÓGICA REFINADA =====

    context = {
        'form': form,
        'full_width_content': True,
        'fecha_actual_iso': fecha_actual.isoformat(),
        'fecha_anterior_str': fecha_anterior_str,
        'fecha_siguiente_str': fecha_siguiente_str,
        'ots_sin_asignar_json': json.dumps(ots_sin_asignar),
        'query_params_sin_fecha': request.GET.urlencode(),
        'abrir_modal': abrir_modal,
    }
    return render(request, 'flota/pizarra_programacion.html', context)






def solicitudes_ot(request, ot_id):
    solicitudes = Solicitud.objects.filter(ot_id=ot_id).values(
        'id', 'motivo', 'estado', 'usuario_solicitante__username', 'created_at'
    )
    return JsonResponse(list(solicitudes), safe=False)




################################################################################
# --- ADQUISICIONES Y COMPRAS ---
################################################################################

@login_required
@require_POST
def api_confirmar_ocr(request):
    """
    Cerebro OCR Pulser: Genera OC, actualiza Stock por Bodega, 
    actualiza Precios Unitarios y cierra Pedidos de Taller.
    """
    connection.set_tenant(request.tenant)
    try:
        with transaction.atomic():
            total_items = int(request.POST.get('total_items', 0))
            proveedor_id = request.POST.get('proveedor_id')
            nro_factura = request.POST.get('nro_factura')
            fecha_emision = request.POST.get('fecha_emision')
            bodega_id = request.POST.get('bodega_id') # NUEVO: Destino físico

            proveedor = get_object_or_404(Proveedor, id=proveedor_id)
            bodega = get_object_or_404(Bodega, id=bodega_id)

            # 1. Crear la O.C. como 'RECIBIDA'
            nueva_oc = OrdenDeCompra.objects.create(
                proveedor=proveedor,
                usuario_creador=request.user,
                estado='RECIBIDA',
                notas=f"Ingreso vía OCR - Factura N° {nro_factura}"
            )

            for i in range(total_items):
                repuesto_id = request.POST.get(f'repuesto_id_{i}')
                cantidad = int(request.POST.get(f'cantidad_{i}', 0))
                precio = float(request.POST.get(f'precio_{i}', 0))
                sku_en_factura = request.POST.get(f'sku_original_{i}')
                solicitud_id = request.POST.get(f'solicitud_id_{i}') # NUEVO: Vínculo pedido

                if repuesto_id and cantidad > 0:
                    repuesto = Repuesto.objects.get(id=repuesto_id)

                    # --- PUNTO 3.3: Actualizar Precio Unitario Automáticamente ---
                    if precio > 0:
                        repuesto.precio_unitario = precio
                    
                    # Actualizar equivalencias si el SKU es nuevo
                    if sku_en_factura and sku_en_factura not in str(repuesto.numero_parte) and \
                       sku_en_factura not in str(repuesto.codigos_equivalentes):
                        actuales = repuesto.codigos_equivalentes or ""
                        repuesto.codigos_equivalentes = f"{actuales}, {sku_en_factura}".strip(', ')
                    
                    repuesto.save()

                    # --- PUNTO 3.3: Carga de Stock por Bodega Específica ---
                    stock_b, _ = StockBodega.objects.get_or_create(repuesto=repuesto, bodega=bodega)
                    stock_b.cantidad += cantidad
                    stock_b.save()

                    # Crear línea de compra
                    LineaOrdenCompra.objects.create(
                        orden=nueva_oc,
                        repuesto=repuesto,
                        cantidad=cantidad,
                        precio_unitario=precio
                    )

                    # Registrar Movimiento de Stock con link a bodega
                    MovimientoStock.objects.create(
                        repuesto=repuesto,
                        tipo_movimiento='ENTRADA',
                        cantidad=cantidad,
                        usuario_responsable=request.user,
                        notas=f"Factura {nro_factura} -> Bodega: {bodega.nombre}"
                    )

                    # --- PUNTO 3.4: Vincular y cerrar Solicitud del Mecánico ---
                    if solicitud_id:
                        solicitud = Solicitud.objects.get(id=solicitud_id)
                        solicitud.estado = 'COMPLETADA'
                        solicitud.orden_compra = nueva_oc
                        solicitud.save()

            nueva_oc.calcular_total()

            # Registrar la factura para evitar duplicidad
            FacturaProcesada.objects.create(
                nro_factura=nro_factura,
                proveedor=proveedor,
                fecha_emision=fecha_emision,
                monto_total=nueva_oc.total,
                usuario_subida=request.user
            )

        messages.success(request, f"¡Factura {nro_factura} procesada! Precios actualizados e inventario cargado en {bodega.nombre}.")
        return redirect('panel_adquisiciones')

    except Exception as e:
        messages.error(request, f"Error al procesar: {str(e)}")
        return redirect('ingreso_factura_manual')




@login_required
@require_POST
def api_generar_oc_desde_pedidos(request):
    """
    Toma una lista de IDs de solicitudes y un ID de proveedor para crear una OC.
    """
    connection.set_tenant(request.tenant)
    try:
        data = json.loads(request.body)
        solicitud_ids = data.get('solicitud_ids', [])
        proveedor_id = data.get('proveedor_id')

        if not solicitud_ids or not proveedor_id:
            return JsonResponse({'status': 'error', 'message': 'Debe seleccionar pedidos y un proveedor.'}, status=400)

        with transaction.atomic():
            proveedor = get_object_or_404(Proveedor, id=proveedor_id)
            
            # 1. Crear la Orden de Compra Maestra
            nueva_oc = OrdenDeCompra.objects.create(
                proveedor=proveedor,
                usuario_creador=request.user,
                estado='PENDIENTE',
                notas=f"O.C. generada automáticamente desde {len(solicitud_ids)} solicitudes de taller."
            )

            # 2. Vincular cada solicitud a la O.C.
            for s_id in solicitud_ids:
                solicitud = Solicitud.objects.get(id=s_id)
                
                # Si el repuesto existe en catálogo, creamos la línea de la OC
                if solicitud.repuesto_referencia:
                    LineaOrdenCompra.objects.create(
                        orden=nueva_oc,
                        repuesto=solicitud.repuesto_referencia,
                        cantidad=solicitud.cantidad,
                        precio_unitario=solicitud.repuesto_referencia.precio_unitario
                    )
                
                # Actualizamos el estado de la solicitud
                solicitud.estado = 'ORDEN_GENERADA'
                solicitud.orden_compra = nueva_oc
                solicitud.save()

            # 3. Calcular el total de la compra
            nueva_oc.calcular_total()

        return JsonResponse({
            'status': 'ok', 
            'message': f'Orden de Compra #{nueva_oc.id} creada exitosamente.',
            'oc_id': nueva_oc.id
        })

    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)



@login_required
@require_POST
def api_procesar_escaneo(request):
    import json
    from django.db import transaction
    from django.utils import timezone
    from .models import Repuesto, Bodega, StockBodega, MovimientoStock

    try:
        data = json.loads(request.body)
        sku_final = data.get('sku', '').strip()
        nombre_input = data.get('nombre', '').strip()
        bodega_id = data.get('bodega_id')
        tipo_mov = data.get('tipo_movimiento', 'INGRESO')
        cantidad = int(data.get('cantidad', 1))
        
        # Nuevos campos de trazabilidad
        solicitante = data.get('solicitante', 'No especificado')
        autorizador = data.get('autorizador', 'No especificado')
        destino = data.get('destino', 'Gasto General')

        ahora = timezone.localtime()
        # Turno Noche: 20:00 a 07:59
        es_turno_noche = (ahora.hour >= 20 or ahora.hour < 8)
        turno_str = "TERMINAL NOCHE" if es_turno_noche else "TERMINAL DÍA"
        
        bodega = get_object_or_404(Bodega, id=bodega_id)

        with transaction.atomic():
            repuesto = Repuesto.objects.filter(numero_parte=sku_final).first()
            if not repuesto:
                repuesto = Repuesto.objects.create(
                    numero_parte=sku_final,
                    nombre=nombre_input if nombre_input else f"NUEVO SKU: {sku_final}",
                    stock_actual=0,
                    precio_unitario=0
                )

            sb, _ = StockBodega.objects.get_or_create(repuesto=repuesto, bodega=bodega)

            if tipo_mov == 'SALIDA':
                sb.cantidad -= cantidad
                sb.save()

                # NOTA ESTRUCTURADA PARA EL ADMINISTRATIVO
                nota_final = f"{turno_str} | Destino: {destino} | Retira: {solicitante} | Autoriza: {autorizador}"

                MovimientoStock.objects.create(
                    repuesto=repuesto,
                    tipo_movimiento='SALIDA_OT',
                    cantidad=-cantidad,
                    usuario_responsable=request.user,
                    notas=nota_final
                )
            else:
                sb.cantidad += cantidad
                sb.save()
                MovimientoStock.objects.create(
                    repuesto=repuesto,
                    tipo_movimiento='ENTRADA',
                    cantidad=cantidad,
                    usuario_responsable=request.user,
                    notas=f"INGRESO {turno_str} - Terminal"
                )

        return JsonResponse({'status': 'ok', 'nombre': repuesto.nombre})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)






@login_required
@user_passes_test(es_supervisor_o_admin)
def cargar_factura_ocr(request):
    """
    Portal para subir facturas PDF y extraer datos automáticamente.
    """
    connection.set_tenant(request.tenant)
    
    if request.method == 'POST' and request.FILES.get('factura_pdf'):
        pdf_file = request.FILES['factura_pdf']
        items_extraidos = []
        
        with pdfplumber.open(pdf_file) as pdf:
            texto_completo = ""
            for pagina in pdf.pages:
                texto_completo += pagina.extract_text()
            
            # --- LÓGICA DE EXTRACCIÓN (BÁSICA PARA CHILE) ---
            # Buscamos líneas que parezcan ítems: SKU, Cantidad, Precio
            # Esto es un ejemplo de patrón, se ajustará según el formato del proveedor
            lineas = texto_completo.split('\n')
            for linea in lineas:
                # Ejemplo de Regex para detectar: [Codigo] [Descripcion] [Cant] [Precio]
                # Esta parte es la que "entrenaremos" según las facturas de Bruno
                match = re.search(r'(\d+)\s+(.+)\s+(\d+)\s+([\d\.]+)', linea)
                if match:
                    sku, desc, cant, precio = match.groups()
                    
                    # Buscamos si el SKU ya existe en nuestro catálogo (o en equivalencias)
                    repuesto_existente = Repuesto.objects.filter(
                        Q(numero_parte=sku) | Q(codigos_equivalentes__icontains=sku)
                    ).first()
                    
                    items_extraidos.append({
                        'sku_factura': sku,
                        'descripcion_factura': desc,
                        'cantidad': cant,
                        'precio_unitario': precio.replace('.', ''),
                        'repuesto_id': repuesto_existente.id if repuesto_existente else None,
                        'repuesto_nombre': repuesto_existente.nombre if repuesto_existente else "NUEVO REPUESTO"
                    })

        context = {
            'items': items_extraidos,
            'filename': pdf_file.name,
            'proveedores': Proveedor.objects.all(),
            'titulo': 'Validación de Factura OCR'
        }
        return render(request, 'flota/adquisiciones/validar_ocr.html', context)

    return render(request, 'flota/adquisiciones/subir_factura.html')


@login_required
@user_passes_test(es_supervisor_o_admin)
def crear_oc_manual(request):
    """Permite crear una O.C. de cualquier tipo (administrativa o taller) desde cero."""
    connection.set_tenant(request.tenant)
    
    if request.method == 'POST':
        form = OrdenDeCompraManualForm(request.POST)
        formset = LineaOCFormSet(request.POST)
        
        if form.is_valid() and formset.is_valid():
            with transaction.atomic():
                oc = form.save(commit=False)
                oc.usuario_creador = request.user
                oc.save()
                
                formset.instance = oc
                formset.save()
                
                oc.calcular_total()
                messages.success(request, f"Orden de Compra #{oc.id} creada exitosamente.")
                return redirect('orden_compra_detail', pk=oc.id)
    else:
        form = OrdenDeCompraManualForm()
        formset = LineaOCFormSet()
        
    context = {
        'form': form,
        'formset': formset,
        'titulo': 'Nueva Orden de Compra (General)',
        'full_width_content': True
    }
    return render(request, 'flota/adquisiciones/oc_manual_form.html', context)


@login_required
@user_passes_test(es_supervisor_o_admin)
def crear_proveedor(request):
    """Vista para registrar un nuevo proveedor."""
    connection.set_tenant(request.tenant)
    if request.method == 'POST':
        form = ProveedorForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, '¡Proveedor registrado con éxito!')
            return redirect('lista_proveedores')
    else:
        form = ProveedorForm()
    
    return render(request, 'flota/administracion/proveedor_form.html', {
        'form': form, 
        'titulo': 'Registrar Nuevo Proveedor'
    })


# /opt/pulser_app/flota/views.py


@login_required
def generar_oc_pdf(request, pk):
    """
    Genera un PDF profesional de la Orden de Compra para enviar al proveedor.
    """
    connection.set_tenant(request.tenant)
    oc = get_object_or_404(OrdenDeCompra.objects.select_related('proveedor'), pk=pk)
    lineas = oc.lineas.all()
    
    context = {
        'oc': oc,
        'lineas': lineas,
        'fecha_emision': timezone.now(),
        'tenant_name': request.tenant.nombre,
    }
    
    # Renderizamos el template a un string HTML
    html_string = render_to_string('flota/adquisiciones/oc_pdf_template.html', context)
    
    # Creamos el objeto respuesta como PDF
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'inline; filename="Orden-Compra-{oc.id}.pdf"'
    
    # Usamos WeasyPrint para convertir el HTML a PDF
    HTML(string=html_string, base_url=request.build_absolute_uri()).write_pdf(response)
    
    return response


@login_required
@user_passes_test(es_supervisor_o_admin)
def historial_ordenes_compra(request):
    """
    Historial completo de O.C. con filtros avanzados por item, fecha, 
    proveedor y centro de costo.
    """
    connection.set_tenant(request.tenant)
    
    # 1. Parámetros de filtro
    q_item = request.GET.get('item', '')
    proveedor_id = request.GET.get('proveedor')
    centro_costo_id = request.GET.get('centro_costo')
    fecha_desde = request.GET.get('fecha_desde')
    fecha_hasta = request.GET.get('fecha_hasta')

    # 2. Consulta base (traemos proveedor para optimizar)
    ocs = OrdenDeCompra.objects.all().select_related('proveedor', 'usuario_creador').prefetch_related('lineas').order_by('-fecha_creacion')

    # 3. Aplicación de Filtros
    if q_item:
        # Busca tanto en el nombre del repuesto como en la descripción manual
        ocs = ocs.filter(
            Q(lineas__repuesto__nombre__icontains=q_item) | 
            Q(lineas__descripcion_manual__icontains=q_item)
        ).distinct()

    if proveedor_id:
        ocs = ocs.filter(proveedor_id=proveedor_id)

    if centro_costo_id:
        ocs = ocs.filter(lineas__centro_de_costo_id=centro_costo_id).distinct()

    if fecha_desde:
        ocs = ocs.filter(fecha_creacion__date__gte=fecha_desde)
    
    if fecha_hasta:
        ocs = ocs.filter(fecha_creacion__date__lte=fecha_hasta)

    # 4. Cálculo de Totales para el resumen del historial
    total_gastado = ocs.aggregate(Sum('total'))['total__sum'] or 0

    # 5. Paginación (20 por página)
    paginator = Paginator(ocs, 20)
    page = request.GET.get('page')
    ocs_paginadas = paginator.get_page(page)

    context = {
        'ocs': ocs_paginadas,
        'proveedores': Proveedor.objects.all().order_by('nombre'),
        'centros_costo': CentroDeCosto.objects.all().order_by('nombre'),
        'total_gastado': total_gastado,
        'full_width_content': True
    }
    return render(request, 'flota/adquisiciones/orden_compra_historial.html', context)


import pdfplumber
import re


@login_required
@user_passes_test(es_supervisor_o_admin)
def ingreso_factura_view(request):
    """
    Punto de entrada para el ingreso manual de facturas (Estilo Pulser).
    """
    connection.set_tenant(request.tenant)
    context = {
        'items': [],
        'proveedores': Proveedor.objects.all().order_by('nombre'),
        'bodegas': Bodega.objects.all().order_by('numero_identificador'),
        'pedidos_pendientes': Solicitud.objects.filter(estado='APROBADA').select_related('ot', 'ot__vehiculo'),
        'titulo': 'Ingreso de Nueva Factura'
    }
    return render(request, 'flota/adquisiciones/validar_ocr.html', context)

# NOTA: Asegúrate de que cargar_factura_ocr también pase 'bodegas' y 'pedidos_pendientes' al context





@login_required
def lista_proveedores(request):
    """Vista para listar proveedores con filtro de búsqueda."""
    connection.set_tenant(request.tenant)
    
    # Capturamos el término de búsqueda
    query = request.GET.get('q', '')
    proveedores = Proveedor.objects.all().order_by('nombre')
    
    if query:
        proveedores = proveedores.filter(nombre__icontains=query)
    
    form = ProveedorForm()
    
    return render(request, 'flota/administracion/lista_proveedores.html', {
        'proveedores': proveedores,
        'form': form,
        'query': query, # Para mantener el texto en el buscador
        'full_width_content': True
    })




@login_required
def orden_compra_detail(request, pk):
    """
    Vista detallada de una Orden de Compra. 
    Muestra ítems, pedidos de taller asociados y permite elegir la bodega al recibir.
    """
    connection.set_tenant(request.tenant)
    
    # Obtenemos la O.C. principal
    oc = get_object_or_404(OrdenDeCompra.objects.select_related('proveedor', 'usuario_creador'), pk=pk)
    
    # Obtenemos las líneas de productos/servicios
    lineas = oc.lineas.select_related('repuesto', 'centro_de_costo').all()
    
    # Obtenemos las solicitudes de mecánicos que se incluyeron en esta compra
    solicitudes_vinculadas = oc.solicitudes_incluidas.select_related('ot', 'solicitante', 'ot__vehiculo').all()
    
    # IMPORTANTE: Enviamos las bodegas disponibles para el modal de recepción
    bodegas = Bodega.objects.all().order_by('numero_identificador')
    
    context = {
        'oc': oc,
        'lineas': lineas,
        'solicitudes': solicitudes_vinculadas,
        'bodegas': bodegas, # <-- Necesario para el selector de bodega
        'full_width_content': True
    }
    return render(request, 'flota/adquisiciones/orden_compra_detail.html', context)





@login_required
@user_passes_test(es_supervisor_o_admin)
def panel_adquisiciones(request):
    """
    Dashboard administrativo central de Adquisiciones.
    Muestra pedidos YA APROBADOS por supervisor, OCs activas e Historial de Facturas (OCR).
    """
    connection.set_tenant(request.tenant)
    
    # 1. Pedidos que el supervisor YA APROBÓ y están esperando compra.
    # Cambiamos el estado a 'APROBADA' para que sigan el flujo que solicitaste.
    pedidos_pendientes = Solicitud.objects.filter(
        estado='APROBADA' # <--- Ahora el panel solo muestra lo validado
    ).select_related(
        'ot', 
        'solicitante', 
        'ot__vehiculo', 
        'repuesto_referencia__proveedor_habitual'
    ).order_by('-prioridad', '-fecha_creacion')

    # 2. Órdenes de Compra activas (Pendientes o En Proceso)
    ocs_activas = OrdenDeCompra.objects.filter(
        estado__in=['PENDIENTE', 'EN_PROCESO']
    ).select_related('proveedor').order_by('-fecha_creacion')

    # 3. Historial de Facturas ingresadas por OCR (últimas 10)
    facturas_recientes = FacturaProcesada.objects.all().select_related(
        'proveedor', 
        'usuario_subida'
    ).order_by('-fecha_subida')[:10]

    context = {
        'pedidos': pedidos_pendientes,
        'ocs_activas': ocs_activas,
        'facturas': facturas_recientes,
        'proveedores': Proveedor.objects.all().order_by('nombre'),
        'full_width_content': True
    }
    return render(request, 'flota/adquisiciones/panel_adquisiciones.html', context)




def procesar_archivo_empleados(archivo, request):
    """
    Procesa el archivo Excel de empleados para CREAR o ACTUALIZAR
    registros en los modelos 'User' y 'Personal' existentes.
    """
    try:
        df = pd.read_excel(archivo).fillna('')
        creados = 0
        actualizados = 0
        errores = []

        with transaction.atomic():
            for index, row in df.iterrows():
                rut = str(row.get('Rut', '')).strip()
                nombre = str(row.get('Nombre', '')).strip()
                ap_paterno = str(row.get('Ap_Paterno', '')).strip()

                if not all([rut, nombre, ap_paterno]):
                    errores.append(f"Fila {index + 2}: Faltan datos (RUT, Nombre o Apellido Paterno). Se omite.")
                    continue

                try:
                    # Busca si ya existe un registro en tu modelo Personal usando el RUT
                    personal_obj = Personal.objects.filter(rut=rut).first()

                    if personal_obj and personal_obj.user:
                        # --- SI YA EXISTE Y ESTÁ VINCULADO, ACTUALIZA EL NOMBRE ---
                        usuario = personal_obj.user
                        usuario.first_name = nombre
                        usuario.last_name = ap_paterno
                        usuario.save()

                        personal_obj.nombre = f"{nombre} {ap_paterno}"
                        personal_obj.save()
                        actualizados += 1
                    elif not personal_obj:
                        # --- SI NO EXISTE, CREA EL USUARIO Y EL PERSONAL ---
                        # 1. Crear un nombre de usuario único (ej: juan.perez)
                        username_base = f"{nombre.split(' ')[0].lower()}.{ap_paterno.lower()}"
                        username = re.sub(r'[^a-zA-Z0-9.]', '', username_base) # Limpia caracteres extraños
                        counter = 1
                        while User.objects.filter(username=username).exists():
                            username = f"{username_base}{counter}"
                            counter += 1

                        # 2. Crear una contraseña por defecto (RUT sin puntos ni guión)
                        password = "".join(filter(str.isdigit, rut))

                        # 3. Mapear Cargo a Rol (ajusta las palabras clave según tu Excel)
                        cargo = str(row.get('Cargo', '')).upper()
                        if 'SUPERVISOR' in cargo:
                            rol_asignado = 'SUPERVISOR'
                        elif 'MECANICO' in cargo or 'MECÁNICO' in cargo:
                            rol_asignado = 'MECANICO'
                        else:
                            rol_asignado = 'ASISTENTE' # Rol por defecto para otros cargos

                        # 4. Crear el usuario de Django
                        nuevo_usuario = User.objects.create_user(
                            username=username,
                            password=password,
                            first_name=nombre,
                            last_name=ap_paterno
                        )

                        # 5. Crear el registro de Personal y vincularlo al nuevo usuario
                        Personal.objects.create(
                            user=nuevo_usuario,
                            nombre=f"{nombre} {ap_paterno}",
                            rut=rut,
                            rol=rol_asignado # Tu modelo Personal se encarga de asignar el grupo
                        )
                        creados += 1

                except Exception as e:
                    errores.append(f"Fila {index + 2} (RUT: {rut}): Error -> {e}")

        if creados > 0 or actualizados > 0:
            messages.success(request, f"Carga finalizada: {creados} usuarios nuevos creados, {actualizados} actualizados.")
        if errores:
            messages.warning(request, f"Se encontraron {len(errores)} errores. Primer error: {errores[0] if errores else 'N/A'}")

    except Exception as e:
        messages.error(request, f"Error CRÍTICO al procesar el archivo: {e}. La operación fue cancelada.")


# Reemplaza la función (o funciones) lista_kits en /opt/pulser_app/flota/views.py con esta


@login_required
@user_passes_test(es_supervisor_o_admin)
def recibir_orden_compra(request, pk):
    connection.set_tenant(request.tenant)
    oc = get_object_or_404(OrdenDeCompra, pk=pk)
    
    if request.method == 'POST':
        bodega_id = request.POST.get('bodega_id')
        if not bodega_id:
            messages.error(request, "Debes seleccionar una bodega para recibir la mercadería.")
            return redirect('orden_compra_detail', pk=oc.id)
            
        bodega = get_object_or_404(Bodega, id=bodega_id)
        oc.marcar_como_recibida(usuario=request.user, bodega=bodega)
        
        messages.success(request, f"O.C. #{oc.id} recibida en {bodega.nombre}. Stock actualizado.")
        return redirect('orden_compra_detail', pk=oc.id)
    
    return redirect('panel_adquisiciones')






################################################################################
# --- VEHICULOS NEUMATICOS COMBUSTIBLE ---
################################################################################

@login_required
def actualizar_km_manual(request, pk):
    vehiculo = get_object_or_404(Vehiculo, pk=pk)
    config = ConfiguracionEmpresa.load()

    if request.method == "POST":
        today = timezone.localdate()

        fecha_inicio = timezone.make_aware(
            datetime.combine(today, time(0,1,0))
        )

        fecha_fin = timezone.make_aware(
            datetime.combine(today, time(23,59,59))
        )
        try:
            vehiculo._user = request.user
            if config.gps_proveedor == 'GPS2':
                data, error = obtener_datos_gps2()

                if error:
                    ok = False
                    msg = error
                else:
                    ok, msg = actualizar_vehiculo_gps2(vehiculo, data)
            else:
                ok, msg = actualizar_km_vehiculo_gps(vehiculo, fecha_inicio, fecha_fin)
            if ok:
                messages.success(request, msg)
            else:
                messages.warning(request, msg)
        except Exception as e:
            messages.error(request, f"Error GPS: {e}")

    return redirect("dashboard_flota")


@login_required
def actualizar_km_vehiculo(request, pk):
    connection.set_tenant(request.tenant)
    vehiculo = get_object_or_404(Vehiculo, pk=pk)
    if request.method == 'POST':
        nuevo_km = request.POST.get('kilometraje_actual')
        print('=====================')
        print(nuevo_km)
        if nuevo_km and nuevo_km.isdigit():
            vehiculo.kilometraje_actual = int(nuevo_km)
            vehiculo.save(update_fields=['kilometraje_actual'])
            messages.success(request, f"Kilometraje del vehículo {vehiculo.numero_interno} actualizado a {nuevo_km} KM.")
        else:
            messages.error(request, "El kilometraje ingresado no es válido.")
    return redirect('dashboard')


@login_required
def analisis_costos_vehiculo(request, pk):
    """
    Vista para mostrar el panel de "Costos y Tendencias" de un vehículo específico.
    Permite visualizar registros y añadir nuevos.
    """
    connection.set_tenant(request.tenant)
    vehiculo = get_object_or_404(Vehiculo, pk=pk)

    # Lógica para procesar el formulario cuando se envía
    if request.method == 'POST':
        form = RegistroContableVehiculoForm(request.POST)
        if form.is_valid():
            nuevo_registro = form.save(commit=False)
            nuevo_registro.vehiculo = vehiculo  # Asignamos el vehículo actual automáticamente
            nuevo_registro.save()

            messages.success(request, f"¡Registro de {nuevo_registro.get_tipo_registro_display()} añadido con éxito!")
            # Redirigimos a la misma página para ver el nuevo registro en la lista
            return redirect('analisis_costos_vehiculo', pk=vehiculo.pk)
        else:
            messages.error(request, "Error al guardar el registro. Por favor, revise el formulario.")
    else:
        # Si no es POST, simplemente creamos un formulario vacío
        form = RegistroContableVehiculoForm()

    # Obtenemos todos los registros contables existentes para este vehículo, ordenados por fecha
    registros_contables = vehiculo.registros_contables.all()

    # --- INICIO: CÁLCULO DE KPIs BÁSICOS ---
    total_ingresos = registros_contables.filter(tipo_registro='INGRESO').aggregate(total=Sum('monto'))['total'] or 0
    total_costos = registros_contables.filter(tipo_registro='COSTO').aggregate(total=Sum('monto'))['total'] or 0
    utilidad_neta = total_ingresos - total_costos
    # --- FIN: CÁLCULO DE KPIs ---

    context = {
        'vehiculo': vehiculo,
        'form': form,
        'registros': registros_contables,
        'total_ingresos': total_ingresos,
        'total_costos': total_costos,
        'utilidad_neta': utilidad_neta,
        'full_width_content': True, # Para que ocupe todo el ancho
    }

    # Le decimos a Django que renderice una nueva plantilla que crearemos en el siguiente paso
    return render(request, 'flota/analisis_costos_vehiculo.html', context)



@login_required
def analisis_km_vehiculo(request, pk):
    """
    Vista para mostrar el análisis de kilometraje y calcular pronósticos
    para un vehículo específico.
    """
    connection.set_tenant(request.tenant)
    vehiculo = get_object_or_404(Vehiculo, pk=pk)
    km_actual = vehiculo.kilometraje_actual

    # Esta lógica es simple y puede fallar si no hay pautas, pero no rompe el servidor.
    # La dejamos así para restaurar el estado anterior.
    proxima_pauta_agg = {} # Iniciar como diccionario vacío
    try:
        # Intentamos buscar con el nombre de campo antiguo por si la migración no se ha completado
        proxima_pauta_agg = PautaMantenimiento.objects.filter(
            modelo_vehiculo=vehiculo.modelo,
            kilometraje_pauta__gt=km_actual
        ).aggregate(proximo_km=Min('kilometraje_pauta'))
    except FieldError:
        # Si falla, es porque ya se migró. Usamos el nuevo nombre de campo.
        proxima_pauta_agg = PautaMantenimiento.objects.filter(
            modelo_vehiculo=vehiculo.modelo,
            kilometraje_inicial__gt=km_actual
        ).aggregate(proximo_km=Min('kilometraje_inicial'))

    proximo_km_pauta = proxima_pauta_agg.get('proximo_km')

    kms_faltantes = None
    if proximo_km_pauta:
        kms_faltantes = proximo_km_pauta - km_actual

    km_prom_dia_base = vehiculo.km_promedio_para_display
    if km_prom_dia_base is None or km_prom_dia_base == 0:
        km_prom_dia_base = 0.001

    km_prom_usado_para_prediccion = float(km_prom_dia_base)

    if request.method == 'POST':
        km_prom_input_str = request.POST.get('km_prom_diario')
        if km_prom_input_str is not None and km_prom_input_str != '':
            try:
                km_prom_usado_para_prediccion = float(km_prom_input_str.replace(',', '.'))
                if km_prom_usado_para_prediccion <= 0:
                    km_prom_usado_para_prediccion = 0.001
            except ValueError:
                messages.warning(request, "El valor de KM/día ingresado no es válido.")
                km_prom_usado_para_prediccion = float(km_prom_dia_base)
        else:
            km_prom_usado_para_prediccion = float(km_prom_dia_base)

    fecha_pronosticada = None
    if kms_faltantes is not None and kms_faltantes > 0 and km_prom_usado_para_prediccion > 0.001:
        dias_para_pauta = kms_faltantes / km_prom_usado_para_prediccion
        fecha_pronosticada = (timezone.now().date() + timedelta(days=round(dias_para_pauta))).strftime("%d de %B de %Y")
    elif kms_faltantes is not None and kms_faltantes <= 0:
        fecha_pronosticada = "¡HOY O ANTES!"
    else:
        fecha_pronosticada = "N/A"

    context = {
        'vehiculo': vehiculo,
        'km_prom_dia_actual': round(float(vehiculo.km_promedio_para_display or 0), 2),
        'proximo_km_pauta': proximo_km_pauta,
        'kms_faltantes': kms_faltantes,
        'fecha_pronosticada': fecha_pronosticada,
        'km_prom_usado': round(float(km_prom_usado_para_prediccion), 2),
    }
    return render(request, 'flota/analisis_km.html', context)



@login_required
@require_POST
def api_actualizar_km_vehiculo(request, pk):
    """
    API para actualizar el kilometraje y la fecha de registro de un vehículo.
    """
    try:
        data = json.loads(request.body)
        nuevo_km_str = data.get('kilometraje_actual')
        fecha_registro_km_str = data.get('fecha_registro_km') # <<< Nuevo: Recibimos la fecha

        if not nuevo_km_str or not str(nuevo_km_str).isdigit():
            return JsonResponse({'status': 'error', 'message': 'Kilometraje inválido.'}, status=400)
        if not fecha_registro_km_str: # <<< Nuevo: Validamos la fecha
            return JsonResponse({'status': 'error', 'message': 'La fecha de registro del kilometraje es obligatoria.'}, status=400)

        nuevo_km = int(nuevo_km_str)
        vehiculo = get_object_or_404(Vehiculo, pk=pk)

        # Validar la fecha
        try:
            fecha_registro_km = datetime.strptime(fecha_registro_km_str, '%Y-%m-%d').date()
        except ValueError:
            return JsonResponse({'status': 'error', 'message': 'Formato de fecha inválido. Use AAAA-MM-DD.'}, status=400)

        # No permitimos fechas futuras para el registro de KM
        if fecha_registro_km > timezone.localdate(): # Usa timezone.localdate() para la fecha actual local
             return JsonResponse({'status': 'error', 'message': 'La fecha de registro no puede ser futura.'}, status=400)

        # Validación más flexible para el KM:
        # Si la nueva fecha de registro es ANTERIOR o IGUAL a la fecha de la última actualización,
        # permitimos que el kilometraje sea menor (se está corrigiendo un registro pasado).
        # Si la nueva fecha es POSTERIOR, el KM debe ser mayor o igual.
        if vehiculo.fecha_actualizacion_km: # Solo aplicamos esta lógica si ya hay una fecha registrada
            if fecha_registro_km > vehiculo.fecha_actualizacion_km:
                if nuevo_km < vehiculo.kilometraje_actual:
                    return JsonResponse({'status': 'error', 'message': f'Si la fecha de registro ({fecha_registro_km.strftime("%d/%m/%Y")}) es posterior al último registro ({vehiculo.fecha_actualizacion_km.strftime("%d/%m/%Y")}), el KM ({nuevo_km}) no puede ser menor al actual ({vehiculo.kilometraje_actual}).'}, status=400)
            # Si la fecha de registro es igual o anterior, se permite cualquier KM (corrección histórica)
            # Si la fecha_actualizacion_km es nula, es la primera vez que se registra una fecha.


        # Actualizamos el kilometraje y la fecha en la base de datos
        vehiculo.kilometraje_actual = nuevo_km
        vehiculo.fecha_actualizacion_km = fecha_registro_km # <<< Nuevo: Guardamos la fecha
        vehiculo.save(update_fields=['kilometraje_actual', 'fecha_actualizacion_km']) # <<< Nuevo: Incluimos el nuevo campo

        # --- RECALCULAMOS LOS DATOS CLAVE DE LA FILA ---
        km_ultimo_mant = 0

        ultima_ot = OrdenDeTrabajo.objects.filter(
            vehiculo=vehiculo, tipo='PREVENTIVA', estado='FINALIZADA'
        ).order_by('-fecha_cierre', '-kilometraje_cierre').first()

        if ultima_ot and ultima_ot.kilometraje_cierre:
            km_ultimo_mant = ultima_ot.kilometraje_cierre
        elif vehiculo.km_ultima_mantencion:
            km_ultimo_mant = vehiculo.km_ultima_mantencion

        acum_prox_mat = nuevo_km - km_ultimo_mant

        return JsonResponse({
            'status': 'ok',
            'message': 'Kilometraje y fecha actualizados con éxito.',
            'nuevos_datos': {
                'kilometraje_actual': f"{nuevo_km:,.0f}".replace(",", "."),
                'acum_prox_mat': f"{acum_prox_mat:,.0f}".replace(",", "."),
                'fecha_km_actual': fecha_registro_km.strftime('%d/%m/%Y'), # <<< Nuevo: Devolvemos la fecha formateada
            }
        })
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error en api_actualizar_km_vehiculo para PK {pk}: {e}", exc_info=True)
        return JsonResponse({'status': 'error', 'message': f'Ocurrió un error interno en el servidor: {str(e)}'}, status=500)

# flota/views.py

# ... (todos tus otros imports) ...
from django.db.models import Prefetch # <-- AÑADE ESTE IMPORT AL INICIO DE TU ARCHIVO


@login_required
@require_POST
def api_crear_modelo_rapido(request):
    """Crea un modelo de vehículo vía AJAX y devuelve el ID y Nombre."""
    connection.set_tenant(request.tenant)
    nombre = request.POST.get('nombre')
    marca = request.POST.get('marca')
    tipo = request.POST.get('tipo', 'Otros') # Valor por defecto

    if nombre and marca:
        try:
            # Crear el objeto
            modelo = ModeloVehiculo.objects.create(
                nombre=nombre.strip().upper(),
                marca=marca.strip().upper(),
                tipo=tipo
            )
            return JsonResponse({
                'status': 'ok',
                'id': modelo.id,
                'text': f"{modelo.marca} {modelo.nombre}"
            })
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
            
    return JsonResponse({'status': 'error', 'message': 'Faltan datos obligatorios.'}, status=400)







def api_lista_vehiculos(request):
    vehiculos = Vehiculo.objects.filter(esta_activo=True).values('id', 'numero_interno', 'patente')
    data = [{'id': v['id'], 'text': f"{v['numero_interno']} ({v['patente']})"} for v in vehiculos]
    return JsonResponse(data, safe=False)



# /opt/pulser_app/flota/views.py


def api_lista_vehiculos(request):
    """
    API que devuelve una lista simple de vehículos activos para los formularios.
    """
    vehiculos = Vehiculo.objects.filter(esta_activo=True).order_by('numero_interno')
    # Formateamos los datos como una lista de diccionarios que el JavaScript puede usar
    data = [{'id': v.id, 'text': f"{v.numero_interno} ({v.patente})"} for v in vehiculos]
    return JsonResponse(data, safe=False)





@login_required
def api_obtener_neumaticos_vehiculo(request, vehiculo_id):
    """
    Devuelve la configuración del tren motriz y los neumáticos 
    actualmente montados en un vehículo.
    """
    connection.set_tenant(request.tenant)
    vehiculo = get_object_or_404(Vehiculo, pk=vehiculo_id)
    
    # 1. Buscamos los neumáticos montados
    neumaticos_montados = Neumatico.objects.filter(
        vehiculo_montado=vehiculo, 
        estado='MONTADO'
    ).select_related('diseno', 'medida')

    data_neumaticos = []
    for n in neumaticos_montados:
        # Buscamos la última inspección para mostrar valores de referencia
        ultima_insp = n.historial_parametros.first()
        
        data_neumaticos.append({
            'id': n.id,
            'dot': n.dot,
            'posicion': n.posicion_montaje,
            'diseno': n.diseno.nombre,
            'psi_anterior': ultima_insp.presion_psi if ultima_insp else 0,
            'mm_anterior': float(ultima_insp.remanente_mm) if ultima_insp else 0.0,
        })

    # 2. Obtenemos la configuración visual (si el modelo tiene una)
    config_tren = "4x2" # Valor por defecto
    if vehiculo.modelo and vehiculo.modelo.tren_motriz_config:
        config_tren = vehiculo.modelo.tren_motriz_config.nombre_configuracion

    return JsonResponse({
        'status': 'ok',
        'configuracion': config_tren,
        'neumaticos': data_neumaticos
    })






@login_required
def crear_neumatico(request):
    if request.method == 'POST':
        # Crea una instancia del formulario y la llena con los datos del POST
        form = NeumaticoForm(request.POST)
        if form.is_valid():
            # Si el formulario es válido, procede a guardar
            medida_str = form.cleaned_data.get('nueva_medida') or form.cleaned_data.get('medida')
            medida_obj, _ = MedidaNeumatico.objects.get_or_create(medida=medida_str.strip())

            diseno_str = form.cleaned_data.get('nuevo_diseno') or form.cleaned_data.get('diseno')
            diseno_obj, _ = DisenoBanda.objects.get_or_create(nombre=diseno_str.strip())

            neumatico = form.save(commit=False)
            neumatico.medida = medida_obj
            neumatico.diseno = diseno_obj
            neumatico.save()
            messages.success(request, '¡Neumático registrado!')
            return redirect('inventario_neumaticos')
        # Si form.is_valid() es Falso, la ejecución continúa.
        # La variable 'form' ya contiene los datos y los errores.
    else:
        # Si es una petición GET, crea un formulario vacío
        form = NeumaticoForm()
        
    # Esta parte se ejecuta tanto para GET como para POST inválidos
    context = {'form': form, 'titulo': 'Registrar Nuevo Neumático'}
    return render(request, 'flota/neumaticos/form_neumatico.html', context)




@login_required
def crear_ruta(request):
    if request.method == 'POST':
        form = RutaForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Ruta creada con éxito.')
            return redirect('lista_rutas')
    else:
        form = RutaForm()
    return render(request, 'flota/ruta_form.html', {'form': form, 'titulo': 'Crear Nueva Ruta'})


@login_required
def detalle_neumatico(request, pk):
    connection.set_tenant(request.tenant)
    neumatico = get_object_or_404(Neumatico.objects.select_related('vehiculo_montado'), pk=pk)
    historial = neumatico.historial_parametros.select_related('inspector').all()

    # --- CÁLCULO DEL CPK ---
    cpk = None
    if neumatico.km_acumulados and neumatico.km_acumulados > 0 and neumatico.costo_inicial > 0:
        try:
            # Usamos Decimal para precisión
            cpk = neumatico.costo_inicial / Decimal(neumatico.km_acumulados)
        except:
            cpk = None
    # --- FIN DEL CÁLCULO ---

    if request.method == 'POST':
        if request.POST.get('accion') == 'montar_neumatico':
            form_montaje = MontarNeumaticoForm(request.POST, instance=neumatico)
            if form_montaje.is_valid():
                neumatico_montado = form_montaje.save(commit=False)
                neumatico_montado.estado = 'MONTADO'
                neumatico_montado.save()
                messages.success(request, f'¡Neumático {neumatico.dot} montado en el vehículo {neumatico_montado.vehiculo_montado.numero_interno}!')
                return redirect('detalle_neumatico', pk=neumatico.pk)
        else:
            form_historial = HistorialParametrosForm(request.POST)
            if form_historial.is_valid():
                nueva_inspeccion = form_historial.save(commit=False)
                nueva_inspeccion.neumatico = neumatico
                nueva_inspeccion.inspector = request.user
                nueva_inspeccion.save()
                messages.success(request, '¡Inspección registrada con éxito!')
                return redirect('detalle_neumatico', pk=neumatico.pk)

    form_historial = HistorialParametrosForm()
    form_montaje = MontarNeumaticoForm(instance=neumatico, initial={'fecha_montaje': timezone.now().date()})

    if neumatico.vehiculo_montado:
        form_historial.initial['km_vehiculo_inspeccion'] = neumatico.vehiculo_montado.kilometraje_actual

    context = {
        'neumatico': neumatico,
        'historial': historial,
        'form_historial': form_historial,
        'form_montaje': form_montaje,
        'cpk': cpk,  # <-- Pasamos el resultado del cálculo al template
    }
    return render(request, 'flota/neumaticos/detalle_neumatico.html', context)



# Importa TODAS tus herramientas desde ia_tools.py
from .ia_tools import ALL_TOOLS

logger = logging.getLogger(__name__)


# /opt/pulser_app/flota/views.py (Fragmento de la función)


@login_required
def detalle_vehiculo_combustible(request, pk):
    """
    Muestra la página de análisis detallado para un vehículo específico.
    """
    connection.set_tenant(request.tenant)
    vehiculo = get_object_or_404(Vehiculo.objects.select_related('modelo'), pk=pk)

    cargas_periodo = CargaCombustible.objects.filter(vehiculo=vehiculo)

    # --- 1. FILTRO DE PERIODO ---
    # (Por ahora es fijo a 90 días, luego lo podemos hacer dinámico)
    end_date = timezone.now()
    start_date = end_date - timedelta(days=90)

    # --- FILTRO POR CONDUCTOR (nuevo) ---
    conductor_username = request.GET.get('conductor')
    if conductor_username:
        cargas_periodo = cargas_periodo.filter(
            Q(conductor__username=conductor_username) |
            Q(conductor_auxiliar__username=conductor_username)
        )
    
    cargas_periodo = cargas_periodo.select_related('conductor', 'conductor_auxiliar','ruta').order_by('-fecha_carga')

    conductores = (
        User.objects.filter(
            Q(cargacombustible__vehiculo=vehiculo) |
            Q(cargacombustible__vehiculo=vehiculo)
        )
        .filter(is_active=True)
        .distinct()
        .order_by('first_name')
        )

    # --- 2. KPIs PRINCIPALES ---
    kpis = cargas_periodo.aggregate(
        rendimiento_avg=Avg('rendimiento_calculado_kml'),
        costo_total=Sum('costo_total_carga'),
        litros_total=Sum('litros_cargados'),
        km_max=Max('kilometraje_en_carga'),
        km_min=Min('kilometraje_en_carga')
    )
    distancia_recorrida = (kpis['km_max'] or 0) - (kpis['km_min'] or 0)
    costo_km = (kpis['costo_total'] or 0) / distancia_recorrida if distancia_recorrida > 0 else 0

    # --- 3. DATOS PARA GRÁFICOS ---
    
    # Gráfico 1: Evolución Mensual
    evolucion_mensual = CargaCombustible.objects.filter(vehiculo=vehiculo) \
        .annotate(month=TruncMonth('fecha_carga')) \
        .values('month') \
        .annotate(avg_rendimiento=Avg('rendimiento_calculado_kml')) \
        .order_by('month')[:6] # Últimos 6 meses
    
    # Gráfico 2: Comparativa de Rendimiento
    promedio_modelo = Vehiculo.objects.filter(modelo=vehiculo.modelo).aggregate(
        avg_rendimiento=Avg('cargas_combustible__rendimiento_calculado_kml')
    )['avg_rendimiento']
    promedio_flota = Vehiculo.objects.all().aggregate(
        avg_rendimiento=Avg('cargas_combustible__rendimiento_calculado_kml')
    )['avg_rendimiento']

    # Gráfico 3: Rendimiento por Conductor
    rendimiento_conductor = cargas_periodo.exclude(conductor__isnull=True) \
        .values('conductor__username') \
        .annotate(avg_rendimiento=Avg('rendimiento_calculado_kml')) \
        .order_by('-avg_rendimiento')
    
    # Rendimiento por conductor auxiliar
    rendimiento_auxiliar = cargas_periodo.exclude(conductor_auxiliar__isnull=True) \
        .values('conductor_auxiliar__username') \
        .annotate(avg_rendimiento=Avg('rendimiento_calculado_kml')) \
        .order_by('-avg_rendimiento')
    
    usernames = set(
        [d['conductor__username'] for d in rendimiento_conductor if d.get('conductor__username')]
        + [d['conductor_auxiliar__username'] for d in rendimiento_auxiliar if d.get('conductor_auxiliar__username')]
    )

    if conductor_username:
        usernames = [conductor_username]

    rendimiento_por_usuario = []
    for uname in usernames:
        agg = cargas_periodo.filter(
            Q(conductor__username=uname) | Q(conductor_auxiliar__username=uname)
        ).aggregate(avg_rendimiento=Avg('rendimiento_calculado_kml'))
        promedio = agg['avg_rendimiento'] or 0

        user = User.objects.filter(username=uname).first()
        if user:
            nombre_completo = f"{user.first_name} {user.last_name}".strip() or user.username
        else:
            nombre_completo = uname

        rendimiento_por_usuario.append({'username': nombre_completo, 'avg_rendimiento': float(promedio)})

    rendimiento_por_usuario.sort(key=lambda x: x['avg_rendimiento'], reverse=True)

    rendimiento_total = list(chain(rendimiento_conductor, rendimiento_auxiliar))
    rendimiento_total = sorted(rendimiento_total, key=lambda x: x['avg_rendimiento'] or 0, reverse=True)
    # Gráfico 4: Rendimiento por Ruta
    rendimiento_ruta = cargas_periodo.exclude(ruta__isnull=True) \
        .values('ruta__nombre') \
        .annotate(avg_rendimiento=Avg('rendimiento_calculado_kml')) \
        .order_by('-avg_rendimiento')

    context = {
        'vehiculo': vehiculo,
        'historial_cargas': cargas_periodo,
        'conductores': conductores,
        'kpis': {
            'rendimiento_avg': kpis['rendimiento_avg'],
            'costo_total': kpis['costo_total'],
            'litros_total': kpis['litros_total'],
            'costo_km': costo_km,
        },
        'charts_data': {
            'evolucion': {
                'labels': json.dumps([d['month'].strftime('%b %Y') for d in evolucion_mensual]),
                'data': json.dumps([float(d['avg_rendimiento'] or 0) for d in evolucion_mensual]),
            },
            'comparativa': {
                'data': json.dumps([
                    float(kpis['rendimiento_avg'] or 0), 
                    float(promedio_modelo or 0), 
                    float(promedio_flota or 0)
                ]),
            },
            'conductor': {
                'labels': json.dumps([d['username'] for d in rendimiento_por_usuario]),
                'data': json.dumps([d['avg_rendimiento'] for d in rendimiento_por_usuario]),
            },
            'ruta': {
                'labels': json.dumps([d['ruta__nombre'] for d in rendimiento_ruta]),
                'data': json.dumps([float(d['avg_rendimiento'] or 0) for d in rendimiento_ruta]),
            },
        }
    }
    return render(request, 'flota/detalle_vehiculo_combustible.html', context)



@login_required
@user_passes_test(es_supervisor_o_admin)
def editar_modelo_vehiculo(request, pk):
    """ Permite editar los objetivos de rendimiento de un modelo de vehículo específico. """
    connection.set_tenant(request.tenant)
    modelo = get_object_or_404(ModeloVehiculo, pk=pk)

    if request.method == 'POST':
        form = ModeloVehiculoRendimientoForm(request.POST, instance=modelo)
        if form.is_valid():
            form.save()
            messages.success(request, f'Los objetivos de rendimiento para el modelo "{modelo.nombre}" han sido actualizados.')
            return redirect('lista_modelos_vehiculo')
    else:
        form = ModeloVehiculoRendimientoForm(instance=modelo)

    context = {
        'form': form,
        'modelo': modelo,
        'full_width_content': True,
    }
    return render(request, 'flota/configuracion/modelo_form.html', context)




@login_required
def editar_neumatico(request, pk):
    neumatico = get_object_or_404(Neumatico, pk=pk)
    if request.method == 'POST':
        form = NeumaticoForm(request.POST, instance=neumatico)
        if form.is_valid():
            medida_str = form.cleaned_data.get('nueva_medida') or form.cleaned_data.get('medida')
            medida_obj, _ = MedidaNeumatico.objects.get_or_create(medida=medida_str.strip())

            diseno_str = form.cleaned_data.get('nuevo_diseno') or form.cleaned_data.get('diseno')
            diseno_obj, _ = DisenoBanda.objects.get_or_create(nombre=diseno_str.strip())

            neumatico_editado = form.save(commit=False)
            neumatico_editado.medida = medida_obj
            neumatico_editado.diseno = diseno_obj
            neumatico_editado.save()
            messages.success(request, f'Neumático {neumatico.dot} actualizado.')
            return redirect('inventario_neumaticos')
    else:
        # Para la carga inicial (GET), seleccionamos los valores actuales
        form = NeumaticoForm(instance=neumatico, initial={
            'medida': neumatico.medida.medida,
            'diseno': neumatico.diseno.nombre
        })
    context = {'form': form, 'titulo': f'Editando Neumático: {neumatico.dot}'}
    return render(request, 'flota/neumaticos/form_neumatico.html', context)


# /opt/pulser_app/flota/views.py


@login_required
def editar_ruta(request, pk):
    ruta = get_object_or_404(Ruta, pk=pk)
    if request.method == 'POST':
        form = RutaForm(request.POST, instance=ruta)
        if form.is_valid():
            form.save()
            messages.success(request, 'Ruta actualizada con éxito.')
            return redirect('lista_rutas')
    else:
        form = RutaForm(instance=ruta)
    return render(request, 'flota/ruta_form.html', {'form': form, 'titulo': f'Editando Ruta: {ruta.nombre}'})


@login_required
@require_POST # <-- Esto asegura que solo se pueda acceder a la vista mediante un POST
def eliminar_carga_combustible(request, pk):
    """
    Elimina un registro de CargaCombustible y recalcula los rendimientos
    del vehículo afectado para mantener la consistencia de los datos.
    """
    connection.set_tenant(request.tenant)
    carga_a_eliminar = get_object_or_404(CargaCombustible, pk=pk)
    vehiculo_afectado = carga_a_eliminar.vehiculo

    # Guardamos el ID del vehículo para la redirección final
    vehiculo_id = vehiculo_afectado.id

    # Eliminamos la carga
    carga_a_eliminar.delete()

    # --- LÓGICA CRÍTICA DE RE-CÁLCULO ---
    # Obtenemos todas las cargas restantes del vehículo, ordenadas cronológicamente
    cargas_restantes = CargaCombustible.objects.filter(vehiculo=vehiculo_afectado).order_by('fecha_carga')

    # Primero, reseteamos todos los rendimientos a nulo
    cargas_restantes.update(rendimiento_calculado_kml=None)

    # Ahora, iteramos y recalculamos en orden
    for i in range(len(cargas_restantes) - 1):
        carga_actual = cargas_restantes[i]
        carga_siguiente = cargas_restantes[i+1]

        distancia = carga_siguiente.kilometraje_en_carga - carga_actual.kilometraje_en_carga
        litros = carga_actual.litros_cargados

        if distancia > 0 and litros > 0:
            rendimiento = Decimal(distancia) / litros
            # Actualizamos el rendimiento de la carga actual
            CargaCombustible.objects.filter(pk=carga_actual.pk).update(rendimiento_calculado_kml=rendimiento)

    messages.success(request, "Carga de combustible eliminada con éxito. Los rendimientos han sido recalculados.")
    return redirect('detalle_vehiculo_combustible', pk=vehiculo_id)


@login_required
def eliminar_ruta(request, pk):
    ruta = get_object_or_404(Ruta, pk=pk)
    if request.method == 'POST':
        ruta.delete()
        messages.warning(request, f'La ruta "{ruta.nombre}" ha sido eliminada.')
        return redirect('lista_rutas')
    # Si no es POST, simplemente redirige para evitar eliminaciones accidentales
    return redirect('lista_rutas')


@login_required
def export_vehiculos_csv(request):
    connection.set_tenant(request.tenant)

    response = HttpResponse(
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    response['Content-Disposition'] = 'attachment; filename="reporte_pizarra_mantenimiento.xlsx"'

    wb = Workbook()
    ws = wb.active
    ws.title = "Pizarra Mantenimiento"

    # --- HEADERS ---
    headers = [
        'N° Int.', 'PPU', 'Marca', 'Modelo', 'Interv. (KM)',
        'KM Últ. Mant.', 'F. Últ. Mant.', 'Tipo Mant.', 'Desviación',
        'Acum. Próx. Mat.', 'Mant. Vencido', 'Estatus', 'KM Actual',
        'KM/Día', 'KM Próx. Mant.', 'Tipo Próx. Mant.', 'Fecha Próx. Mant.'
    ]

    ws.append(headers)

    # Negrita en headers
    for cell in ws[1]:
        cell.font = Font(bold=True)

    # --- TU LÓGICA (la dejas EXACTAMENTE igual) ---
    config = ConfiguracionEmpresa.load()
    vehiculos_qs = Vehiculo.objects.filter(esta_activo=True).select_related('modelo', 'norma_euro').order_by('numero_interno')

    latest_ot_ids_subquery = OrdenDeTrabajo.objects.filter(
        vehiculo_id=OuterRef('id'),
        tipo='PREVENTIVA',
        estado='FINALIZADA'
    ).order_by('-kilometraje_cierre').values('id')[:1]

    vehiculos_con_latest_ot_id = vehiculos_qs.annotate(
        latest_ot_id=Subquery(latest_ot_ids_subquery, output_field=models.IntegerField())
    )

    latest_ot_pks = [v.latest_ot_id for v in vehiculos_con_latest_ot_id if v.latest_ot_id is not None]
    latest_ots_by_id = OrdenDeTrabajo.objects.filter(pk__in=latest_ot_pks).select_related('pauta_mantenimiento').in_bulk()
    ultima_ot_por_vehiculo_id = {ot.vehiculo_id: ot for ot in latest_ots_by_id.values()}

    all_pautas_rules = list(PautaMantenimiento.objects.select_related('modelo_vehiculo').order_by('modelo_vehiculo__nombre', 'kilometraje_inicial'))

    filtro_form = FiltroPizarraForm(request.GET or None)
    data_flota_completa = []
    today = timezone.now().date()
    INITIAL_PAUTA_NAMES = ['SI', 'R']

    # ⚠️ TODO tu loop queda igual (no lo repito para no hacerlo eterno)
    # SOLO cambia la escritura final 👇
    for vehiculo in vehiculos_con_latest_ot_id:
        km_actual = vehiculo.kilometraje_actual

        # --- NUEVA INICIALIZACIÓN DE DATOS, CON PRIORIDAD Y RESPALDO ---
        # 1. Intentamos obtener la información de la última OT preventiva (que la subconsulta nos trae)
        ultima_ot_preventiva_data = ultima_ot_por_vehiculo_id.get(vehiculo.pk)

        ot_km_ultimo_mant = ultima_ot_preventiva_data.kilometraje_cierre if ultima_ot_preventiva_data and ultima_ot_preventiva_data.kilometraje_cierre else None
        ot_fecha_ultimo_mant = ultima_ot_preventiva_data.fecha_cierre.date() if ultima_ot_preventiva_data and ultima_ot_preventiva_data.fecha_cierre else None
        ot_tipo_ultimo_mant = ultima_ot_preventiva_data.pauta_mantenimiento.nombre.split('-')[0] if ultima_ot_preventiva_data and ultima_ot_preventiva_data.pauta_mantenimiento else None

        # ESTE ES EL BLOQUE CORRECTO
        km_ultimo_mant_display = ot_km_ultimo_mant or vehiculo.km_ultima_mantencion
        fecha_ultimo_mant_display = ot_fecha_ultimo_mant or vehiculo.fecha_ultima_mantencion
        tipo_ultimo_mant_display = ot_tipo_ultimo_mant or vehiculo.nombre_ultima_pauta_aplicada
        # Ajustar si Coalesce devuelve None
        if km_ultimo_mant_display is None: km_ultimo_mant_display = 0
        if fecha_ultimo_mant_display is None: fecha_ultimo_mant_display = None
        if tipo_ultimo_mant_display is None: tipo_ultimo_mant_display = "N/A"

        # Diccionario de datos para el vehículo
        datos = {
            'vehiculo': vehiculo, 'marca': vehiculo.modelo.marca if vehiculo.modelo else 'N/A',
            'modelo': vehiculo.modelo.nombre if vehiculo.modelo else 'N/A',
            'km_ultimo_mant': km_ultimo_mant_display,
            'fecha_ultimo_mant': fecha_ultimo_mant_display,
            'tipo_ultimo_mant': tipo_ultimo_mant_display,
            'intervalo_km': vehiculo.intervalo_mantenimiento_km, 'km_prox_mant': None, 'kms_faltantes': None,
            'mant_vencido': None, 'estado': 'SIN_INFO', 'estatus_display': 'SIN INFORMACIÓN', 'tipo_prox_mant': 'N/A',
            'km_prom_dia': round(float(vehiculo.km_promedio_para_display or 0), 2), 'fecha_prox_mant': None, 'acum_prox_mat': None,
            'semaforo_10_dias': False,
            'desviacion_ult_mant': None, # Se recalculará más abajo si es posible
        }
        # --- FIN NUEVA INICIALIZACIÓN DE DATOS ---

        if not vehiculo.modelo:
            datos['estatus_display'] = 'MODELO NO ASIGNADO'
            data_flota_completa.append(datos)
            continue
        pautas_rules_del_modelo = [p for p in all_pautas_rules if p.modelo_vehiculo_id == vehiculo.modelo.id]
        if not pautas_rules_del_modelo:
            datos['estatus_display'] = 'PAUTAS NO DEFINIDAS'
            data_flota_completa.append(datos)
            continue

        # --- LÓGICA DE DESVIACIÓN ACTUALIZADA (usando los datos definitivos) ---
        km_realizado = datos['km_ultimo_mant']
        nombre_pauta_realizada_str = datos['tipo_ultimo_mant']

        regla_pauta_realizada = next((r for r in pautas_rules_del_modelo if r.nombre.split('-')[0] == nombre_pauta_realizada_str), None)

        if regla_pauta_realizada and km_realizado is not None and km_realizado > 0 and \
           regla_pauta_realizada.kilometraje_inicial is not None:

            km_inicial = regla_pauta_realizada.kilometraje_inicial
            intervalo1 = regla_pauta_realizada.intervalo_1_km
            intervalo2 = regla_pauta_realizada.intervalo_2_km
            hito_ideal = km_inicial

            if intervalo1 and intervalo1 > 0 and km_realizado >= km_inicial:
                if intervalo2 and intervalo2 > 0:
                    ciclo_completo = intervalo1 + intervalo2
                    if ciclo_completo > 0:
                        num_ciclos = (km_realizado - km_inicial) // ciclo_completo
                        km_base = km_inicial + num_ciclos * ciclo_completo
                        hito1, hito2 = km_base, km_base + intervalo1
                        hito_ideal = hito1 if abs(km_realizado - hito1) <= abs(km_realizado - hito2) else hito2
                    else:
                        hito_ideal = km_inicial
                else:
                    if intervalo1 > 0:
                        num_ciclos = (km_realizado - km_inicial) // intervalo1
                        hito_ideal = km_inicial + num_ciclos * intervalo1
                    else:
                        hito_ideal = km_inicial

            datos['desviacion_ult_mant'] = km_realizado - hito_ideal
        else:
            datos['desviacion_ult_mant'] = None
        # --- FIN LÓGICA DE DESVIACIÓN ACTUALIZADA ---

        pautas_iniciales = [p for p in pautas_rules_del_modelo if p.nombre.split('-')[0] in INITIAL_PAUTA_NAMES]
        max_km_inicial = max(p.kilometraje_inicial for p in pautas_iniciales) if pautas_iniciales else 0

        is_past_initial_phase = (datos['km_ultimo_mant'] > 0) or (km_actual > (max_km_inicial + 5000))

        secuencia, limite_km = [], km_actual + 500000
        for regla in pautas_rules_del_modelo:
            km_pauta = regla.kilometraje_inicial
            if km_pauta < limite_km: secuencia.append({'km': km_pauta, 'tipo': regla.nombre})
            if regla.intervalo_1_km:
                if km_pauta < km_actual:
                    if regla.intervalo_2_km:
                        ciclo = regla.intervalo_1_km + regla.intervalo_2_km
                        saltos = max(0, (km_actual - km_pauta) // ciclo)
                        km_pauta += saltos * ciclo
                    else:
                        saltos = max(0, (km_actual - km_pauta) // regla.intervalo_1_km)
                        km_pauta += saltos * regla.intervalo_1_km
                i1, i2 = regla.intervalo_1_km, regla.intervalo_2_km
                alt = True
                while km_pauta < limite_km:
                    if i2:
                        km_pauta += i1 if alt else i2
                        alt = not alt
                    else:
                        km_pauta += i1
                    if km_pauta < limite_km: secuencia.append({'km': km_pauta, 'tipo': regla.nombre})
        secuencia_ordenada = sorted(secuencia, key=lambda x: x['km'])
        pautas_vencidas = []
        km_inicio_busqueda = datos.get('km_ultimo_mant') or 0
        for pauta_posible in secuencia_ordenada:
            if km_inicio_busqueda < pauta_posible['km'] <= km_actual:
                nombre_pauta = pauta_posible['tipo'].split('-')[0]
                if nombre_pauta not in pautas_vencidas:
                    pautas_vencidas.append(nombre_pauta)

        if pautas_vencidas:
            datos['mantenimientos_vencidos_str'] = ", ".join(pautas_vencidas)

        prox_pauta = next((p for p in secuencia_ordenada if p['km'] > km_actual and not (is_past_initial_phase and p['tipo'].split('-')[0] in INITIAL_PAUTA_NAMES)), None)
        if prox_pauta:
            datos['km_prox_mant'], datos['tipo_prox_mant'] = prox_pauta['km'], prox_pauta['tipo'].split('-')[0]
        else:
            datos['tipo_prox_mant'] = "FIN DE PAUTA"

        # Acumulado próxima mantención
        if datos['km_ultimo_mant'] is not None:
            datos['acum_prox_mat'] = km_actual - datos['km_ultimo_mant']
        else:
            datos['acum_prox_mat'] = km_actual

        if isinstance(datos['acum_prox_mat'], (int, float)) and datos['intervalo_km']:
            datos['mant_vencido'] = datos['acum_prox_mat'] - datos['intervalo_km']

        if datos['km_prox_mant']: datos['kms_faltantes'] = datos['km_prox_mant'] - km_actual
        kms_faltantes, mant_vencido = datos.get('kms_faltantes'), datos.get('mant_vencido')
        umbral = (datos['intervalo_km'] * config.porcentaje_alerta_mantenimiento / 100.0) if datos['intervalo_km'] else 5000
        if (kms_faltantes is not None and kms_faltantes <= 0) or (mant_vencido is not None and mant_vencido > 0) or pautas_vencidas:
            datos['estado'], datos['estatus_display'] = 'VENCIDO', 'VENCIDO'
        elif kms_faltantes is not None and kms_faltantes <= umbral:
            datos['estado'], datos['estatus_display'] = 'PROXIMO', 'MANT. PRÓX.'
        else:
            datos['estado'], datos['estatus_display'] = 'NORMAL', 'NORMALIDAD'
        if datos['km_prom_dia'] > 0 and kms_faltantes and kms_faltantes > 0:
            dias = kms_faltantes / datos['km_prom_dia']
            datos['fecha_prox_mant'] = today + timedelta(days=round(dias))
        elif kms_faltantes is not None and kms_faltantes <= 0:
            datos['fecha_prox_mant'] = today
        if datos['fecha_prox_mant'] and 0 <= (datos['fecha_prox_mant'] - today).days <= 10:
            datos['semaforo_10_dias'] = True

        data_flota_completa.append(datos)

    # --- FILTROS ---
    data_flota_filtrada = data_flota_completa
    if filtro_form.is_valid():
        modelo_obj = filtro_form.cleaned_data.get('modelo')
        if modelo_obj:
            data_flota_filtrada = [d for d in data_flota_filtrada if d['vehiculo'].modelo_id == modelo_obj.id]

        if request.GET.get('proximos_alerta') == 'true':
            data_flota_filtrada = [d for d in data_flota_filtrada if d['estado'] == 'PROXIMO']

        tipo_mant = filtro_form.cleaned_data.get('tipo_mantenimiento')
        if tipo_mant and str(tipo_mant).strip().lower() not in ['', 'todos los tipos']:
            data_flota_filtrada = [d for d in data_flota_filtrada if d['tipo_prox_mant'] == tipo_mant]

    # --- ESCRIBIR FILAS ---
    for item in data_flota_filtrada:
        ws.append([
            item['vehiculo'].numero_interno,
            item['vehiculo'].patente,
            item['marca'],
            item['modelo'],
            item['intervalo_km'],
            item.get('km_ultimo_mant', ''),
            item.get('fecha_ultimo_mant'),
            item.get('tipo_ultimo_mant', 'N/A'),
            item.get('desviacion_ult_mant', ''),
            item.get('acum_prox_mat', ''),
            item.get('mant_vencido', ''),
            item.get('estatus_display', ''),
            item['vehiculo'].kilometraje_actual,
            item.get('km_prom_dia', ''),
            item.get('km_prox_mant', ''),
            item.get('tipo_prox_mant', ''),
            item.get('fecha_prox_mant')
        ])

    wb.save(response)
    return response




@login_required
def guardar_precio_combustible(request, pk=None):
    if request.method == 'POST':
        instance = get_object_or_404(PrecioCombustible, pk=pk) if pk else None
        form = PrecioCombustibleForm(request.POST, instance=instance)

        if form.is_valid():
            with transaction.atomic():
                nuevo = form.save(commit=False)

                fecha_inicio = nuevo.fecha_inicio

                #1. CERRAR REGISTRO ANTERIOR
                anterior = PrecioCombustible.objects.filter(
                    fecha_inicio__lt=fecha_inicio
                ).exclude(pk=nuevo.pk).order_by('-fecha_inicio').first()

                if anterior:
                    anterior.fecha_fin = fecha_inicio - timedelta(days=1)
                    anterior.save()

                #2. AJUSTAR REGISTROS FUTUROS (evitar solape)
                siguientes = PrecioCombustible.objects.filter(
                    fecha_inicio__gt=fecha_inicio
                ).exclude(pk=nuevo.pk).order_by('fecha_inicio')

                if siguientes.exists():
                    siguiente = siguientes.first()

                    # este nuevo no puede invadir al siguiente
                    if not nuevo.fecha_fin or nuevo.fecha_fin >= siguiente.fecha_inicio:
                        nuevo.fecha_fin = siguiente.fecha_inicio - timedelta(days=1)

                nuevo.save()

            return JsonResponse({'success': True})

        return JsonResponse({'success': False, 'errors': form.errors}, status=400)

    return JsonResponse({'success': False}, status=400)



@login_required
def historial_vehiculo(request, pk):
    connection.set_tenant(request.tenant)
    vehiculo = get_object_or_404(Vehiculo, pk=pk)
    ordenes = OrdenDeTrabajo.objects.filter(vehiculo=vehiculo).order_by('-fecha_creacion')
    context = {'vehiculo': vehiculo, 'ordenes': ordenes}
    return render(request, 'flota/historial_vehiculo.html', context)


@login_required
@user_passes_test(es_supervisor_o_admin) # Solo supervisores o admins pueden configurar
def lista_modelos_vehiculo(request):
    """ Muestra una lista de todos los modelos de vehículos para configurar sus rendimientos. """
    connection.set_tenant(request.tenant)
    modelos = ModeloVehiculo.objects.all().order_by('marca', 'nombre')
    context = {
        'modelos': modelos,
        'full_width_content': True,
    }
    return render(request, 'flota/configuracion/lista_modelos.html', context)



@login_required
def lista_precios_combustible(request):
    precios = PrecioCombustible.objects.all()
    form = PrecioCombustibleForm()
    return render(request, 'flota/precios_combustible.html', {
        'precios': precios,
        'form': form
    })



@login_required
def lista_rutas(request):
    rutas = Ruta.objects.all()
    return render(request, 'flota/lista_rutas.html', {'rutas': rutas})


@login_required
def obtener_precio_combustible(request, pk):
    precio = get_object_or_404(PrecioCombustible, pk=pk)
    return JsonResponse({
        'id': precio.id,
        'fecha_inicio': precio.fecha_inicio,
        'fecha_fin': precio.fecha_fin,
        'precio_por_litro': float(precio.precio_por_litro)
    })

def obtener_vehiculos_con_alertas():
    today = timezone.now().date()

    vehiculos_qs = Vehiculo.objects.filter(esta_activo=True).annotate(
        numero_interno_int=Cast('numero_interno', output_field=IntegerField())
    ).select_related('modelo', 'norma_euro')

    # Última OT preventiva finalizada
    latest_ot_subq = OrdenDeTrabajo.objects.filter(
        vehiculo_id=OuterRef('id'),
        tipo='PREVENTIVA',
        estado='FINALIZADA'
    ).order_by('-fecha_cierre', '-kilometraje_cierre').values('id')[:1]

    vehiculos = vehiculos_qs.annotate(
        latest_ot_id=Subquery(latest_ot_subq, output_field=IntegerField())
    )

    # Pre-cargar OTs
    latest_ot_pks = [v.latest_ot_id for v in vehiculos if v.latest_ot_id]
    ots = OrdenDeTrabajo.objects.filter(pk__in=latest_ot_pks).select_related('pauta_mantenimiento')
    ots_dict = {o.pk: o for o in ots}

    # Todas las reglas de pauta
    all_rules = list(PautaMantenimiento.objects.select_related('modelo_vehiculo'))

    data_alertas = []

    for v in vehiculos:
        ot = ots_dict.get(v.latest_ot_id)
        km_actual = v.kilometraje_actual

        # km última mantención
        if ot and ot.pauta_mantenimiento:
            km_ultimo = ot.kilometraje_cierre
        else:
            km_ultimo = v.km_ultima_mantencion

        datos = {
            "vehiculo": v,
            "km_actual": km_actual,
            "km_ultimo_mant": km_ultimo or 0,
            "estado": "NORMAL",
            "pauta_vencida": None,
            "pauta_proxima": None,
            "intervalo_usado": None,
        }

        # ------------ Encontrar pauta desde all_rules ------------
        pauta = next(
            (rule for rule in all_rules if rule.modelo_vehiculo_id == v.modelo_id),
            None
        )

        # Elegir intervalo:
        # 🔥 PRIORIDAD 1 → intervalo del vehículo
        # 🔥 PRIORIDAD 2 → frecuencia de la pauta
        if v.intervalo_mantenimiento_km:
            intervalo = v.intervalo_mantenimiento_km
        elif pauta and pauta.frecuencia_km:
            intervalo = pauta.frecuencia_km
        else:
            intervalo = None

        datos["intervalo_usado"] = intervalo

        # No hay forma de calcular si no hay intervalo ni km último
        if not intervalo or not km_ultimo:
            continue

        # ------ Lógica de vencimiento ------
        hito_ideal = round(km_ultimo / intervalo) * intervalo
        proximo_hito = hito_ideal + intervalo
        kms_restantes = proximo_hito - km_actual

        # VENCIDO
        if km_actual >= proximo_hito:
            datos["estado"] = "VENCIDO"
            datos["pauta_vencida"] = pauta.nombre if pauta else "Sin pauta asignada"

        # PRÓXIMO
        elif 0 < kms_restantes <= intervalo * 0.25:
            datos["estado"] = "PROXIMO"
            datos["pauta_vencida"] = pauta.nombre if pauta else "Sin pauta asignada"
            datos["pauta_proxima"] = pauta.nombre if pauta else "Sin pauta asignada"

        # Guardar solo vehículos con alerta
        if datos["estado"] in ("VENCIDO", "PROXIMO"):
            data_alertas.append(datos)

    return data_alertas


def obtener_vehiculos_con_alertasss():
    today = timezone.now().date()

    vehiculos_qs = Vehiculo.objects.filter(esta_activo=True).annotate(
        numero_interno_int=Cast('numero_interno', output_field=IntegerField())
    ).select_related('modelo', 'norma_euro')

    # Última OT preventiva finalizada
    latest_ot_subq = OrdenDeTrabajo.objects.filter(
        vehiculo_id=OuterRef('id'),
        tipo='PREVENTIVA',
        estado='FINALIZADA'
    ).order_by('-fecha_cierre', '-kilometraje_cierre').values('id')[:1]

    vehiculos = vehiculos_qs.annotate(
        latest_ot_id=Subquery(latest_ot_subq, output_field=IntegerField())
    )

    # Pre-cargar OTs
    latest_ot_pks = [v.latest_ot_id for v in vehiculos if v.latest_ot_id]
    ots = OrdenDeTrabajo.objects.filter(pk__in=latest_ot_pks).select_related('pauta_mantenimiento')
    ots_dict = {o.pk: o for o in ots}

    all_rules = list(PautaMantenimiento.objects.select_related('modelo_vehiculo'))
    data_alertas = []

    for v in vehiculos:
        ot = ots_dict.get(v.latest_ot_id)
        km_actual = v.kilometraje_actual

        if ot and ot.pauta_mantenimiento:
            km_ultimo = ot.kilometraje_cierre
            tipo = ot.pauta_mantenimiento.nombre.split('-')[0]
        else:
            km_ultimo = v.km_ultima_mantencion
            tipo = v.nombre_ultima_pauta_aplicada or "N/A"

        intervalo = v.intervalo_mantenimiento_km

        datos = {
            "vehiculo": v,
            "km_actual": km_actual,
            "km_ultimo_mant": km_ultimo or 0,
            "intervalo": intervalo,
            "estado": "NORMAL",
            "tipo_prox_mant": tipo,
        }

        if km_ultimo and intervalo:
            hito_ideal = round(km_ultimo / intervalo) * intervalo
            proximo_hito = hito_ideal + intervalo

            kms_restantes = proximo_hito - km_actual

            if km_actual >= proximo_hito:
                datos["estado"] = "VENCIDO"

            else:
                if 0 < kms_restantes <= (intervalo * 0.25):
                    datos["estado"] = "PROXIMO"

        if datos["estado"] in ("VENCIDO", "PROXIMO"):
            data_alertas.append(datos)

    return data_alertas


def obtener_vehiculos_con_mantencion_vencida_o_proxima_con_pauta():
    today = timezone.now().date()

    vehiculos_qs = Vehiculo.objects.filter(esta_activo=True).select_related('modelo')
    # precargar últimas OT preventivas finalizadas (como en tu dashboard)
    latest_ot_subq = OrdenDeTrabajo.objects.filter(
        vehiculo_id=OuterRef('id'),
        tipo='PREVENTIVA',
        estado='FINALIZADA'
    ).order_by('-fecha_cierre', '-kilometraje_cierre').values('id')[:1]

    vehiculos = vehiculos_qs.annotate(
        latest_ot_id=Subquery(latest_ot_subq, output_field=IntegerField())
    )

    latest_ot_pks = [v.latest_ot_id for v in vehiculos if v.latest_ot_id]
    ots = OrdenDeTrabajo.objects.filter(pk__in=latest_ot_pks).select_related('pauta_mantenimiento')
    ots_dict = {o.pk: o for o in ots}

    # todas las pautas (pre-cargadas)
    all_pautas = list(PautaMantenimiento.objects.select_related('modelo_vehiculo').order_by('modelo_vehiculo__nombre', 'kilometraje_inicial'))

    resultados = []

    for v in vehiculos:
        ot = ots_dict.get(v.latest_ot_id)
        km_actual = v.kilometraje_actual or 0

        # km último según OT o vehículo (igual que en dashboard)
        ot_km_ultimo = ot.kilometraje_cierre if ot and ot.kilometraje_cierre else None
        km_ultimo_mant_display = ot_km_ultimo if ot_km_ultimo is not None else v.km_ultima_mantencion
        if km_ultimo_mant_display is None:
            km_ultimo_mant_display = 0

        # obtener pautas del modelo (y por tipo de aceite si aplica) tal como hace dashboard_flota
        pautas_rules_del_modelo = [p for p in all_pautas if p.modelo_vehiculo_id == (v.modelo.id if v.modelo else None) and getattr(p, 'tipo_aceite', None) == getattr(v, 'tipo_aceite', None)]
        if not pautas_rules_del_modelo:
            pautas_rules_del_modelo = [p for p in all_pautas if p.modelo_vehiculo_id == (v.modelo.id if v.modelo else None)]
        if not pautas_rules_del_modelo:
            # sin pautas definidas, no podemos calcular
            continue

        # --- Generar la secuencia de pautas (secuencia_orig que usa dashboard_flota) ---
        secuencia_orig = []
        limite_km_orig = km_actual + 500000
        for regla in pautas_rules_del_modelo:
            km_pauta = regla.kilometraje_inicial
            if km_pauta is None:
                continue
            if km_pauta < limite_km_orig:
                secuencia_orig.append({'km': km_pauta, 'tipo': regla.nombre, 'regla': regla})
            if getattr(regla, 'intervalo_1_km', None):
                # Llevar km_pauta a la posición más próxima menor o igual a km_actual
                if km_pauta < km_actual:
                    if getattr(regla, 'intervalo_2_km', None):
                        ciclo = regla.intervalo_1_km + regla.intervalo_2_km
                        saltos = max(0, (km_actual - km_pauta) // ciclo) if ciclo > 0 else 0
                        km_pauta += saltos * ciclo
                    else:
                        saltos = max(0, (km_actual - km_pauta) // regla.intervalo_1_km) if regla.intervalo_1_km > 0 else 0
                        km_pauta += saltos * regla.intervalo_1_km

                i1, i2 = regla.intervalo_1_km, regla.intervalo_2_km
                alt = True
                while km_pauta < limite_km_orig:
                    if i2:
                        km_pauta += i1 if alt else i2
                        alt = not alt
                    else:
                        km_pauta += i1
                    if km_pauta < limite_km_orig:
                        secuencia_orig.append({'km': km_pauta, 'tipo': regla.nombre, 'regla': regla})

        # normalizar y ordenar (el dashboard elimina duplicados tomando el más largo)
        # crear dict por km para evitar duplicados y luego ordenar
        seq_dict = {}
        for item in secuencia_orig:
            # si existe una entrada para ese km, prioriza el nombre más largo (como en tu código)
            existing = seq_dict.get(item['km'])
            if not existing or len(item['tipo']) > len(existing['tipo']):
                seq_dict[item['km']] = item
        secuencia_ordenada_orig = sorted(seq_dict.values(), key=lambda x: x['km'])

        # detectar si estamos en fase posterior a inicial (usa lógica del dashboard)
        INITIAL_PAUTA_NAMES = ['SI', 'R']
        pautas_iniciales_orig = [p for p in pautas_rules_del_modelo if p.nombre.split('-')[0] in INITIAL_PAUTA_NAMES]
        max_km_inicial_orig = max(p.kilometraje_inicial for p in pautas_iniciales_orig) if pautas_iniciales_orig else 0
        is_past_initial_phase_orig = (km_ultimo_mant_display > 0) or (km_actual > (max_km_inicial_orig + 5000))

        # -------------------
        # DETECTAR VENCIDAS
        # -------------------
        # reproduzco exactamente: km_inicio_busqueda = km_actual - datos.get('mant_vencido')
        # Need to compute mant_vencido as in dashboard_flota:
        mant_vencido = None
        try:
            intervalo_calc = v.intervalo_mantenimiento_km
            km_ultimo_calc = km_ultimo_mant_display
            if isinstance(km_ultimo_calc, (int, float)) and isinstance(intervalo_calc, (int, float)) and intervalo_calc > 0:
                km_ultimo_mant_redondeado = round(km_ultimo_calc / intervalo_calc) * intervalo_calc
                resultado = km_actual - km_ultimo_mant_redondeado - intervalo_calc
                if resultado > 0:
                    mant_vencido = resultado
        except Exception:
            mant_vencido = None

        pauta_vencida_nombre = None
        pauta_vencida_km = None
        if mant_vencido and km_actual and mant_vencido > 0:
            km_inicio_busqueda = km_actual - mant_vencido
            vencidas = []
            for item in secuencia_ordenada_orig:
                km_pauta = item['km']
                if is_past_initial_phase_orig and item.get('regla') and ('INICIAL' in (getattr(item['regla'], 'tipo_aplicacion', '') or '').upper()):
                    # saltar pautas iniciales si corresponde
                    continue
                if km_inicio_busqueda <= km_pauta <= km_actual:
                    vencidas.append(item)
            if vencidas:
                # elegir la más cercana a km_actual (mayor km)
                last = max(vencidas, key=lambda x: x['km'])
                pauta_vencida_nombre = last['tipo']
                pauta_vencida_km = last['km']

        # -------------------
        # DETECTAR PRÓXIMA
        # -------------------
        pauta_proxima_nombre = None
        pauta_proxima_km = None
        prox = next(
            (p for p in secuencia_ordenada_orig if p['km'] > km_actual and not (is_past_initial_phase_orig and p['tipo'].split('-')[0].strip() in INITIAL_PAUTA_NAMES)),
            None
        )
        if prox:
            pauta_proxima_nombre = prox['tipo']
            pauta_proxima_km = prox['km']

        # -------------------
        # DECIDIR qué devolver:
        # si hay pauta_vencida -> VENCIDO (prioridad)
        # else si hay pauta_proxima dentro del umbral usado en dashboard -> PROXIMO
        # else saltar
        if pauta_vencida_nombre:
            resultados.append({
                "vehiculo": v,
                "estado": "VENCIDO",
                "km_actual": km_actual,
                "km_mantencion": pauta_vencida_km,
                "pauta_nombre": pauta_vencida_nombre
            })
            continue

        # Para próxima, aplicamos la misma regla de umbral que hace dashboard_v2:
        intervalo_v2 = v.intervalo_mantenimiento_km
        km_ultimo_v2 = km_ultimo_mant_display
        if isinstance(km_ultimo_v2, (int, float)) and isinstance(intervalo_v2, (int, float)) and intervalo_v2 > 0:
            hito_ideal = round(km_ultimo_v2 / intervalo_v2) * intervalo_v2
            proximo_hito_vencimiento = hito_ideal + intervalo_v2
            if not (km_ultimo_v2 > (proximo_hito_vencimiento - (intervalo_v2 * 0.1)) and km_ultimo_v2 <= proximo_hito_vencimiento):
                umbral_alerta = intervalo_v2 * 0.25
                kms_faltantes_para_hito = proximo_hito_vencimiento - km_actual
                if 0 < kms_faltantes_para_hito <= umbral_alerta:
                    # si prox_pauta detectada por secuencia existe, usarla; si no, fallback al proximo_hito_vencimiento
                    if pauta_proxima_nombre:
                        resultados.append({
                            "vehiculo": v,
                            "estado": "PROXIMO",
                            "km_actual": km_actual,
                            "km_mantencion": pauta_proxima_km,
                            "pauta_nombre": pauta_proxima_nombre
                        })
                    else:
                        resultados.append({
                            "vehiculo": v,
                            "estado": "PROXIMO",
                            "km_actual": km_actual,
                            "km_mantencion": proximo_hito_vencimiento,
                            "pauta_nombre": pauta_proxima_nombre or (pautas_rules_del_modelo[0].nombre if pautas_rules_del_modelo else None)
                        })
                    continue

    return resultados


@login_required
def registrar_carga_combustible(request):
    """
    Procesa el formulario para registrar una nueva carga de combustible.
    """
    if request.method == 'POST':
        form = CargaCombustibleForm(request.POST)
        if form.is_valid():
            nueva_carga = form.save(commit=False)
            if not nueva_carga.conductor:
                nueva_carga.conductor = request.user
            nueva_carga.save()
            messages.success(request, f"Carga de combustible para {nueva_carga.vehiculo.numero_interno} registrada con éxito.")
        else:
            for field, errors in form.errors.items():
                for error in errors:
                    messages.error(request, f"Error en '{field}': {error}")
    
    return redirect('dashboard_combustible')

# ... (tus otros imports se mantienen igual) ...
from django.db.models import Max, Min # <-- AÑADE ESTOS DOS NUEVOS IMPORTS


@login_required
# Opcional: Restringe quién puede reactivar vehículos. Solo administradores es lo más seguro.
# @user_passes_test(lambda u: u.is_superuser or u.groups.filter(name='Administrador').exists())
def vehiculo_activate(request, pk):
    connection.set_tenant(request.tenant) # NO OLVIDES ESTA LÍNEA en todas tus vistas

    if request.method == 'POST':
        vehiculo = get_object_or_404(Vehiculo, pk=pk)
        vehiculo.esta_activo = True  # ¡El cambio clave!
        vehiculo.save()
        messages.success(request, f'El vehículo {vehiculo.patente} ha sido reactivado y vuelve al dashboard principal.')
        return redirect('dashboard_flota') # Redirige al dashboard principal después de reactivar
    # Si la petición no es POST, o hay algún error, simplemente redirige de vuelta a la lista de archivados
    return redirect('vehiculo_archived_list')





@login_required
def vehiculo_archive(request, pk):
    if request.method == 'POST':
        vehiculo = get_object_or_404(Vehiculo, pk=pk)
        vehiculo.esta_activo = False
        vehiculo.save()
        messages.warning(request, f'El vehículo {vehiculo.patente} ha sido archivado.')
    return redirect('dashboard')


@login_required
# Opcional: Si quieres restringir quién puede ver esta lista, descomenta y ajusta los decoradores.
# Por ejemplo, para que solo administradores o supervisores puedan verla:
# @user_passes_test(lambda u: u.is_superuser or u.groups.filter(name__in=['Administrador', 'Supervisor']).exists())
def vehiculo_archived_list(request):
    connection.set_tenant(request.tenant)

    # Filtra para obtener SOLO los vehículos que NO están activos
    archived_vehicles = Vehiculo.objects.filter(esta_activo=False).order_by('numero_interno')

    context = {
        'archived_vehicles': archived_vehicles,
        'full_width_content': True, # Si quieres que esta página sea de ancho completo
        'tenant_name': request.tenant.nombre, # Para mostrar el nombre del inquilino en el título
    }
    return render(request, 'flota/vehiculo_archived_list.html', context)



@login_required
# @user_passes_test(es_administrador)
def vehiculo_create(request):
    if request.method == 'POST':
        form = VehiculoCreateForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, '¡Vehículo creado con éxito!')
            return redirect('dashboard')
    else:
        form = VehiculoCreateForm()

    context = {
        'form': form,
        'titulo': 'Crear Nuevo Vehículo'
    }
    return render(request, 'flota/vehiculo_form.html', context)


@login_required
@user_passes_test(es_administrador) # Solo los administradores pueden eliminar
@require_POST
def vehiculo_delete(request, pk):
    """
    Elimina un vehículo y todo su historial de forma permanente.
    ACCIÓN DE ALTO RIESGO Y SOLO PARA DESARROLLO/ADMIN.
    """
    connection.set_tenant(request.tenant)
    vehiculo = get_object_or_404(Vehiculo, pk=pk)

    patente_vehiculo = vehiculo.patente
    vehiculo.delete() # La línea que borra todo en cascada

    messages.error(request, f'El vehículo {patente_vehiculo} y todo su historial han sido ELIMINADOS PERMANENTEMENTE.')
    return redirect('dashboard_flota')




@login_required
def vehiculo_update(request, pk):
    vehiculo = get_object_or_404(Vehiculo, pk=pk)

    # LÍNEAS NUEVAS A AGREGAR: Calculamos el KM/día promedio para este vehículo
    # Este valor es para *mostrarlo* en el formulario como referencia, no para editarlo directamente.
    # Asegúrate de que el método 'calcular_km_por_dia_promedio()' exista en tu modelo Vehiculo.
    km_dia_calculado = vehiculo.calcular_km_por_dia_promedio()
    print('========================================')
    print(vehiculo.fecha_ultima_mantencion)

    if request.method == 'POST':
        form = VehiculoUpdateForm(request.POST, instance=vehiculo)
        if form.is_valid():
            print('=========================== esto es form')
            print(form)
            form.save()
            messages.success(request, '¡Vehículo actualizado con éxito!')
            return redirect('dashboard')
        # Si el formulario no es válido, el contexto se construirá con el formulario y los datos ya calculados.
    else:
        form = VehiculoUpdateForm(instance=vehiculo)

    context = {
        'form': form,
        'titulo': f'Editando Vehículo: {vehiculo.patente}',
        # LÍNEA NUEVA: Pasamos el valor calculado al contexto del template.
        'km_dia_calculado': round(km_dia_calculado, 2) if km_dia_calculado is not None else 'N/A'
    }
    return render(request, 'flota/vehiculo_form.html', context)







################################################################################
# --- ADMINISTRACION USUARIOS RRHH ---
################################################################################

@login_required
def api_empresas_cargos(request):
    empresas = list(Empresa.objects.values('id', 'nombre'))
    cargos = list(
        Cargo.objects.select_related('departamento')
        .values(
            'id',
            'nombre',
            'departamento__nombre'
        )
    )

    return JsonResponse({
        'empresas': empresas,
        'cargos': cargos
    })


########## CARGO ##################

@login_required
def api_usuario_details(request, user_id):
    """
    API para obtener los detalles completos de un usuario para el modal.
    """
    try:
        user = User.objects.select_related('personal__empresa', 'personal__cargo__departamento').get(pk=user_id)
        personal = user.personal

        # Preparamos los datos en formato JSON
        data = {
            'id': user.id,
            'username': user.username,
            'nombre': personal.nombre,
            'apellido_paterno': personal.apellido_paterno,
            'apellido_materno': personal.apellido_materno,
            'rut': personal.rut,
            'estado': personal.estado,
            'empresa': personal.empresa.id if personal.empresa else '',
            'cargo': personal.cargo.id if personal.cargo else '',
            'departamento': personal.cargo.departamento.nombre if personal.cargo and personal.cargo.departamento else '',
            'sueldo_base': f"{personal.sueldo_base:.0f}",
            'valor_hora_normal': f"{personal.valor_hora_normal:.0f}",
            'valor_hora_extra': f"{personal.valor_hora_extra:.0f}",
            'firma_jpg': personal.firma_jpg.url if personal.firma_jpg else None,
            'rol': personal.rol,
            'password': user.password
        }
        return JsonResponse(data)
    except User.DoesNotExist:
        return JsonResponse({'error': 'Usuario no encontrado'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)



@login_required
@user_passes_test(es_supervisor_o_admin)
def api_usuario_update(request, user_id):
    """
    API para actualizar los datos de un usuario desde el modal.
    """
    if request.method == 'POST':
        try:
            user = User.objects.get(pk=user_id)
            personal = user.personal

            personal.nombre = request.POST.get('nombre', personal.nombre)
            personal.apellido_paterno = request.POST.get('apellido_paterno', personal.apellido_paterno)
            personal.apellido_materno = request.POST.get('apellido_materno', personal.apellido_materno)
            personal.rut = request.POST.get('rut', personal.rut)
            personal.estado = request.POST.get('estado', personal.estado)

            # archivo
            if 'firma_jpg' in request.FILES:
                personal.firma_jpg = request.FILES['firma_jpg']

            personal.sueldo_base = request.POST.get('sueldo_base') or personal.sueldo_base
            personal.valor_hora_normal = request.POST.get('valor_hora_normal') or personal.valor_hora_normal
            personal.valor_hora_extra = request.POST.get('valor_hora_extra') or personal.valor_hora_extra
            personal.rol = request.POST.get('rol') or personal.rol

            empresa_id = request.POST.get('empresa')
            cargo_id = request.POST.get('cargo')
            password = request.POST.get('password')

            if empresa_id:
                personal.empresa_id = empresa_id

            if cargo_id:
                personal.cargo_id = cargo_id

            if password:
                user.set_password(password)
                user.save()

            personal.save()

            return JsonResponse({'status': 'ok', 'message': 'Usuario actualizado correctamente'})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    
    return JsonResponse({'error': 'Método no permitido'}, status=405)






@login_required
def cargo_create(request):
    if request.method == "POST":
        form = CargoForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Cargo creado correctamente")
            return redirect("cargo_list")
    else:
        form = CargoForm()

    return render(request, "flota/administracion/cargo_form.html", {
        "form": form,
        "titulo": "Crear Cargo"
    })



@login_required
def cargo_edit(request, pk):
    cargo = get_object_or_404(Cargo, pk=pk)

    if request.method == "POST":
        form = CargoForm(request.POST, instance=cargo)
        if form.is_valid():
            form.save()
            messages.success(request, "Cargo actualizado correctamente")
            return redirect("cargo_list")
    else:
        form = CargoForm(instance=cargo)

    return render(request, "flota/administracion/cargo_form.html", {
        "form": form,
        "titulo": "Editar Cargo"
    })



@login_required
def cargo_list(request):
    cargos = Cargo.objects.select_related("departamento").all()
    return render(request, "flota/administracion/cargo_list.html", {
        "cargos": cargos
    })



@login_required
@user_passes_test(puede_modificar_datos)
def crear_contrato(request):
    """Gestiona la creación de un nuevo contrato. Protegida."""
    if request.method == 'POST':
        form = ContratoForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, '¡Contrato creado con éxito!')
            return redirect('lista_contratos')
    else:
        form = ContratoForm()
    
    context = {
        'form': form, 
        'titulo': 'Crear Nuevo Contrato',
        'full_width_content': True
    }
    return render(request, 'flota/administracion/contrato_form.html', context)


@login_required
@user_passes_test(es_administrador)
def crear_pauta(request):
    connection.set_tenant(request.tenant)
    if request.method == 'POST':
        form = PautaMantenimientoForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            messages.success(request, '¡Pauta de mantenimiento creada con éxito!')
            return redirect('lista_pautas')
    else:
        form = PautaMantenimientoForm()

    context = {
        'form': form,
        'titulo': 'Crear Nueva Pauta de Mantenimiento'
    }
    return render(request, 'flota/administracion/pauta_form.html', context)


@login_required
@user_passes_test(es_administrador)
def crear_tipo_pausa(request):
    connection.set_tenant(request.tenant)
    if request.method == 'POST':
        form = TipoPausaForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, '¡Tipo de pausa creado con éxito!')
            return redirect('lista_tipos_pausa')
    else:
        form = TipoPausaForm()

    context = {
        'form': form,
        'titulo': 'Crear Nuevo Tipo de Pausa'
    }
    return render(request, 'flota/administracion/tipo_pausa_form.html', context)


@login_required
@user_passes_test(es_supervisor_o_admin)
def crear_usuario(request):
    """
    Gestiona la creación de un nuevo usuario (User) y su perfil (Personal).
    """
    connection.set_tenant(request.tenant)

    if request.method == 'POST':
        form = UsuarioCreacionForm(request.POST, request.FILES)
        if form.is_valid():
            try:
                with transaction.atomic():
                    # Obtenemos los datos limpios del formulario
                    username = form.cleaned_data['username']
                    password = form.cleaned_data['password']
                    email = form.cleaned_data['email']
                    first_name = form.cleaned_data['first_name']
                    last_name = form.cleaned_data['last_name']
                    grupo = form.cleaned_data['grupo']
                    firma_jpg = form.cleaned_data['firma_jpg']
                    rut = form.cleaned_data['rut']
                    empresa = form.cleaned_data['empresa']
                    cargo = form.cleaned_data['cargo']

                    # 1. Creamos el nuevo usuario (User)
                    nuevo_usuario = User.objects.create_user(
                        username=username,
                        password=password,
                        email=email,
                        first_name=first_name,
                        last_name=last_name
                    )

                    # 2. Creamos el perfil de Personal asociado
                    # El RUT es un campo obligatorio y único. Usaremos un placeholder.
                    # El usuario deberá editarlo después.
                    rol_map = {
                        'Administrador': 'ADMINISTRADOR',
                        'Supervisor': 'SUPERVISOR',
                        'Mecánico': 'MECANICO',
                        'Asistente': 'ASISTENTE'
                    }
                    rol_personal = rol_map.get(grupo.name, 'ASISTENTE')

                    Personal.objects.create(
                        user=nuevo_usuario,
                        nombre=nuevo_usuario.get_full_name(),
                        rut=rut,
                        rol=rol_personal,
                        firma_jpg=firma_jpg,
                        empresa=empresa,
                        cargo=cargo
                        
                    )
                    # El método .save() del modelo Personal se encarga de asignar el grupo,
                    # por lo que la línea 'nuevo_usuario.groups.add(grupo)' ya no es necesaria aquí.

                    messages.success(request, f'Usuario "{username}" creado con éxito. Por favor, edítelo para agregar el RUT correcto.')
                    return redirect('lista_usuarios')

            except Exception as e:
                # Si el usuario ya existe, Django levanta una excepción. La mostramos amigablemente.
                messages.error(request, f'Ocurrió un error al crear el usuario: {e}')

    else: # Si es una petición GET
        form = UsuarioCreacionForm()

    context = {
        'form': form
    }
    return render(request, 'flota/administracion/crear_usuario.html', context)


@login_required
@user_passes_test(puede_modificar_datos)
def editar_contrato(request, pk):
    """Gestiona la edición de un contrato existente. Protegida."""
    contrato = get_object_or_404(Contrato, pk=pk)
    if request.method == 'POST':
        form = ContratoForm(request.POST, instance=contrato)
        if form.is_valid():
            form.save()
            messages.success(request, '¡Contrato actualizado con éxito!')
            return redirect('lista_contratos')
    else:
        form = ContratoForm(instance=contrato)

    context = {
        'form': form, 
        'titulo': f'Editando Contrato: {contrato.nombre}',
        'full_width_content': True
    }
    return render(request, 'flota/administracion/contrato_form.html', context)


@login_required
@user_passes_test(es_administrador)
def editar_pauta(request, pk):
    connection.set_tenant(request.tenant)
    pauta = get_object_or_404(PautaMantenimiento, pk=pk)
    if request.method == 'POST':
        form = PautaMantenimientoForm(request.POST, request.FILES, instance=pauta)
        if form.is_valid():
            form.save()
            messages.success(request, '¡Pauta de mantenimiento actualizada con éxito!')
            return redirect('lista_pautas')
    else:
        form = PautaMantenimientoForm(instance=pauta)

    context = {
        'form': form,
        'titulo': f'Editando Pauta: {pauta.nombre} para {pauta.modelo_vehiculo.nombre}'
    }
    return render(request, 'flota/administracion/pauta_form.html', context)





@login_required
@user_passes_test(es_administrador)
def editar_tipo_pausa(request, pk):
    connection.set_tenant(request.tenant)
    tipo_pausa = get_object_or_404(TipoPausa, pk=pk)
    if request.method == 'POST':
        form = TipoPausaForm(request.POST, instance=tipo_pausa)
        if form.is_valid():
            form.save()
            messages.success(request, '¡Tipo de pausa actualizado con éxito!')
            return redirect('lista_tipos_pausa')
    else:
        form = TipoPausaForm(instance=tipo_pausa)

    context = {
        'form': form,
        'titulo': f'Editando: {tipo_pausa.nombre}'
    }
    return render(request, 'flota/administracion/tipo_pausa_form.html', context)


@login_required
@user_passes_test(es_supervisor_o_admin) # Solo supervisores y admins pueden editar
def editar_usuario(request, user_id):
    """
    Gestiona la edición de los datos y el rol de un usuario existente.
    """
    connection.set_tenant(request.tenant)
    # Buscamos solo usuarios "completos" que son editables
    usuario_a_editar = get_object_or_404(User, pk=user_id, is_superuser=False, personal__isnull=False)

    if request.method == 'POST':
        # Pasamos `instance=usuario_a_editar` para que el formulario sepa que estamos editando
        form = UsuarioEdicionForm(request.POST, request.FILES, instance=usuario_a_editar)
        if form.is_valid():
            try:
                with transaction.atomic():
                    # El form.save() ya actualiza los campos básicos si está bien configurado.
                    # Pero para ser explícitos:
                    usuario_a_editar.first_name = form.cleaned_data['first_name']
                    usuario_a_editar.last_name = form.cleaned_data['last_name']
                    usuario_a_editar.email = form.cleaned_data['email']
                    usuario_a_editar.firma_jpg = form.cleaned_data['firma_jpg']
                    usuario_a_editar.password = form.cleaned_data['password']
                    usuario_a_editar.save()

                    # Actualizamos el grupo (rol)
                    grupo_nuevo = form.cleaned_data['grupo']

                    # Y actualizamos el rol en el modelo Personal
                    rol_map = {
                        'Administrador': 'ADMINISTRADOR',
                        'Supervisor': 'SUPERVISOR',
                        'Mecánico': 'MECANICO',
                        'Asistente': 'ASISTENTE'
                    }
                    rol_personal_nuevo = rol_map.get(grupo_nuevo.name, 'ASISTENTE')

                    # El .save() del modelo Personal se encarga de actualizar el grupo en el modelo User
                    personal_obj = usuario_a_editar.personal
                    personal_obj.rol = rol_personal_nuevo
                    personal_obj.save()

                    messages.success(request, f'Usuario "{usuario_a_editar.username}" actualizado con éxito.')
                    return redirect('lista_usuarios')

            except Exception as e:
                messages.error(request, f'Ocurrió un error al editar el usuario: {e}')

    else: # Si es una petición GET
        # Pre-poblamos el formulario con los datos actuales del usuario
        initial_data = {
            'first_name': usuario_a_editar.first_name,
            'last_name': usuario_a_editar.last_name,
            'email': usuario_a_editar.email,
            'grupo': usuario_a_editar.groups.first(), # Obtenemos el primer grupo del usuario
            'password': usuario_a_editar.password
        }
        form = UsuarioEdicionForm(initial=initial_data)

    context = {
        'form': form,
        'usuario_a_editar': usuario_a_editar
    }
    return render(request, 'flota/administracion/editar_usuario.html', context)


# REEMPLAZA ESTA FUNCIÓN COMPLETA EN /opt/pulser_app/flota/views.py

from .models import Personal # Asegúrate de importar el modelo Personal


@login_required
@user_passes_test(puede_modificar_datos)
@require_POST
def eliminar_contrato(request, pk):
    """Gestiona la eliminación de un contrato. Protegida."""
    contrato = get_object_or_404(Contrato, pk=pk)
    contrato.delete()
    messages.warning(request, f'El contrato "{contrato.nombre}" ha sido eliminado.')
    return redirect('lista_contratos')




@login_required
@user_passes_test(es_administrador)
def eliminar_tipo_pausa(request, pk):
    connection.set_tenant(request.tenant)
    tipo_pausa = get_object_or_404(TipoPausa, pk=pk)
    if request.method == 'POST':
        nombre_pausa = tipo_pausa.nombre
        tipo_pausa.delete()
        messages.warning(request, f'El tipo de pausa "{nombre_pausa}" ha sido eliminado.')
    return redirect('lista_tipos_pausa')






@login_required
def generar_cargo_personal_pdf(request, pk):
    """
    Genera un PDF con el "Folio de Cargo de Personal", listando los insumos
    y repuestos asignados a una OT para la firma del técnico.
    """
    connection.set_tenant(request.tenant)

    ot = get_object_or_404(OrdenDeTrabajo.objects.select_related(
        'vehiculo',
        'responsable'
    ).prefetch_related(
        'detalles_insumos_ot__repuesto_inventario',
        'detalles_insumos_ot__insumo'
    ), pk=pk)

    context = {
        'ot': ot,
        'fecha_impresion': timezone.now()
    }
    html_string = render_to_string('flota/ot_cargo_personal_pdf_template.html', context)

    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'inline; filename="Cargo-Personal-OT-{ot.folio}.pdf"'

    HTML(string=html_string, base_url=request.build_absolute_uri()).write_pdf(response)

    return response


@login_required
def lista_contratos(request):
    """
    Muestra la lista de contratos. 
    Esta vista es de solo lectura por defecto, no necesita protección.
    """
    contratos = Contrato.objects.all()
    context = {
        'contratos': contratos,
        'full_width_content': True
    }
    return render(request, 'flota/administracion/lista_contratos.html', context)


@login_required
@user_passes_test(es_administrador)
def lista_pautas(request):
    connection.set_tenant(request.tenant)
    # Volvemos a la versión original que usaba 'kilometraje_pauta'
    # Esto dará error si ya migraste, pero es el estado anterior.
    pautas = PautaMantenimiento.objects.select_related('modelo_vehiculo').all().order_by('modelo_vehiculo__nombre', 'kilometraje_inicial')
    context = {
        'pautas': pautas,
    }
    return render(request, 'flota/administracion/lista_pautas.html', context)



@login_required
@user_passes_test(es_administrador)
def lista_tipos_pausa(request):
    connection.set_tenant(request.tenant)
    tipos_pausa = TipoPausa.objects.all().order_by('nombre')
    context = {
        'tipos_pausa': tipos_pausa,
    }
    return render(request, 'flota/administracion/lista_tipos_pausa.html', context)


@login_required
@user_passes_test(es_supervisor_o_admin)
def lista_usuarios(request):
    """
    Muestra una lista PAGINADA de todos los usuarios del tenant que tienen un perfil de Personal.
    """
    connection.set_tenant(request.tenant)

    usuarios_list = User.objects.filter(
        is_superuser=False,
        personal__isnull=False
    ).select_related(
        'personal',
        'personal__empresa',
        'personal__cargo',
        'personal__cargo__departamento'
    ).order_by('username')

    # Añadimos la paginación aquí
    paginator = Paginator(usuarios_list, 20) # Muestra 20 usuarios por página
    page_number = request.GET.get('page')
    usuarios = paginator.get_page(page_number)

    context = {
        'usuarios': usuarios
    }
    return render(request, 'flota/administracion/lista_usuarios.html', context)


# --- AÑADE ESTAS DOS NUEVAS VISTAS API AL FINAL DE TU ARCHIVO views.py ---


@login_required
def ver_pauta_pdf(request, pk):
    connection.set_tenant(request.tenant)
    pauta = get_object_or_404(PautaMantenimiento, pk=pk)

    # Verificamos si la pauta realmente tiene un archivo PDF asociado
    if not pauta.archivo_pdf:
        raise Http404("La pauta no tiene un archivo PDF adjunto.")

    # Obtenemos la ruta completa al archivo en el servidor
    file_path = pauta.archivo_pdf.path

    try:
        # Devolvemos el archivo directamente al navegador
        # as_attachment=False le dice al navegador que lo muestre, no que lo descargue
        return FileResponse(open(file_path, 'rb'), as_attachment=False, content_type='application/pdf')
    except FileNotFoundError:
        raise Http404("Archivo PDF no encontrado en el servidor.")













################################################################################
# --- REPORTES Y EXPORTACIONES ---
################################################################################

@login_required
def analisis_avanzado(request):
    connection.set_tenant(request.tenant)
    proveedores = Proveedor.objects.all()
    tipos_vehiculo = ModeloVehiculo.objects.all()
    formatos = OrdenDeTrabajo.FORMATO_CHOICES
    ots = OrdenDeTrabajo.objects.filter(estado='FINALIZADA', costo_total__gt=0)
    proveedor_id = request.GET.get('proveedor')
    if proveedor_id: ots = ots.filter(proveedor_id=proveedor_id)
    formato_filtro = request.GET.get('formato')
    if formato_filtro: ots = ots.filter(formato=formato_filtro)
    tipo_veh_id = request.GET.get('tipo_vehiculo')
    if tipo_veh_id: ots = ots.filter(vehiculo__modelo_id=tipo_veh_id)
    tco_data = ots.values('proveedor__nombre').annotate(costo_sum=Sum('costo_total'), km_recorrido_sum=Sum(F('kilometraje_cierre') - F('kilometraje_apertura'))).order_by('-costo_sum')
    for item in tco_data:
        km_recorridos = item['km_recorrido_sum'] or 0
        item['costo_por_km'] = (item['costo_sum'] / km_recorridos) if km_recorridos > 0 else 0
        item['km_prom_mes'] = random.randint(3000, 5000)
    labels = [item['proveedor__nombre'] for item in tco_data]
    costo_total_data = [float(item['costo_sum']) for item in tco_data]
    costo_km_data = [float(item['costo_por_km']) for item in tco_data]
    km_mes_data = [item['km_prom_mes'] for item in tco_data]
    context = {
        'proveedores': proveedores, 'tipos_vehiculo': tipos_vehiculo, 'formatos': formatos, 'tco_data': tco_data,
        'labels': json.dumps(labels), 'costo_total_data': json.dumps(costo_total_data),
        'costo_km_data': json.dumps(costo_km_data), 'km_mes_data': json.dumps(km_mes_data),
        'selected_proveedor': int(proveedor_id) if proveedor_id else None,
        'selected_formato': formato_filtro,
        'selected_tipo_vehiculo': int(tipo_veh_id) if tipo_veh_id else None,
    }
    return render(request, 'flota/analisis_avanzado.html', context)


# --- Vistas de Acciones ---


@login_required
def analisis_costos(request):
    """
    Vista para mostrar el panel de "Costos y Tendencias" de un vehículo específico.
    Permite visualizar registros y añadir nuevos.
    """

    #AJustalo:
    today = date.today()
    start_date_str = request.GET.get('start_date', (today - timedelta(days=365)).strftime('%Y-%m-%d'))
    end_date_str = request.GET.get('end_date', today.strftime('%Y-%m-%d'))

    try:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
    except (ValueError, TypeError):
        # En caso de error en las fechas, volvemos a los valores por defecto
        end_date = today
        start_date = end_date - timedelta(days=365)



    connection.set_tenant(request.tenant)

    # Lógica para procesar el formulario cuando se envía
    if request.method == 'POST':
        form = RegistroContableVehiculoForm(request.POST)
        if form.is_valid():
            nuevo_registro = form.save(commit=False)
            nuevo_registro.save()

            messages.success(request, f"¡Registro de {nuevo_registro.get_tipo_registro_display()} añadido con éxito!")
            # Redirigimos a la misma página para ver el nuevo registro en la lista
            return redirect('analisis_costos')
        else:
            messages.error(request, "Error al guardar el registro. Por favor, revise el formulario.")
    else:
        # Si no es POST, simplemente creamos un formulario vacío
        form = RegistroContableVehiculoForm()

    # Obtenemos todos los registros contables existentes, ordenados por fecha
    registros_contables = RegistroContableVehiculo.objects.filter(fecha__range=[start_date, end_date]).order_by('-fecha')
    #registros_contables = RegistroContableVehiculo.objects.all().order_by('-fecha')

    # --- INICIO: CÁLCULO DE KPIs BÁSICOS ---
    total_ingresos = registros_contables.filter(tipo_registro='INGRESO').aggregate(total=Sum('monto'))['total'] or 0
    total_costos = registros_contables.filter(tipo_registro='COSTO').aggregate(total=Sum('monto'))['total'] or 0
    utilidad_neta = total_ingresos - total_costos
    # --- FIN: CÁLCULO DE KPIs ---

    context = {
        'form': form,
        'registros': registros_contables,
        'total_ingresos': total_ingresos,
        'total_costos': total_costos,
        'utilidad_neta': utilidad_neta,
        'full_width_content': True, # Para que ocupe todo el ancho
        'start_date_value': start_date.strftime('%Y-%m-%d'),
        'end_date_value': end_date.strftime('%Y-%m-%d'),
    }

    # Le decimos a Django que renderice una nueva plantilla que crearemos en el siguiente paso
    return render(request, 'flota/analisis_costos.html', context)


@login_required
def calcular_costo(request):
    fecha = request.GET.get('fecha')
    litros = request.GET.get('litros')

    if not fecha or not litros:
        return JsonResponse({'costo': 0})

    fecha = datetime.fromisoformat(fecha).date()
    litros = float(litros)

    precio = obtener_precio_por_fecha(fecha)

    if not precio:
        return JsonResponse({'costo': 0})

    return JsonResponse({
        'costo': litros * float(precio.precio_por_litro)
    })


@login_required
def descargar_alertas_excel(request):
    connection.set_tenant(request.tenant)

    vehiculos_alertas = obtener_alertas_flota()

    repuestos_stock_bajo = Repuesto.objects.filter(
        stock_actual__lte=F('stock_minimo'),
        ocultar= False
    ).order_by('stock_actual')

    ordenes_pendientes = OrdenDeTrabajo.objects.filter(
        estado__in=['PENDIENTE', 'EN_PROCESO', 'PAUSADA']
    )

    wb = Workbook()

    # ======================================================
    # HOJA 1: Vehículos con Mantenciones
    # ======================================================
    ws1 = wb.active
    ws1.title = "Mantenciones"

    ws1.append([
        "Vehículo",
        "Última Mantención (KM)",
        "KM Actual",
        "Pauta",
        "KM Pauta",
        "Estado"
    ])

    for item in vehiculos_alertas:
        ws1.append([
            f"{item.vehiculo.numero_interno} - {item.vehiculo.patente}",
            item.km_ultimo_mant,
            item.km_actual,
            item.pauta_nombre,
            item.km_pauta,
            item.estado
        ])

    # ======================================================
    # HOJA 2: Repuestos con Stock Crítico
    # ======================================================
    ws2 = wb.create_sheet(title="Stock Crítico")

    ws2.append([
        "Repuesto",
        "Número Parte",
        "Calidad",
        "Stock Actual",
        "Stock Mínimo"
    ])

    for r in repuestos_stock_bajo:
        ws2.append([
            r.nombre,
            r.numero_parte,
            r.get_calidad_display(),
            r.stock_actual,
            r.stock_minimo
        ])

    # ======================================================
    # HOJA 3: Órdenes de Trabajo Pendientes
    # ======================================================
    ws3 = wb.create_sheet(title="Órdenes Pendientes")

    ws3.append([
        "Folio",
        "Vehículo",
        "Tipo",
        "Prioridad",
        "Estado",
        "Fecha"
    ])

    for ot in ordenes_pendientes:
        ws3.append([
            ot.folio,
            f"{ot.vehiculo.patente} ({ot.vehiculo.numero_interno})",
            ot.tipo,
            ot.prioridad,
            ot.get_estado_display(),
            ot.fecha_creacion.strftime("%d-%m-%Y")
        ])

    # ======================================================
    # RESPUESTA HTTP
    # ======================================================
    response = HttpResponse(
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    response["Content-Disposition"] = 'attachment; filename="alertas_flota.xlsx"'

    wb.save(response)
    return response


@login_required
def exportar_comercial_excel(request):
    """Genera un reporte Excel con toda la data de la pizarra comercial."""
    connection.set_tenant(request.tenant)

    # Obtenemos las fechas de la URL
    start_date_str = request.GET.get('start_date')
    end_date_str = request.GET.get('end_date')

    # --- VALIDACIÓN DE SEGURIDAD ---
    # Si las fechas vienen vacías, definimos el mes actual por defecto para que no explote
    today = date.today()
    if not start_date_str or start_date_str == "None" or start_date_str == "":
        start_date = today.replace(day=1)
    else:
        start_date = start_date_str

    if not end_date_str or end_date_str == "None" or end_date_str == "":
        end_date = today
    else:
        end_date = end_date_str

    # 1. Obtener datos de rentabilidad (TCO)
    vehiculos = Vehiculo.objects.filter(esta_activo=True).select_related('modelo')
    data_tco = []
    for v in vehiculos:
        # Ahora start_date y end_date están garantizados como valores válidos
        gasto = v.registros_contables.filter(fecha__range=[start_date, end_date]).aggregate(total=Sum('monto'))['total'] or 0
        km = v.kilometraje_actual
        data_tco.append({
            'N° Interno': v.numero_interno,
            'Patente': v.patente,
            'Modelo': v.modelo.nombre if v.modelo else 'N/A',
            'Razón Social': v.razon_social,
            'Gasto Total ($)': float(gasto),
            'Kilometraje': km,
            'Costo por KM ($)': float(gasto/km) if km > 0 else 0
        })

    # 2. Obtener datos de presupuestos (Filtrar por rango de fechas)
    presupuestos = PresupuestoMensual.objects.filter(mes__range=[start_date, end_date]).select_related('autorizado_por')
    data_pres = [{
        'Mes': p.mes.strftime('%m/%Y'),
        'Monto Autorizado': float(p.monto_total),
        'Autorizado por': p.autorizado_por.get_full_name() if p.autorizado_por else 'N/A',
        'Fecha Firma': p.fecha_autorizacion.strftime('%d/%m/%Y %H:%M') if p.fecha_autorizacion else 'N/A',
        'Notas': p.notas
    } for p in presupuestos]

    # 3. Crear el Excel
    output_path = '/tmp/reporte_comercial.xlsx'
    with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
        pd.DataFrame(data_tco).to_excel(writer, sheet_name='Rentabilidad TCO', index=False)
        pd.DataFrame(data_pres).to_excel(writer, sheet_name='Historial Presupuestos', index=False)

    # 4. Enviar el archivo
    with open(output_path, 'rb') as f:
        response = HttpResponse(f.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = f'attachment; filename="Reporte_Comercial_{start_date}_al_{end_date}.xlsx"'
        return response



@login_required
def generar_certificado_pdf(request, pk):
    connection.set_tenant(request.tenant)  

    ot = get_object_or_404(
        OrdenDeTrabajo.objects.select_related("responsableFirma"),
        pk=pk
    )
    vehiculo = ot.vehiculo
    km_actual = ot.kilometraje_cierre
    km_prox_mant = ''
    tipo_prox_mant = ''
    # --- LÓGICA PARA IMAGEN EN BASE64 ---
    firma_b64 = None
    if ot.responsableFirma and ot.responsableFirma.firma_jpg:
        try:
            # Opción A: Si usas almacenamiento local (Media folder en el disco)
            path_imagen = ot.responsableFirma.firma_jpg.path
            
            if os.path.exists(path_imagen):
                with open(path_imagen, "rb") as image_file:
                    encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
                    # Asumiendo que es JPG, si es PNG cambia image/jpeg por image/png
                    firma_b64 = f"data:image/jpeg;base64,{encoded_string}"
            else:
                print(f"Advertencia: La imagen no existe en la ruta {path_imagen}")

        except Exception as e:
            print(f"Error al procesar la imagen para PDF: {e}")
    # -------------------------------------
    INITIAL_PAUTA_NAMES = ['SI', 'R']
    TOLERANCIA_KM = 1000
    all_pautas_rules = list(PautaMantenimiento.objects.select_related('modelo_vehiculo').order_by('modelo_vehiculo__nombre', 'kilometraje_inicial'))
    pautas_rules_del_modelo = [p for p in all_pautas_rules if p.modelo_vehiculo_id == vehiculo.modelo.id and p.tipo_aceite == vehiculo.tipo_aceite]
    if not pautas_rules_del_modelo:
        pautas_rules_del_modelo = [p for p in all_pautas_rules if p.modelo_vehiculo_id == vehiculo.modelo.id]
    pautas_iniciales_orig = [p for p in pautas_rules_del_modelo if p.nombre.split('-')[0] in INITIAL_PAUTA_NAMES]
    max_km_inicial_orig = max(p.kilometraje_inicial for p in pautas_iniciales_orig) if pautas_iniciales_orig else 0
    is_past_initial_phase_orig = (km_actual > 0) or (km_actual > (max_km_inicial_orig + 5000))
    secuencia_orig, limite_km_orig = [], km_actual + 500000
    for regla in pautas_rules_del_modelo:
        km_pauta = regla.kilometraje_inicial
        if km_pauta < limite_km_orig: secuencia_orig.append({'km': km_pauta, 'tipo': regla.nombre})
        if regla.intervalo_1_km:
            if km_pauta < km_actual:
                if regla.intervalo_2_km:
                    ciclo = regla.intervalo_1_km + regla.intervalo_2_km
                    saltos = max(0, (km_actual - km_pauta) // ciclo) if ciclo > 0 else 0
                    km_pauta += saltos * ciclo
                else:
                    saltos = max(0, (km_actual - km_pauta) // regla.intervalo_1_km) if regla.intervalo_1_km > 0 else 0
                    km_pauta += saltos * regla.intervalo_1_km
            i1, i2 = regla.intervalo_1_km, regla.intervalo_2_km
            alt = True
            while km_pauta < limite_km_orig:
                if i2:
                    km_pauta += i1 if alt else i2
                    alt = not alt
                else:
                    km_pauta += i1
                if km_pauta < limite_km_orig: secuencia_orig.append({'km': km_pauta, 'tipo': regla.nombre})

    secuencia_ordenada_orig = sorted(list({v['km']:v for v in secuencia_orig}.values()), key=lambda x: x['km'])

    prox_pauta = next((p for p in secuencia_ordenada_orig if p['km'] > (km_actual + TOLERANCIA_KM) and not (is_past_initial_phase_orig and p['tipo'].split('-')[0].strip() in INITIAL_PAUTA_NAMES)), None)
    if prox_pauta:
        km_prox_mant, tipo_prox_mant = prox_pauta['km'], prox_pauta['tipo']
    else:
        tipo_prox_mant = "FIN DE PAUTA"

    context = {
        "ot": ot,
        "request": request,
        "firma_b64": firma_b64,
        "km_prox_mant": km_prox_mant,
        "tipo_prox_mant": tipo_prox_mant
    }

    html_string = render_to_string("flota/ot_certificado_template.html", context)

    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'inline; filename="certificado-{ot.folio}.pdf"'

    HTML(string=html_string, base_url=request.build_absolute_uri()).write_pdf(response)

    return response



@login_required
@user_passes_test(es_supervisor_o_admin)
def generar_lista_invisibles_pdf(request, pk):
    """Genera una hoja de ruta para buscar los productos no encontrados."""
    connection.set_tenant(request.tenant)
    auditoria = get_object_or_404(AuditoriaInventario, pk=pk)
    
    # Obtener lo que no se ha contado
    detalles_ids = auditoria.detalles.values_list('repuesto_id', flat=True)
    invisibles = StockBodega.objects.filter(
        bodega=auditoria.bodega, 
        cantidad__gt=0
    ).exclude(repuesto_id__in=detalles_ids).select_related('repuesto')

    context = {
        'auditoria': auditoria,
        'invisibles': invisibles,
        'fecha': timezone.now(),
        'tenant_name': request.tenant.nombre,
    }

    html_string = render_to_string('flota/inventario/pdf_lista_busqueda.html', context)
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'inline; filename="Lista-Busqueda-AUD-{auditoria.id}.pdf"'
    HTML(string=html_string, base_url=request.build_absolute_uri()).write_pdf(response)
    return response









@login_required
@user_passes_test(es_supervisor_o_admin)
def panel_tco(request):
    connection.set_tenant(request.tenant)

    # --- 1. OBTENER Y VALIDAR PARÁMETROS DE FILTRO ---
    today = date.today()
    start_date_str = request.GET.get('start_date', (today - timedelta(days=365)).strftime('%Y-%m-%d'))
    end_date_str = request.GET.get('end_date', today.strftime('%Y-%m-%d'))

    try:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
    except (ValueError, TypeError):
        # En caso de error en las fechas, volvemos a los valores por defecto
        end_date = today
        start_date = end_date - timedelta(days=365)

    vehiculo_ids = request.GET.getlist('vehiculos') # Puede recibir múltiples vehículos
    contrato_id = request.GET.get('contrato')
    # NUEVOS FILTROS
    marca = request.GET.get('marca')
    modelo = request.GET.get('modelo')
    ruta = request.GET.get('ruta')
    tipo_mantencion = request.GET.get('tipo_mantencion')
    razon_social = request.GET.get('razon_social')
    rut = request.GET.get('rut')

    # --- 2. CONSTRUIR LA CONSULTA BASE ---
    registros = RegistroContableVehiculo.objects.filter(fecha__range=[start_date, end_date])

    # --- 3. APLICAR FILTROS SI EXISTEN ---
    if vehiculo_ids:
        registros = registros.filter(vehiculo_id__in=vehiculo_ids)
    if contrato_id:
        registros = registros.filter(contrato_id=contrato_id)
     # --- NUEVOS FILTROS ---
    if marca:
        registros = registros.filter(vehiculo__modelo__marca=marca)
    if modelo:
        registros = registros.filter(vehiculo__modelo__pk=modelo)
    if ruta:
        registros = registros.filter(carga_combustible__ruta_id=ruta)
    if tipo_mantencion:
        registros = registros.filter(
            orden_de_trabajo__tipo=tipo_mantencion
        )
    if razon_social:
        registros = registros.filter(vehiculo__razon_social=razon_social)
    if rut:
        registros = registros.filter(vehiculo__rut=rut)

    # --- 4. CÁLCULO DE KPIs PRINCIPALES ---
    totales = registros.aggregate(
        ingresos_totales=Coalesce(Sum('monto', filter=Q(tipo_registro='INGRESO')), 0, output_field=DecimalField()),
        costos_totales=Coalesce(Sum('monto', filter=Q(tipo_registro='COSTO')), 0, output_field=DecimalField())
    )
    ingresos_totales = totales['ingresos_totales']
    costos_totales = totales['costos_totales']
    utilidad_bruta = ingresos_totales - costos_totales
    margen_operativo = (utilidad_bruta / ingresos_totales * 100) if ingresos_totales > 0 else 0

    # --- 5. DATOS PARA GRÁFICOS (YA RESPONDEN A LOS FILTROS) ---
    # Gráfico de Torta: Desglose de Costos
    #categoria_map = dict(RegistroContableVehiculo.CATEGORIA_CHOICES)
    #desglose_costos = registros.filter(tipo_registro='COSTO').values('categoria').annotate(total=Sum('monto')).order_by('-total')
    #labels_torta = [categoria_map.get(d['categoria'], d['categoria']) for d in desglose_costos]
    #data_torta = [float(d['total']) for d in desglose_costos]
    
    #GRafico apilado de ingresos y egresos
    costos_t = registros.filter(tipo_registro='COSTO').exclude(categoria='MANTENIMIENTO') \
    .values('categoria').annotate(total=Sum('monto'))

    mantenimiento = registros.filter(
        tipo_registro='COSTO',
        categoria='MANTENIMIENTO'
    ).values('orden_de_trabajo__tipo').annotate(total=Sum('monto'))

    ingresos_t = registros.filter(tipo_registro='INGRESO') \
    .values('categoria').annotate(total=Sum('monto'))

    datasets = []

    categoria_map = dict(RegistroContableVehiculo.CATEGORIA_CHOICES)
    tipo_ot_map = dict(OrdenDeTrabajo.TIPO_CHOICES)

    for c in costos_t:
        datasets.append({
            "label": categoria_map[c['categoria']],
            "data": [float(c['total']), 0]
        })

    for m in mantenimiento:
        datasets.append({
            "label": f"Mantenimiento {tipo_ot_map.get(m['orden_de_trabajo__tipo'], 'Otro')}",
            "data": [float(m['total']), 0]
        })

    for i in ingresos_t:
        datasets.append({
            "label": categoria_map[i['categoria']],
            "data": [0, float(i['total'])]
        })

    chart_data = {
        "labels": ["Costos", "Ingresos"],
        "datasets": datasets
    }

    # Gráfico de Barras: Rentabilidad por Vehículo
    rentabilidad_vehiculo = registros.values('vehiculo__numero_interno').annotate(
        ingresos=Coalesce(Sum('monto', filter=Q(tipo_registro='INGRESO')), 0, output_field=DecimalField()),
        costos=Coalesce(Sum('monto', filter=Q(tipo_registro='COSTO')), 0, output_field=DecimalField())
    ).order_by('vehiculo__numero_interno')
    labels_barras = [d['vehiculo__numero_interno'] or "N/A" for d in rentabilidad_vehiculo]
    ingresos_barras = [float(d['ingresos']) for d in rentabilidad_vehiculo]
    costos_barras = [float(d['costos']) for d in rentabilidad_vehiculo]

    margen_barras = []
    for d in rentabilidad_vehiculo:
        ingresos = float(d['ingresos'])
        costos = float(d['costos'])
        margen = 0
        if ingresos > 0:
            margen = (ingresos - costos) / ingresos * 100
        margen_barras.append(round(margen, 2))

    # Gráfico de Barras: Rentabilidad por Vehículo 2
    categorias_ingreso = list(
        registros.filter(tipo_registro='INGRESO')
        .values_list('categoria', flat=True)
        .distinct()
    )

    categorias_costos_simples = [
        'COSTO_FIJO',
        'COMBUSTIBLE',
        'NEUMATICOS',
        'PEAJES',
        'FLUIDOS',
        'COSTO_EXTRAORDINARIO',
    ]

    tipos_mant = ['PREVENTIVA', 'CORRECTIVA', 'EVALUATIVA']

    vehiculos = (
        registros
        .order_by('vehiculo__numero_interno')
        .values_list('vehiculo__numero_interno', flat=True)
        .distinct()
    )

    # INGRESOS
    data_ingresos = {v: {cat: 0 for cat in categorias_ingreso} for v in vehiculos}
    # COSTOS (NO mantenimiento)
    data_costos = {v: {cat: 0 for cat in categorias_costos_simples} for v in vehiculos}
    # COSTOS mantenimiento desglosados
    data_mant = {v: {cat: 0 for cat in tipos_mant} for v in vehiculos}

    for row in registros.filter(tipo_registro='INGRESO') \
        .values('vehiculo__numero_interno', 'categoria') \
        .annotate(total=Sum('monto')):
        v = row['vehiculo__numero_interno']
        cat = row['categoria']

        if cat in categorias_ingreso:
            data_ingresos[v][cat] = float(row['total'])

    for row in registros.filter(tipo_registro='COSTO', categoria__in=categorias_costos_simples) \
        .values('vehiculo__numero_interno', 'categoria') \
        .annotate(total=Sum('monto')):
        v = row['vehiculo__numero_interno']
        cat = row['categoria']

        data_costos[v][cat] = float(row['total'])
    
    for row in registros.filter(tipo_registro='COSTO', categoria='MANTENIMIENTO') \
        .values('vehiculo__numero_interno', 'orden_de_trabajo__tipo') \
        .annotate(total=Sum('monto')):
        v = row['vehiculo__numero_interno']
        tipo_mant = row['orden_de_trabajo__tipo']  # PREVENTIVA / CORRECTIVA / EVALUATIVA

        if tipo_mant in tipos_mant:
            data_mant[v][tipo_mant] += float(row['total'])
    
    labels = list(vehiculos)
    datasets = []
    categoria_map = dict(RegistroContableVehiculo.CATEGORIA_CHOICES)
    # INGRESOS
    for cat in categorias_ingreso:
        datasets.append({
            "label": f"{categoria_map.get(cat, cat)}",
            "stack": "ingresos",
            "data": [data_ingresos[v][cat] for v in labels]
        })

    # COSTOS normales
    for cat in categorias_costos_simples:
        datasets.append({
            "label": f"{categoria_map.get(cat, cat)}",
            "stack": "costos",
            "data": [data_costos[v][cat] for v in labels]
        })

    # COSTOS mantenimiento desglosados
    tipo_mant_map = {
        "PREVENTIVA": "Mantenimiento Preventivo",
        "CORRECTIVA": "Mantenimiento Correctivo",
        "EVALUATIVA": "Mantenimiento Evaluativo",
    }
    for cat in tipos_mant:
        datasets.append({
            "label": tipo_mant_map[cat],
            "stack": "costos",
            "data": [data_mant[v][cat] for v in labels]
        })

    chart_data2 = {"labels": labels, "datasets": datasets}

    # --- 6. PREPARAR DATOS PARA LOS FILTROS DEL FORMULARIO ---
    todos_los_vehiculos = Vehiculo.objects.filter(esta_activo=True).order_by('numero_interno')
    todos_los_contratos = Contrato.objects.all().order_by('nombre')
    todas_las_marcas = ModeloVehiculo.objects.values_list('marca', flat=True).distinct()
    todos_los_modelos = ModeloVehiculo.objects.all()
    todas_las_rutas = Ruta.objects.all()
    tipos_mantencion = ["PREVENTIVA", "CORRECTIVA", "EVALUATIVA"]
    razones_sociales = Vehiculo.objects.values_list('razon_social', flat=True).exclude(razon_social='').distinct()
    ruts = Vehiculo.objects.values_list('rut', flat=True).exclude(rut='').distinct()

    context = {
        # Valores de los filtros para mantenerlos en el formulario
        'start_date_value': start_date.strftime('%Y-%m-%d'),
        'end_date_value': end_date.strftime('%Y-%m-%d'),
        'selected_vehiculo_ids': [int(v) for v in vehiculo_ids],
        'selected_contrato_id': int(contrato_id) if contrato_id else None,
        # nuevos seleccionados
        "selected_marca": marca,
        "selected_modelo": int(modelo) if modelo else None,
        "selected_ruta": int(ruta) if ruta else None,
        "selected_tipo_mant": tipo_mantencion,
        "razones_sociales": razones_sociales,
        "ruts": ruts,
        "selected_razon_social": razon_social,
        "selected_rut": rut,

        # Opciones para los selectores del formulario
        'todos_los_vehiculos': todos_los_vehiculos,
        'todos_los_contratos': todos_los_contratos,
        "todos_los_vehiculos": todos_los_vehiculos,
        "todos_los_contratos": Contrato.objects.all(),
        "todas_las_marcas": todas_las_marcas,
        "todos_los_modelos": todos_los_modelos,
        "todas_las_rutas": todas_las_rutas,
        "tipos_mantencion": tipos_mantencion,

        # KPIs para las tarjetas
        'ingresos_totales': ingresos_totales,
        'costos_totales': costos_totales,
        'utilidad_bruta': utilidad_bruta,
        'margen_operativo': margen_operativo,

        # Datos para los gráficos
        'labels_torta': json.dumps({}),
        'data_torta': json.dumps({}),
        'chart_data':json.dumps(chart_data),
        'labels_barras': json.dumps(labels_barras),
        'ingresos_barras': json.dumps(ingresos_barras),
        'costos_barras': json.dumps(costos_barras),
        'margen_barras': margen_barras,

        'full_width_content': True,

        'barra_autos': json.dumps(chart_data2)
        
    }

    return render(request, 'flota/panel_tco.html', context)





################################################################################
# --- APIS Y ASISTENTE ---
################################################################################

@login_required
@require_POST
def api_asignar_presupuesto(request):
    """
    Crea un nuevo abono. No pisa el anterior, los suma.
    """
    connection.set_tenant(request.tenant)
    monto = request.POST.get('monto')
    mes_str = request.POST.get('mes') # Formato YYYY-MM-DD
    notas = request.POST.get('notas')
    
    if monto and mes_str:
        # IMPORTANTE: Usamos .create() para permitir múltiples abonos
        PresupuestoMensual.objects.create(
            mes=mes_str,
            monto_total=monto,
            autorizado_por=request.user,
            notas=notas
        )
        messages.success(request, f"Se ha abonado ${int(monto):,d} al presupuesto del mes.")
    
    return redirect('dashboard_comercial')



@login_required
@require_POST
def api_asistente_logic(request):
    """
    API para interactuar con el asistente de IA (Pulser AI).
    Gestiona la lógica de LangChain, el uso de herramientas y la memoria conversacional.
    """
    
    try:
        """
        print("limpiar")
        
        connection.set_tenant(request.tenant)
        data = json.loads(request.body)
        question = data.get('question')

        if not question:
            return JsonResponse({'error': 'No se proporcionó pregunta.'}, status=400)

        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash-latest",
            google_api_key=settings.GOOGLE_API_KEY,
            temperature=0.0, # Temperatura CERO para máxima predictibilidad.
            convert_system_message_to_human=True
        )

        tools = ALL_TOOLS

        memory = ConversationBufferWindowMemory(
            memory_key="chat_history",
            k=5,
            return_messages=True,
            output_key="output"
        )

        system_message_content = ""
        Eres un asistente de base de datos llamado Pulser AI. Tu ÚNICA función es usar las herramientas para responder preguntas sobre una flota de vehículos.

        **REGLAS ESTRICTAS:**
        1.  **NO CONVERSES, ACTÚA.** Tu objetivo es ejecutar la herramienta correcta lo más rápido posible.
        2.  **USA EL HISTORIAL.** Si pides información (como una patente) y el usuario te la da en el siguiente mensaje, DEBES usarla para ejecutar la herramienta. NO vuelvas a preguntar. NO reinicies la conversación.
        3.  **SI FALTA UN PARÁMETRO, PÍDELO.** Si una herramienta necesita un identificador de vehículo y no lo tienes, pídelo de forma clara y concisa. Ejemplo: "Necesito la patente (PPU) o el número interno (N° Int.) del vehículo."
        4.  **SI UNA PREGUNTA ES AMBIGUA, OFRECE OPCIONES.** Si el usuario pregunta "estado de la flota", ofrece opciones claras como 'número total de vehículos', 'costos operativos', o 'estado de mantenimiento de un vehículo específico'. Cuando el usuario elija una, ACTÚA sobre esa elección. NO repitas la lista de opciones.
        5.  **NO INVENTES NADA.** Solo puedes responder con los datos que te devuelven las herramientas. Si una herramienta no encuentra nada, informa eso al usuario.
        ""

        prompt = ChatPromptTemplate.from_messages(
            [
                ("system", system_message_content),
                MessagesPlaceholder(variable_name="chat_history"),
                ("human", "{input}"),
                MessagesPlaceholder(variable_name="agent_scratchpad"),
            ]
        )

        agent = create_tool_calling_agent(llm, tools, prompt)

        agent_executor = AgentExecutor(
            agent=agent,
            tools=tools,
            verbose=True, # MANTÉN ESTO EN TRUE PARA DEPURAR
            memory=memory,
            handle_parsing_errors="Por favor, reformula tu pregunta. No pude entender la solicitud.", # Mensaje de error más directo
        )

        response = agent_executor.invoke({"input": question})
        answer = response.get('output', 'Lo siento, no pude procesar tu solicitud. Por favor, intenta reformular tu pregunta.')

        return JsonResponse({'answer': answer})"""

    except Exception as e:
        logger.error(f"Error en api_asistente_logic: {e}", exc_info=True)
        return JsonResponse({'error': f"Error interno del servidor: {str(e)}."}, status=500)



@login_required
def api_eliminar_abono_presupuesto(request, pk):
    """
    Permite a Bruno borrar un abono específico del historial.
    """
    connection.set_tenant(request.tenant)
    abono = get_object_or_404(PresupuestoMensual, pk=pk)
    abono.delete()
    messages.warning(request, "Abono eliminado. El total mensual ha sido actualizado.")
    return redirect('dashboard_comercial')



@login_required
@require_POST
def api_ignorar_alerta(request):
    repuesto_id = request.POST.get('repuesto_id')
    motivo = request.POST.get('motivo')
    HistorialAlertaIgnorada.objects.create(
        repuesto_id=repuesto_id, usuario=request.user, motivo=motivo
    )
    return JsonResponse({'status': 'ok'})


# Asegúrate de que Abs esté en los imports de arriba (donde están Sum, Count, etc)
# Si no está, agrégalo: from django.db.models.functions import Abs


@login_required
@require_POST
def api_movimiento_masivo(request):
    import json
    from .models import StockBodega, Bodega, MovimientoStock, Repuesto
    from django.db import transaction

    try:
        data = json.loads(request.body)
        
        # --- LIMPIEZA ROBUSTA DE IDS ---
        # Filtramos los IDs de los repuestos seleccionados para que solo queden números
        raw_sb_ids = data.get('ids', [])
        sb_ids = []
        for rid in raw_sb_ids:
            if rid:
                # Esto elimina el \xa0, puntos, comas o espacios y deja solo los dígitos
                clean_id = "".join(filter(str.isdigit, str(rid)))
                if clean_id:
                    sb_ids.append(int(clean_id))
        
        # Limpiamos también el ID de la bodega de destino (ej: '2\xa0005' -> 2005)
        raw_bodega_id = data.get('bodega_id')
        if not raw_bodega_id:
             return JsonResponse({'status': 'error', 'message': 'No se seleccionó bodega de destino.'}, status=400)
             
        clean_bodega_id = "".join(filter(str.isdigit, str(raw_bodega_id)))
        
        if not sb_ids or not clean_bodega_id:
            return JsonResponse({'status': 'error', 'message': 'No se recibieron artículos o bodega válidos.'}, status=400)

        # Ahora que el ID es un número puro, buscamos la bodega
        bodega_destino = get_object_or_404(Bodega, id=int(clean_bodega_id))
        exitos = 0

        with transaction.atomic():
            for sb_id in sb_ids:
                try:
                    origen = StockBodega.objects.select_related('repuesto', 'bodega').get(id=sb_id)
                    repuesto = origen.repuesto

                    # Cantidad a mover (siempre movemos el total del registro de origen)
                    cant_a_mover = origen.cantidad

                    if cant_a_mover <= 0:
                        continue

                    # 1. Borramos el registro de origen (porque movemos todo)
                    origen.delete()

                    # 2. Sumar a la nueva bodega (si no existe, la crea)
                    destino, _ = StockBodega.objects.get_or_create(repuesto=repuesto, bodega=bodega_destino)
                    destino.cantidad += cant_a_mover
                    destino.save()

                    # 3. Registro en Historial para Bruno
                    # Creamos el registro del traslado
                    MovimientoStock.objects.create(
                        repuesto=repuesto,
                        tipo_movimiento='AJUSTE_POSITIVO',
                        cantidad=cant_a_mover,
                        usuario_responsable=request.user,
                        notas=f"TRASLADO: Desde {origen.bodega.nombre} a {bodega_destino.nombre}"
                    )

                    # COMPENSACIÓN: Restamos al global lo que el movimiento sumó,
                    # para que el Stock Total no cambie.
                    repuesto.stock_actual -= cant_a_mover
                    repuesto.save()

                    exitos += 1
                except StockBodega.DoesNotExist:
                    continue # Si un ID no existe, pasamos al siguiente

        return JsonResponse({
            'status': 'ok',
            'message': f'¡Éxito! Se trasladaron {exitos} artículos a {bodega_destino.nombre}.'
        })
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': f"Error en el traslado: {str(e)}"}, status=500)



############## PRECIO COMBUSTIBLE

@login_required
@require_POST
def api_texto_a_voz(request):
    """
    API que usa Google Cloud Text-to-Speech para convertir texto a voz.
    Ahora acepta un parámetro 'voice' para seleccionar la voz.
    """
    try:
        data = json.loads(request.body)
        texto_para_hablar = data.get('text')
        # Obtenemos el nombre de la voz que eligió el usuario, con un valor por defecto
        voice_name = data.get('voice', 'es-US-Standard-A') # Voz masculina de español (EE.UU.) por defecto

        if not texto_para_hablar:
            return JsonResponse({'error': 'No se proporcionó texto.'}, status=400)

        # 1. Instanciar un cliente de la API
        client = texttospeech.TextToSpeechClient()

        # 2. Configurar el texto de entrada
        synthesis_input = texttospeech.SynthesisInput(text=texto_para_hablar)

        # 3. Construir la voz con el nombre recibido
        # Para voces Neural2 (España), el language_code es 'es-ES'
        language_code = "es-ES" if "es-ES" in voice_name else "es-US"
        voice = texttospeech.VoiceSelectionParams(
            language_code=language_code,
            name=voice_name
        )

        # 4. Seleccionar el tipo de audio (MP3)
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3
        )

        # 5. Realizar la petición a la API
        response = client.synthesize_speech(
            input=synthesis_input, voice=voice, audio_config=audio_config
        )

        # 6. Devolver el audio directamente
        return HttpResponse(response.audio_content, content_type='audio/mpeg')

    except Exception as e:
        logger.error(f"Error en api_texto_a_voz (Cloud): {e}", exc_info=True)
        return JsonResponse({'error': 'Error interno al generar el audio.'}, status=500)



@login_required
def mecanicos_recursos_api(request):
    """
    API que devuelve la lista de mecánicos para FullCalendar.
    Añade un recurso especial para "Sin Asignar". Es útil tenerla por si acaso.
    """
    connection.set_tenant(request.tenant)
    try:
        mecanicos_qs = User.objects.filter(groups__name='Mecánico', is_active=True).order_by('first_name', 'last_name')
    except Group.DoesNotExist:
        mecanicos_qs = User.objects.filter(is_staff=True, is_superuser=False, is_active=True).order_by('first_name', 'last_name')

    recursos = [
        # Este es nuestro "corral" virtual para OTs no asignadas.
        {'id': 'sin-asignar', 'title': 'Sin Asignar'}
    ]

    for usuario in mecanicos_qs:
        recursos.append({
            'id': usuario.pk,
            'title': usuario.get_full_name() or usuario.username,
        })

    return JsonResponse(recursos, safe=False)





@login_required
def mecanicos_recursos_api(request):
    """
    API que devuelve una lista de usuarios que son Mecánicos o Supervisores
    en el formato que FullCalendar Resource-Timeline necesita.
    """
    connection.set_tenant(request.tenant)
    recursos_qs = User.objects.filter(groups__name__in=['Mecánico', 'Supervisor']).distinct()
    recursos = []
    for usuario in recursos_qs:
        recursos.append({
            'id': usuario.pk,
            'title': usuario.get_full_name() or usuario.username,
        })
    return JsonResponse(recursos, safe=False)


@login_required
def pagina_asistente_ia(request):
    """
    Renderiza la página dedicada para interactuar con el asistente de IA.
    El contexto inicial puede estar vacío, ya que toda la interacción
    se manejará con JavaScript y llamadas a una API.
    """
    connection.set_tenant(request.tenant) # Muy importante mantener esto

    # Podemos pasar el nombre del tenant para personalizar el saludo
    context = {
        'tenant_name': request.tenant.nombre,
        'full_width_content': True, # Para que ocupe todo el ancho si tu plantilla lo soporta
    }
    return render(request, 'flota/asistente_ia_page.html', context)





################################################################################
# --- OTROS ---
################################################################################

@login_required
@user_passes_test(es_supervisor_o_admin)
def autorizar_horas_extra(request, pk):
    connection.set_tenant(request.tenant)
    ot = get_object_or_404(OrdenDeTrabajo, pk=pk)

    if request.method == 'POST':
        ot.horas_extra_autorizadas = True

        if ot.estado == 'PAUSADA':
            ot.estado = 'EN_PROCESO'

        ot.save()

        HistorialOT.objects.create(
            orden_de_trabajo=ot,
            usuario=request.user,
            tipo_evento='MODIFICACION',
            descripcion="Se han autorizado las horas extra para esta OT."
        )

        messages.success(request, f"¡Horas extra autorizadas para la OT #{ot.folio}!")

    return redirect('ot_detail', pk=pk)


@login_required
@user_passes_test(lambda u: es_administrador(u))
def carga_masiva(request):
    connection.set_tenant(request.tenant)
    if request.method == 'POST':
        form = CargaMasivaForm(request.POST, request.FILES)
        if form.is_valid():
            archivos_procesados = False

            # --- 1. PROCESAMIENTO DEL ARCHIVO DE PAUTAS ---
            if form.cleaned_data.get('archivo_pautas'):
                archivos_procesados = True
                try:
                    with transaction.atomic():
                        df = pd.read_excel(form.cleaned_data.get('archivo_pautas'))
                        df.columns = [str(col).strip().lower().replace(' ', '_').replace('í', 'i').replace('°', '').replace('ó', 'o').replace('á', 'a') for col in df.columns]
                        PautaMantenimiento.objects.all().delete()
                        creados_pautas, advertencias = 0, []
                        for index, row in df.iterrows():
                            nombre_pauta_base = str(row.get('nombre_pauta', '')).strip()
                            nombre_modelo_raw = str(row.get('nombre_modelo_vehiculo', '')).strip()
                            if not nombre_modelo_raw or not nombre_pauta_base: continue
                            modelo_obj, created = ModeloVehiculo.objects.get_or_create(nombre=nombre_modelo_raw)
                            if created: advertencias.append(f"Fila {index+2}: Se creó un nuevo modelo '{nombre_modelo_raw}'.")
                            tipo_aceite = str(row.get('tipo_aceite', '')).strip().upper()
                            nombre_pauta_final = f"{nombre_pauta_base}-{tipo_aceite}" if tipo_aceite else nombre_pauta_base
                            try:
                                km_inicial_val = row.get('cronograma_en_km')
                                if pd.isna(km_inicial_val) or str(km_inicial_val).strip() == '': km_inicial_val = row.get('kilometraje_pauta')
                                km_inicial = int(km_inicial_val)
                                intervalo1_val = row.get('intervalo_km')
                                intervalo2_val = row.get('intervalo_km_2')
                                km_intervalo1 = int(intervalo1_val) if pd.notna(intervalo1_val) and str(intervalo1_val).strip() != '' else None
                                km_intervalo2 = int(intervalo2_val) if pd.notna(intervalo2_val) and str(intervalo2_val).strip() != '' else None
                                if km_inicial <= 0:
                                    advertencias.append(f"Fila {index+2}: Pauta '{nombre_pauta_base}' no tiene KM inicial válido. Omitida.")
                                    continue
                                PautaMantenimiento.objects.create(modelo_vehiculo=modelo_obj, nombre=nombre_pauta_final, kilometraje_inicial=km_inicial, intervalo_1_km=km_intervalo1, intervalo_2_km=km_intervalo2, tipo_aplicacion=str(row.get('tipo_aplicacion', '')).strip().upper(), tipo_aceite=tipo_aceite)
                                creados_pautas += 1
                            except (ValueError, TypeError) as e:
                                advertencias.append(f"Fila {index+2}: Error de datos para pauta '{nombre_pauta_base}' ('{e}'). Omitida.")
                        messages.success(request, f"Carga de pautas completada: {creados_pautas} reglas creadas.")
                        for advertencia in advertencias: messages.warning(request, advertencia)
                except Exception as e:
                    messages.error(request, f"Error CRÍTICO al procesar archivo de Pautas: {e}. La operación fue cancelada.")

            # --- 2. PROCESAMIENTO DEL ARCHIVO DE VEHÍCULOS ---
            if form.cleaned_data.get('archivo_vehiculos'):
                archivos_procesados = True
                try:
                    with transaction.atomic():
                        df = pd.read_excel(form.cleaned_data.get('archivo_vehiculos'))
                        df.columns = [str(col).strip().lower().replace(' ', '_').replace('í', 'i') for col in df.columns]
                        creados, actualizados, ots_procesadas, advertencias_vehiculos = 0, 0, 0, []
                        for index, row in df.iterrows():
                            patente_vehiculo = str(row.get('patente', '')).strip()
                            if not patente_vehiculo: continue
                            modelo_nombre = str(row.get('modelo', 'Desconocido')).strip()
                            marca_nombre = str(row.get('marca', 'Desconocida')).strip()
                            modelo_obj, _ = ModeloVehiculo.objects.get_or_create(nombre=modelo_nombre, defaults={'marca': marca_nombre})
                            norma_nombre = str(row.get('norma_euro', 'N/A')).strip()
                            if norma_nombre.lower() == 'nan' or not norma_nombre: norma_nombre = 'N/A'
                            norma_obj, _ = NormaEuro.objects.get_or_create(nombre=norma_nombre)
                            fecha_str = row.get('fecha_ultima_mantencion')
                            fecha_ult_mant = None
                            if pd.notna(fecha_str):
                                try:
                                    fecha_dt = pd.to_datetime(fecha_str, dayfirst=True)
                                    fecha_ult_mant = timezone.make_aware(fecha_dt, timezone.get_default_timezone())
                                except: pass

                            tipo_aceite_excel = str(row.get('tipo_aceite', '')).strip().upper()
                            tipo_aceite_db = None
                            if 'SINTÉTICO' in tipo_aceite_excel or 'SINTETICO' in tipo_aceite_excel:
                                tipo_aceite_db = 'SINTETICO'
                            elif 'MINERAL' in tipo_aceite_excel:
                                tipo_aceite_db = 'MINERAL'
                            elif 'AMBOS' in tipo_aceite_excel:
                                tipo_aceite_db = 'AMBOS'

                            vehiculo_obj, created = Vehiculo.objects.update_or_create(
                                patente=patente_vehiculo,
                                defaults={
                                    'numero_interno': str(row.get('numero_interno', '')).strip(),
                                    'modelo': modelo_obj,
                                    'norma_euro': norma_obj,
                                    'chasis': str(row.get('chasis', '')).strip(),
                                    'motor': str(row.get('motor', '')).strip(),
                                    'razon_social': str(row.get('empresa', '')).strip(),
                                    'kilometraje_actual': int(row.get('kilometraje_actual', 0)),
                                    'aplicacion': str(row.get('aplicacion', '')).strip(),
                                    'km_ultima_mantencion': int(row.get('km_ultima_mantencion', 0)),
                                    'fecha_ultima_mantencion': fecha_ult_mant.date() if fecha_ult_mant else None,
                                    'intervalo_mantenimiento_km': int(row.get('intervalo_km', 10000)),
                                    'tipo_aceite': tipo_aceite_db,
                                    'rut': str(row.get('razon_social', '')).strip(),
                                }
                            )
                            if created: creados += 1
                            else: actualizados += 1
                            km_ult_mant_val = int(row.get('km_ultima_mantencion', 0))
                            if km_ult_mant_val > 0 and fecha_ult_mant:
                                pauta_nombre_base = str(row.get('tipo_ultimo_mant', '')).strip()
                                tipo_aceite_vehiculo_normalizado = tipo_aceite_db.replace("SINTÉTICO", "SINTETICO") if tipo_aceite_db else None
                                pauta_historica = None
                                if pauta_nombre_base:
                                    nombre_pauta_unico = f"{pauta_nombre_base}-{tipo_aceite_vehiculo_normalizado}" if tipo_aceite_vehiculo_normalizado else pauta_nombre_base
                                    pauta_historica = PautaMantenimiento.objects.filter(modelo_vehiculo=modelo_obj, nombre=nombre_pauta_unico).first()
                                    if not pauta_historica: advertencias_vehiculos.append(f"Para {patente_vehiculo}, no se encontró la regla '{nombre_pauta_unico}'.")
                                OrdenDeTrabajo.objects.update_or_create(
                                    vehiculo=vehiculo_obj, 
                                    tipo='PREVENTIVA', 
                                    kilometraje_cierre=km_ult_mant_val, 
                                    defaults={'estado': 'FINALIZADA', 'fecha_cierre': fecha_ult_mant, 'fecha_creacion': fecha_ult_mant - timedelta(days=1), 'observacion_inicial': f"OT histórica importada: {pauta_nombre_base or 'Sin pauta'}", 'folio': f'HIST-{vehiculo_obj.patente}-{km_ult_mant_val}', 'pauta_mantenimiento': pauta_historica})
                                ots_procesadas += 1
                    messages.success(request, f"Vehículos procesados: {creados} creados, {actualizados} actualizados. {ots_procesadas} OTs históricas procesadas.")
                    for advertencia in advertencias_vehiculos: messages.warning(request, advertencia)
                except Exception as e:
                    messages.error(request, f"Error al procesar archivo de vehículos: {e}")

            # --- 3. PROCESAMIENTO DEL ARCHIVO DE INVENTARIO ---
            if form.cleaned_data.get('archivo_repuestos'):
                archivos_procesados = True
                try:
                    with transaction.atomic():
                        df = pd.read_excel(form.cleaned_data.get('archivo_repuestos'))
                        df.columns = [str(col).strip().lower().replace(' ', '_') for col in df.columns]
                        creados, actualizados = 0, 0
                        for index, row in df.iterrows():
                            numero_parte = str(row.get('numero_parte', '')).strip()
                            if not numero_parte: continue
                            calidad_excel = str(row.get('calidad', 'Genérico')).strip().lower()
                            if 'original' in calidad_excel:
                                calidad_db = 'ORIGINAL'
                            elif 'oem' in calidad_excel:
                                calidad_db = 'OEM'
                            else:
                                calidad_db = 'GENERICO'

                            # ---------- PROVEEDOR ----------
                            proveedor_nombre = str(row.get('proveedor_habitual', '')).strip()
                            proveedor_rut = str(row.get('rut_proveedor_habitual', '')).strip()

                            proveedor = None

                            if proveedor_rut:
                                proveedor, _ = Proveedor.objects.get_or_create(
                                                rut=proveedor_rut,
                                                defaults={'nombre': proveedor_nombre or proveedor_rut}
                                            )
                            elif proveedor_nombre:
                                    proveedor, _ = Proveedor.objects.get_or_create(
                                    nombre=proveedor_nombre
                                )
                            repuesto, created = Repuesto.objects.update_or_create(
                                numero_parte=numero_parte, calidad=calidad_db,
                                defaults={
                                    'nombre': str(row.get('nombre', 'Sin Nombre')).strip(),
                                    'stock_actual': int(row.get('stock_actual', 0)),
                                    'stock_minimo': int(row.get('stock_minimo', 1)),
                                    'ubicacion': str(row.get('ubicacion', '')).strip(),
                                    'precio_unitario': float(str(row.get('precio_unitario', '0')).replace(',', '.')),
                                    'proveedor_habitual': proveedor
                                }
                            )
                            if created: creados += 1
                            else: actualizados += 1
                        messages.success(request, f"Inventario procesado: {creados} repuestos creados, {actualizados} actualizados.")
                except Exception as e:
                    messages.error(request, f"Error al procesar archivo de inventario: {e}")

            # --- 4. PROCESAMIENTO DEL ARCHIVO DE TAREAS ---
            if form.cleaned_data.get('archivo_tareas'):
                archivos_procesados = True
                try:
                    with transaction.atomic():
                        df = pd.read_excel(form.cleaned_data.get('archivo_tareas'))
                        df.columns = [str(col).strip().lower().replace(' ', '_') for col in df.columns]
                        creados, actualizados = 0, 0
                        for index, row in df.iterrows():
                            descripcion = str(row.get('descripcion', '')).strip()
                            if not descripcion: continue
                            tarea, created = Tarea.objects.update_or_create(
                                descripcion=descripcion,
                                defaults={
                                    'tiempo_estandar_minutos': int(row.get('tiempo_estandar_minutos', 60)),
                                    'costo_base': float(str(row.get('costo_base', '0')).replace(',', '.'))
                                }
                            )
                            if created: creados += 1
                            else: actualizados += 1
                        messages.success(request, f"Tareas procesadas: {creados} creadas, {actualizados} actualizadas.")
                except Exception as e:
                    messages.error(request, f"Error al procesar archivo de tareas: {e}")

            # --- 5. PROCESAMIENTO DEL ARCHIVO DE TIPOS DE FALLA ---
            if form.cleaned_data.get('archivo_tipos_falla'):
                archivos_procesados = True
                try:
                    with transaction.atomic():
                        df = pd.read_excel(form.cleaned_data.get('archivo_tipos_falla'))
                        df.columns = [str(col).strip().lower().replace(' ', '_') for col in df.columns]
                        creados, actualizados = 0, 0
                        for index, row in df.iterrows():
                            descripcion = str(row.get('descripcion', '')).strip()
                            if not descripcion: continue
                            criticidad_map = {'Alta': 'ALTA', 'Media': 'MEDIA', 'Baja': 'BAJA'}
                            causa_map = {'Mecánica': 'MECANICA', 'Eléctrica': 'ELECTRICA', 'Operación': 'OPERACION'}
                            criticidad_excel = str(row.get('criticidad', 'Media')).strip()
                            causa_excel = str(row.get('causa', 'Mecánica')).strip()
                            tipo_falla, created = TipoFalla.objects.update_or_create(
                                descripcion=descripcion,
                                defaults={
                                    'criticidad': criticidad_map.get(criticidad_excel, 'MEDIA'),
                                    'causa': causa_map.get(causa_excel, 'MECANICA'),
                                    'tfs_predeterminado_min': int(row.get('tfs_predeterminado_min', 60))
                                }
                            )
                            if created: creados += 1
                            else: actualizados += 1
                        messages.success(request, f"Tipos de Falla procesados: {creados} creados, {actualizados} actualizados.")
                except Exception as e:
                    messages.error(request, f"Error al procesar archivo de Tipos de Falla: {e}")

            # =======================================================================
            # --- INICIO: NUEVA LÓGICA INTEGRADA PARA ARCHIVO DE EMPLEADOS ---
            # =======================================================================
            if form.cleaned_data.get('archivo_empleados'):
                archivos_procesados = True
                try:
                    df = pd.read_excel(form.cleaned_data['archivo_empleados']).fillna('')
                    creados_usuarios = 0
                    actualizados_personal = 0
                    errores = []

                    with transaction.atomic():
                        for index, row in df.iterrows():
                            rut = str(row.get('Rut', '')).strip()
                            nombre = str(row.get('Nombre', '')).strip().title()
                            ap_paterno = str(row.get('Ap_Paterno', '')).strip().title()
                            ap_materno = str(row.get('Ap_Materno', '')).strip().title()

                            if not all([rut, nombre, ap_paterno]):
                                errores.append(f"Fila {index + 2}: Faltan datos (RUT, Nombre o Apellido Paterno). Se omite.")
                                continue

                            try:
                                nombre_empresa = str(row.get('Empresa', 'Empresa Genérica')).strip()
                                empresa_obj, _ = Empresa.objects.get_or_create(nombre=nombre_empresa)

                                nombre_depto = str(row.get('Departamento', 'Sin Departamento')).strip()
                                depto_obj, _ = Departamento.objects.get_or_create(nombre=nombre_depto)

                                nombre_cargo = str(row.get('Cargo', 'Sin Cargo')).strip()
                                cargo_obj, _ = Cargo.objects.get_or_create(nombre=nombre_cargo, defaults={'departamento': depto_obj})

                                estado_excel = str(row.get('Estado', 'ACTIVO')).upper().strip()
                                estado_db = 'ACTIVO' if estado_excel == 'ACTIVO' else 'INACTIVO'

                                sexo_excel = str(row.get('Sexo', 'OTRO')).upper().strip()
                                sexo_db = sexo_excel if sexo_excel in ['HOMBRE', 'MUJER'] else 'OTRO'

                                prestador_excel = str(row.get('Prestador_de_servicio', 'INTERNO')).upper().strip()
                                prestador_db = 'INTERNO' if prestador_excel == 'INTERNO' else 'EXTERNO'
                                
                                sueldo_base = limpiar_moneda(row.get('Sueldo_Base_$', '0'))
                                hh_normal = limpiar_moneda(row.get('HH_$', '0'))
                                hh_extra = limpiar_moneda(row.get('HH_Extras_$', '0'))

                                personal_obj, created = Personal.objects.update_or_create(
                                    rut=rut,
                                    defaults={
                                        'nombre': nombre,
                                        'apellido_paterno': ap_paterno,
                                        'apellido_materno': ap_materno,
                                        'sexo': sexo_db,
                                        'empresa': empresa_obj,
                                        'cargo': cargo_obj,
                                        'estado': estado_db,
                                        'tipo_prestador': prestador_db,
                                        'sueldo_base': sueldo_base,
                                        'valor_hora_normal': hh_normal,
                                        'valor_hora_extra': hh_extra,
                                    }
                                )

                                if created:
                                    username_base = f"{nombre.split(' ')[0].lower()}.{ap_paterno.lower()}"
                                    username = re.sub(r'[^a-z0-9.]', '', username_base)
                                    counter = 1
                                    while User.objects.filter(username=username).exists():
                                        username = f"{username_base}{counter}"
                                        counter += 1
                                    
                                    password = "".join(filter(str.isdigit, rut))
                                    nuevo_usuario = User.objects.create_user(username=username, password=password)
                                    personal_obj.user = nuevo_usuario
                                    
                                    cargo_upper = nombre_cargo.upper()
                                    if 'ADMINISTRADOR' in cargo_upper or 'GERENTE' in cargo_upper:
                                        personal_obj.rol = 'ADMINISTRADOR'
                                    elif 'SUPERVISOR' in cargo_upper or 'JEFE' in cargo_upper:
                                        personal_obj.rol = 'SUPERVISOR'
                                    elif 'MECANICO' in cargo_upper or 'MECÁNICO' in cargo_upper or 'ELECTRICO' in cargo_upper:
                                        personal_obj.rol = 'MECANICO'
                                    else:
                                        personal_obj.rol = 'ASISTENTE'
                                    
                                    personal_obj.save()
                                    creados_usuarios += 1
                                else:
                                    personal_obj.save()
                                    actualizados_personal += 1
                            except Exception as e:
                                errores.append(f"Fila {index + 2} (RUT: {rut}): Error -> {e}")

                    if creados_usuarios > 0 or actualizados_personal > 0:
                        messages.success(request, f"Carga de personal finalizada: {creados_usuarios} nuevos creados, {actualizados_personal} existentes actualizados.")
                    if errores:
                        for error in errores[:5]:
                            messages.warning(request, error)
                        if len(errores) > 5:
                            messages.warning(request, f"... y {len(errores) - 5} errores más.")
                    if not creados_usuarios and not actualizados_personal and not errores:
                        messages.info(request, "Archivo de empleados procesado, pero no se encontraron nuevos datos para crear o actualizar.")

                except Exception as e:
                    messages.error(request, f"Error CRÍTICO al procesar el archivo de empleados: {e}. La operación fue cancelada.")
            
            # =====================================================================
            # --- FIN: LÓGICA INTEGRADA PARA ARCHIVO DE EMPLEADOS ---
            # =====================================================================

            if not archivos_procesados:
                messages.info(request, "No se seleccionó ningún archivo para cargar.")
            return redirect('carga_masiva')
    else:
        form = CargaMasivaForm()
    context = {'form': form, 'full_width_content': True}
    return render(request, 'flota/carga_masiva.html', context)



@login_required
def configuracion_empresa_edit(request):
    config = ConfiguracionEmpresa.load()

    if request.method == "POST":
        form = ConfiguracionEmpresaForm(request.POST, instance=config)
        if form.is_valid():
            form.save()
            messages.success(request, "Configuración actualizada correctamente")
            return redirect('configuracion_empresa_edit')
    else:
        form = ConfiguracionEmpresaForm(instance=config)

    return render(request, 'flota/administracion/configuracion_empresa_form.html', {
        'form': form
    })



@login_required
def editar_registro_contable(request, vehiculo_pk, registro_pk):
    """
    Vista para editar un registro contable existente a través de un modal.
    Solo maneja peticiones POST.
    """
    connection.set_tenant(request.tenant)
    vehiculo = get_object_or_404(Vehiculo, pk=vehiculo_pk)
    registro = get_object_or_404(RegistroContableVehiculo, pk=registro_pk, vehiculo=vehiculo)

    if request.method == 'POST':
        # Pasamos `instance=registro` para que el formulario sepa que estamos editando
        form = RegistroContableVehiculoForm(request.POST, instance=registro)
        if form.is_valid():
            form.save()
            messages.success(request, '¡Registro actualizado con éxito!')
        else:
            # Si hay errores, los mostramos para que el usuario sepa qué pasó
            for field, errors in form.errors.items():
                for error in errors:
                    messages.error(request, f"Error al editar: {field} - {error}")
    
    # Redirigimos siempre a la página de análisis de costos del vehículo
    return redirect('analisis_costos_vehiculo', pk=vehiculo.pk)



@login_required
@require_POST
def eliminar_registro_contable(request, vehiculo_pk=None, registro_pk=None):
    """
    Vista para eliminar un registro contable.
    """
    connection.set_tenant(request.tenant)

    if vehiculo_pk:
        # Si viene asociado a un vehículo
        vehiculo = get_object_or_404(Vehiculo, pk=vehiculo_pk)
        registro = get_object_or_404(
            RegistroContableVehiculo,
            pk=registro_pk,
            vehiculo=vehiculo
        )
        registro.delete()
        messages.warning(request, 'El registro ha sido eliminado correctamente.')
        return redirect('analisis_costos_vehiculo', pk=vehiculo.pk)

    else:
        # Si NO tiene vehículo, se elimina igual
        registro = get_object_or_404(RegistroContableVehiculo, pk=registro_pk)
        registro.delete()
        messages.warning(request, 'El registro ha sido eliminado correctamente.')
        return redirect('analisis_costos')


from google.cloud import texttospeech


def es_supervisor_o_admin(user):
    return user.groups.filter(name__in=['Supervisor', 'Administrador']).exists()



def es_supervisor_o_admin(user):
    return user.groups.filter(name__in=['Supervisor', 'Administrador']).exists()


@login_required
@user_passes_test(es_supervisor_o_admin)
def estudio_eficiencia(request):
    connection.set_tenant(request.tenant)
    hoy = timezone.now()

    # 1. MONITOR 48H
    hace_48h = hoy - timedelta(hours=48)
    piezas_estancadas = MovimientoStock.objects.filter(
        tipo_movimiento='ENTRADA', solicitud_origen__prioridad='ALTA',
        fecha_movimiento__lte=hace_48h,
        orden_de_trabajo__estado__in=['PENDIENTE', 'PAUSADA', 'EN_PROCESO']
    ).select_related('repuesto', 'solicitud_origen__ot__vehiculo', 'usuario_responsable')

    # 2. FACTOR MERCEDES (TCO m3)
    vehiculos = Vehiculo.objects.filter(esta_activo=True).select_related('modelo')
    analisis_tco = []
    for v in vehiculos:
        gasto_total = float(v.registros_contables.aggregate(total=Sum('monto'))['total'] or 0)
        capacidad = v.capacidad_m3 if v.capacidad_m3 > 0 else 1
        eficiencia_m3 = gasto_total / (v.kilometraje_actual * capacidad) if v.kilometraje_actual > 0 else 0
        
        analisis_tco.append({
            'vehiculo': v,
            'eficiencia': eficiencia_m3,
            'gasto': gasto_total,
            'capacidad': v.capacidad_m3,
            'ultimos_movimientos': v.registros_contables.all().order_by('-fecha')[:5] # Para el CLIC
        })

    # 3. DURABILIDAD
    durabilidad = Repuesto.objects.values('origen').annotate(
        avg_km_vida=Avg(F('movimientos__orden_de_trabajo__vehiculo__kilometraje_actual'), filter=Q(movimientos__tipo_movimiento='SALIDA_OT'))
    )

    # 4. PROVEEDORES
    score_proveedores = Solicitud.objects.filter(estado='COMPLETADA').values('repuesto_referencia__proveedor_habitual__nombre').annotate(
        tiempo_medio=Avg(ExpressionWrapper(F('fecha_validacion') - F('fecha_creacion'), output_field=models.DurationField()))
    ).order_by('tiempo_medio')

    context = {
        'piezas_estancadas': piezas_estancadas,
        'analisis_tco': sorted(analisis_tco, key=lambda x: x['eficiencia']),
        'durabilidad': durabilidad,
        'score_proveedores': score_proveedores,
        'full_width_content': True
    }
    return render(request, 'flota/reportes/estudio_eficiencia.html', context)




@login_required
def firmar_certificado(request, pk):
    connection.set_tenant(request.tenant)

    ot = get_object_or_404(OrdenDeTrabajo, pk=pk)

    # buscar el personal asociado al usuario
    personal = Personal.objects.filter(user=request.user).first()

    if not personal:
        messages.error(request, "No tienes un perfil de personal asociado, no puedes firmar.")
        return redirect('ot_detail', pk=ot.pk)

    if not personal.firma_jpg:
        messages.error(request, "No tienes una firma cargada, debes subir una antes de firmar.")
        return redirect('ot_detail', pk=ot.pk)

    # asignar personal como responsable de la firma
    ot.responsableFirma = personal
    ot.save()

    ot.refresh_from_db()

    # registrar en historial
    HistorialOT.objects.create(
        orden_de_trabajo=ot,
        usuario=request.user,
        tipo_evento='FIRMA',
        descripcion=f"Certificado firmado por {personal.nombre} {personal.apellido_paterno}"
    )

    messages.success(request, "Certificado firmado correctamente.")
    return redirect('ot_detail', pk=ot.pk)



def landing_page(request):
    """
    Vista para la landing page pública del sitio.
    """
    # Esta vista simplemente renderiza una plantilla HTML. No necesita contexto.
    return render(request, 'flota/landing.html')

# --- Función de chequeo de rol ---

def landing_page(request):
    """
    Vista para la landing page pública del sitio.
    """
    return render(request, 'flota/landing.html')

# --- Función de chequeo de rol ---

def limpiar_codigo_industrial(codigo):
    """
    Limpia códigos DataMatrix de fabricantes (Mercedes, Sachs, LuK).
    Extrae el SKU real eliminando prefijos de lote o serie.
    """
    if not codigo: return ""
    # Eliminar caracteres especiales no imprimibles
    limpio = re.sub(r'[^\w\s.-]', '', codigo).strip()
    
    # Si es Mercedes (empieza por A y tiene 10-11 dígitos)
    match_mb = re.search(r'A\d{10,11}', limpio)
    if match_mb: return match_mb.group(0)
    
    # Si el código es muy largo (típico de Sachs/LuK con prefijos industriales)
    # Buscamos patrones de SKU comunes (ej: 510 0035 10 -> 510003510)
    if len(limpio) > 15:
        # Intentamos quedarnos con la parte numérica más significativa
        solo_numeros = re.sub(r'\D', '', limpio)
        if len(solo_numeros) >= 9:
            return solo_numeros[:10] # Tomamos los primeros 10 dígitos útiles
            
    return limpio



def limpiar_moneda(valor_str):
    """
    Toma un string como "$1,257,210" y lo convierte a un Decimal.
    Devuelve Decimal('0.0') si el valor es inválido.
    """
    if not isinstance(valor_str, str):
        valor_str = str(valor_str)
    
    try:
        # Elimina el símbolo de peso, las comas y los espacios
        valor_limpio = valor_str.replace('$', '').replace(',', '').strip()
        return Decimal(valor_limpio)
    except (InvalidOperation, ValueError):
        # Si la conversión falla, retorna 0
        return Decimal('0.0')




def obtener_precio_por_fecha(fecha):
    return PrecioCombustible.objects.filter(
        fecha_inicio__lte=fecha
    ).filter(
        Q(fecha_fin__gte=fecha) | Q(fecha_fin__isnull=True)
    ).order_by('-fecha_inicio').first()


def orden_create(request):
    form = OrdenDeCompraForm(request.POST or None)
    formset = LineaOrdenCompraFormset(
        request.POST or None,
        queryset=LineaOrdenCompra.objects.none()
    )

    if request.method == "POST":
        if form.is_valid() and formset.is_valid():
            orden = form.save(commit=False)
            orden.usuario_creador = request.user
            orden.save()

            lineas = formset.save(commit=False)
            for linea in lineas:
                linea.orden = orden
                linea.save()

            orden.calcular_total()

            messages.success(request, "Orden de compra creada correctamente")
            return redirect("orden_list")

    return render(request, "ordenes/form.html", {
        "form": form,
        "formset": formset
    })


def orden_delete(request, pk):
    orden = get_object_or_404(OrdenDeCompra, pk=pk)
    orden.delete()
    messages.success(request, "Orden eliminada")
    return redirect("orden_list")



def orden_edit(request, pk):
    orden = get_object_or_404(OrdenDeCompra, pk=pk)

    if orden.estado == "RECIBIDA":
        messages.error(request, "No se puede editar una orden ya recibida")
        return redirect("orden_list")

    form = OrdenDeCompraForm(request.POST or None, instance=orden)
    formset = LineaOrdenCompraFormset(request.POST or None, instance=orden)

    if request.method == "POST":
        if form.is_valid() and formset.is_valid():
            form.save()

            lineas = formset.save(commit=False)
            for linea in lineas:
                linea.orden = orden
                linea.save()

            formset.save_deleted()
            orden.calcular_total()

            messages.success(request, "Orden modificada correctamente")
            return redirect("orden_list")

    return render(request, "ordenes/form.html", {
        "orden": orden,
        "form": form,
        "formset": formset
    })


def orden_list(request):
    ordenes = OrdenDeCompra.objects.all()
    return render(request, "ordenes/lista.html", {"ordenes": ordenes})


def orden_rechazar(request, pk):
    orden = get_object_or_404(OrdenDeCompra, pk=pk)

    if orden.estado not in ["PENDIENTE", "EN_PROCESO"]:
        messages.error(request, "Esta orden ya no puede ser rechazada.")
        return redirect("orden_list")

    orden.estado = "CANCELADA"
    orden.save()

    messages.success(request, "Orden cancelada.")
    return redirect("orden_list")


def orden_recibir(request, pk):
    orden = get_object_or_404(OrdenDeCompra, pk=pk)

    if orden.estado != "EN_PROCESO":
        messages.error(request, "Solo órdenes en proceso pueden recibirse.")
        return redirect("orden_list")

    orden.marcar_como_recibida(usuario=request.user)

    messages.success(request, "Orden recibida correctamente. Stock actualizado.")
    return redirect("orden_list")"""


### GPS ###

def orden_validar(request, pk):
    orden = get_object_or_404(OrdenDeCompra, pk=pk)

    if orden.estado != "PENDIENTE":
        messages.error(request, "Solo puedes validar órdenes pendientes.")
        return redirect("orden_list")

    orden.estado = "EN_PROCESO"
    orden.save()

    messages.success(request, "Orden validada y en proceso.")
    return redirect("orden_list")



@login_required
def registrar_movimiento(request, repuesto_pk):
    """
    Vista para registrar una entrada, salida o ajuste manual de stock
    para un repuesto específico.
    """
    connection.set_tenant(request.tenant)
    repuesto = get_object_or_404(Repuesto, pk=repuesto_pk)

    if request.method == 'POST':
        form = MovimientoStockForm(request.POST)
        if form.is_valid():
            movimiento = form.save(commit=False)
            movimiento.repuesto = repuesto
            movimiento.usuario_responsable = request.user

            movimiento.save()

            messages.success(request, f'Movimiento de stock para "{repuesto.nombre}" registrado con éxito.')
            return redirect('repuesto_detail', pk=repuesto.pk)
    else:
        form = MovimientoStockForm()

    context = {
        'form': form,
        'repuesto': repuesto
    }
    return render(request, 'flota/movimiento_stock_form.html', context)



@require_POST
def validar_solicitud(request, solicitud_id):
    data = json.loads(request.body)
    accion = data.get('accion')

    solicitud = Solicitud.objects.get(id=solicitud_id)

    if accion == 'aprobar':
        solicitud.estado = 'APROBADA'
    elif accion == 'rechazar':
        solicitud.estado = 'RECHAZADA'

    solicitud.usuario_validador = request.user
    solicitud.fecha_validacion = timezone.now()
    solicitud.save()

    return JsonResponse({'status': 'ok'})



