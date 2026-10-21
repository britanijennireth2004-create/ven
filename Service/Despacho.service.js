/**
 * Service/Despacho.service.js
 * Capa de servicios para la asignación de recursos y gestión de despacho.
 * Versión: 1.0 - Proyecto CUPAZ Monagas
 */

import { DataManager } from '../Persistencia/localStorage.js';
import { AuditService } from './AuditService.js';
import { AuthService } from './AuthService.js';

export const DespachoService = {

    /**
     * Obtiene unidades disponibles para despacho
     * Filtra recursos que no estén en mantenimiento o ya asignados
     */
    getUnidadesDisponibles() {
        const recursos = DataManager.leer('cupaz_recursos') || [];
        // En un sistema real, filtraríamos por estado === 'DISPONIBLE'
        return recursos.filter(r => r.estado === 'ACTIVO' || r.estado === 'DISPONIBLE');
    },

    /**
     * Asigna una o varias unidades a un incidente (CU-10)
     * @param {string} folio - El folio del incidente (Ej: CPZ-2026-0001)
     * @param {Array} unidadesIds - Array de IDs de las unidades asignadas
     */
    asignarRecursos(folio, unidadesIds) {
        try {
            const incidentes = DataManager.leer('cupaz_incidentes') || [];
            const index = incidentes.findIndex(inc => inc.folio === folio);

            if (index === -1) throw new Error("Incidente no encontrado");

            const fechaAsignacion = new Date().toISOString();

            // 1. Actualizar el incidente
            incidentes[index].estatus = 'ASIGNADO';
            incidentes[index].unidades_asignadas = unidadesIds;
            incidentes[index].fecha_despacho = fechaAsignacion;
            
            incidentes[index].historial_estados.push({
                estado: 'ASIGNADO',
                hora: fechaAsignacion,
                nota: `Unidades asignadas: ${unidadesIds.join(', ')}`
            });

            DataManager.guardar('cupaz_incidentes', incidentes);

            // 2. Opcional: Marcar unidades como "EN COMISION" en Logística
            this.actualizarEstadoUnidades(unidadesIds, 'EN COMISION');

            AuditService.registrar(
                'DESPACHO_RECURSOS', 
                `Asignación de unidades [${unidadesIds}] al folio ${folio}`,
                'EXITOSO'
            );

            return { success: true };
        } catch (error) {
            console.error("Error en DespachoService:", error);
            return { success: false, message: error.message };
        }
    },

    /**
     * Finaliza la transmisión de orden por radio (CU-11)
     */
    confirmarTransmisionRadio(folio) {
        const incidentes = DataManager.leer('cupaz_incidentes') || [];
        const index = incidentes.findIndex(inc => inc.folio === folio);

        if (index !== -1) {
            incidentes[index].estatus = 'DESPACHADO';
            incidentes[index].historial_estados.push({
                estado: 'DESPACHADO',
                hora: new Date().toISOString(),
                nota: 'Orden transmitida vía Radio/Data'
            });
            DataManager.guardar('cupaz_incidentes', incidentes);
            return true;
        }
        return false;
    },

    /**
     * Actualiza el estado de los recursos en el módulo de Logística
     */
    actualizarEstadoUnidades(ids, nuevoEstado) {
        const recursos = DataManager.leer('cupaz_recursos') || [];
        const nuevosRecursos = recursos.map(r => {
            if (ids.includes(r.id) || ids.includes(r.placa) || ids.includes(r.unidad)) {
                return { ...r, estado: nuevoEstado };
            }
            return r;
        });
        DataManager.guardar('cupaz_recursos', nuevosRecursos);
    },

    /**
     * Vuelve a encolar un incidente liberando los recursos retenidos (CU-11B)
     */
    reasignarIncidente(folio) {
        const incidentes = DataManager.leer('cupaz_incidentes') || [];
        const index = incidentes.findIndex(inc => inc.folio === folio);
        
        if (index !== -1 && (incidentes[index].estatus === 'EN DESPACHO' || incidentes[index].estatus === 'ASIGNADO')) {
            const oldUnits = incidentes[index].unidades_asignadas;
            incidentes[index].estatus = 'CAPTADO';
            incidentes[index].unidades_asignadas = [];
            incidentes[index].fecha_despacho = null;
            incidentes[index].historial_estados.push({
                estado: 'CAPTADO',
                hora: new Date().toISOString(),
                nota: 'Operador forzó retorno a cola de asignación. Unidades originales abortadas.'
            });
            DataManager.guardar('cupaz_incidentes', incidentes);
            
            if(oldUnits && oldUnits.length > 0) {
                this.actualizarEstadoUnidades(oldUnits, 'DISPONIBLE');
            }
            
            AuditService.registrar('DESPACHO_RECURSOS', `Reasignación forzada al folio ${folio}`, 'EXITOSO');
            return true;
        }
        return false;
    }
};
