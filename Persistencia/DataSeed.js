/**
 * Persistencia/DataSeed.js
 * Datos iniciales para demostración institucional del SISTEMA CUPAZ - Monagas
 */

import { DataManager } from './localStorage.js';
import { AuthService } from '../Service/AuthService.js';

export const DataSeed = {
    /**
     * Punto de entrada para la siembra de datos.
     */
    init() {
        console.log("Iniciando sincronización de base de datos CUPAZ...");
        
        // 1. Usuarios y Seguridad
        this.seedUsuarios();
        
        // 2. Estructura Organizativa
        this.seedOrganismos();
        this.seedModulos();
        this.seedCuadrantes();
        
        // 3. Operaciones y Logs
        this.seedResources();
        this.seedIncidents();
        this.seedAudit();
        
        // Guardar versión para evitar re-seeds innecesarios
        DataManager.guardar('cupaz_db_version', '2.2');
        console.log("SISTEMA CUPAZ: Base de datos institucional sincronizada (v2.2).");
    },

    seedUsuarios() {
        const existentes = DataManager.leer('cupaz_usuarios');
        if (!existentes || existentes.length === 0) {
            // AuthService.getSeedUsers() ya devuelve la lista con passwords hasheados
            const seedData = AuthService.getSeedUsers();
            DataManager.guardar('cupaz_usuarios', seedData);
            console.log("-> Usuarios iniciales cargados.");
        }
    },

    seedOrganismos() {
        if (!DataManager.leer('cupaz_organismos').length) {
            const orgs = [
                { id: 'PMM', nombre: 'Policía Municipal Maturín', siglas: 'PMM' },
                { id: 'PE', nombre: 'Policía del Estado Monagas', siglas: 'PEM' },
                { id: 'PC', nombre: 'Protección Civil', siglas: 'PC' },
                { id: 'CBB', nombre: 'Cuerpo de Bomberos', siglas: 'CBB' }
            ];
            DataManager.guardar('cupaz_organismos', orgs);
        }
    },

    seedModulos() {
        if (!DataManager.leer('cupaz_modulos').length) {
            const modulos = [
                { 
                    id: 'MOD-01', 
                    nombre: 'Módulo Policial Centro', 
                    organismo: 'PMM', 
                    responsable: 'Supervisor Mario Pérez',
                    estado: 'Activo' 
                },
                { 
                    id: 'MOD-02', 
                    nombre: 'Estación de Bomberos Los Godos', 
                    organismo: 'CBB', 
                    responsable: 'Capitán Ana Rivas',
                    estado: 'Activo' 
                }
            ];
            DataManager.guardar('cupaz_modulos', modulos);
        }
    },

    seedCuadrantes() {
        if (!DataManager.leer('cupaz_cuadrantes').length) {
            const cuadrantes = [
                { id: 1, nombre: 'MTR-01 (Centro)', parroquia: 'Maturín', municipio: 'Maturín' },
                { id: 2, nombre: 'MTR-02 (Los Godos)', parroquia: 'Maturín', municipio: 'Maturín' },
                { id: 3, nombre: 'MTR-03 (Boquerón)', parroquia: 'Maturín', municipio: 'Maturín' },
                { id: 4, nombre: 'PUN-01', parroquia: 'Punta de Mata', municipio: 'Ezequiel Zamora' }
            ];
            DataManager.guardar('cupaz_cuadrantes', cuadrantes);
        }
    },

    seedResources() {
        if (!DataManager.leer('cupaz_recursos').length) {
            const resources = [
                { id: 'UN-001', tipo: 'Patrulla', placa: 'PMM-101', estado: 'Disponible' },
                { id: 'UN-002', tipo: 'Ambulancia', placa: 'PC-022', estado: 'En Servicio' }
            ];
            DataManager.guardar('cupaz_recursos', resources);
        }
    },

    seedIncidents() {
        if (!DataManager.leer('cupaz_incidentes').length) {
            const incidents = [
                { 
                    id: 'INC-2026-001', 
                    tipo: 'Seguridad Ciudadana', 
                    estatus: 'Abierto', 
                    cuadrante: 'MTR-01 (Centro)',
                    descripcion: 'Reporte de alteración del orden público.'
                }
            ];
            DataManager.guardar('cupaz_incidentes', incidents);
        }
    },

    seedAudit() {
        if (!DataManager.leer('cupaz_auditoria').length) {
            const audit = [
                { 
                    id: Date.now(), 
                    fecha: new Date().toLocaleDateString(), 
                    hora: new Date().toLocaleTimeString(), 
                    usuario: 'SISTEMA', 
                    accion: 'INICIO_SISTEMA', 
                    resultado: 'EXITOSO', 
                    detalle: 'Sincronización inicial de la plataforma CUPAZ Monagas' 
                }
            ];
            DataManager.guardar('cupaz_auditoria', audit);
        }
    }
};
