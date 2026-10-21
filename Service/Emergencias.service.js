/**
 * Service/Emergencias.service.js
 * Motor de gestión de incidentes y generación de folios institucionales.
 * Versión: 3.0 - Proyecto CUPAZ Monagas
 */

import { DataManager } from '../Persistencia/localStorage.js';
import { AuditService } from './AuditService.js';
import { AuthService } from './AuthService.js';
import { AdministracionService } from './Administracion.service.js';

export const EmergenciasService = {

    /**
     * Genera un folio único con formato CPZ-AÑO-CORRELATIVO
     * Ejemplo: CPZ-2026-0001
     */
    generarFolio() {
        const incidentes = DataManager.leer('cupaz_incidentes') || [];
        const yearActual = new Date().getFullYear();
        
        // Filtrar incidentes del año actual para el correlativo
        const incidentesAnio = incidentes.filter(inc => inc.folio.includes(`-${yearActual}-`));
        const siguienteNumero = (incidentesAnio.length + 1).toString().padStart(4, '0');
        
        return `CPZ-${yearActual}-${siguienteNumero}`;
    },

    /**
     * Registra un nuevo incidente en el sistema
     */
    async registrarIncidente(datos) {
        try {
            const incidentes = DataManager.leer('cupaz_incidentes') || [];
            const session = AuthService.getUserData();

            const nuevoIncidente = {
                id: Date.now(),
                folio: this.generarFolio(),
                fecha: new Date().toLocaleDateString(),
                hora: new Date().toLocaleTimeString(),
                prioridad: datos.prioridad || 'MEDIA',
                naturaleza: datos.naturaleza,
                ubicacion: {
                    direccion: datos.direccion,
                    parroquia: datos.parroquia,
                    punto_referencia: datos.punto_referencia,
                    coordenadas: datos.coordenadas || null
                },
                denunciante: {
                    nombre: datos.nombre_denunciante || 'ANÓNIMO',
                    telefono: datos.telefono_denunciante || 'N/P'
                },
                estatus: 'CAPTADO', // Estado inicial según flujo CU-10
                operador: session ? session.username : 'SISTEMA',
                descripcion: datos.descripcion,
                organismo_asignado: null,
                unidad_asignada: null,
                historial_estados: [
                    { estado: 'CAPTADO', hora: new Date().toISOString(), nota: 'Registro inicial en sistema' }
                ]
            };

            incidentes.unshift(nuevoIncidente);
            DataManager.guardar('cupaz_incidentes', incidentes);

            // Registro en Auditoría
            AuditService.registrar(
                'REGISTRO_EMERGENCIA', 
                `Incidente creado: ${nuevoIncidente.folio} - ${nuevoIncidente.naturaleza}`,
                'EXITOSO'
            );

            return { success: true, folio: nuevoIncidente.folio };
        } catch (error) {
            console.error("Error en EmergenciasService:", error);
            return { success: false, message: "Error al procesar el registro del incidente" };
        }
    },

    /**
     * Obtiene todos los incidentes o filtra por estatus
     */
    obtenerIncidentes(filtroEstatus = null) {
        const incidentes = DataManager.leer('cupaz_incidentes') || [];
        if (filtroEstatus) {
            return incidentes.filter(inc => inc.estatus === filtroEstatus);
        }
        return incidentes;
    },

    /**
     * Devuelve el script de voz según la naturaleza
     */
    getScriptVoz(naturaleza = 'GENERAL') {
        const cats = AdministracionService.getCategorias();
        const cat = cats.find(c => c.id === naturaleza);
        
        if (cat && cat.script) return cat.script;

        const scripts = {
            'GENERAL': 'CUPAZ, ¿cuál es su emergencia? Indique su ubicación exacta para el despacho.'
        };
        return scripts['GENERAL'];
    }
};
