/**
 * Service/SupportService.js
 * Servicio encargado de gestionar las solicitudes de soporte técnico 
 * y comunicaciones de usuarios no autenticados.
 */

import { DataManager } from '../Persistencia/localStorage.js';
import { AuditService } from './AuditService.js';

export const SupportService = {
    /**
     * Envía una solicitud de soporte al sistema de notificaciones.
     * @param {Object} payload - Datos de la solicitud (cedula, cuadrante, motivo)
     * @returns {Promise<boolean>}
     */
    async enviarSolicitud(payload) {
        try {
            if (!payload.cedula || !payload.motivo || !payload.cuadrante) {
                throw new Error("Todos los campos son obligatorios para procesar el soporte.");
            }

            const detalleBus = `SOPORTE TÉCNICO - CI: ${payload.cedula} | Cuadrante: ${payload.cuadrante} | Motivo: ${payload.motivo}`;

            AuditService.registrar(
                'SOLICITUD_SOPORTE', 
                detalleBus, 
                'NOTIFICACIÓN CUPAZ'
            );

            return new Promise((resolve) => setTimeout(() => resolve(true), 800));

        } catch (error) {
            console.error("Error en SupportService:", error.message);
            throw error;
        }
    },

    /**
     * Obtiene la lista de cuadrantes activos del sistema para el soporte público.
     * @returns {Array}
     */
    getCuadrantes() {
        // En este sistema los cuadrantes se almacenan institucionalmente
        const cuadrantes = DataManager.leer('cupaz_cuadrantes_paz') || [];
        return cuadrantes.filter(c => (c.estado || 'Activo').toLowerCase() === 'activo');
    }
};
