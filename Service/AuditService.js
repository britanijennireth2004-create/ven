/**
 * Service/AuditService.js
 * Servicio centralizado de auditoría y registro de eventos institucional.
 * Versión: 2.2 - Sistema CUPAZ Monagas.
 */

import { DataManager } from '../Persistencia/localStorage.js';

export const AuditService = {
    /**
     * Registra un evento en la bitácora de auditoría.
     * @param {string} accion - Tipo de actividad (LOGIN, SOPORTE, MODIFICACION, etc).
     * @param {string} detalle - Descripción técnica o administrativa.
     * @param {string} resultado - Estado final (EXITOSO, FALLIDO, NOTIFICACIÓN CUPAZ).
     */
    registrar(accion, detalle, resultado = 'ÉXITO') {
        const sessionStr = sessionStorage.getItem('cupaz_userData');
        const session = sessionStr ? JSON.parse(sessionStr) : null;
        const logs = this.getLogs();
        
        // Simulación de captura de IP (Dato institucional requerido)
        const mockIP = `192.168.1.${Math.floor(Math.random() * 254) + 1}`;

        logs.unshift({
            id: Date.now(),
            fecha: new Date().toLocaleDateString(),
            hora: new Date().toLocaleTimeString(),
            usuario: session?.username || 'SISTEMA',
            rol: session?.role || 'N/A',
            ip: mockIP,
            accion: accion,
            detalle: detalle,
            resultado: resultado
        });

        DataManager.guardar('cupaz_auditoria', logs.slice(0, 500));
    },

    getLogs() {
        return DataManager.leer('cupaz_auditoria') || [];
    },

    getUsuarioActual() {
        try {
            const data = sessionStorage.getItem('userData');
            if (data) {
                const session = JSON.parse(data);
                return session.username || 'SISTEMA';
            }
            return 'SISTEMA';
        } catch (error) {
            return 'SISTEMA';
        }
    },

    logToConsole(reg) {
        console.log(`[AUDIT-LOG] ${reg.fecha} ${reg.hora} | ${reg.accion} | ${reg.resultado} | User: ${reg.usuario}`);
    }
};
