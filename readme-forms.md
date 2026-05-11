from django import forms
from django.contrib.auth.models import User
from django.forms import ValidationError, inlineformset_factory
from django.contrib.auth.models import Group
from django.forms import inlineformset_factory
from datetime import date
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.db.models import Q
from .models import (
    Cargo, ConfiguracionEmpresa, Empresa, LineaOrdenCompra, OrdenDeCompra, OrdenDeTrabajo, BitacoraDiaria, PrecioCombustible, Solicitud, Vehiculo, Tarea, Insumo, DetalleInsumoOT,
    PautaMantenimiento, ModeloVehiculo, Repuesto, MovimientoStock, Personal,
    Ruta, CondicionAmbiental, CargaCombustible, TipoPausa,
    KitDeRepuestos, DetalleKitRepuesto, RegistroContableVehiculo, Contrato,
    Neumatico, MedidaNeumatico, DisenoBanda, HistorialParametrosNeumatico, Bodega, Proveedor, AuditoriaInventario, DetalleAuditoria
)



# /opt/pulser_app/flota/forms.py

class OrdenDeCompraManualForm(forms.ModelForm):
    class Meta:
        model = OrdenDeCompra
        fields = ['proveedor', 'notas']
        widgets = {
            'proveedor': forms.Select(attrs={'class': 'custom-input select2-field'}),
            'notas': forms.Textarea(attrs={'class': 'custom-input', 'rows': 3, 'placeholder': 'Detalles de la compra...'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['proveedor'].queryset = Proveedor.objects.all().order_by('nombre')



class RutaForm(forms.ModelForm):
    class Meta:
        model = Ruta
        fields = ['nombre', 'distancia_km']
        widgets = {
            'nombre': forms.TextInput(attrs={'class': 'form-input'}),
            'distancia_km': forms.NumberInput(attrs={'class': 'form-input'}),
        }
        labels = {
            'nombre': 'Nombre de la Ruta',
            'distancia_km': 'Distancia (KM)'
        }

class ContratoForm(forms.ModelForm):
    class Meta:
        model = Contrato
        # --- LISTA DE CAMPOS ACTUALIZADA PARA COINCIDIR CON TU MODELO ---
        fields = [
            'nombre',
            'cliente',
            'fecha_inicio',
            'fecha_fin',
            'estado',
            'tipo_facturacion',
            'valor_fijo_mensual_clp',
            'valor_por_km_clp',
            'valor_por_hora_clp',
            'vehiculos',
            'notas'
        ]

        widgets = {
            'nombre': forms.TextInput(attrs={'class': 'form-input'}),
            'cliente': forms.TextInput(attrs={'class': 'form-input'}),
            'fecha_inicio': forms.DateInput(attrs={'class': 'form-input', 'type': 'date'}),
            'fecha_fin': forms.DateInput(attrs={'class': 'form-input', 'type': 'date'}),
            'estado': forms.Select(attrs={'class': 'form-input'}),
            'tipo_facturacion': forms.Select(attrs={'class': 'form-input'}),
            'valor_fijo_mensual_clp': forms.NumberInput(attrs={'class': 'form-input'}),
            'valor_por_km_clp': forms.NumberInput(attrs={'class': 'form-input'}),
            'valor_por_hora_clp': forms.NumberInput(attrs={'class': 'form-input'}),
            'vehiculos': forms.SelectMultiple(attrs={'class': 'form-input select2-field'}),
            'notas': forms.Textarea(attrs={'class': 'form-input', 'rows': 3}),
        }

        labels = {
            'valor_fijo_mensual_clp': 'Valor Fijo Mensual (CLP)',
            'valor_por_km_clp': 'Valor por KM (CLP)',
            'valor_por_hora_clp': 'Valor por Hora (CLP)',
            'tipo_facturacion': 'Tipo de Facturación',
            'notas': 'Notas Adicionales',
        }

class MontarNeumaticoForm(forms.ModelForm):
    class Meta:
        model = Neumatico
        # Especificamos solo los campos que necesitamos para el montaje
        fields = ['vehiculo_montado', 'posicion_montaje', 'fecha_montaje', 'km_montaje']
        widgets = {
            'vehiculo_montado': forms.Select(attrs={'class': 'form-input select2-field'}),
            'posicion_montaje': forms.NumberInput(attrs={'class': 'form-input', 'placeholder': 'Ej: 3'}),
            'fecha_montaje': forms.DateInput(attrs={'class': 'form-input', 'type': 'date'}),
            'km_montaje': forms.NumberInput(attrs={'class': 'form-input'}),
        }
        labels = {
            'vehiculo_montado': 'Seleccionar Vehículo',
            'posicion_montaje': 'Posición de Montaje',
            'fecha_montaje': 'Fecha de Montaje',
            'km_montaje': 'Kilometraje del Vehículo al Montar',
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Hacemos que la lista de vehículos solo muestre los activos y ordenados
        self.fields['vehiculo_montado'].queryset = Vehiculo.objects.filter(esta_activo=True).order_by('numero_interno')
        self.fields['vehiculo_montado'].empty_label = "Seleccione un vehículo..."

class UserChoiceField(forms.ModelChoiceField):
    def label_from_instance(self, obj):
        try:
            nombre_completo = obj.get_full_name() or obj.username
            rol = obj.personal.get_rol_display() if hasattr(obj, 'personal') else "Sin rol"
            return f"{nombre_completo} ({rol})"
        except AttributeError:
            return obj.username

class ProveedorForm(forms.ModelForm):
    class Meta:
        model = Proveedor
        fields = ['nombre', 'rut', 'direccion', 'telefono', 'email']
        widgets = {
            'nombre': forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'Ej: Repuestos Gaval S.A.'}),
            'rut': forms.TextInput(attrs={'class': 'form-input', 'placeholder': '12.345.678-9'}),
            'direccion': forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'Av. Principal 123'}),
            'telefono': forms.TextInput(attrs={'class': 'form-input', 'placeholder': '+56 9...'}),
            'email': forms.EmailInput(attrs={'class': 'form-input', 'placeholder': 'contacto@proveedor.cl'}),
        }
        labels = {
            'nombre': 'Razón Social / Nombre',
            'rut': 'RUT',
            'direccion': 'Dirección Física',
        }



class UserMultipleChoiceField(forms.ModelMultipleChoiceField):
    def label_from_instance(self, obj):
        try:
            nombre_completo = obj.get_full_name() or obj.username
            rol = obj.personal.get_rol_display() if hasattr(obj, 'personal') else "Sin rol"
            return f"{nombre_completo} ({rol})"
        except AttributeError:
            return obj.username


class ModeloVehiculoRendimientoForm(forms.ModelForm):
    class Meta:
        model = ModeloVehiculo
        fields = ['rendimiento_optimo_kml', 'rendimiento_regular_kml']
        labels = {
            'rendimiento_optimo_kml': "Rendimiento Óptimo (Verde)",
            'rendimiento_regular_kml': "Rendimiento Regular (Amarillo)",
        }
        help_texts = {
            'rendimiento_optimo_kml': "Por encima de este valor, el rendimiento se marcará como 'Óptimo'.",
            'rendimiento_regular_kml': "Por encima de este valor (y por debajo del óptimo), se marcará como 'Regular'. Debajo, será 'Crítico'.",
        }
        widgets = {
            'rendimiento_optimo_kml': forms.NumberInput(attrs={'class': 'form-input'}),
            'rendimiento_regular_kml': forms.NumberInput(attrs={'class': 'form-input'}),
        }


class RegistroContableVehiculoForm(forms.ModelForm):
    class Meta:
        model = RegistroContableVehiculo
        # --- AÑADIMOS 'contrato' A LA LISTA DE CAMPOS ---
        fields = ['fecha', 'tipo_registro', 'categoria', 'contrato', 'descripcion', 'monto']

        widgets = {
            'fecha': forms.DateInput(
                attrs={
                    'type': 'date',
                    'class': 'form-control'
                }
            ),
            'tipo_registro': forms.Select(
                attrs={'class': 'form-control'}
            ),
            'categoria': forms.Select(
                attrs={'class': 'form-control'}
            ),
            # --- WIDGET PARA EL NUEVO CAMPO DE CONTRATO ---
            'contrato': forms.Select(
                attrs={'class': 'form-control select2-field'} # Usamos select2 para que sea buscable
            ),
            'descripcion': forms.Textarea(
                attrs={
                    'class': 'form-control',
                    'rows': 3,
                    'placeholder': 'Ej: Factura de peajes, Contrato mensual...'
                }
            ),
            'monto': forms.NumberInput(
                attrs={
                    'class': 'form-control',
                    'placeholder': 'Ingrese solo el número, ej: 150000.50'
                }
            ),
        }

        labels = {
            'fecha': 'Fecha del Registro',
            'tipo_registro': 'Tipo de Registro',
            'categoria': 'Categoría',
            'contrato': 'Contrato Asociado (Opcional)', # --- LABEL PARA EL NUEVO CAMPO ---
            'descripcion': 'Descripción',
            'monto': 'Monto ($)',
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Hacemos que el campo de contrato no sea obligatorio
        self.fields['contrato'].required = False
        self.fields['contrato'].empty_label = "Sin contrato específico"

# Reemplaza la clase OrdenDeTrabajoForm completa en /opt/pulser_app/flota/forms.py

class OrdenDeTrabajoForm(forms.ModelForm):
    kit_de_repuestos = forms.ModelChoiceField(
        queryset=KitDeRepuestos.objects.all().order_by('nombre'),
        required=False,
        label="Kit de Repuestos (Opcional)",
        widget=forms.Select(attrs={'class': 'form-input select2-field'})
    )
    personal_asignado = UserMultipleChoiceField(
        queryset=User.objects.none(),
        required=False,
        label="Personal Operativo",
        widget=forms.SelectMultiple(attrs={'class': 'form-input select2-field'}),
    )

    class Meta:
        model = OrdenDeTrabajo
        fields = [
            'vehiculo', 'tipo', 'pauta_mantenimiento', 'kit_de_repuestos',
            'kilometraje_apertura', 'kilometraje_cierre', 'fecha_creacion',
            'fecha_programada', 'hora_programada', 'prioridad', 'tipo_falla',
            'personal_asignado', 'formato', 'empresa_manual', 'rut_empresa_manual',
            'valor_hh_manual', 'presupuesto_manual', 'observacion_inicial',
            'sintomas_reportados','hora_finalizacion'
        ]
        labels = {
            'formato': 'Proveedor',
            'kilometraje_cierre': 'Kilometraje de Cierre',
            'fecha_creacion': 'Fecha de Apertura',
        }
        widgets = {
            'vehiculo': forms.Select(attrs={'class': 'form-input select2-field'}),
            'tipo': forms.Select(attrs={'class': 'form-input'}),
            'formato': forms.Select(attrs={'class': 'form-input'}),
            'kilometraje_apertura': forms.NumberInput(attrs={'class': 'form-input', 'placeholder': 'KM al abrir OT'}),
            'kilometraje_cierre': forms.NumberInput(attrs={'class': 'form-input', 'placeholder': 'KM al cerrar OT (opcional)'}),
            'fecha_creacion': forms.DateTimeInput(attrs={'class': 'form-input', 'type': 'datetime-local'},format='%Y-%m-%dT%H:%M'),
            'fecha_programada': forms.DateInput(attrs={'class': 'form-input', 'type': 'date'}, format='%Y-%m-%d'),
            'hora_programada': forms.TimeInput(attrs={'class': 'form-input', 'type': 'time'}),
            'hora_finalizacion': forms.TimeInput(attrs={'class': 'form-input', 'type': 'time'}),
            'prioridad': forms.Select(attrs={'class': 'form-input select2-field'}),
            'pauta_mantenimiento': forms.Select(attrs={'class': 'form-input select2-field'}),
            'tipo_falla': forms.Select(attrs={'class': 'form-input select2-field'}),
            'observacion_inicial': forms.Textarea(attrs={'class': 'form-input', 'rows': 2, 'placeholder': 'Observaciones o motivo...'}),
            'sintomas_reportados': forms.Textarea(attrs={'class': 'form-input', 'rows': 2, 'placeholder': 'Síntomas reportados...'}),
            'empresa_manual': forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'Nombre de la empresa cliente'}),
            'rut_empresa_manual': forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'RUT de la empresa'}),
            'valor_hh_manual': forms.NumberInput(attrs={'class': 'form-input', 'placeholder': 'Ej: 25000'}),
            'presupuesto_manual': forms.NumberInput(attrs={'class': 'form-input', 'placeholder': 'Ej: 500000'}),
            'kit_de_repuestos': forms.Select(attrs={'class': 'form-input select2-field'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['kit_de_repuestos'].required = False
        self.fields['pauta_mantenimiento'].required = False
        self.fields['tipo_falla'].required = False
        self.fields['sintomas_reportados'].required = False
        self.fields['fecha_programada'].required = False
        self.fields['hora_programada'].required = False
        self.fields['prioridad'].required = False
        self.fields['empresa_manual'].required = False
        self.fields['rut_empresa_manual'].required = False
        self.fields['valor_hh_manual'].required = False
        self.fields['presupuesto_manual'].required = False
        self.fields['kilometraje_cierre'].required = False
        self.fields['fecha_creacion'].required = False
        self.fields['formato'].required = False
        self.fields['fecha_creacion'].input_formats = ['%Y-%m-%dT%H:%M']

        roles_permitidos = Group.objects.filter(name__in=['Mecánico', 'Supervisor', 'Administrador'])
        usuarios_asignables = User.objects.filter(groups__in=roles_permitidos).select_related('personal').distinct().order_by('first_name', 'last_name')
        self.fields['personal_asignado'].queryset = usuarios_asignables

        if self.instance and self.instance.pk:
            self.fields['vehiculo'].disabled = True

    def clean(self):
        cleaned_data = super().clean()
        tipo_ot = cleaned_data.get('tipo')
        hora_programada = cleaned_data.get('hora_programada')
        hora_finalizacion = cleaned_data.get('hora_programada')
        if tipo_ot == 'PREVENTIVA':
            cleaned_data['tipo_falla'] = None
            cleaned_data['sintomas_reportados'] = ''
        elif tipo_ot in ['CORRECTIVA', 'EVALUATIVA']:
            cleaned_data['pauta_mantenimiento'] = None

        if tipo_ot == 'PREVENTIVA' and not cleaned_data.get('pauta_mantenimiento'):
            self.add_error('pauta_mantenimiento', 'Para una OT Preventiva, debe seleccionar una pauta.')
        if tipo_ot in ['CORRECTIVA', 'EVALUATIVA'] and not cleaned_data.get('tipo_falla'):
            self.add_error('tipo_falla', 'Para este tipo de OT, debe especificar un tipo de falla.')
        if tipo_ot == 'EVALUATIVA' and not cleaned_data.get('sintomas_reportados'):
            self.add_error('sintomas_reportados', 'Para una OT Evaluativa, debe describir los síntomas reportados.')
        if hora_finalizacion and hora_programada and hora_finalizacion < hora_programada:
            self.add_error('hora_finalizacion', 'La hora de finalización no puede ser anterior a la hora programada.')
        return cleaned_data


class OrdenDeCompraManualForm(forms.ModelForm):
    class Meta:
        model = OrdenDeCompra
        fields = ['proveedor', 'notas']
        widgets = {
            'proveedor': forms.Select(attrs={'class': 'form-control select2'}),
            'notas': forms.Textarea(attrs={'class': 'form-control', 'rows': 2, 'placeholder': 'Ej: Insumos mensuales oficina central...'}),
        }

# Formset para las líneas de la compra
LineaOCFormSet = inlineformset_factory(
    OrdenDeCompra,
    LineaOrdenCompra,
    fields=('repuesto', 'descripcion_manual', 'centro_de_costo', 'cantidad', 'precio_unitario'),
    extra=1, # Empieza con una fila vacía
    can_delete=True,
    widgets={
        'repuesto': forms.Select(attrs={'class': 'form-control select2'}),
        'descripcion_manual': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Describa el producto si no es un repuesto'}),
        'centro_de_costo': forms.Select(attrs={'class': 'form-control'}),
        'cantidad': forms.NumberInput(attrs={'class': 'form-control', 'min': '1'}),
        'precio_unitario': forms.NumberInput(attrs={'class': 'form-control', 'placeholder': '0.00'}),
    }
)

class ManualTareaForm(forms.ModelForm):
    """
    Formulario para crear una nueva Tarea manualmente desde la OT.
    """
    class Meta:
        model = Tarea
        fields = ['descripcion', 'tiempo_estandar_minutos', 'costo_base']
        widgets = {
            'descripcion': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Ej: Cambiar aceite de motor'}),
            'tiempo_estandar_minutos': forms.NumberInput(attrs={'class': 'form-control', 'placeholder': 'Ej: 90'}),
            'costo_base': forms.NumberInput(attrs={'class': 'form-control', 'placeholder': 'Ej: 25000'}),
        }
        labels = {
            'descripcion': 'Descripción de la Tarea (Motivo)',
            'tiempo_estandar_minutos': 'Tiempo Estándar (minutos)',
            'costo_base': 'Costo Mano de Obra ($)',
        }


class TareaForm(forms.ModelForm):
    class Meta:
        model = Tarea
        fields = ['descripcion', 'tiempo_estandar_minutos', 'costo_base']
        widgets = {
            'descripcion': forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'Ej: Cambio de aceite motor OM906'}),
            'tiempo_estandar_minutos': forms.NumberInput(attrs={'class': 'form-input'}),
            'costo_base': forms.NumberInput(attrs={'class': 'form-input'}),
        }
        labels = {
            'descripcion': 'Descripción de la Tarea',
            'tiempo_estandar_minutos': 'Tiempo Estándar (minutos)',
            'costo_base': 'Costo Mano de Obra ($)',
        }



class CambiarEstadoOTForm(forms.ModelForm):
    # --- INICIO: DEFINICIÓN EXPLÍCITA DE CAMPOS ---
    # Forzamos al campo 'estado' a usar siempre la lista completa de opciones del modelo.
    estado = forms.ChoiceField(
        choices=OrdenDeTrabajo.ESTADO_CHOICES,
        label="Nuevo Estado",
        widget=forms.Select(attrs={'class': 'form-control'})
    )

    kilometraje_cierre = forms.IntegerField(
        required=False,
        label="Kilometraje de Cierre (Requerido para Finalizar)",
        widget=forms.NumberInput(attrs={'class': 'form-control'})
    )

    motivo_pausa = forms.ModelChoiceField(
        queryset=TipoPausa.objects.all(),
        required=False,
        label="Motivo de la Pausa",
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    # --- FIN: DEFINICIÓN EXPLÍCITA DE CAMPOS ---

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Asignamos el valor inicial al campo 'estado' desde la instancia de la OT
        if self.instance:
            self.fields['estado'].initial = self.instance.estado

        if self.instance and self.instance.kilometraje_apertura:
            self.fields['kilometraje_cierre'].initial = self.instance.kilometraje_apertura

        self.fields['motivo_pausa'].empty_label = "Seleccione un motivo..."


    def clean(self):
        cleaned_data = super().clean()
        estado = cleaned_data.get("estado")
        km_cierre = cleaned_data.get("kilometraje_cierre")
        motivo = cleaned_data.get("motivo_pausa")

        if estado == 'PAUSADA' and not motivo:
            self.add_error('motivo_pausa', "Debe seleccionar un motivo para pausar la OT.")

        if estado == 'FINALIZADA':
            if not km_cierre:
                self.add_error('kilometraje_cierre', "Este campo es obligatorio para finalizar la OT.")

            km_apertura = self.instance.kilometraje_apertura
            if km_cierre and km_apertura and km_cierre < km_apertura:
                self.add_error('kilometraje_cierre', "El KM de cierre no puede ser menor al de apertura.")

        return cleaned_data

    class Meta:
        model = OrdenDeTrabajo
        fields = ['estado', 'kilometraje_cierre', 'motivo_pausa']







class BitacoraDiariaForm(forms.ModelForm):
    class Meta:
        model = BitacoraDiaria
        fields = '__all__'
        widgets = {
            'vehiculo': forms.Select(attrs={'class': 'form-control select2'}),
            'fecha': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
        }

class CargaMasivaForm(forms.Form):
    """
    Formulario para la carga masiva de datos mediante plantillas Excel estandarizadas.
    """
    archivo_vehiculos = forms.FileField(
        label="Plantilla de Flota (Vehículos)",
        required=False,
        widget=forms.ClearableFileInput(attrs={'class': 'custom-input'})
    )
    archivo_tipos_falla = forms.FileField(
        label="Plantilla de Tipos de Falla",
        required=False,
        widget=forms.ClearableFileInput(attrs={'class': 'custom-input'})
    )
    archivo_tareas = forms.FileField(
        label="Plantilla de Tareas",
        required=False,
        widget=forms.ClearableFileInput(attrs={'class': 'custom-input'})
    )
    archivo_pautas = forms.FileField(
        label="Plantilla de Pautas de Mantenimiento",
        required=False,
        widget=forms.ClearableFileInput(attrs={'class': 'custom-input'})
    )
    archivo_repuestos = forms.FileField(
        label="Plantilla de Inventario de Repuestos",
        required=False,
        widget=forms.ClearableFileInput(attrs={'class': 'custom-input'})
    )

    # --- ↓ AÑADE ESTE NUEVO CAMPO AQUÍ ↓ ---
    archivo_empleados = forms.FileField(
        label="Plantilla de Personal (Empleados)",
        required=False,
        widget=forms.ClearableFileInput(attrs={'class': 'custom-input'})
    )





class CerrarOtMecanicoForm(forms.ModelForm):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.fields['kilometraje_cierre'].required = True
        self.fields['kilometraje_cierre'].label = "Kilometraje Final de Cierre"
        self.fields['kilometraje_cierre'].help_text = "Odómetro del vehículo al finalizar el mantenimiento."

        self.fields['motivo_pendiente'].required = False

        if self.instance and self.instance.kilometraje_apertura:
            self.fields['kilometraje_cierre'].initial = self.instance.kilometraje_apertura

    def clean_kilometraje_cierre(self):
        km_cierre = self.cleaned_data.get('kilometraje_cierre')
        km_apertura = self.instance.kilometraje_apertura if self.instance else None

        if km_cierre and km_apertura and km_cierre < km_apertura:
            raise forms.ValidationError(
                "El kilometraje de cierre no puede ser menor que el de apertura."
            )
        return km_cierre

    class Meta:
        model = OrdenDeTrabajo
        fields = ['kilometraje_cierre', 'motivo_pendiente']
        widgets = {
            'kilometraje_cierre': forms.NumberInput(attrs={'class': 'form-control'}),
            'motivo_pendiente': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }



class AsignarPersonalOTForm(forms.ModelForm):
    responsable = UserChoiceField(
        queryset=User.objects.none(),
        required=False,
        label="Responsable Principal",
        widget=forms.Select(attrs={'class': 'form-control select2', 'style': 'width: 100%;'})
    )
    personal_asignado = UserMultipleChoiceField(
        queryset=User.objects.none(),
        required=False,
        label="Personal de Apoyo (Ayudantes)",
        widget=forms.SelectMultiple(attrs={'class': 'form-control select2', 'style': 'width: 100%;'})
    )

    class Meta:
        model = OrdenDeTrabajo
        fields = ['responsable', 'personal_asignado']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        roles_permitidos = Group.objects.filter(name__in=['Mecánico', 'Supervisor', 'Administrador'])

        usuarios_asignables = User.objects.filter(
            groups__in=roles_permitidos
        ).select_related('personal').distinct().order_by('first_name', 'last_name')

        self.fields['responsable'].queryset = usuarios_asignables
        self.fields['personal_asignado'].queryset = usuarios_asignables




class ManualTareaForm(forms.ModelForm):
    class Meta:
        model = Tarea
        fields = ['descripcion', 'tiempo_estandar_minutos', 'costo_base']
        widgets = {
            'descripcion': forms.TextInput(attrs={'class': 'form-control'}),
            'tiempo_estandar_minutos': forms.NumberInput(attrs={'class': 'form-control', 'placeholder': 'Ej: 90'}),
            'costo_base': forms.NumberInput(attrs={'class': 'form-control'}),
        }
        labels = {
            'tiempo_estandar_minutos': 'Tiempo Estándar (minutos)',
            'costo_base': 'Costo Mano de Obra ($)'
        }

class AsignarTareaForm(forms.Form):
    """
    Formulario para seleccionar una Tarea existente y asignarla a una OT.
    """
    tarea = forms.ModelChoiceField(
        queryset=Tarea.objects.all().order_by('descripcion'),
        label="Seleccionar Tarea de la Lista",
        widget=forms.Select(attrs={
            'class': 'form-control select2',
            'style': 'width: 100%;'
        }),
        help_text="Seleccione una tarea predefinida del catálogo."
    )

class ManualInsumoForm(forms.Form):
    nombre = forms.CharField(
        max_length=150,
        widget=forms.TextInput(attrs={'class': 'form-control'}),
        label="Nombre del Insumo"
    )
    precio_unitario = forms.DecimalField(
        max_digits=10,
        decimal_places=2,
        initial=0,
        widget=forms.NumberInput(attrs={'class': 'form-control'}),
        label="Precio Unitario"
    )
    cantidad = forms.DecimalField(
        min_value=0.01,
        widget=forms.NumberInput(attrs={'class': 'form-control'}),
        label="Cantidad"
    )

class FiltroPizarraForm(forms.Form):
    # --- Filtros Generales ---
    modelo = forms.ModelChoiceField(
        queryset=ModeloVehiculo.objects.all().order_by('nombre'),
        required=False,
        label="Modelo",
        empty_label="Todos los Modelos",
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    tipo_mantenimiento = forms.ChoiceField(
        required=False,
        label="Tipo de Mantenimiento Próximo", # Label más claro
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    numero_interno = forms.CharField(
        required=False,
        label='Nº Interno',
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Buscar por Nº Interno'})
    )

    # --- Filtros de Proyección (Futuro) ---
    fecha_desde = forms.DateField(
        required=False,
        label='Fecha Próx. Desde',
        widget=forms.DateInput(attrs={'class': 'form-control', 'type': 'date'})
    )
    fecha_hasta = forms.DateField(
        required=False,
        label='Fecha Próx. Hasta',
        widget=forms.DateInput(attrs={'class': 'form-control', 'type': 'date'})
    )

    # --- Filtros Históricos (Pasado) ---
    fecha_ult_mant_desde = forms.DateField(
        required=False,
        label='Fecha Últ. Mant. Desde',
        widget=forms.DateInput(attrs={'class': 'form-control', 'type': 'date'})
    )
    fecha_ult_mant_hasta = forms.DateField(
        required=False,
        label='Fecha Últ. Mant. Hasta',
        widget=forms.DateInput(attrs={'class': 'form-control', 'type': 'date'})
    )

    # Campo oculto para el botón de "Próximos a Alerta", no necesita label visible
    proximos_alerta = forms.BooleanField(required=False)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Lógica para poblar las opciones de Tipo de Mantenimiento
        tipos_pauta_unicos = set()
        pautas = PautaMantenimiento.objects.all().values_list('nombre', flat=True)
        for nombre_pauta in pautas:
            # Extrae la parte principal del nombre, ej. 'SL' de 'SL-SINTETICO'
            tipo = nombre_pauta.split('-')[0].strip()
            if tipo:
                tipos_pauta_unicos.add(tipo)

        # Crea las opciones para el campo de selección
        opciones_finales = [('', 'Todos los Tipos')] + sorted([(tipo, tipo) for tipo in tipos_pauta_unicos])
        self.fields['tipo_mantenimiento'].choices = opciones_finales

# /opt/pulser_app/flota/forms.py

class PausarOTForm(forms.ModelForm):
    class Meta:
        model = OrdenDeTrabajo
        # Django ahora sabe que 'motivo_pausa' debe ser un <select> con los Tipos de Pausa
        fields = ['motivo_pausa', 'notas_pausa']
        widgets = {
            'motivo_pausa': forms.Select(attrs={'class': 'form-control'}),
            'notas_pausa': forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'placeholder': 'Especifique detalles adicionales si es necesario...'}),
        }
        labels = {
            'motivo_pausa': 'Motivo de la Pausa',
            'notas_pausa': 'Notas Adicionales (Opcional)',
        }

    # Hacemos que el campo de motivo sea obligatorio en este formulario
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['motivo_pausa'].required = True
        self.fields['motivo_pausa'].empty_label = "Seleccione un motivo..."




class DiagnosticoEvaluacionForm(forms.ModelForm):
    class Meta:
        model = OrdenDeTrabajo
        fields = ['diagnostico_evaluacion']
        widgets = {
            'diagnostico_evaluacion': forms.Textarea(attrs={'class': 'form-control', 'rows': 4, 'placeholder': 'Ingrese el diagnóstico técnico aquí...'}),
        }

class OTFiltroForm(forms.Form):
    vehiculo = forms.ModelChoiceField(
        queryset=Vehiculo.objects.all(),
        required=False,
        label="Vehículo",
        widget=forms.Select(attrs={'class': 'form-control select2'})
    )
    tipo = forms.ChoiceField(
        choices=[('', 'Todos los Tipos')] + OrdenDeTrabajo.TIPO_CHOICES,
        required=False,
        label="Tipo de OT",
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    estado = forms.ChoiceField(
        choices=[('', 'Todos los Estados')] + OrdenDeTrabajo.ESTADO_CHOICES,
        required=False,
        label="Estado",
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    fecha_desde = forms.DateField(
        required=False,
        label="Fecha Desde",
        widget=forms.DateInput(attrs={'class': 'form-control', 'type': 'date'})
    )
    fecha_hasta = forms.DateField(
        required=False,
        label="Fecha Hasta",
        widget=forms.DateInput(attrs={'class': 'form-control', 'type': 'date'})
    )

class CalendarioFiltroForm(forms.Form):
    vehiculo = forms.ModelChoiceField(
        queryset=Vehiculo.objects.all(),
        required=False,
        label="Filtrar por Vehículo",
        widget=forms.Select(attrs={'class': 'custom-input select2'})
    )
    estado = forms.ChoiceField(
        choices=[('', 'Todos los Estados')] + OrdenDeTrabajo.ESTADO_CHOICES,
        required=False,
        label="Filtrar por Estado",
        widget=forms.Select(attrs={'class': 'custom-input'})
    )
    responsable = forms.ModelChoiceField(
        queryset=User.objects.filter(groups__name__in=['Mecánico', 'Supervisor']).distinct(),
        required=False,
        label="Filtrar por Responsable",
        widget=forms.Select(attrs={'class': 'custom-input select2'})
    )
    repuestos_disponibles = forms.ChoiceField(
        choices=[
            ('', 'Todos los Repuestos'),
            ('true', 'Con Repuestos Disponibles'),
            ('false', 'Faltan Repuestos')
        ],
        required=False,
        label='Disponibilidad de Repuestos',
        widget=forms.Select(attrs={'class': 'custom-input'})
    )


class RepuestoForm(forms.ModelForm):
    class Meta:
        model = Repuesto
        fields = [
            'nombre', 'numero_parte', 'calidad', 'origen',
            'nivel_criticidad', 'stock_actual', 'stock_minimo',
            'dias_stock_objetivo', 'ubicacion',
            'proveedor_habitual', 'precio_unitario'
        ]
        widgets = {
            'nombre': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Ej: Filtro de Aceite'}),
            'numero_parte': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'SKU / N° de Parte'}),
            'calidad': forms.Select(attrs={'class': 'form-control'}),
            'origen': forms.Select(attrs={'class': 'form-control'}),
            'nivel_criticidad': forms.Select(attrs={'class': 'form-control'}),
            'stock_actual': forms.NumberInput(attrs={'class': 'form-control'}),
            'stock_minimo': forms.NumberInput(attrs={'class': 'form-control'}),
            'dias_stock_objetivo': forms.NumberInput(attrs={'class': 'form-control'}),
            'ubicacion': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Ej: Pasillo 1, Estante B'}),
            'proveedor_habitual': forms.Select(attrs={'class': 'form-control select2-field'}),
            'precio_unitario': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # --- CAMPOS OBLIGATORIOS ---
        self.fields['nombre'].required = True
        self.fields['numero_parte'].required = True
        
        # --- CAMPOS OPCIONALES (Para evitar que el formulario rebote si no están en el HTML) ---
        self.fields['origen'].required = False
        self.fields['nivel_criticidad'].required = False
        self.fields['dias_stock_objetivo'].required = False
        self.fields['proveedor_habitual'].required = False
        self.fields['ubicacion'].required = False
        
        # Estilizar el campo de proveedor para que use Select2 si está disponible
        self.fields['proveedor_habitual'].empty_label = "Seleccione un proveedor..."


class MovimientoStockForm(forms.ModelForm):
    class Meta:
        model = MovimientoStock
        exclude = ['usuario_responsable', 'orden_de_trabajo', 'repuesto']
        widgets = {
            'tipo_movimiento': forms.Select(attrs={'class': 'form-control'}),
            'cantidad': forms.NumberInput(attrs={'class': 'form-control', 'placeholder': 'Ej: 10 para entradas, -2 para salidas'}),
            'notas': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }

    def clean_cantidad(self):
        cantidad = self.cleaned_data.get('cantidad')
        if cantidad == 0:
            raise forms.ValidationError("La cantidad no puede ser cero.")
        return cantidad


class CargaCombustibleForm(forms.ModelForm):
    class Meta:
        model = CargaCombustible
        fields = [
            'vehiculo', 
            'fecha_carga', 
            'kilometraje_en_carga', 
            'litros_cargados', 
            'costo_total_carga',
            'conductor',
            'conductor_auxiliar',
            'ruta'
        ]
        # AÑADIMOS LOS ESTILOS DIRECTAMENTE AQUÍ, EN LOS WIDGETS
        widgets = {
            'vehiculo': forms.Select(attrs={'class': 'modal-form-input'}),
            'fecha_carga': forms.DateTimeInput(attrs={'type': 'datetime-local', 'class': 'modal-form-input'}),
            'kilometraje_en_carga': forms.NumberInput(attrs={'class': 'modal-form-input'}),
            'litros_cargados': forms.NumberInput(attrs={'class': 'modal-form-input'}),
            'costo_total_carga': forms.NumberInput(attrs={'class': 'modal-form-input','readonly': 'readonly'}),
            'conductor': forms.Select(attrs={'class': 'modal-form-input'}),
            'conductor_auxiliar': forms.Select(attrs={'class': 'modal-form-input'}),
            'ruta': forms.Select(attrs={'class': 'modal-form-input'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['conductor'].required = False
        self.fields['conductor_auxiliar'].required = False
        self.fields['ruta'].required = False
        self.fields['ruta'].empty_label = "Sin Ruta Específica"

        # Tu lógica para poblar los conductores está perfecta y se mantiene
        # Asegúrate que los nombres de tus grupos sean correctos aquí
        self.fields['conductor'].queryset = User.objects.filter(
            is_active=True,
            groups__name__in=['Mecánico', 'Supervisor', 'Administrador', 'Gerente', 'Conductor'] # Añade aquí todos los roles que puedan registrar
        ).distinct()

        self.fields['conductor'].label_from_instance = lambda obj: f"{obj.first_name} {obj.last_name}"

        self.fields['conductor_auxiliar'].queryset = User.objects.filter(
            is_active=True,
            groups__name__in=['Mecánico', 'Supervisor', 'Administrador', 'Gerente', 'Conductor'] # Añade aquí todos los roles que puedan registrar
        ).distinct()

        self.fields['conductor_auxiliar'].label_from_instance = lambda obj: f"{obj.first_name} ({obj.last_name})"

        # Para que los vehículos y rutas salgan ordenados
        self.fields['vehiculo'].queryset = Vehiculo.objects.filter(esta_activo=True).order_by('numero_interno')
        self.fields['ruta'].queryset = Ruta.objects.all().order_by('nombre')
    
    def clean(self):
        cleaned_data = super().clean()
        fecha = cleaned_data.get('fecha_carga')
        litros = cleaned_data.get('litros_cargados')

        if fecha and litros:
            precio = obtener_precio_por_fecha(fecha)

            if not precio:
                raise forms.ValidationError("No hay precio de combustible para esa fecha")

            cleaned_data['costo_total_carga'] = litros * precio.precio_por_litro

        return cleaned_data

class UsuarioCreacionForm(forms.Form):
    username = forms.CharField(label="Nombre de usuario", max_length=150, widget=forms.TextInput(attrs={'class': 'custom-input'}))
    first_name = forms.CharField(label="Nombre", max_length=150, widget=forms.TextInput(attrs={'class': 'custom-input'}))
    last_name = forms.CharField(label="Apellido", max_length=150, widget=forms.TextInput(attrs={'class': 'custom-input'}))
    email = forms.EmailField(label="Correo electrónico", widget=forms.EmailInput(attrs={'class': 'custom-input'}))
    rut = forms.CharField(label="Rut", widget=forms.TextInput(attrs={'class': 'custom-input'}))
    password = forms.CharField(label="Contraseña", widget=forms.PasswordInput(attrs={'class': 'custom-input'}))
    grupo = forms.ModelChoiceField(
        queryset=Group.objects.exclude(name='Administrador'),
        label="Rol del Usuario",
        widget=forms.Select(attrs={'class': 'custom-input select2'})
    )
    empresa = forms.ModelChoiceField(
        queryset=Empresa.objects.all(),
        label="Empresa",
        widget=forms.Select(attrs={'class': 'custom-input select2'})
    )
    cargo = forms.ModelChoiceField(
        queryset=Cargo.objects.all(),
        label="Cargo",
        widget=forms.Select(attrs={'class': 'custom-input select2'})
    )
    firma_jpg = forms.ImageField(
        label="Firma (Imagen)",
        required=False,
        widget=forms.FileInput(attrs={'class': 'custom-input'})
    )


class UsuarioEdicionForm(forms.Form):
    first_name = forms.CharField(label="Nombre", max_length=150, widget=forms.TextInput(attrs={'class': 'custom-input'}))
    last_name = forms.CharField(label="Apellido", max_length=150, widget=forms.TextInput(attrs={'class': 'custom-input'}))
    email = forms.EmailField(label="Correo electrónico", widget=forms.EmailInput(attrs={'class': 'custom-input'}))
    grupo = forms.ModelChoiceField(
        queryset=Group.objects.exclude(name='Administrador'),
        label="Rol del Usuario",
        widget=forms.Select(attrs={'class': 'custom-input select2'})
    )
    password = forms.CharField(label="Contraseña", widget=forms.PasswordInput(attrs={'class': 'custom-input'}))
    firma_jpg = forms.ImageField(
        label="Firma (Imagen)",
        required=False,
        widget=forms.FileInput(attrs={'class': 'custom-input'})
    )

class TenantLoginForm(forms.Form):
    tenant_identifier = forms.CharField(
        label='Identificador de Empresa',
        max_length=100,
        help_text='Ejemplo: "pulser" si tu dirección es pulser.pulser.cl'
    )
    username = forms.CharField(label='Nombre de Usuario', max_length=150)
    password = forms.CharField(label='Contraseña', widget=forms.PasswordInput)



# --- REEMPLAZA VehiculoCreateForm Y VehiculoUpdateForm ---

class VehiculoCreateForm(forms.ModelForm):
    # Definimos el campo como una elección basada en el modelo PautaMantenimiento
    nombre_ultima_pauta_aplicada = forms.ModelChoiceField(
        queryset=PautaMantenimiento.objects.all(),
        required=False,
        label="Tipo Últ. Pauta",
        widget=forms.Select(attrs={'class': 'form-select select2-field'})
    )

    class Meta:
        model = Vehiculo
        fields = [
            'numero_interno', 'patente', 'modelo', 'norma_euro', 'tipo_aceite',
            'kilometraje_actual', 'intervalo_mantenimiento_km', 'esta_activo',
            'chasis', 'motor', 'razon_social', 'rut', 'aplicacion',
            'km_dia_manual_editable', 'km_ultima_mantencion', 'fecha_ultima_mantencion',
            'nombre_ultima_pauta_aplicada'
        ]
        widgets = {
            'numero_interno': forms.TextInput(attrs={'class': 'form-input'}),
            'patente': forms.TextInput(attrs={'class': 'form-input'}),
            'modelo': forms.Select(attrs={'class': 'form-select'}),
            'norma_euro': forms.Select(attrs={'class': 'form-select'}),
            'tipo_aceite': forms.Select(attrs={'class': 'form-select'}),
            'kilometraje_actual': forms.NumberInput(attrs={'class': 'form-input'}),
            'intervalo_mantenimiento_km': forms.NumberInput(attrs={'class': 'form-input'}),
            'esta_activo': forms.CheckboxInput(attrs={'class': 'form-checkbox'}),
            'chasis': forms.TextInput(attrs={'class': 'form-input'}),
            'motor': forms.TextInput(attrs={'class': 'form-input'}),
            'razon_social': forms.TextInput(attrs={'class': 'form-input'}),
            'rut': forms.TextInput(attrs={'class': 'form-input'}),
            'aplicacion': forms.TextInput(attrs={'class': 'form-input'}),
            'km_dia_manual_editable': forms.NumberInput(attrs={'class': 'form-input'}),
            'km_ultima_mantencion': forms.NumberInput(attrs={'class': 'form-input'}),
            'fecha_ultima_mantencion': forms.DateInput(attrs={'class': 'form-input', 'type': 'date'}),
        }

    def clean_nombre_ultima_pauta_aplicada(self):
        # Como el modelo Vehiculo espera un texto (CharField), 
        # extraemos solo el nombre de la pauta seleccionada.
        pauta = self.cleaned_data.get('nombre_ultima_pauta_aplicada')
        return pauta.nombre if pauta else ""


class VehiculoUpdateForm(forms.ModelForm):
    # Mismo cambio para la edición
    nombre_ultima_pauta_aplicada = forms.ModelChoiceField(
        queryset=PautaMantenimiento.objects.all(),
        required=False,
        label="Tipo Últ. Pauta",
        widget=forms.Select(attrs={'class': 'form-select select2-field'})
    )

    class Meta:
        model = Vehiculo
        fields = [
            'numero_interno', 'patente', 'modelo', 'norma_euro', 'tipo_aceite',
            'kilometraje_actual', 'intervalo_mantenimiento_km', 'esta_activo',
            'chasis', 'motor', 'razon_social', 'rut', 'aplicacion',
            'km_dia_manual_editable', 'km_ultima_mantencion', 'fecha_ultima_mantencion',
            'nombre_ultima_pauta_aplicada'
        ]
        widgets = {
            'numero_interno': forms.TextInput(attrs={'class': 'form-input'}),
            'patente': forms.TextInput(attrs={'class': 'form-input'}),
            'modelo': forms.Select(attrs={'class': 'form-select'}),
            'norma_euro': forms.Select(attrs={'class': 'form-select'}),
            'tipo_aceite': forms.Select(attrs={'class': 'form-select'}),
            'kilometraje_actual': forms.NumberInput(attrs={'class': 'form-input'}),
            'intervalo_mantenimiento_km': forms.NumberInput(attrs={'class': 'form-input'}),
            'esta_activo': forms.CheckboxInput(attrs={'class': 'form-checkbox'}),
            'chasis': forms.TextInput(attrs={'class': 'form-input'}),
            'motor': forms.TextInput(attrs={'class': 'form-input'}),
            'razon_social': forms.TextInput(attrs={'class': 'form-input'}),
            'rut': forms.TextInput(attrs={'class': 'form-input'}),
            'aplicacion': forms.TextInput(attrs={'class': 'form-input'}),
            'km_dia_manual_editable': forms.NumberInput(attrs={'class': 'form-input'}),
            'km_ultima_mantencion': forms.NumberInput(attrs={'class': 'form-input'}),
            'fecha_ultima_mantencion': forms.DateInput(format='%Y-%m-%d', attrs={'class': 'form-input', 'type': 'date'}),
        }

    def clean_nombre_ultima_pauta_aplicada(self):
        pauta = self.cleaned_data.get('nombre_ultima_pauta_aplicada')
        return pauta.nombre if pauta else ""



class AuditoriaInventarioForm(forms.ModelForm):
    class Meta:
        model = AuditoriaInventario
        fields = ['bodega', 'notas']
        widgets = {
            'bodega': forms.Select(attrs={'class': 'form-input select2-field'}),
            'notas': forms.Textarea(attrs={'class': 'form-input', 'rows': 2, 'placeholder': 'Ej: Inventario general de cierre de mes...'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['bodega'].queryset = Bodega.objects.all().order_by('numero_identificador')



class TipoPausaForm(forms.ModelForm):
    class Meta:
        model = TipoPausa
        fields = ['nombre', 'descripcion']
        widgets = {
            'nombre': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Ej: Falla de Herramienta'}),
            'descripcion': forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'placeholder': 'Descripción opcional del motivo...'}),
        }
        labels = {
            'nombre': 'Nombre del Motivo de Pausa',
            'descripcion': 'Descripción (Opcional)',
        }

# /opt/pulser_app/flota/forms.py

class PautaMantenimientoForm(forms.ModelForm):
    class Meta:
        model = PautaMantenimiento
        # --- LISTA DE CAMPOS CORREGIDA ---
        fields = [
            'nombre',
            'modelo_vehiculo',
            'kilometraje_inicial',
            'intervalo_1_km',
            'intervalo_2_km',
            'tareas',
            # 'kit_repuestos_asociado', # <-- Este campo es el que causa el error. Lo eliminamos.
            'archivo_pdf',
            'tipo_aplicacion',
            'tipo_aceite'
        ]
        widgets = {
            'nombre': forms.TextInput(attrs={'class': 'form-input'}),
            'modelo_vehiculo': forms.Select(attrs={'class': 'form-select'}),
            'kilometraje_inicial': forms.NumberInput(attrs={'class': 'form-input'}),
            'intervalo_1_km': forms.NumberInput(attrs={'class': 'form-input'}),
            'intervalo_2_km': forms.NumberInput(attrs={'class': 'form-input'}),
            'tareas': forms.SelectMultiple(attrs={'class': 'form-multiselect'}),
            # 'kit_repuestos_asociado': forms.Select(attrs={'class': 'form-select select2-field'}), # <-- WIDGET ELIMINADO
            'archivo_pdf': forms.ClearableFileInput(attrs={'class': 'form-input'}),
            'tipo_aplicacion': forms.TextInput(attrs={'class': 'form-input'}),
            'tipo_aceite': forms.TextInput(attrs={'class': 'form-input'}),
        }
        labels = {
            'kilometraje_inicial': 'Kilometraje Inicial',
            'intervalo_1_km': 'Intervalo 1 (KM)',
            'intervalo_2_km': 'Intervalo 2 (KM) - Opcional',
            # 'kit_repuestos_asociado': 'Kit de Repuestos Asociado (Opcional)', # <-- LABEL ELIMINADO
        }
        help_texts = {
            'intervalo_1_km': 'Frecuencia principal. Dejar en blanco si es pauta única.',
            'intervalo_2_km': 'Usar solo para patrones de frecuencia alternada.',
        }

class KitDeRepuestosForm(forms.ModelForm):
    class Meta:
        model = KitDeRepuestos
        fields = ['nombre', 'descripcion']
        widgets = {
            'nombre': forms.TextInput(attrs={'class': 'form-input', 'placeholder': 'Ej: Kit Mantención SM1'}),
            'descripcion': forms.Textarea(attrs={'class': 'form-input', 'rows': 3, 'placeholder': 'Descripción detallada del contenido o uso del kit...'}),
        }

DetalleKitRepuestoFormSet = inlineformset_factory(
    KitDeRepuestos,
    DetalleKitRepuesto,
    fields=('repuesto', 'cantidad'),
    extra=0,  # <-- CAMBIO CLAVE: Volvemos a 0.
    can_delete=True,
    widgets={
        # Dejamos un Select normal. El JS se encargará de convertirlo.
        'repuesto': forms.Select(attrs={'class': 'form-input repuesto-select'}),
        'cantidad': forms.NumberInput(attrs={'class': 'form-input', 'min': '1', 'value': '1'}),
    }
)

class NeumaticoForm(forms.ModelForm):
    # Volvemos a la versión simple. La magia la haremos en la vista y la plantilla.
    medida = forms.CharField(label="Medida (si ya existe)")
    diseno = forms.CharField(label="Diseño de Banda (si ya existe)")

    # --- NUEVOS CAMPOS ---
    nueva_medida = forms.CharField(
        required=False,
        label="O crear nueva medida",
        widget=forms.TextInput(attrs={'placeholder': 'Ej: 315/80R22.5'})
    )
    nuevo_diseno = forms.CharField(
        required=False,
        label="O crear nuevo diseño de banda",
        widget=forms.TextInput(attrs={'placeholder': 'Ej: Michelin X Multi D'})
    )

    class Meta:
        model = Neumatico
        fields = ['dot', 'fecha_compra', 'costo_inicial', 'estado']
        widgets = {
            'dot': forms.TextInput(attrs={'placeholder': 'DOT o N° de Fuego único'}),
            'fecha_compra': forms.DateInput(attrs={'type': 'date'}),
        }
        labels = {
            'dot': 'DOT / N° de Fuego',
            'costo_inicial': 'Costo de Compra ($)',
            'estado': 'Estado Inicial',
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Poblamos el campo 'medida' con las opciones existentes
        medidas_existentes = [(m.medida, m.medida) for m in MedidaNeumatico.objects.all()]
        self.fields['medida'] = forms.ChoiceField(
            label="Medida (si ya existe)",
            choices=[('', 'Buscar...')] + medidas_existentes,
            required=False,
            widget=forms.Select(attrs={'class': 'form-input select2-field'})
        )

        # Poblamos el campo 'diseno' con las opciones existentes
        disenos_existentes = [(d.nombre, d.nombre) for d in DisenoBanda.objects.all()]
        self.fields['diseno'] = forms.ChoiceField(
            label="Diseño de Banda (si ya existe)",
            choices=[('', 'Buscar...')] + disenos_existentes,
            required=False,
            widget=forms.Select(attrs={'class': 'form-input select2-field'})
        )

    def clean(self):
        cleaned_data = super().clean()
        if not cleaned_data.get('medida') and not cleaned_data.get('nueva_medida'):
            raise forms.ValidationError("Debe seleccionar o crear una Medida.")
        if not cleaned_data.get('diseno') and not cleaned_data.get('nuevo_diseno'):
            raise forms.ValidationError("Debe seleccionar o crear un Diseño de Banda.")
        return cleaned_data




class HistorialParametrosForm(forms.ModelForm):
    """
    Formulario para registrar una nueva inspección (parámetros) de un neumático.
    """
    class Meta:
        model = HistorialParametrosNeumatico
        # Excluimos los campos que se llenarán automáticamente en la vista
        exclude = ['neumatico', 'inspector']
        widgets = {
            'fecha_inspeccion': forms.DateTimeInput(attrs={'class': 'form-input', 'type': 'datetime-local'}),
            'presion_psi': forms.NumberInput(attrs={'class': 'form-input', 'placeholder': 'Ej: 120'}),
            'remanente_mm': forms.NumberInput(attrs={'class': 'form-input', 'placeholder': 'Ej: 8.5'}),
            'km_vehiculo_inspeccion': forms.NumberInput(attrs={'class': 'form-input', 'placeholder': 'KM del odómetro del vehículo'}),
            'notas': forms.Textarea(attrs={'class': 'form-input', 'rows': 3}),
        }
        labels = {
            'fecha_inspeccion': 'Fecha y Hora de Inspección',
            'presion_psi': 'Presión Medida (PSI)',
            'remanente_mm': 'Remanente de Banda (mm)',
            'km_vehiculo_inspeccion': 'Kilometraje del Vehículo',
            'notas': 'Notas Adicionales',
        }

"""
class OrdenDeCompraForm(forms.ModelForm):
    class Meta:
        model = OrdenDeCompra
        fields = ['proveedor', 'notas']  # estado y total se manejan automáticamente


LineaOrdenCompraFormset = inlineformset_factory(
    OrdenDeCompra,
    LineaOrdenCompra,
    fields=['repuesto', 'cantidad', 'precio_unitario', 'notas'],
    extra=1,
    can_delete=True
)"""


class ConfiguracionEmpresaForm(forms.ModelForm):
    class Meta:
        model = ConfiguracionEmpresa
        fields = [
            'porcentaje_alerta_mantenimiento',
            'horas_laborales_mes_por_persona',
            'gps_proveedor',
            'gps_api_token',
            'gps2_username',
            'gps2_password'
        ]
        widgets = {
            'porcentaje_alerta_mantenimiento': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': 1,
                'max': 100
            }),
            'horas_laborales_mes_por_persona': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': 1
            }),
            'gps_api_token': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Token GPS Global'
            }),
            'gps_proveedor': forms.Select(attrs={
                'class': 'form-control'
            }),
            'gps2_username': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Usuario GPS Segundo Proveedor'
            }),
            'gps2_password': forms.PasswordInput(attrs={
                'class': 'form-control',
                'placeholder': 'Contraseña GPS Segundo Proveedor'
            }, render_value=True),
        }


class CargoForm(forms.ModelForm):
    class Meta:
        model = Cargo
        fields = ["nombre", "departamento"]
        widgets = {
            "nombre": forms.TextInput(attrs={
                "class": "form-control",
                "placeholder": "Nombre del cargo"
            }),
            "departamento": forms.Select(attrs={
                "class": "form-control"
            }),
        }

class SolicitudForm(forms.ModelForm):
    class Meta:
        model = Solicitud
        fields = ['motivo']  # motivo_rechazo lo usa el validador, no aquí
        widgets = {
            'motivo': forms.Textarea(attrs={'class': 'form-control', 'rows': 3})
        }

class BodegaForm(forms.ModelForm):
    class Meta:
        model = Bodega
        # Añadimos 'responsable' a la lista de campos
        fields = ['nombre', 'tipo', 'numero_identificador', 'proveedor_asociado', 'responsable']
        widgets = {
            'nombre': forms.TextInput(attrs={'class': 'custom-input'}),
            'tipo': forms.Select(attrs={'class': 'custom-input'}),
            'numero_identificador': forms.NumberInput(attrs={'class': 'custom-input'}),
            'proveedor_asociado': forms.Select(attrs={'class': 'custom-input'}),
            # Nuevo widget para el responsable
            'responsable': forms.Select(attrs={'class': 'custom-input select2-field'}),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Solo mostrar usuarios que no sean superusuarios para elegir responsables
        self.fields['responsable'].queryset = User.objects.filter(is_superuser=False).order_by('first_name')
        self.fields['responsable'].empty_label = "Sin responsable asignado"
# /opt/pulser_app/flota/forms.py

class SolicitudRepuestoForm(forms.ModelForm):
    """
    Formulario para que los mecánicos soliciten repuestos 
    que no están en stock o que no existen en el catálogo.
    """
    class Meta:
        model = Solicitud
        fields = ['repuesto_nombre', 'cantidad', 'prioridad', 'motivo', 'repuesto_referencia']
        
        widgets = {
            'repuesto_nombre': forms.TextInput(attrs={
                'class': 'form-control', 
                'placeholder': 'Ej: Filtro de Aire Volvo FH16',
                'id': 'id_repuesto_nombre_solicitud'
            }),
            'cantidad': forms.NumberInput(attrs={
                'class': 'form-control', 
                'min': '1',
                'placeholder': '1'
            }),
            'prioridad': forms.Select(attrs={
                'class': 'form-control'
            }),
            'motivo': forms.Textarea(attrs={
                'class': 'form-control', 
                'rows': 3, 
                'placeholder': '¿Por qué se necesita? Ej: No hay stock en bodega Matrix o pieza llegó dañada...'
            }),
            # El campo referencia es oculto porque lo llenaremos vía JS si seleccionan algo del catálogo
            'repuesto_referencia': forms.HiddenInput(), 
        }

        labels = {
            'repuesto_nombre': '¿Qué repuesto necesitas?',
            'cantidad': 'Cantidad',
            'prioridad': 'Urgencia',
            'motivo': 'Justificación / Notas',
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Hacemos que el nombre del repuesto sea obligatorio
        self.fields['repuesto_nombre'].required = True
        # El motivo también es bueno que sea obligatorio para que Bruno sepa por qué gasta plata
        self.fields['motivo'].required = True

class PrecioCombustibleForm(forms.ModelForm):
    class Meta:
        model = PrecioCombustible
        fields = '__all__'
        widgets = {
            'fecha_inicio': forms.DateInput(attrs={'type': 'date', 'class': 'modal-form-input'}),
            'fecha_fin': forms.DateInput(attrs={'type': 'date', 'class': 'modal-form-input'}),
            'precio_por_litro': forms.NumberInput(attrs={'class': 'modal-form-input'}),
        }

    def clean(self):
        cleaned_data = super().clean()

        fecha_inicio = cleaned_data.get('fecha_inicio')
        fecha_fin = cleaned_data.get('fecha_fin')

        if not fecha_inicio:
            return cleaned_data

        # 1. Validar rango lógico
        if fecha_fin and fecha_fin < fecha_inicio:
            raise ValidationError("La fecha fin no puede ser menor que la fecha inicio.")

        qs = PrecioCombustible.objects.all()

        if self.instance.pk:
            qs = qs.exclude(pk=self.instance.pk)

        for precio in qs:
            inicio = precio.fecha_inicio
            fin = precio.fecha_fin

            #CASO ESPECIAL: registro vigente (fin = None)
            if fin is None:
                # permitir si el nuevo empieza después
                if fecha_inicio > inicio:
                    continue
                else:
                    raise ValidationError(
                        f"Ya existe un precio vigente desde {inicio}."
                    )

            #VALIDACIÓN NORMAL (rangos cerrados)
            nuevo_fin = fecha_fin or date.max

            if fecha_inicio <= fin and inicio <= nuevo_fin:
                raise ValidationError(
                    f"El rango se solapa con un precio existente ({inicio} - {fin})."
                )

        return cleaned_data
        

def obtener_precio_por_fecha(fecha):
    return PrecioCombustible.objects.filter(
        fecha_inicio__lte=fecha
    ).filter(
        Q(fecha_fin__gte=fecha) | Q(fecha_fin__isnull=True)
    ).order_by('-fecha_inicio').first()
