/**
 * Service/Monitoreo.service.js
 * Capa de servicios para el seguimiento de incidentes y recursos en tiempo real.
 */

import { DataManager } from '../Persistencia/localStorage.js';
import { AuditService } from './AuditService.js';

export const MonitoreoService = {

    getIncidentes() {
        return DataManager.leer('cupaz_incidentes') || [];
    },

    /**
     * Obtiene incidentes activos filtrados por jerarquía y búsqueda (Req P-C-S)
     */
    getIncidentesActivos(query = '', session = {}) {
        const allData = this.getIncidentes();
        const roleLevel = session?.role === 'Coordinador CUPAZ' ? 1000 : 
                         (session?.role === 'DIRECTOR GENERAL' ? 900 :
                         (session?.role?.includes('COORDINADOR') ? 500 : 100));

        let data = allData;
        // Filtrado territorial por jerarquía
        if (roleLevel < 900 && session.cuadrante) {
            data = allData.filter(i => i.cuadrante && i.cuadrante.startsWith(session.cuadrante));
        }

        const q = query.toLowerCase();
        return data.filter(i => 
            i.estatus !== 'RECIBIDO' && i.estatus !== 'DESECHADO' && i.estatus !== 'CERRADO' &&
            ((i.folio || '').toLowerCase().includes(q) || 
             (i.unidades_asignadas && i.unidades_asignadas.join(' ').toLowerCase().includes(q)) ||
             (i.naturaleza || '').toLowerCase().includes(q))
        );
    },

    getRecursos() {
        return DataManager.leer('cupaz_recursos') || [];
    },

    /**
     * Obtiene recursos desplegados filtrados por territorio (Req P-C-S)
     */
    getRecursosDesplegados(session = {}) {
        const recursos = this.getRecursos();
        const roleLevel = session?.role === 'Coordinador CUPAZ' ? 1000 : 
                         (session?.role === 'DIRECTOR GENERAL' ? 900 :
                         (session?.role?.includes('COORDINADOR') ? 500 : 100));

        let enServicio = recursos.filter(r => r.estatus !== 'DISPONIBLE');
        
        if (roleLevel < 900 && session.cuadrante) {
            enServicio = enServicio.filter(r => r.cuadrante && r.cuadrante.startsWith(session.cuadrante));
        }
        return enServicio;
    },

    getIncidentePorFolio(folio) {
        const incidentes = this.getIncidentes();
        return incidentes.find(i => i.folio === folio);
    },

    actualizarIncidente(incidenteActualizado) {
        const incidentes = this.getIncidentes();
        const index = incidentes.findIndex(i => i.folio === incidenteActualizado.folio);
        if (index !== -1) {
            incidentes[index] = incidenteActualizado;
            DataManager.guardar('cupaz_incidentes', incidentes);
            return true;
        }
        return false;
    },

    agregarNovedad(folio, novedadTxt, usuario) {
        const incidentes = this.getIncidentes();
        const index = incidentes.findIndex(i => i.folio === folio);
        
        if (index !== -1) {
            if (!incidentes[index].seguimiento) incidentes[index].seguimiento = [];
            incidentes[index].seguimiento.push({
                fecha: new Date().toLocaleString(),
                usuario: usuario,
                novedad: novedadTxt
            });
            DataManager.guardar('cupaz_incidentes', incidentes);
            return true;
        }
        return false;
    },

    registrarEvidencia(folio, evidencia, usuario) {
        const incidentes = this.getIncidentes();
        const index = incidentes.findIndex(i => i.folio === folio);
        if (index !== -1) {
            if (!incidentes[index].evidencias) incidentes[index].evidencias = [];
            incidentes[index].evidencias.push(evidencia);
            
            if (!incidentes[index].historial) incidentes[index].historial = [];
            incidentes[index].historial.push({
                fecha: evidencia.fecha,
                accion: 'EVIDENCIA ADJUNTA',
                nota: `Evidencia [${evidencia.tipo}] agregada por ${usuario}.`
            });

            DataManager.guardar('cupaz_incidentes', incidentes);
            AuditService.registrar('MONITOREO', `Evidencia adjunta a folio ${folio}`, 'EXITOSO');
            return true;
        }
        return false;
    },

    confirmarLlegada(folio, observaciones, coordenadasActuales) {
        const incidentes = this.getIncidentes();
        const index = incidentes.findIndex(i => i.folio === folio);

        if (index !== -1) {
            const inc = incidentes[index];
            const now = new Date();
            
            inc.estatus = 'EN ATENCION';
            inc.fechaLlegada = now.toLocaleString();
            
            if (!inc.historial) inc.historial = [];
            inc.historial.push({
                fecha: inc.fechaLlegada,
                accion: 'LLEGADA A ESCENA',
                nota: `Llegada confirmada. Obs: ${observaciones}`
            });

            DataManager.guardar('cupaz_incidentes', incidentes);
            
            // Actualizar estatus de recursos asociados
            const recursos = this.getRecursos();
            const units = inc.unidades_asignadas || [inc.despacho?.unidadId];
            units.forEach(uId => {
                const rIdx = recursos.findIndex(r => r.id === uId);
                if (rIdx !== -1) recursos[rIdx].estatus = 'EN INTERVENCION';
            });
            DataManager.guardar('cupaz_recursos', recursos);
            
            AuditService.registrar('MONITOREO', `Llegada a escena confirmada: ${folio}`, 'EXITOSO');
            return true;
        }
        return false;
    }
};
