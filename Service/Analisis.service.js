/**
 * Service/Analisis.service.js
 * Capa de servicios para la generación de estadísticas, análisis de datos y mapas de calor.
 */

import { DataManager } from '../Persistencia/localStorage.js';

export const AnalisisService = {

    getResumenEstadistico() {
        const incidentes = DataManager.leer('cupaz_incidentes') || [];
        const patrullajes = DataManager.leer('cupaz_patrullajes') || [];
        
        return {
            totalIncidentes: incidentes.length,
            incidentesActivos: incidentes.filter(i => i.estatus !== 'CERRADO').length,
            incidentesPrioridadAlta: incidentes.filter(i => i.prioridad === 'ALTA').length,
            totalPatrullajes: patrullajes.length,
            patrullajesActivos: patrullajes.filter(p => p.estatus === 'ACTIVO').length
        };
    },

    getIncidentesPorNaturaleza() {
        const incidentes = DataManager.leer('cupaz_incidentes') || [];
        const conteo = {};
        incidentes.forEach(i => {
            conteo[i.naturaleza] = (conteo[i.naturaleza] || 0) + 1;
        });
        return conteo;
    },

    /**
     * Procesa puntos geoespaciales para el mapa de calor basado en una colección de incidentes.
     * @param {Array} data - Lista filtrada de incidentes (opcional).
     * @returns {Array} - Puntos en formato [lat, lng, intensidad] para Leaflet.heatLayer.
     */
    producirPuntosCalor(data = null) {
        const incidentes = data || DataManager.leer('cupaz_incidentes') || [];
        
        return incidentes
            .filter(i => i.ubicacion?.coordenadas)
            .map(i => {
                const coords = i.ubicacion.coordenadas.split(',');
                const lat = parseFloat(coords[0].trim());
                const lng = parseFloat(coords[1].trim());
                
                // Intensidad táctica basada en prioridad
                let intensidad = 0.5;
                if (i.prioridad === 'CRÍTICA') intensidad = 1.0;
                else if (i.prioridad === 'ALTA') intensidad = 0.8;
                
                return [lat, lng, intensidad];
            });
    },

    getHistorialReportes() {
        return DataManager.leer('cupaz_reportes_historial') || [];
    },

    guardarReporteHistorial(reporte) {
        const historial = this.getHistorialReportes();
        historial.push({
            ...reporte,
            id: Date.now(),
            fecha_gen: new Date().toLocaleString()
        });
        DataManager.guardar('cupaz_reportes_historial', historial);
    },

    obtenerDataReporte(parametros, session) {
        const { tipo, desde, hasta, subFiltro } = parametros;
        let raw = [];
        const dDesde = new Date(desde);
        const dHasta = new Date(hasta);

        switch(tipo) {
            case 'INCIDENTES': raw = DataManager.leer('cupaz_incidentes') || []; break;
            case 'PATRULLAJE': raw = DataManager.leer('cupaz_patrullajes') || []; break;
            case 'PREVENCION': raw = DataManager.leer('cupaz_prevenciones') || []; break;
            default: raw = []; break;
        }

        // Filtrado Jerárquico
        if (session.role !== 'Coordinador CUPAZ' && session.role !== 'DIRECTOR GENERAL' && session.role !== 'ANALISTA') {
            raw = raw.filter(item => {
                if (session.cuadrante) {
                    const itemCuad = item.cuadrante || item.ubicacion?.cuadrante;
                    return itemCuad && itemCuad.startsWith(session.cuadrante);
                }
                return item.organismo === session.organismo;
            });
        }

        let filtered = raw.filter(item => {
            const dateStr = item.fecha?.split(' ')[0].split('/').reverse().join('-') || item.fecha_registro || item.fecha;
            const itemDate = new Date(dateStr);
            return itemDate >= dDesde && itemDate <= dHasta;
        });

        if (subFiltro === 'ALTA_CRITICA') {
            filtered = filtered.filter(i => ['ALTA', 'CRÍTICA'].includes(i.prioridad));
        } else if (['POLICIAL', 'SALUD', 'BOMBEROS'].includes(subFiltro)) {
            const map = { 'POLICIAL': 'Policial', 'SALUD': 'Salud', 'BOMBEROS': 'Bomberos' };
            filtered = filtered.filter(i => i.naturaleza === map[subFiltro]);
        }

        return filtered;
    },

    // Gestión de Plantillas/Configuraciones de Reportes
    getPlantillasConfiguracion() {
        return DataManager.leer('cupaz_reportes_plantillas') || [];
    },

    guardarPlantillaConfiguracion(nombre, config) {
        const plantillas = this.getPlantillasConfiguracion();
        // Evita duplicidad de nombres de plantilla, sobrescribiendo
        const index = plantillas.findIndex(p => p.nombre === nombre);
        const nuevaPlantilla = { id: Date.now(), nombre, config };
        
        if (index !== -1) {
            plantillas[index] = nuevaPlantilla;
        } else {
            plantillas.push(nuevaPlantilla);
        }
        
        DataManager.guardar('cupaz_reportes_plantillas', plantillas);
        return true;
    }
};
