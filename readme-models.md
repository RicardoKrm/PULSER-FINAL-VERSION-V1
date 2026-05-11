# flota/models.py

# ==============================================================================
#                  Asegúrate que estos imports estén al inicio de tu archivo
# ==============================================================================
from django.db import models
from django.conf import settings
from django.utils import timezone # <-- Asegúrate que timezone esté importado
from django.contrib.auth.models import Group, User
from django.db import transaction
from django.db.models import Sum, F, Q # <-- Asegúrate que Sum, F y Q estén aquí
from decimal import Decimal
from django.db.models.signals import post_save
from django.dispatch import receiver
from django import forms
from datetime import timedelta
# ==============================================================================
#                      MODELOS DE CATÁLOGO Y SOPORTE (tus modelos existentes)
# ==============================================================================

class Proveedor(models.Model):
    nombre = models.CharField(max_length=150, unique=True)
    rut = models.CharField(max_length=20, blank=True, null=True)
    direccion = models.CharField(max_length=255, blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    def __str__(self): return self.nombre


class DisenoBanda(models.Model):
    nombre = models.CharField(max_length=100, unique=True, help_text="Ej: Michelin XZY-3, Goodyear G622")
    marca = models.CharField(max_length=50, blank=True, null=True, help_text="Ej: Michelin, Goodyear")

    def __str__(self):
        return self.nombre

class ConsumoInterno(models.Model):
    CATEGORIA_CHOICES = [
        ('EPP', 'EPP / Seguridad'),
        ('ASEO', 'Aseo / Oficina'),
        ('TALLER', 'Insumos Taller (Grasa, Pernos, etc.)'),
        ('OTROS', 'Otros Gastos Generales'),
    ]
    repuesto = models.ForeignKey('Repuesto', on_delete=models.CASCADE)
    cantidad = models.DecimalField(max_digits=10, decimal_places=2)
    categoria = models.CharField(max_length=20, choices=CATEGORIA_CHOICES)
    fecha_validacion = models.DateTimeField(auto_now_add=True)
    usuario_validador = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    monto_total = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.repuesto.nombre} - {self.get_categoria_display()}"


class MedidaNeumatico(models.Model):
    medida = models.CharField(max_length=50, unique=True, help_text="Ej: 295/80R22.5")
    def __str__(self):
        return self.medida

class TrenMotriz(models.Model):
    nombre_configuracion = models.CharField(max_length=50, unique=True, help_text="Ej: 6x2, 4x2, 8x4")
    numero_ejes = models.PositiveIntegerField()
    numero_posiciones = models.PositiveIntegerField()
    diagrama = models.ImageField(upload_to='tren_motriz/', help_text="Subir una imagen del diagrama del tren motriz")
    def __str__(self):
        return self.nombre_configuracion


class Neumatico(models.Model):
    ESTADO_CHOICES = [
        ('NUEVO', 'Nuevo en Bodega'),
        ('USADO', 'Usado en Bodega'),
        ('MONTADO', 'Montado en Vehículo'),
        ('RECAUCHE', 'En Proceso de Recauche'),
        ('BAJA', 'Dado de Baja'),
    ]

    MOTIVO_BAJA_CHOICES = [
        ('FIN_VIDA_UTIL', 'Fin de Vida Útil (Desgaste Normal)'),
        ('IMPACTO', 'Daño por Impacto (Golpe/Corte)'),
        ('BAJA_PRESION', 'Daño por Baja Presión Crónica'),
        ('DESGASTE_IRREGULAR', 'Desgaste Irregular (Alineación/Balanceo)'),
        ('RECAUCHE_FALLIDO', 'Falla de Recauche'),
        ('OTROS', 'Otros'),
    ]

    dot = models.CharField(max_length=20, unique=True, verbose_name="DOT / N° de Fuego")
    medida = models.ForeignKey(MedidaNeumatico, on_delete=models.PROTECT)
    diseno = models.ForeignKey(DisenoBanda, on_delete=models.PROTECT)
    estado = models.CharField(max_length=15, choices=ESTADO_CHOICES, default='NUEVO')
    fecha_compra = models.DateField()
    costo_inicial = models.DecimalField(max_digits=10, decimal_places=2)

    # Datos de montaje actual
    vehiculo_montado = models.ForeignKey(
        'Vehiculo',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='neumaticos_montados'
    )
    posicion_montaje = models.PositiveIntegerField(null=True, blank=True, help_text="Número de la posición según el tren motriz")
    fecha_montaje = models.DateField(null=True, blank=True)
    km_montaje = models.PositiveIntegerField(null=True, blank=True)

    # Acumulados
    km_acumulados = models.PositiveIntegerField(default=0)

    # Campo nuevo para el motivo de la baja
    motivo_baja = models.CharField(
        max_length=50,
        choices=MOTIVO_BAJA_CHOICES,
        blank=True,
        null=True,
        verbose_name="Motivo de la Baja"
    )

    def __str__(self):
        return f"{self.dot} ({self.medida})"



class TareaDiariaTaller(models.Model):
    """
    Define una tarea recurrente que debe realizarse en el taller.
    Ej: "Limpiar foso", "Ordenar pañol de herramientas".
    """
    descripcion = models.CharField(max_length=255, unique=True, help_text="Descripción de la tarea diaria.")
    activa = models.BooleanField(default=True, help_text="Desmarcar para ocultar esta tarea del checklist.")
    orden = models.PositiveIntegerField(default=0, help_text="Para ordenar las tareas en la lista (menor a mayor).")

    class Meta:
        ordering = ['orden', 'descripcion']
        verbose_name = "Tarea Diaria de Taller"
        verbose_name_plural = "Tareas Diarias de Taller"

    def __str__(self):
        return self.descripcion

class RegistroChecklistDiario(models.Model):
    """
    Registra si una TareaDiariaTaller fue completada en una fecha específica.
    """
    tarea = models.ForeignKey(TareaDiariaTaller, on_delete=models.CASCADE)
    fecha = models.DateField(db_index=True)
    completada = models.BooleanField(default=False)
    usuario_completo = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='checklist_completados')
    fecha_hora_completo = models.DateTimeField(null=True, blank=True)

    class Meta:
        # Asegura que solo haya un registro por tarea y día
        unique_together = ('tarea', 'fecha')
        ordering = ['fecha', 'tarea__orden']
        verbose_name = "Registro de Checklist Diario"
        verbose_name_plural = "Registros de Checklist Diario"

    def __str__(self):
        return f"{self.tarea.descripcion} - {self.fecha} - {'Completada' if self.completada else 'Pendiente'}"


class HistorialParametrosNeumatico(models.Model):
    neumatico = models.ForeignKey(Neumatico, on_delete=models.CASCADE, related_name='historial_parametros')
    
    # --- Vínculo con la Orden de Trabajo ---
    ot = models.ForeignKey(
        'OrdenDeTrabajo', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='inspecciones_neumaticos',
        verbose_name="Orden de Trabajo Asociada"
    )
    
    fecha_inspeccion = models.DateTimeField(default=timezone.now)
    inspector = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )

    presion_psi = models.PositiveIntegerField(verbose_name="Presión (PSI)")
    remanente_mm = models.DecimalField(max_digits=4, decimal_places=2, verbose_name="Remanente (mm)")
    km_vehiculo_inspeccion = models.PositiveIntegerField(verbose_name="KM del Vehículo en la Inspección")
    
    # --- Campo para la Foto (Punto clave de la pizarra) ---
    foto_estado = models.ImageField(
        upload_to='neumaticos/inspecciones/', 
        null=True, 
        blank=True,
        verbose_name="Foto de Evidencia"
    )

    notas = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-fecha_inspeccion']

    def __str__(self):
        return f"Inspección de {self.neumatico.dot} el {self.fecha_inspeccion.strftime('%d/%m/%Y')}"




class Contrato(models.Model):
    ESTADO_CHOICES = [('ACTIVO', 'Activo'), ('FINALIZADO', 'Finalizado'), ('PENDIENTE', 'Pendiente')]

    # --- NUEVO CAMPO: TIPO DE FACTURACIÓN ---
    TIPO_FACTURACION_CHOICES = [
        ('FIJO_MENSUAL', 'Fijo Mensual'),
        ('POR_KM', 'Por Kilómetro'),
        ('POR_HORA', 'Por Hora de Servicio'),
        ('POR_VIAJE', 'Por Viaje/Tramo'),
        ('HIBRIDO', 'Híbrido (Fijo + Variable)'),
    ]

    # --- DATOS GENERALES ---
    nombre = models.CharField(max_length=200, unique=True, help_text="Ej: 'Transporte Minera Escondida 2024'")
    cliente = models.CharField(max_length=200, help_text="Nombre de la empresa cliente")
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    estado = models.CharField(max_length=15, choices=ESTADO_CHOICES, default='ACTIVO')

    # --- ESTRUCTURA DE INGRESOS ---
    tipo_facturacion = models.CharField(max_length=20, choices=TIPO_FACTURACION_CHOICES, default='FIJO_MENSUAL')

    valor_fijo_mensual_clp = models.DecimalField(
        max_digits=14, decimal_places=2, null=True, blank=True,
        verbose_name="Valor Fijo Mensual (CLP)",
        help_text="Llenar si la facturación es Fija o Híbrida."
    )
    valor_por_km_clp = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        verbose_name="Valor por KM Recorrido (CLP)",
        help_text="Llenar si la facturación es por Kilómetro."
    )
    valor_por_hora_clp = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        verbose_name="Valor por Hora de Servicio (CLP)",
        help_text="Llenar si la facturación es por Hora."
    )

    # --- DATOS ASOCIADOS ---
    vehiculos = models.ManyToManyField(
        'Vehiculo',
        blank=True,
        related_name='contratos',
        help_text="Vehículos asignados a este contrato."
    )

    notas = models.TextField(blank=True, null=True, verbose_name="Notas Adicionales")

    class Meta:
        ordering = ['-fecha_inicio']
        verbose_name = "Contrato de Servicio"
        verbose_name_plural = "Contratos de Servicio"

    def __str__(self):
        return f"{self.nombre} ({self.cliente})"



class ModeloVehiculo(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    marca = models.CharField(max_length=50)
    tipo = models.CharField(max_length=50, help_text="Ej: Bus, Camión, Camioneta")
    rendimiento_optimo_kml = models.DecimalField(
        max_digits=5, decimal_places=2, default=5.0,
        verbose_name="Rendimiento Óptimo (Km/L)",
        help_text="Rendimiento en Km/L a partir del cual se considera 'ÓPTIMO' (verde)."
    )
    rendimiento_regular_kml = models.DecimalField(
        max_digits=5, decimal_places=2, default=4.0,
        verbose_name="Rendimiento Regular (Km/L)",
        help_text="Rendimiento en Km/L a partir del cual se considera 'REGULAR' (amarillo)."
    )
    # --- CAMPO CRUCIAL para la lógica del ciclo infinito ---
    longitud_ciclo_mantenimiento_km = models.PositiveIntegerField(
        default=0,
        help_text="Longitud en KM de un ciclo COMPLETO de mantenimiento para este modelo (ej. 50000 KM).",
        verbose_name="Longitud Ciclo Mantenimiento (KM)"
    )

    tren_motriz_config = models.ForeignKey(
        'TrenMotriz', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        verbose_name="Configuración de Tren Motriz"
    )
    # --- FIN CAMPO CRUCIAL ---
    def __str__(self): return f"{self.marca} {self.nombre}"


class NormaEuro(models.Model):
    nombre = models.CharField(max_length=20, unique=True, help_text="Ej: EURO V, EURO VI")
    def __str__(self): return self.nombre# En flota/models.py, dentro de la clase ModeloVehiculo

# /opt/pulser_app/flota/models.py

# ... (tus imports existentes)
# Asegúrate que 'timezone' esté importado:
from django.utils import timezone
# ...

class Vehiculo(models.Model):
    numero_interno = models.CharField(max_length=50, unique=True, verbose_name="Número Interno")
    patente = models.CharField(max_length=10, unique=True)
    modelo = models.ForeignKey('ModeloVehiculo', on_delete=models.SET_NULL, null=True, blank=True)
    norma_euro = models.ForeignKey('NormaEuro', on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Norma Euro")
    capacidad_m3 = models.PositiveIntegerField(default=0, verbose_name="Capacidad de Carga (m3 o Ton)")
    TIPO_ACEITE_CHOICES = [
        ('SINTETICO', 'Sintético'),
        ('MINERAL', 'Mineral'),
        ('AMBOS', 'Ambos/Mixto'),
    ]
    tipo_aceite = models.CharField(
        max_length=10,
        choices=TIPO_ACEITE_CHOICES,
        blank=True,
        null=True,
        help_text="Tipo de aceite que usa el vehículo, definido en la carga masiva."
    )

    kilometraje_actual = models.PositiveIntegerField(
        default=0,
        verbose_name="Kilometraje Actual",
        help_text="El kilometraje actual del vehículo."
    )
    fecha_actualizacion_km = models.DateField(
        "Fecha de registro de KM",
        null=True, blank=True,
        help_text="Fecha en la que se registró el último kilometraje. Permite registros retroactivos."
    )
    intervalo_mantenimiento_km = models.IntegerField(default=10000, help_text="Kilómetros entre cada mantenimiento preventivo")
    esta_activo = models.BooleanField(default=True, help_text="Desmarque esta casilla para archivar el vehículo y ocultarlo de los dashboards principales.")
    chasis = models.CharField(max_length=50, blank=True)
    motor = models.CharField(max_length=50, blank=True)
    razon_social = models.CharField(max_length=150, blank=True, help_text="Razón social o propietario del vehículo")
    rut = models.CharField(max_length=20, blank=True, help_text="RUT del propietario del vehículo")
    aplicacion = models.CharField(max_length=100, blank=True, help_text="Aplicación del vehículo (ej: 'Urbano', 'Carretera', 'Minero')")
    
    # --- CAMPOS PARA SEGUIMIENTO DE ÚLTIMA PAUTA DE MANTENIMIENTO ---
    km_ultima_mantencion = models.PositiveIntegerField(
        default=0,
        verbose_name="KM Últ. Mant. (Pauta)", # Más claro que es de pauta
        help_text="Kilometraje de la última mantención PREVENTIVA significativa."
    )
    fecha_ultima_mantencion = models.DateField(
        "Fecha Últ. Mant. (Pauta)", # Más claro que es de pauta
        null=True, blank=True,
        help_text="Fecha de la última mantención PREVENTIVA significativa"
    )
    nombre_ultima_pauta_aplicada = models.CharField(
        max_length=100,
        blank=True, null=True,
        verbose_name="Tipo Últ. Pauta", # Nombre más corto para la interfaz
        help_text="Nombre corto de la pauta preventiva aplicada en el último mantenimiento significativo (ej: SM1, L)."
    )
    # --- FIN CAMPOS ---

    km_dia_manual_editable = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True,
        verbose_name="KM/día Manual",
        help_text="Promedio de KM que se espera que el vehículo recorra por día. Si se deja vacío, se calculará automáticamente con datos históricos."
    )

    class Meta:
        verbose_name = "Vehículo"
        verbose_name_plural = "Vehículos"
        ordering = ['numero_interno']

    def __str__(self):
        return f"{self.numero_interno} - {self.patente}"

    def get_absolute_url(self):
        from django.urls import reverse
        return reverse('dashboard_flota')

    def calcular_km_por_dia_promedio_antiguo(self, ultimos_dias=120, fallback_value=51.0):
        if self.pk is None:
            return fallback_value
        today = timezone.localdate()
        date_limit = today - timezone.timedelta(days=ultimos_dias)

        # Buscar kilometrajes de OTs finalizadas (cualquier tipo para el promedio general)
        relevant_ots = self.ordenes_de_trabajo.filter(
            estado='FINALIZADA',
            kilometraje_cierre__isnull=False,
            fecha_cierre__isnull=False,
            fecha_cierre__gte=date_limit
        ).order_by('fecha_cierre')
        if relevant_ots.exists():
            print('Hay OT para calcular')
            # Usar el kilometraje más antiguo y el más reciente de las OTs
            first_km = relevant_ots.first().kilometraje_cierre
            first_date = relevant_ots.first().fecha_cierre.date()
            last_km = relevant_ots.last().kilometraje_cierre
            last_date = relevant_ots.last().fecha_cierre.date()

            # Incluir el kilometraje actual si es más reciente
            if self.fecha_actualizacion_km and self.fecha_actualizacion_km > last_date and self.kilometraje_actual > last_km:
                last_km = self.kilometraje_actual
                last_date = self.fecha_actualizacion_km
            elif self.fecha_actualizacion_km and self.fecha_actualizacion_km < first_date and self.kilometraje_actual < first_km:
                 first_km = self.kilometraje_actual
                 first_date = self.fecha_actualizacion_km


            if last_date > first_date:
                km_recorridos = last_km - first_km
                dias_transcurridos = (last_date - first_date).days
                if dias_transcurridos > 0 and km_recorridos >= 0:
                    return max(km_recorridos / dias_transcurridos, 1.0)
                elif dias_transcurridos == 0 and km_recorridos > 0:
                    print(km_recorridos)
                    return float(km_recorridos)

        # Si no hay suficientes OTs, intentar con cargas de combustible
        relevant_cargas = self.cargas_combustible.filter(
            kilometraje_en_carga__isnull=False,
            fecha_carga__isnull=False,
            fecha_carga__gte=date_limit
        ).order_by('fecha_carga')
        print('cargas')
        print(relevant_cargas)
        if relevant_cargas.exists():
            # Usar el kilometraje más antiguo y el más reciente de las cargas
            first_km = relevant_cargas.first().kilometraje_en_carga
            first_date = relevant_cargas.first().fecha_carga.date()
            last_km = relevant_cargas.last().kilometraje_en_carga
            last_date = relevant_cargas.last().fecha_carga.date()

            # Incluir el kilometraje actual si es más reciente
            if self.fecha_actualizacion_km and self.fecha_actualizacion_km > last_date and self.kilometraje_actual > last_km:
                last_km = self.kilometraje_actual
                last_date = self.fecha_actualizacion_km
            elif self.fecha_actualizacion_km and self.fecha_actualizacion_km < first_date and self.kilometraje_actual < first_km:
                 first_km = self.kilometraje_actual
                 first_date = self.fecha_actualizacion_km

            if last_date > first_date:
                km_recorridos = last_km - first_km
                dias_transcurridos = (last_date - first_date).days
                if dias_transcurridos > 0 and km_recorridos >= 0:
                    return max(km_recorridos / dias_transcurridos, 1.0)
                elif dias_transcurridos == 0 and km_recorridos > 0:
                    return float(km_recorridos)

        # Si aún no se puede calcular, usar el kilometraje actual y la fecha de actualización
        if self.fecha_actualizacion_km and self.kilometraje_actual:
            print('Entramos con datos de km nomas')
            if self.kilometraje_actual > 0 and self.fecha_actualizacion_km < today:
                dias_desde_registro = (today - self.fecha_actualizacion_km).days
                if dias_desde_registro > 0:
                    return max(float(self.kilometraje_actual / dias_desde_registro), 1.0)

        # Si no hay datos suficientes en ninguno de los casos, devuelve el valor por defecto
        return fallback_value

    def calcular_km_por_dia_promedio(self, ultimos_dias=180, fallback_value=51.0):
        if self.pk is None:
            return fallback_value

        today = timezone.localdate()
        date_limit = today - timezone.timedelta(days=ultimos_dias)

        # ------------------------------------------------------------------
        # 1️⃣ PRIORIDAD MÁXIMA: ÚLTIMA MANTENCIÓN vs KM ACTUAL
        # ------------------------------------------------------------------
        if (
            self.fecha_ultima_mantencion
            and self.fecha_actualizacion_km
            and self.fecha_actualizacion_km > self.fecha_ultima_mantencion
        ):
            print('entramos a la ultima mantención con fechas')
            dias = (self.fecha_actualizacion_km - self.fecha_ultima_mantencion).days
            km_diff = self.kilometraje_actual - self.km_ultima_mantencion

            if dias > 0 and km_diff >= 0:
                print('hay DIAS============================')
                return max(float(km_diff) / dias, 1.0)

            # Caso especial: mismos KM pero fechas distintas
            if dias > 0 and km_diff == 0:
                print('hay DIAS 3============================')
                return 1.0

        # ------------------------------------------------------------------
        # 2️⃣ OTs FINALIZADAS
        # ------------------------------------------------------------------
        relevant_ots = self.ordenes_de_trabajo.filter(
            estado='FINALIZADA',
            kilometraje_cierre__isnull=False,
            fecha_cierre__isnull=False,
            fecha_cierre__gte=date_limit
        ).order_by('kilometraje_cierre')

        if relevant_ots.exists():
            print('hay ot??==============================')
            print(relevant_ots)
            first_ot = relevant_ots.first()
            last_ot = relevant_ots.last()

            first_km = first_ot.kilometraje_cierre
            first_date = first_ot.fecha_cierre.date()
            last_km = last_ot.kilometraje_cierre
            last_date = last_ot.fecha_cierre.date()

            if self.fecha_actualizacion_km and self.fecha_actualizacion_km > last_date:
                last_km = max(last_km, self.kilometraje_actual)
                last_date = self.fecha_actualizacion_km

            if last_date > first_date:
                dias = (last_date - first_date).days
                km = last_km - first_km

                if dias > 0 and km >= 0:
                    return max(float(km) / dias, 1.0)
                if dias == 0 and km > 0:
                    return float(km)

        # ------------------------------------------------------------------
        # 3️⃣ CARGAS DE COMBUSTIBLE
        # ------------------------------------------------------------------
        relevant_cargas = self.cargas_combustible.filter(
            kilometraje_en_carga__isnull=False,
            fecha_carga__isnull=False,
            fecha_carga__gte=date_limit
        ).order_by('fecha_carga')

        if relevant_cargas.exists():
            print('cargas==============================')
            print(relevant_cargas)
            first_carga = relevant_cargas.first()
            last_carga = relevant_cargas.last()

            first_km = first_carga.kilometraje_en_carga
            first_date = first_carga.fecha_carga.date()
            last_km = last_carga.kilometraje_en_carga
            last_date = last_carga.fecha_carga.date()

            if self.fecha_actualizacion_km and self.fecha_actualizacion_km > last_date:
                last_km = max(last_km, self.kilometraje_actual)
                last_date = self.fecha_actualizacion_km

            if last_date > first_date:
                dias = (last_date - first_date).days
                km = last_km - first_km

                if dias > 0 and km >= 0:
                    return max(float(km) / dias, 1.0)
                if dias == 0 and km > 0:
                    return float(km)

        # ------------------------------------------------------------------
        # 4️⃣ SOLO KM ACTUAL
        # ------------------------------------------------------------------
        if self.fecha_actualizacion_km and self.kilometraje_actual:
            if self.fecha_actualizacion_km < today:
                dias = (today - self.fecha_actualizacion_km).days
                if dias > 0:
                    print('km actual')
                    return max(float(self.kilometraje_actual) / dias, 1.0)

        # ------------------------------------------------------------------
        # 5️⃣ FALLBACK
        # ------------------------------------------------------------------
        return fallback_value


    @property
    def km_promedio_para_display(self):
        if self.km_dia_manual_editable is not None:
            return self.km_dia_manual_editable
        return self.calcular_km_por_dia_promedio()


class RegistroContableVehiculo(models.Model):
    TIPO_REGISTRO_CHOICES = [
        ('INGRESO', 'Ingreso'),
        ('COSTO', 'Costo/Egreso'),
    ]
    CATEGORIA_CHOICES = [
        ('CONTRATO', 'Ingreso por Contrato'),
        ('OPERACION_VARIABLE', 'Ingreso Variable (Viaje, KM)'),
        ('OTROS_INGRESOS', 'Otros Ingresos'),
        ('COSTO_FIJO', 'Costo Fijo (Seguros, Salarios)'),
        ('COMBUSTIBLE', 'Combustible'),
        ('MANTENIMIENTO', 'Mantenimiento y Reparaciones'),
        ('NEUMATICOS', 'Neumáticos'),
        ('PEAJES', 'Peajes y Estacionamiento'),
        ('FLUIDOS', 'Lubricantes y Fluidos'),
        ('COSTO_EXTRAORDINARIO', 'Costo Extraordinario (Multas)'),
    ]

    vehiculo = models.ForeignKey("flota.Vehiculo", on_delete=models.CASCADE, null=True, blank=True, related_name='registros_contables')

    # --- CAMBIOS REALIZADOS AQUÍ ---
    contrato = models.ForeignKey(
        'Contrato',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='registros_contables'
    )
    orden_de_trabajo = models.ForeignKey("flota.OrdenDeTrabajo", on_delete=models.SET_NULL, null=True, blank=True, related_name='registros_contables')
    carga_combustible = models.ForeignKey("flota.CargaCombustible", on_delete=models.SET_NULL, null=True, blank=True, related_name='registros_contables')
    # --- FIN DE CAMBIOS ---

    fecha = models.DateField(default=timezone.now, help_text="Fecha en que se registró el ingreso o costo.")
    tipo_registro = models.CharField(max_length=10, choices=TIPO_REGISTRO_CHOICES)
    categoria = models.CharField(max_length=30, choices=CATEGORIA_CHOICES)
    descripcion = models.CharField(max_length=255, help_text="Descripción detallada (Ej: 'Factura de peajes A-5', 'Contrato mensual', 'Cambio de aceite').")
    monto = models.DecimalField(max_digits=12, decimal_places=2, help_text="Monto del registro. Ingresar siempre como número positivo.")

    class Meta:
        ordering = ['-fecha', '-id']
        verbose_name = "Registro Contable de Vehículo"
        verbose_name_plural = "Registros Contables de Vehículos"

    def __str__(self):
        signo = "+" if self.tipo_registro == 'INGRESO' else "-"
        return f"{self.fecha.strftime('%d/%m/%Y')} - {self.vehiculo.numero_interno} - {self.get_categoria_display()}: {signo}${self.monto:,.2f}"

class Insumo(models.Model):
    nombre = models.CharField(max_length=150, unique=True)
    categoria = models.CharField(max_length=100, default="General")
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    def __str__(self): return self.nombre



class Empresa(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    def __str__(self): return self.nombre
    class Meta:
        ordering = ['nombre']

class Departamento(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    def __str__(self): return self.nombre
    class Meta:
        ordering = ['nombre']

class Cargo(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    departamento = models.ForeignKey(Departamento, on_delete=models.CASCADE, related_name='cargos')
    def __str__(self): return self.nombre
    class Meta:
        ordering = ['departamento', 'nombre']

class Personal(models.Model):
    # --- ROL_CHOICES ACTUALIZADO CON BODEGUERO ---
    ROL_CHOICES = [
        ('ADMINISTRADOR', 'Administrador'), 
        ('SUPERVISOR', 'Supervisor'), 
        ('MECANICO', 'Mecánico'), 
        ('ASISTENTE', 'Asistente'),
        ('BODEGUERO', 'Bodeguero'), # <--- Nuevo rol solicitado por Gabriel
    ]

    ESTADO_CHOICES = [('ACTIVO', 'Activo'), ('INACTIVO', 'Inactivo')]
    SEXO_CHOICES = [('HOMBRE', 'Hombre'), ('MUJER', 'Mujer'), ('OTRO', 'Otro')]
    TIPO_PRESTADOR_CHOICES = [('INTERNO', 'Interno'), ('EXTERNO', 'Externo')]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        help_text="Usuario de Django asociado para el inicio de sesión."
    )

    # Datos personales
    nombre = models.CharField(max_length=100)
    apellido_paterno = models.CharField(max_length=100)
    apellido_materno = models.CharField(max_length=100, blank=True)
    rut = models.CharField(max_length=20, unique=True)
    sexo = models.CharField(max_length=10, choices=SEXO_CHOICES, blank=True)

    # Datos laborales
    empresa = models.ForeignKey('Empresa', on_delete=models.SET_NULL, null=True, blank=True)
    cargo = models.ForeignKey('Cargo', on_delete=models.SET_NULL, null=True, blank=True)
    rol = models.CharField(max_length=20, choices=ROL_CHOICES, default='ASISTENTE') 
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='ACTIVO')
    tipo_prestador = models.CharField(max_length=10, choices=TIPO_PRESTADOR_CHOICES, default='INTERNO')

    # Datos económicos
    sueldo_base = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name="Sueldo Base ($)")
    valor_hora_normal = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Valor Hora Normal ($)")
    valor_hora_extra = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Valor Hora Extra ($)")

    firma_jpg = models.FileField(upload_to='firmas/', blank=True, null=True)

    def __str__(self):
        return f"{self.nombre} {self.apellido_paterno} ({self.get_rol_display()})"

    def save(self, *args, **kwargs):
        # Actualizamos el modelo User con los datos principales
        if self.user:
            self.user.first_name = self.nombre
            self.user.last_name = f"{self.apellido_paterno} {self.apellido_materno}".strip()
            # Sincronizar estado activo/inactivo
            is_active_user = (self.estado == 'ACTIVO')
            if self.user.is_active != is_active_user:
                self.user.is_active = is_active_user
            self.user.save()

        super().save(*args, **kwargs)

        # Sincronizar grupo del sistema automáticamente
        if self.user:
            try:
                rol_nombre_legible = self.get_rol_display()
                # Buscamos o creamos el grupo (Administrador, Mecánico, Bodeguero, etc.)
                grupo, created = Group.objects.get_or_create(name=rol_nombre_legible)
                if grupo not in self.user.groups.all():
                    self.user.groups.clear() # Limpiamos roles anteriores
                    self.user.groups.add(grupo)
            except Exception as e:
                print(f"ADVERTENCIA: No se pudo asignar el grupo '{rol_nombre_legible}' al usuario '{self.user.username}'. Error: {e}")





class TipoFalla(models.Model):
    CRITICIDAD_CHOICES = [('ALTA', 'Alta'), ('MEDIA', 'Media'), ('BAJA', 'Baja')]
    CAUSA_CHOICES = [('MECANICA', 'Mecánica'), ('ELECTRICA', 'Eléctrica'), ('OPERACION', 'Operación')]
    descripcion = models.CharField(max_length=255, unique=True)
    criticidad = models.CharField(max_length=20, choices=CRITICIDAD_CHOICES, default='MEDIA')
    causa = models.CharField(max_length=20, choices=CAUSA_CHOICES, default='MECANICA')
    tfs_predeterminado_min = models.PositiveIntegerField(
        default=60,
        help_text="Tiempo Fuera de Servicio predeterminado en minutos para este tipo de falla."
    )
    def __str__(self): return self.descripcion

class ConfiguracionEmpresa(models.Model):
    GPS_CHOICES = [
        ("GPS1", "GPS Global"),
        ("GPS2", "Fleetsatlatam"),
    ]
    
    porcentaje_alerta_mantenimiento = models.PositiveIntegerField(
        default=25,
        help_text="Porcentaje del intervalo de KM para activar la alerta 'PRÓXIMO'."
    )

    horas_laborales_mes_por_persona = models.PositiveIntegerField(
        default=160,
        verbose_name="Horas Laborales Base por Mes"
    )

    gps_api_token = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Token GPS Global"
    )

    gps_proveedor = models.CharField(
        max_length=10,
        choices=GPS_CHOICES,
        default="GPS1"
    )

    gps2_username = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Usuario"
    )

    gps2_password = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Password"
    )

    def __str__(self):
        return "Configuración General de la Empresa"

    class Meta:
        verbose_name_plural = "Configuraciones de Empresa"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

class Repuesto(models.Model):
    CALIDAD_CHOICES = [('ORIGINAL', 'Original'), ('OEM', 'Alternativo OEM'), ('GENERICO', 'Alternativo Genérico')]

    # --- NUEVOS CHOICES PARA INTELIGENCIA COMERCIAL ---
    ORIGEN_CHOICES = [
        ('CHINO', 'Alternativo Chino (Baja Durabilidad)'),
        ('OEM', 'Original / Marca (Alta Durabilidad)'),
        ('RECAUCHE', 'Recauche / Recuperado')
    ]
    
    CRITICIDAD_CHOICES = [
        ('PANA', 'Crítico "Pana" (Detiene el Camión)'),
        ('MINA', 'Consumo "Mina" (Desgaste Programado)'),
        ('INSUMO', 'Insumo General (No afecta disponibilidad)')
    ]
    # --------------------------------------------------

    nombre = models.CharField(max_length=255, help_text="Nombre descriptivo del repuesto (ej: Filtro de Aceite Motor OM906)")
    numero_parte = models.CharField(max_length=100, help_text="Número de parte o SKU del fabricante")
    calidad = models.CharField(max_length=20, choices=CALIDAD_CHOICES, default='GENERICO')
    
    # --- NUEVOS CAMPOS DE INTELIGENCIA ---
    origen = models.CharField(max_length=15, choices=ORIGEN_CHOICES, default='OEM', verbose_name="ADN del Repuesto")
    nivel_criticidad = models.CharField(max_length=10, choices=CRITICIDAD_CHOICES, default='MINA', verbose_name="Nivel de Criticidad")
    dias_stock_objetivo = models.PositiveIntegerField(default=15, help_text="Días de stock que queremos asegurar según rotación")
    # -------------------------------------

    stock_actual = models.PositiveIntegerField(default=0, verbose_name="Stock Actual")
    stock_minimo = models.PositiveIntegerField(default=1, verbose_name="Stock Mínimo de Alerta")
    ubicacion = models.CharField(max_length=100, blank=True, null=True, help_text="Ubicación en bodega (ej: Estante A, Casillero 3)")
    proveedor_habitual = models.ForeignKey(Proveedor, on_delete=models.SET_NULL, null=True, blank=True)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Precio Unitario")
    ocultar = models.BooleanField(default=False, help_text="Indica si se debe ocultar el repuesto")

    codigos_equivalentes = models.TextField(
        blank=True, null=True,
        help_text="Lista de códigos compatibles separados por coma (ej: LF3000, 1R-0716, P551000)"
    )
    aplicacion_maquinaria = models.CharField(
        max_length=255, blank=True, null=True,
        help_text="Ej: Excavadora CAT 320D, Motor Cummins L10"
    )

    class Meta:
        verbose_name = "Repuesto"
        verbose_name_plural = "Repuestos"
        unique_together = ('numero_parte', 'calidad')

    def __str__(self):
        return f"{self.nombre} ({self.numero_parte}) - {self.get_origen_display()}"



class MovimientoStock(models.Model):
    TIPO_MOVIMIENTO_CHOICES = [
        ('ENTRADA', 'Entrada (Compra/Recepción)'), 
        ('SALIDA_OT', 'Salida por OT'), 
        ('AJUSTE_POSITIVO', 'Ajuste de Inventario (Suma)'), 
        ('AJUSTE_NEGATIVO', 'Ajuste de Inventario (Resta)')
    ]
    
    repuesto = models.ForeignKey(Repuesto, on_delete=models.CASCADE, related_name='movimientos')
    tipo_movimiento = models.CharField(max_length=20, choices=TIPO_MOVIMIENTO_CHOICES)
    cantidad = models.IntegerField(help_text="Positivo para entradas, negativo para salidas.")
    fecha_movimiento = models.DateTimeField(auto_now_add=True)
    usuario_responsable = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    orden_de_trabajo = models.ForeignKey('OrdenDeTrabajo', on_delete=models.SET_NULL, null=True, blank=True, help_text="OT asociada a la salida de stock")

    # --- NUEVOS CAMPOS DE FLUJO OPERATIVO ---
    solicitud_origen = models.ForeignKey(
        'Solicitud', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        help_text="Vínculo con el pedido del mecánico para avisar automáticamente al recibir"
    )
    alerta_inmovilizado_enviada = models.BooleanField(
        default=False, 
        help_text="Evita que el sistema envíe múltiples alertas por el mismo ítem estancado"
    )
    # ----------------------------------------

    notas = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "Movimiento de Stock"
        verbose_name_plural = "Movimientos de Stock"
        ordering = ['-fecha_movimiento']

    def __str__(self): 
        return f"{self.get_tipo_movimiento_display()}: {self.cantidad} x {self.repuesto.nombre}"

    def save(self, *args, **kwargs):
        with transaction.atomic():
            if self.pk:
                movimiento_anterior = MovimientoStock.objects.get(pk=self.pk)
                self.repuesto.stock_actual -= movimiento_anterior.cantidad
            
            self.repuesto.stock_actual += self.cantidad
            self.repuesto.save()
            super().save(*args, **kwargs)



class Bodega(models.Model):
    TIPO_BODEGA = [
        ('PROPIA', 'Bodega Matrix (Principal)'),
        ('CONSIGNACION', 'Bodega de Consignación'),
        ('TRANSITORIA', 'Reservorio Transitorio (Turno Noche)'),
        ('MONTAJE', 'Bodega de Montaje / Taller'), # <--- NUEVO PARA PUNTO 1
    ]
    nombre = models.CharField(max_length=100)
    tipo = models.CharField(max_length=20, choices=TIPO_BODEGA)
    proveedor_asociado = models.ForeignKey('Proveedor', on_delete=models.SET_NULL, null=True, blank=True)
    numero_identificador = models.PositiveIntegerField(default=1)
    
    # Añadimos este campo ahora para dejar listo el Punto #6 del checklist
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        help_text="Usuario encargado de esta bodega"
    )

    def __str__(self):
        return f"{self.nombre} ({self.get_tipo_display()})"



class StockBodega(models.Model):
    repuesto = models.ForeignKey('Repuesto', on_delete=models.CASCADE, related_name='stocks_bodega')
    bodega = models.ForeignKey(Bodega, on_delete=models.CASCADE)
    cantidad = models.IntegerField(default=0)

    class Meta:
        unique_together = ('repuesto', 'bodega')







class OrdenDeTrabajo(models.Model):
    # --- Choices ---
    ESTADO_CHOICES = [('POR_ASIGNAR','Programada'),('PENDIENTE', 'Pendiente'), ('EN_PROCESO', 'En Proceso'), ('PAUSADA', 'Pausada'), ('CERRADA_MECANICO', 'Cerrada por Mecánico'), ('FINALIZADA', 'Finalizada')]
    TIPO_CHOICES = [('PREVENTIVA', 'Preventiva'), ('CORRECTIVA', 'Correctiva'), ('EVALUATIVA', 'Evaluativa')]
    FORMATO_CHOICES = [('INTERNO', 'Interno'), ('EXTERNO', 'Externo')]
    PRIORIDAD_CHOICES = [('BAJA', 'Baja'), ('MEDIA', 'Media'), ('ALTA', 'Alta'), ('CRITICA', 'Crítica')]

    # --- Campos (se mantienen igual) ---
    prioridad = models.CharField(max_length=10, choices=PRIORIDAD_CHOICES, default='MEDIA', verbose_name="Prioridad")
    folio = models.CharField(max_length=20, unique=True, blank=True, null=True)
    vehiculo = models.ForeignKey('Vehiculo', on_delete=models.CASCADE, related_name='ordenes_de_trabajo')
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PENDIENTE')
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    formato = models.CharField(max_length=10, choices=FORMATO_CHOICES, default='INTERNO')
    fecha_creacion = models.DateTimeField(default=timezone.now, verbose_name="Fecha de Apertura")
    fecha_cierre = models.DateTimeField(null=True, blank=True)
    fecha_programada = models.DateField(null=True, blank=True)
    hora_programada = models.TimeField(null=True, blank=True, verbose_name="Hora Programada", help_text="Hora específica para la que se programa la OT (ej: 10:30).")
    hora_finalizacion = models.TimeField(null=True, blank=True, verbose_name="Hora Finalizacion", help_text="Hora específica para la que se finalizara la OT(ej: 12:30).")
    kilometraje_apertura = models.PositiveIntegerField(null=True, blank=True)
    kilometraje_cierre = models.PositiveIntegerField(null=True, blank=True)
    observacion_inicial = models.TextField(blank=True, null=True)
    costo_total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    motivo_pendiente = models.TextField(blank=True, null=True)
    tfs_minutos = models.PositiveIntegerField(default=0, help_text="Tiempo Fuera de Servicio en minutos")
    proveedor = models.ForeignKey('Proveedor', on_delete=models.SET_NULL, null=True, blank=True)
    tipo_falla = models.ForeignKey('TipoFalla', on_delete=models.SET_NULL, null=True, blank=True)
    pauta_mantenimiento = models.ForeignKey('PautaMantenimiento', on_delete=models.SET_NULL, null=True, blank=True)
    responsable = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='ots_responsable')
    sintomas_reportados = models.TextField(blank=True, null=True)
    diagnostico_evaluacion = models.TextField(blank=True, null=True)
    empresa_manual = models.CharField(max_length=200, blank=True, null=True, verbose_name="Empresa (Manual)", help_text="Nombre de la empresa externa o cliente si aplica.")
    rut_empresa_manual = models.CharField(max_length=20, blank=True, null=True, verbose_name="RUT Empresa (Manual)")
    valor_hh_manual = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, verbose_name="Valor HH (Manual)", help_text="Costo por hora hombre para esta OT específica.")
    presupuesto_manual = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True, verbose_name="Presupuesto (Manual)", help_text="Presupuesto estimado o aprobado para esta OT.")
    motivo_pausa = models.ForeignKey('TipoPausa', on_delete=models.SET_NULL, blank=True, null=True, verbose_name="Motivo de la Pausa")
    notas_pausa = models.TextField(blank=True, null=True)
    tareas_realizadas = models.ManyToManyField('Tarea', blank=True, related_name='ordenes_de_trabajo')
    horas_extra_autorizadas = models.BooleanField(default=False, help_text="Indica si un supervisor autorizó trabajar fuera del tiempo estándar o del horario laboral.")
    personal_asignado = models.ManyToManyField(User, related_name='ots_asignadas', blank=True)
    responsableFirma = models.ForeignKey(
        "flota.Personal",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="firmas_ot"
    )
    inicio_proceso = models.DateTimeField(null=True, blank=True)
    tiempo_trabajado_segundos = models.PositiveIntegerField(default=0)

    def save(self, *args, **kwargs):
        # Lógica para generar el folio si es nuevo (esto siempre va al inicio)
        if not self.pk:
            last_ot = OrdenDeTrabajo.objects.all().order_by('id').last()
            new_id = (last_ot.id + 1) if last_ot else 1
            self.folio = f'OT-{new_id:04d}'
        
        # Guarda la instancia para asegurar que tenga un PK antes de cualquier lógica que use relaciones m2m o costos
        if self.pk:
            original = OrdenDeTrabajo.objects.get(pk=self.pk)

            # Entró en EN_PROCESO
            if original.estado != 'EN_PROCESO' and self.estado == 'EN_PROCESO':
                self.inicio_proceso = timezone.now()

            # Salió de EN_PROCESO
            if original.estado == 'EN_PROCESO' and self.estado != 'EN_PROCESO':
                if original.inicio_proceso:
                    segundos = (timezone.now() - original.inicio_proceso).total_seconds()
                    self.tiempo_trabajado_segundos += int(segundos)
                    self.inicio_proceso = None

        super().save(*args, **kwargs) 

        # Recálculo de costo total (lógica existente, se mantiene sin cambios)
        costo_insumos_agg = self.detalles_insumos_ot.aggregate(
            total_repuestos=Sum(F('cantidad') * F('repuesto_inventario__precio_unitario'), output_field=models.DecimalField()),
            total_manuales=Sum(F('cantidad') * F('insumo__precio_unitario'), output_field=models.DecimalField())
        )
        costo_total_insumos = (costo_insumos_agg.get('total_repuestos') or 0) + (costo_insumos_agg.get('total_manuales') or 0)
        costo_total_tareas = self.tareas_realizadas.aggregate(total=Sum('costo_base'))['total'] or 0
        costo_mano_obra_hh = 0
        if self.responsable and hasattr(self.responsable, 'personal') and self.tfs_minutos and self.tfs_minutos > 0:
            try:
                personal_responsable = self.responsable.personal
                valor_hora = personal_responsable.valor_hora_normal
                tfs_en_horas = self.tfs_minutos / 60.0
                costo_mano_obra_hh = tfs_en_horas * valor_hora
            except (AttributeError, TypeError):
                costo_mano_obra_hh = 0
        nuevo_costo_total = costo_total_insumos + costo_total_tareas + costo_mano_obra_hh
        if self.costo_total != nuevo_costo_total:
            # Es importante usar update() aquí para evitar un bucle de save()
            OrdenDeTrabajo.objects.filter(pk=self.pk).update(costo_total=nuevo_costo_total)
            self.costo_total = nuevo_costo_total # Actualizar la instancia en memoria también

        # Lógica para actualizar `kilometraje_actual` y `fecha_actualizacion_km` del Vehiculo
        # Esto ocurre con CUALQUIER OT finalizada que tenga un KM de cierre y sea más reciente
        if self.estado == 'FINALIZADA':
            if self.kilometraje_cierre and self.kilometraje_cierre > 0:
                # Usamos una transacción para asegurarnos de que el Vehiculo se actualice correctamente
                with transaction.atomic():
                    # Recargar el vehículo para obtener la versión más reciente en caso de modificaciones concurrentes
                    vehiculo_actualizado = self.vehiculo
                    
                    # Criterio de actualización: si el KM de la OT es mayor O la fecha de la OT es posterior.
                    # También si no hay fecha de actualización previa en el vehículo.
                    if (self.kilometraje_cierre > vehiculo_actualizado.kilometraje_actual) or \
                       (self.fecha_cierre and (not vehiculo_actualizado.fecha_actualizacion_km or self.fecha_cierre.date() > vehiculo_actualizado.fecha_actualizacion_km)):
                        
                        vehiculo_actualizado.kilometraje_actual = self.kilometraje_cierre
                        vehiculo_actualizado.fecha_actualizacion_km = self.fecha_cierre.date() if self.fecha_cierre else timezone.localdate()
                        vehiculo_actualizado.save(update_fields=['kilometraje_actual', 'fecha_actualizacion_km'])

            # --- NUEVA LÓGICA CLAVE PARA 'ÚLTIMA MANTENCIÓN PREVENTIVA' ---
            # Se actualizarán los campos `km_ultima_mantencion`, `fecha_ultima_mantencion`
            # y `nombre_ultima_pauta_aplicada` del vehículo SOLO si la OT es de un tipo relevante
            # Y SIEMPRE que los datos de esta OT sean más recientes o significativos.
            
            should_update_last_preventive_info = False
            vehiculo_a_actualizar_preventiva = self.vehiculo # Usar el objeto ya cargado
            
            last_preventive_km_in_vehiculo = vehiculo_a_actualizar_preventiva.km_ultima_mantencion
            last_preventive_date_in_vehiculo = vehiculo_a_actualizar_preventiva.fecha_ultima_mantencion

            # Condición 1: Es una OT PREVENTIVA FINALIZADA con kilometraje de cierre y pauta
            if self.tipo == 'PREVENTIVA' and self.estado == 'FINALIZADA' and \
               self.kilometraje_cierre is not None and self.pauta_mantenimiento:
                
                # Criterio de actualización: si el KM de la OT es mayor O la fecha de la OT es posterior.
                # También si los campos del vehículo están vacíos.
                if (self.kilometraje_cierre > last_preventive_km_in_vehiculo) or \
                   (last_preventive_km_in_vehiculo == 0 and last_preventive_date_in_vehiculo is None) or \
                   (self.fecha_cierre and (not last_preventive_date_in_vehiculo or self.fecha_cierre.date() > last_preventive_date_in_vehiculo)):
                    should_update_last_preventive_info = True
            
            # Condición 2: Es una OT CORRECTIVA o EVALUATIVA FINALIZADA, pero con pauta asignada
            # Esto cumple el requisito "si se le aplica una pauta recién se actualiza el campo de ultima pauta de mantenimiento"
            elif self.tipo in ['CORRECTIVA', 'EVALUATIVA'] and self.estado == 'FINALIZADA' and \
                 self.kilometraje_cierre is not None and self.pauta_mantenimiento:
                
                # Para correctivas/evaluativas con pauta, actualizamos si el KM es mayor
                # o la fecha es posterior. Se asume que una pauta en estas OTs indica un hito.
                if (self.kilometraje_cierre > last_preventive_km_in_vehiculo) or \
                   (self.fecha_cierre and (not last_preventive_date_in_vehiculo or self.fecha_cierre.date() > last_preventive_date_in_vehiculo)):
                    should_update_last_preventive_info = True

            # Si alguna de las condiciones se cumple, actualizamos los campos de la última preventiva del vehículo
            if should_update_last_preventive_info:
                with transaction.atomic():
                    # Recargar el vehículo para evitar posibles problemas de caché o concurrencia
                    # (aunque con el save anterior ya estaría bastante al día)
                    vehiculo_para_preventiva = Vehiculo.objects.select_for_update().get(pk=self.vehiculo.pk) 
                    
                    vehiculo_para_preventiva.km_ultima_mantencion = self.kilometraje_cierre
                    vehiculo_para_preventiva.fecha_ultima_mantencion = (
                        timezone.localdate(self.fecha_cierre)
                        if self.fecha_cierre
                        else timezone.localdate()
                    )
                    # Si hay pauta, guardamos su nombre corto. Si no hay (aunque la condición lo verifica), se guarda None.
                    vehiculo_para_preventiva.nombre_ultima_pauta_aplicada = self.pauta_mantenimiento.nombre.split('-')[0] if self.pauta_mantenimiento else None
                    vehiculo_para_preventiva.save()
            # --- FIN NUEVA LÓGICA CLAVE ---


    def __str__(self):
        return f"OT {self.folio or self.pk} - {self.vehiculo.numero_interno}"

    def has_all_parts_available(self):
        required_parts_data = RepuestoRequeridoPorTarea.objects.filter(tarea__in=self.tareas_realizadas.all()).values('repuesto_id', 'repuesto__stock_actual').annotate(total_required_for_ot=Sum('cantidad_requerida'))
        if not required_parts_data.exists(): return True
        for item in required_parts_data:
            if item['repuesto__stock_actual'] < item['total_required_for_ot']: return False
        return True
    
    @property
    def tiempo_trabajado(self):
        segundos = self.tiempo_trabajado_segundos

        if self.estado == 'EN_PROCESO' and self.inicio_proceso:
            segundos += (timezone.now() - self.inicio_proceso).total_seconds()

        return int(segundos)









# ==============================================================================
#                MODELOS DE PAUTAS, TAREAS Y SUS RELACIONES (tus modelos existentes)
# ==============================================================================

class RepuestoRequeridoPorTarea(models.Model):
    tarea = models.ForeignKey('Tarea', on_delete=models.CASCADE)
    repuesto = models.ForeignKey(Repuesto, on_delete=models.CASCADE)
    cantidad_requerida = models.PositiveIntegerField(default=1)
    class Meta: unique_together = ('tarea', 'repuesto')
    def __str__(self): return f"{self.cantidad_requerida} x {self.repuesto.nombre} para la tarea '{self.tarea.descripcion}'"

class Tarea(models.Model):
    descripcion = models.CharField(max_length=255, unique=True)
    tiempo_estandar_minutos = models.PositiveIntegerField(
        default=60,
        help_text="Tiempo estándar para completar esta tarea, en minutos."
    )
    costo_base = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Costo base de mano de obra para esta tarea, sin incluir repuestos.")
    repuestos_requeridos = models.ManyToManyField(Repuesto, through=RepuestoRequeridoPorTarea, blank=True, related_name='tareas_que_lo_requieren')
    def __str__(self): return self.descripcion




class PautaMantenimiento(models.Model):
    nombre = models.CharField(
        max_length=100,
        help_text="Nombre único de la regla (ej: SM1-SINTETICO)."
    )
    modelo_vehiculo = models.ForeignKey(
        'ModeloVehiculo',
        on_delete=models.CASCADE,
        related_name='pautas'
    )
    kilometraje_inicial = models.PositiveIntegerField(
        help_text="Primer KM en el que se realiza esta pauta."
    )
    intervalo_1_km = models.PositiveIntegerField(
        null=True, blank=True,
        verbose_name="Intervalo 1 (KM)",
        help_text="Frecuencia principal de repetición. Dejar en blanco si es pauta única."
    )
    intervalo_2_km = models.PositiveIntegerField(
        null=True, blank=True,
        verbose_name="Intervalo 2 (KM)",
        help_text="Frecuencia secundaria para patrones alternados. Dejar en blanco si no aplica."
    )
    tareas = models.ManyToManyField('Tarea', blank=True)
    archivo_pdf = models.FileField(upload_to='pautas/', blank=True, null=True)
    tipo_aplicacion = models.CharField(max_length=50, blank=True, null=True)
    tipo_aceite = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return self.nombre






class DetalleInsumoOT(models.Model):
    orden_de_trabajo = models.ForeignKey(OrdenDeTrabajo, on_delete=models.CASCADE, related_name='detalles_insumos_ot')
    repuesto_inventario = models.ForeignKey(Repuesto, on_delete=models.SET_NULL, null=True, blank=True, related_name='detalles_ot_asociados_consumo')
    insumo = models.ForeignKey(Insumo, on_delete=models.PROTECT, null=True, blank=True)
    cantidad = models.DecimalField(max_digits=10, decimal_places=2)
    class Meta:
        constraints = [
            models.CheckConstraint(
                check=Q(repuesto_inventario__isnull=False, insumo__isnull=True) |
                      Q(repuesto_inventario__isnull=True, insumo__isnull=False),
                name='one_of_repuesto_or_insumo_not_both_v2'
            )
        ]
    def __str__(self):
        if self.repuesto_inventario: return f"{self.cantidad} x {self.repuesto_inventario.nombre} (Inv.) en OT {self.orden_de_trabajo.folio or self.orden_de_trabajo.pk}"
        elif self.insumo: return f"{self.cantidad} x {self.insumo.nombre} (Manual) en OT {self.orden_de_trabajo.folio or self.orden_de_trabajo.pk}"
        return f"{self.cantidad} x Insumo Desconocido en OT {self.orden_de_trabajo.folio or self.orden_de_trabajo.pk}"
    def save(self, *args, **kwargs):
        if self.repuesto_inventario and self.insumo: raise ValueError("Un DetalleInsumoOT no puede tener un repuesto de inventario y un insumo manual al mismo tiempo.")
        if not self.repuesto_inventario and not self.insumo: raise ValueError("Un DetalleInsumoOT debe tener un repuesto de inventario o un insumo manual.")
        super().save(*args, **kwargs)

class BitacoraDiaria(models.Model):
    vehiculo = models.ForeignKey(Vehiculo, on_delete=models.CASCADE, related_name='bitacoras')
    fecha = models.DateField()
    horas_operativas = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    horas_mantenimiento_prog = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    horas_falla = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    class Meta:
        unique_together = ('vehiculo', 'fecha')
        ordering = ['-fecha']
    def __str__(self): return f"Bitácora de {self.vehiculo.numero_interno} para {self.fecha}"

class HistorialOT(models.Model):
    TIPO_EVENTO_CHOICES = [('CREACION', 'Creación de OT'), ('ASIGNACION', 'Asignación de Personal'),('INICIO_OT', 'Inicio de Trabajos OT'), ('INICIO', 'Inicio de Tareas'), ('PAUSA', 'OT Pausada'), ('REANUDACION', 'OT Reanudada'), ('CIERRE_MECANICO', 'Cierre por Mecánico'), ('FINALIZACION', 'Finalización de OT'), ('MODIFICACION', 'Modificación de Datos'), ('COMENTARIO', 'Comentario'),('SOLICITUD','Solicitud')]
    orden_de_trabajo = models.ForeignKey(OrdenDeTrabajo, on_delete=models.CASCADE, related_name='historial')
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, help_text="Usuario que realizó la acción")
    fecha_evento = models.DateTimeField(auto_now_add=True)
    tipo_evento = models.CharField(max_length=20, choices=TIPO_EVENTO_CHOICES)
    descripcion = models.TextField(help_text="Detalle del evento. Ej: 'Pausada por falta de repuesto: Filtro de aceite.'")
    class Meta: ordering = ['-fecha_evento']
    def __str__(self):
        user_str = self.usuario.username if self.usuario else "Sistema"
        return f"{self.get_tipo_evento_display()} en OT-{self.orden_de_trabajo.folio} por {user_str}"

# ==============================================================================
#                      MODELOS DE CONTROL DE COMBUSTIBLE (tus modelos existentes)
# ==============================================================================


class CondicionAmbiental(models.Model):
    CLIMA_CHOICES = [('DESPEJADO', 'Despejado'), ('LLUVIA', 'Lluvia'), ('VIENTO', 'Viento Fuerte'), ('NIEVE', 'Nieve')]
    TRAFICO_CHOICES = [('BAJO', 'Bajo'), ('MODERADO', 'Moderado'), ('ALTO', 'Alto')]
    fecha_medicion = models.DateField()
    temperatura_celsius = models.IntegerField(default=15)
    condicion_climatica = models.CharField(max_length=20, choices=CLIMA_CHOICES, default='DESPEJADO')
    nivel_trafico = models.CharField(max_length=20, choices=TRAFICO_CHOICES, default='BAJO')
    class Meta:
        verbose_name = "Condición Ambiental"
        verbose_name_plural = "Condiciones Ambientales"
    def __str__(self): return f"{self.fecha_medicion}: {self.temperatura_celsius}°C, {self.get_condicion_climatica_display()}"

# /opt/pulser_app/flota/models.py

class Ruta(models.Model):
    nombre = models.CharField(
        max_length=150, 
        unique=True,
        help_text="Nombre descriptivo y único. Ej: 'Faena Minera', 'Urbano Santiago', 'Ruta 5 Norte'"
    )
    distancia_km = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        verbose_name="Distancia (KM)",
        help_text="Distancia estándar de la ruta en kilómetros."
    )
    
    class Meta:
        verbose_name = "Ruta de Operación"
        verbose_name_plural = "Rutas de Operación"
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre} ({self.distancia_km} km)"

class CargaCombustible(models.Model):
    vehiculo = models.ForeignKey('Vehiculo', on_delete=models.CASCADE, related_name='cargas_combustible')
    fecha_carga = models.DateTimeField(verbose_name="Fecha y Hora de Carga", default=timezone.now)
    kilometraje_en_carga = models.PositiveIntegerField(verbose_name="Kilometraje en la Carga")
    litros_cargados = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Litros Cargados")
    costo_total_carga = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Costo Total de la Carga")

    conductor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        help_text="Usuario que registró o realizó la carga."
    )
    conductor_auxiliar = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        help_text="Usuario que registró o realizó la carga.",
        related_name='cargas_como_auxiliar'
    )
    ruta = models.ForeignKey(
        Ruta,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        help_text="Ruta o tipo de operación principal desde la última carga."
    )

    # ¡CORRECCIÓN APLICADA AQUÍ! Se aumentó max_digits de 6 a 10 para evitar el error.
    rendimiento_calculado_kml = models.DecimalField(
        max_digits=10, decimal_places=2,
        null=True, blank=True, # Permite nulos para la primera carga
        verbose_name="Rendimiento del Tramo (Km/L)"
    )

    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha_carga']
        verbose_name = "Carga de Combustible"
        verbose_name_plural = "Cargas de Combustible"

    def __str__(self):
        return f"Carga de {self.vehiculo} - {self.fecha_carga.strftime('%d/%m/%Y')}"

# ¡ESTA ES LA MAGIA! Lógica automática que se ejecuta después de guardar una carga.
# Coloca este código justo después de la clase CargaCombustible.
@receiver(post_save, sender=CargaCombustible)
def actualizar_datos_post_carga(sender, instance, created, **kwargs):
    """
    Este "signal" se dispara después de que se guarda una CargaCombustible.
    1. Si es una nueva carga, calcula el rendimiento del tramo anterior.
    2. Actualiza el kilometraje del vehículo si el de la carga es más reciente.
    """
    # Solo ejecutamos la lógica de cálculo de rendimiento al CREAR un nuevo registro.
    if created:
        # Buscamos la carga inmediatamente anterior del mismo vehículo
        carga_anterior = CargaCombustible.objects.filter(
            vehiculo=instance.vehiculo,
            fecha_carga__lt=instance.fecha_carga
        ).order_by('-fecha_carga').first()

        if carga_anterior:
            distancia_recorrida = instance.kilometraje_en_carga - carga_anterior.kilometraje_en_carga
            # Usamos los litros de la carga ANTERIOR para calcular el rendimiento del tramo que acaba de terminar
            litros_consumidos = carga_anterior.litros_cargados

            # Evitamos división por cero y distancias negativas (corregiría un mal ingreso de KM)
            if litros_consumidos > 0 and distancia_recorrida > 0:
                rendimiento = Decimal(distancia_recorrida) / litros_consumidos
                # Actualizamos el rendimiento en la carga ANTERIOR.
                # Esto es más lógico: la carga_anterior ahora sabe qué rendimiento tuvo.
                #carga_anterior.rendimiento_calculado_kml = rendimiento
                # Usamos .save() con update_fields para evitar que la señal se llame a sí misma en un bucle
                #carga_anterior.save(update_fields=['rendimiento_calculado_kml'])

                #Cambios
                instance.rendimiento_calculado_kml = rendimiento
                CargaCombustible.objects.filter(pk=instance.pk).update(
                    rendimiento_calculado_kml=rendimiento
                )

    # Esta parte se ejecuta SIEMPRE (al crear o al modificar una carga)
    # para mantener el KM del vehículo siempre actualizado.
    vehiculo = instance.vehiculo
    if instance.kilometraje_en_carga > vehiculo.kilometraje_actual:
        vehiculo.kilometraje_actual = instance.kilometraje_en_carga
        vehiculo.fecha_actualizacion_km = instance.fecha_carga.date()
        vehiculo.save(update_fields=['kilometraje_actual', 'fecha_actualizacion_km'])






class Notificacion(models.Model):
    usuario_destino = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notificaciones')
    mensaje = models.CharField(max_length=255, help_text="El texto que verá el usuario. Ej: 'La OT #123 fue pausada por Juan Pérez.'")
    leida = models.BooleanField(default=False)
    url_destino = models.CharField(max_length=255, blank=True, null=True, help_text="URL a la que se dirige la notificación. Ej: /ot/123/detail/")
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ['-fecha_creacion']
        verbose_name = "Notificación"
        verbose_name_plural = "Notificaciones"
    def __str__(self): return f"Notificación para {self.usuario_destino.username}: {self.mensaje[:30]}..."



class TipoPausa(models.Model):
    nombre = models.CharField(max_length=100, unique=True, help_text="Ej: Falta de repuestos, Falla de herramienta, etc.")
    descripcion = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "Tipo de Pausa"
        verbose_name_plural = "Tipos de Pausa"
        ordering = ['nombre']

    def __str__(self):
        return self.nombre




#-------------------------------------------------------------------------------
#      ↓  ESTE ES EL CÓDIGO CORRECTO PARA EL FINAL DE models.py  ↓
#-------------------------------------------------------------------------------


class KitDeRepuestos(models.Model):
    nombre = models.CharField(max_length=150, unique=True, help_text="Nombre descriptivo del kit (ej: Kit Mantención SM1 - Filtros)")
    descripcion = models.TextField(blank=True, null=True)
    repuestos = models.ManyToManyField(Repuesto, through='DetalleKitRepuesto', blank=True, related_name="kits_donde_aparece")

    class Meta:
        verbose_name = "Kit de Repuestos"
        verbose_name_plural = "Kits de Repuestos"
        ordering = ['nombre']

    def __str__(self):
        return self.nombre

class DetalleKitRepuesto(models.Model):
    kit = models.ForeignKey(KitDeRepuestos, on_delete=models.CASCADE)
    repuesto = models.ForeignKey(Repuesto, on_delete=models.CASCADE)
    cantidad = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = ('kit', 'repuesto')
        verbose_name = "Detalle de Kit de Repuesto"
        verbose_name_plural = "Detalles de Kits de Repuestos"

    def __str__(self):
        return f"{self.cantidad} x {self.repuesto.nombre} en {self.kit.nombre}"



# /opt/pulser_app/flota/models.py

# ... (todos tus otros modelos y el primer signal se mantienen igual) ...

# ==============================================================================
#      ↓ AÑADE ESTE NUEVO SIGNAL AL FINAL DE TU ARCHIVO models.py ↓
# ==============================================================================

@receiver(post_save, sender=CargaCombustible)
def crear_registro_contable_por_combustible(sender, instance, created, **kwargs):
    """
    Este signal se dispara después de guardar una CargaCombustible.
    Si es una nueva carga, crea automáticamente un RegistroContableVehiculo
    asociado para imputar el costo a la operación del vehículo.
    """
    # Solo queremos que se ejecute al CREAR una nueva carga,
    # para no duplicar costos si se edita una carga existente.
    if created:
        # Verificamos que haya un costo total para registrar
        if instance.costo_total_carga and instance.costo_total_carga > 0:
            RegistroContableVehiculo.objects.create(
                vehiculo=instance.vehiculo,
                carga_combustible=instance, # Vinculamos el registro a esta carga específica
                fecha=instance.fecha_carga.date(),
                tipo_registro='COSTO',
                categoria='COMBUSTIBLE', # Usamos la categoría específica
                descripcion=f"Carga de {instance.litros_cargados} Lts de combustible.",
                monto=instance.costo_total_carga
            )

### ORDENES DE COMPRA ###
class OrdenDeCompra(models.Model):
    ESTADOS_OC = [
        ('PENDIENTE', 'Pendiente'),
        ('EN_PROCESO', 'En proceso'),
        ('RECIBIDA', 'Recibida'),
        ('CANCELADA', 'Cancelada'),
    ]

    proveedor = models.ForeignKey(
        Proveedor, on_delete=models.PROTECT, related_name="ordenes_compra"
    )
    fecha_creacion = models.DateTimeField(default=timezone.now)
    estado = models.CharField(max_length=20, choices=ESTADOS_OC, default='PENDIENTE')
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    usuario_creador = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True
    )

    notas = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "Orden de Compra"
        verbose_name_plural = "Órdenes de Compra"
        ordering = ['-fecha_creacion']

    def __str__(self):
        return f"OC #{self.id} - {self.proveedor.nombre}"

    def calcular_total(self):
        total = self.lineas.aggregate(
            total=models.Sum('precio_total')
        )['total'] or Decimal('0')
        self.total = total
        self.save(update_fields=['total'])
        return self.total
    def marcar_como_recibida(self, usuario=None, bodega=None): # <-- Añadimos bodega
        """
        Recibe la orden de compra, genera movimientos de stock en una bodega específica 
        y cierra las solicitudes de los mecánicos.
        """
        if self.estado == 'RECIBIDA':
            return

        with transaction.atomic():
            for linea in self.lineas.all():
                if linea.repuesto: # Solo si es un repuesto de catálogo
                    # 1. Registrar el Movimiento General
                    MovimientoStock.objects.create(
                        repuesto=linea.repuesto,
                        tipo_movimiento='ENTRADA',
                        cantidad=linea.cantidad,
                        usuario_responsable=usuario,
                        notas=f"Entrada por O.C. #{self.id} en {bodega.nombre if bodega else 'Bodega Central'}"
                    )
                    
                    # 2. ACTUALIZAR STOCK ESPECÍFICO POR BODEGA (Lo nuevo)
                    if bodega:
                        stock_b, _ = StockBodega.objects.get_or_create(
                            repuesto=linea.repuesto, 
                            bodega=bodega
                        )
                        stock_b.cantidad += linea.cantidad
                        stock_b.save()

            # 3. Finalizar solicitudes de mecánicos
            self.solicitudes_incluidas.all().update(estado='COMPLETADA')

            self.estado = 'RECIBIDA'
            self.save(update_fields=['estado'])






class LineaOrdenCompra(models.Model):
    orden = models.ForeignKey(
        OrdenDeCompra, on_delete=models.CASCADE, related_name="lineas"
    )
    # El repuesto sigue siendo opcional (para compras de taller)
    repuesto = models.ForeignKey(Repuesto, on_delete=models.PROTECT, null=True, blank=True)
    
    # --- NUEVOS CAMPOS PARA GASTOS GENERALES ---
    descripcion_manual = models.CharField(max_length=255, help_text="Ej: Resma de papel, Servicio de Limpieza", null=True, blank=True)
    centro_de_costo = models.ForeignKey(
        'CentroDeCosto', 
        on_delete=models.SET_NULL, 
        null=True, blank=True,
        help_text="Si no es para un repuesto, asignar a un centro de costo (Administración, Aseo, etc.)"
    )
    # --------------------------------------------

    cantidad = models.PositiveIntegerField()
    precio_unitario = models.DecimalField(max_digits=12, decimal_places=2)
    precio_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    notas = models.TextField(blank=True, null=True)

    def save(self, *args, **kwargs):
        self.precio_total = Decimal(self.cantidad) * self.precio_unitario
        super().save(*args, **kwargs)
        self.orden.calcular_total()

class Solicitud(models.Model):
    class EstadoSolicitud(models.TextChoices):
        EN_PROCESO = 'EN_PROCESO', 'En espera de Compra'
        ORDEN_GENERADA = 'ORDEN_GENERADA', 'En Orden de Compra'
        APROBADA = 'APROBADA', 'Aprobada (Asignada)'
        RECHAZADA = 'RECHAZADA', 'Rechazada'
        COMPLETADA = 'COMPLETADA', 'Recibido en Bodega'

    # Relación con la OT (Mantiene la trazabilidad de para qué camión es el repuesto)
    ot = models.ForeignKey(
        'OrdenDeTrabajo',
        on_delete=models.CASCADE,
        related_name='solicitudes'
    )
    solicitante = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='solicitudes_creadas'
    )

    # --- NUEVOS CAMPOS PARA GESTIÓN DE COMPRAS ---
    repuesto_nombre = models.CharField(
        max_length=255, 
        blank=True, null=True, 
        help_text="Nombre descriptivo del repuesto necesario"
    )
    repuesto_referencia = models.ForeignKey(
        'Repuesto', 
        on_delete=models.SET_NULL, 
        null=True, blank=True,
        help_text="Vínculo opcional si el repuesto ya existe en el catálogo"
    )
    cantidad = models.PositiveIntegerField(default=1)
    prioridad = models.CharField(
        max_length=10, 
        choices=[('BAJA', 'Baja'), ('MEDIA', 'Media'), ('ALTA', 'Alta')], 
        default='MEDIA'
    )

    # Vínculo con la Orden de Compra (se llena cuando el administrativo agrupa el pedido)
    orden_compra = models.ForeignKey(
        'OrdenDeCompra', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='solicitudes_incluidas'
    )

    # --- JUSTIFICACIÓN Y CONTROL (Campos originales mantenidos) ---
    motivo = models.TextField(help_text="Explicación del mecánico sobre por qué pide la pieza")
    motivo_rechazo = models.TextField(blank=True, null=True)
    estado = models.CharField(
        max_length=20,
        choices=EstadoSolicitud.choices,
        default=EstadoSolicitud.EN_PROCESO
    )

    # Usuario que valida (Administrativo o Supervisor)
    validado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='solicitudes_validadas'
    )
    fecha_validacion = models.DateTimeField(null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    # Métodos de utilidad para acciones rápidas
    def aprobar(self, usuario):
        self.estado = self.EstadoSolicitud.APROBADA
        self.validado_por = usuario
        self.fecha_validacion = timezone.now()
        self.save()

    def rechazar(self, usuario, motivo=""):
        self.estado = self.EstadoSolicitud.RECHAZADA
        self.motivo_rechazo = motivo
        self.validado_por = usuario
        self.fecha_validacion = timezone.now()
        self.save()

    def __str__(self):
        item = self.repuesto_nombre if self.repuesto_nombre else "Pedido General"
        return f"Solicitud #{self.id} - {item} ({self.get_estado_display()})"



class CentroDeCosto(models.Model):
    nombre = models.CharField(max_length=100)
    codigo = models.CharField(max_length=20, unique=True)

    def __str__(self):
        return self.nombre

class FacturaProcesada(models.Model):
    """Guarda el registro de las facturas PDF subidas para evitar duplicados."""
    nro_factura = models.CharField(max_length=50, unique=True)
    proveedor = models.ForeignKey('Proveedor', on_delete=models.CASCADE)
    fecha_emision = models.DateField()
    monto_total = models.DecimalField(max_digits=12, decimal_places=2)
    archivo_pdf = models.FileField(upload_to='facturas_ocr/')
    fecha_subida = models.DateTimeField(auto_now_add=True)
    usuario_subida = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return f"Factura {self.nro_factura} - {self.proveedor.nombre}"


# ==============================================================================
#      CEREBRO DE NOTIFICACIONES AUTOMÁTICAS (ADQUISICIONES)
# ==============================================================================

@receiver(post_save, sender=MovimientoStock)
def notificar_recepcion_repuesto(sender, instance, created, **kwargs):
    """
    Cuando entra stock y ese movimiento está ligado a una solicitud,
    le avisamos al mecánico automáticamente.
    """
    if created and instance.tipo_movimiento == 'ENTRADA' and instance.solicitud_origen:
        solicitud = instance.solicitud_origen
        mecanico = solicitud.solicitante
        
        # Creamos la notificación para el mecánico
        Notificacion.objects.create(
            usuario_destino=mecanico,
            mensaje=f"✅ ¡Buenas noticias! Llegó el repuesto '{instance.repuesto.nombre}' que pediste para el vehículo {solicitud.ot.vehiculo.numero_interno}.",
            url_destino=f"/ordenes/{solicitud.ot.id}/"
        )

class PresupuestoMensual(models.Model):
    """
    Representa un abono al presupuesto de un mes específico.
    Varios abonos se suman para dar el presupuesto total del mes.
    """
    # Quitamos 'unique=True' para permitir múltiples entradas el mismo mes
    mes = models.DateField(help_text="Primer día del mes al que pertenece (Ej: 2026-04-01)")
    
    monto_total = models.DecimalField(
        max_digits=14, 
        decimal_places=2, 
        verbose_name="Monto del Abono ($)"
    )
    
    autorizado_por = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='presupuestos_autorizados'
    )
    
    fecha_autorizacion = models.DateTimeField(auto_now_add=True)
    notas = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "Abono de Presupuesto"
        verbose_name_plural = "Abonos de Presupuesto"
        ordering = ['-fecha_autorizacion']

    def __str__(self):
        return f"{self.mes.strftime('%m/%Y')} - Abono: ${self.monto_total:,.0f}"




# 2. NUEVO MODELO: HISTORIAL DE ALERTAS ELIMINADAS (AUDITORÍA)
class HistorialAlertaIgnorada(models.Model):
    repuesto = models.ForeignKey('Repuesto', on_delete=models.CASCADE)
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    motivo = models.TextField()
    fecha = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Alerta eliminada: {self.repuesto.nombre} por {self.usuario.username}"




class AuditoriaInventario(models.Model):
    ESTADO_CHOICES = [
        ('EN_PROCESO', 'En Proceso'),
        ('ESPERANDO', 'Esperando Autorización'),
        ('FINALIZADA', 'Finalizada y Ajustada'),
        ('CANCELADA', 'Cancelada'),
    ]
    
    bodega = models.ForeignKey('Bodega', on_delete=models.CASCADE, related_name='auditorias')
    responsable = models.ForeignKey(User, on_delete=models.PROTECT)
    fecha_inicio = models.DateTimeField(auto_now_add=True)
    fecha_termino = models.DateTimeField(null=True, blank=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='EN_PROCESO')
    notas = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Auditoría #{self.id} - {self.bodega.nombre} ({self.get_estado_display()})"

class DetalleAuditoria(models.Model):
    auditoria = models.ForeignKey(AuditoriaInventario, on_delete=models.CASCADE, related_name='detalles')
    repuesto = models.ForeignKey('Repuesto', on_delete=models.CASCADE)
    stock_teorico = models.IntegerField(help_text="Stock en sistema al iniciar")
    stock_fisico = models.IntegerField(default=0)
    ubicacion_conteo = models.CharField(max_length=100, blank=True, null=True, help_text="Ej: Pasillo A, Rack 1") # PUNTO 3
    
    @property
    def diferencia(self):
        return self.stock_fisico - self.stock_teorico

    class Meta:
        unique_together = ('auditoria', 'repuesto')


class PrecioCombustible(models.Model):
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField(null=True, blank=True)  # null = vigente
    precio_por_litro = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        ordering = ['-fecha_inicio']

    def __str__(self):
        return f"{self.precio_por_litro} ({self.fecha_inicio} - {self.fecha_fin or 'Actual'})"


