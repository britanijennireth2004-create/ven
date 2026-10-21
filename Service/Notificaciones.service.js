/**
 * Service/Notificaciones.service.js
 * Capa de servicios para la gestión de notificaciones e integridad de logs.
 * Patrón: Service Layer - Encapsula la lógica de negocio y persistencia.
 */

import { DataManager } from '../Persistencia/localStorage.js';
import { AuditService } from './AuditService.js';

export const NotificacionesService = {
    /**
     * Obtiene los logs de auditoría enriquecidos con estados de usuario (leído, destacado, etc).
     */
    getEnrichedLogs() {
        const logs = AuditService.getLogs() || [];
        const starred = DataManager.leer('cupaz_notif_starred') || [];
        const read = DataManager.leer('cupaz_notif_revisadas') || [];

        return logs.map(l => ({
            ...l,
            id: String(l.id),
            isStarred: starred.includes(String(l.id)),
            isRead: read.includes(String(l.id))
        })).reverse(); // Orden cronológico inverso (recientes primero)
    },

    /**
     * Alterna el estado de "Destacado" (Estrella) de una notificación.
     */
    toggleStar(id) {
        let starred = DataManager.leer('cupaz_notif_starred') || [];
        const idStr = String(id);

        if (starred.includes(idStr)) {
            starred = starred.filter(s => s !== idStr);
        } else {
            starred.push(idStr);
        }

        DataManager.guardar('cupaz_notif_starred', starred);
        return starred.includes(idStr);
    },

    /**
     * Marca una notificación como leída.
     */
    marcarComoLeida(id) {
        const read = DataManager.leer('cupaz_notif_revisadas') || [];
        const idStr = String(id);

        if (!read.includes(idStr)) {
            read.push(idStr);
            DataManager.guardar('cupaz_notif_revisadas', read);
        }
    },

    /**
     * Busca notificaciones que coincidan con un término de búsqueda.
     * @param {string} query - Término a buscar.
     * @returns {Array} - Lista de hasta 8 coincidencias.
     */
    search(query) {
        if (!query || !query.trim()) return [];
        
        const allLogs = this.getEnrichedLogs();
        const q = query.toLowerCase();
        
        return allLogs.filter(n => 
            (n.detalle || '').toLowerCase().includes(q) || 
            (n.accion || '').toLowerCase().includes(q) ||
            (n.usuario || '').toLowerCase().includes(q)
        ).slice(0, 8);
    },

    /**
     * Obtiene el conteo de notificaciones pendientes (no leídas).
     */
    getUnreadCount() {
        const read = DataManager.leer('cupaz_notif_revisadas') || [];
        const logs = AuditService.getLogs() || [];
        return logs.filter(l => !read.includes(String(l.id))).length;
    }
};
