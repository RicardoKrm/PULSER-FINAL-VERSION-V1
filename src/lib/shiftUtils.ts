/**
 * shiftUtils.ts
 * Utilidades para el control de jornada laboral, límites de cronómetro de OTs
 * y gestión de horas extras conforme a la legislación laboral chilena (Art. 31 Código del Trabajo: máx 2h diarias).
 */

export interface ShiftCutoffResult {
  isPastCutoff: boolean;
  cutoffTime: Date;
  shiftEndTime: Date;
  scheduledEndStr: string;
  horasExtras: number; // Máximo 2 horas según ley
  cappedElapsedSeconds: number;
  sessionStartDate: Date;
  minutesRemainingToCutoff: number;
}

/**
 * Calcula los límites de jornada laboral para una orden de trabajo activa.
 * - Jornada estándar termina a la hora programada o 18:00 por defecto.
 * - Permite hasta un máximo legal de 2 horas extras si fueron autorizadas.
 * - Si se supera el límite de la jornada, el tiempo transcurrido se congela al horario de corte
 *   y se indica que la OT debe pasar a 'OT detenida por término de jornada'.
 */
export function calculateShiftCutoff(
  inicioProcesoStr?: string,
  horaTerminoProgramadaStr?: string,
  horasExtrasAutorizadas?: number
): ShiftCutoffResult | null {
  if (!inicioProcesoStr) return null;
  const sessionStart = new Date(inicioProcesoStr);
  if (isNaN(sessionStart.getTime())) return null;

  // Hora de término programada (por defecto 18:00 hrs)
  const scheduledEndStr = horaTerminoProgramadaStr && horaTerminoProgramadaStr.trim() !== ''
    ? horaTerminoProgramadaStr.trim()
    : '18:00';

  const [endHourRaw, endMinRaw] = scheduledEndStr.split(':').map(Number);
  const endHour = isNaN(endHourRaw) ? 18 : endHourRaw;
  const endMin = isNaN(endMinRaw) ? 0 : endMinRaw;

  // Fecha y hora del fin de jornada base para el día en que se inició la sesión
  const shiftEndTime = new Date(sessionStart);
  shiftEndTime.setHours(endHour, endMin, 0, 0);

  // Horas extras permitidas por ley: máximo 2 horas
  const horasExtras = Math.min(Math.max(Number(horasExtrasAutorizadas || 0), 0), 2);

  // Si se inició después del horario regular de salida, el corte es el inicio + horas extras (o máx 2h)
  let cutoffTime = new Date(shiftEndTime.getTime() + horasExtras * 3600 * 1000);
  if (cutoffTime.getTime() <= sessionStart.getTime()) {
    cutoffTime = new Date(sessionStart.getTime() + (horasExtras > 0 ? horasExtras : 2) * 3600 * 1000);
  }

  const now = Date.now();
  const isPastCutoff = now > cutoffTime.getTime();

  // Tiempo transcurrido de esta sesión acotado estrictamente al límite de la jornada
  const targetEndTimestamp = isPastCutoff ? cutoffTime.getTime() : now;
  const cappedElapsedSeconds = Math.max(0, Math.floor((targetEndTimestamp - sessionStart.getTime()) / 1000));
  const minutesRemainingToCutoff = Math.max(0, Math.floor((cutoffTime.getTime() - now) / (60 * 1000)));

  return {
    isPastCutoff,
    cutoffTime,
    shiftEndTime,
    scheduledEndStr,
    horasExtras,
    cappedElapsedSeconds,
    sessionStartDate: sessionStart,
    minutesRemainingToCutoff
  };
}

/**
 * Metadata parser/embedder para almacenar horasExtrasAutorizadas, solicitudHorasExtras y pausa_motivo
 * dentro del campo 'observaciones' de orden_de_trabajo sin requerir migraciones de base de datos.
 */
export function extractOtMeta(observaciones?: string): {
  horasExtrasAutorizadas?: number;
  solicitudHorasExtras?: {
    solicitadas: number;
    motivo: string;
    estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
    solicitado_en?: string;
    respondido_en?: string;
    respondido_por?: string;
  };
  pausa_motivo?: string;
} {
  if (!observaciones) return {};
  const match = observaciones.match(/<!--META:(.*?)-->/);
  if (match) {
    try {
      return JSON.parse(match[1]);
    } catch {
      return {};
    }
  }
  return {};
}

export function embedOtMeta(
  observaciones?: string,
  meta?: {
    horasExtrasAutorizadas?: number;
    solicitudHorasExtras?: any;
    pausa_motivo?: string;
  }
): string | undefined {
  const cleanObs = (observaciones || '').replace(/<!--META:.*?-->/g, '').trim();
  const hasMeta = meta && (
    (meta.horasExtrasAutorizadas !== undefined && meta.horasExtrasAutorizadas !== null) ||
    (meta.solicitudHorasExtras !== undefined && meta.solicitudHorasExtras !== null) ||
    (meta.pausa_motivo !== undefined && meta.pausa_motivo !== null && meta.pausa_motivo !== '')
  );

  if (!hasMeta) return cleanObs || undefined;
  return `${cleanObs}\n<!--META:${JSON.stringify(meta)}-->`.trim();
}

export function cleanObservaciones(observaciones?: string): string {
  if (!observaciones) return '';
  return observaciones.replace(/<!--META:.*?-->/g, '').trim();
}
