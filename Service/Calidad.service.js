/**
 * Service/Calidad.service.js
 * Capa de servicios para la evaluación de desempeño y control de calidad.
 */

import { DataManager } from '../Persistencia/localStorage.js';
import { AuditService } from './AuditService.js';

export const CalidadService = {

    getEvaluaciones() {
        return DataManager.leer('cupaz_evaluaciones_historial') || [];
    },

    guardarEvaluacion(evaluacion) {
        const historial = this.getEvaluaciones();
        historial.push({
            ...evaluacion,
            id: Date.now(),
            fecha_eval: new Date().toLocaleString()
        });
        DataManager.guardar('cupaz_evaluaciones_historial', historial);
        AuditService.registrar('EVALUACION_DESEMPENO', `Nueva evaluación registrada.`);
        return true;
    },

    calcularKPIs(incidentes) {
        const trs = incidentes.filter(i => i.tiempo_respuesta).map(i => Number(i.tiempo_respuesta));
        const avgTR = trs.length > 0 ? (trs.reduce((a, b) => a + b, 0) / trs.length).toFixed(1) : "0.0";
        
        const cerrados = incidentes.filter(i => ['CERRADO', 'RESUELTO', 'TERMINADO'].includes(i.estatus)).length;
        const tasaResolucion = incidentes.length > 0 ? ((cerrados / incidentes.length) * 100).toFixed(1) : "0.0";
        
        return { avgTR, tasaResolucion };
    }
};
