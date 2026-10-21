/**
 * Service/Logistica.service.js
 * Capa de servicios para la gestión de recursos, inventario y logística institucional.
 */

import { DataManager } from '../Persistencia/localStorage.js';
import { AuditService } from './AuditService.js';

export const LogisticaService = {

    inicializarInventario() {
        if (!this.getRecursos().length) {
            const seed = [
                { id: 'POL-01', tipo: 'vehiculo', nombre: 'Patrulla 01 (Hilux)', estatus: 'disponible', cuadrante: 'MTR-01', funcionario: 'Juan Pérez' },
                { id: 'AMB-01', tipo: 'AMBULANCIA', nombre: 'Ambulancia 01 (Unidad Alfa)', estatus: 'disponible', cuadrante: 'MTR-02', funcionario: 'Ana López' },
                { id: 'RAD-05', tipo: 'equipo', nombre: 'Radio Portátil Harris XP', estatus: 'disponible', cuadrante: 'MTR-03', funcionario: 'Carlos Ruiz' }
            ];
            seed.forEach(r => this.guardarRecursoSimulacion(r));
        }
    },

    getRecursos() {
        return DataManager.leer('cupaz_recursos') || [];
    },

    getRecursoPorId(id) {
        const recursos = this.getRecursos();
        return recursos.find(r => r.id === id);
    },

    buscarRecursos(term) {
        term = (term || '').toLowerCase().trim();
        const data = this.getRecursos();
        if (!term) return data;
        return data.filter(r => 
            r.id.toLowerCase().includes(term) ||
            r.nombre.toLowerCase().includes(term) ||
            (r.placa && r.placa.toLowerCase().includes(term)) ||
            (r.funcionario && r.funcionario.toLowerCase().includes(term)) ||
            (r.cuadrante && r.cuadrante.toLowerCase().includes(term))
        );
    },

    getEstadisticas() {
        const data = this.getRecursos();
        return {
            total: data.length,
            operativos: data.filter(r => r.estatus === 'disponible' || r.estatus === 'DISPONIBLE').length,
            despliegue: data.filter(r => r.estatus === 'asignado' || r.estatus === 'ASIGNADO').length,
            mantenimiento: data.filter(r => r.estatus === 'en_mantenimiento' || r.estatus === 'dado_baja' || r.estatus === 'EN MANTENIMIENTO').length
        };
    },

    // Uso interno para semilla sin auditoría
    guardarRecursoSimulacion(recursoData) {
        const recursos = this.getRecursos();
        recursos.push({ ...recursoData, createdAt: new Date().toISOString(), historial: [{ fecha: new Date().toLocaleString(), cambio: 'Alta de recurso en inventario (Semilla)' }] });
        DataManager.guardar('cupaz_recursos', recursos);
    },
    validarRecursoNegocio(data) {
        // Validación puramente de negocio, independientemente del origen de los datos
        const errors = {};
        
        // Regla de Negocio: Ningún vehículo puede entrar sin un registro militar/policial de placa
        if (data.tipo === 'vehiculo' && !data.placa) {
            errors.placa = 'Se requiere identificación estricta (Placa) por normativa operativa';
        }
        
        // Regla de Negocio: Equipos de comunicación están sujetos a CONATEL
        if (data.tipo === 'telefono' && (!data.imei || data.imei.length !== 15)) {
            errors.imei = 'IMEI inválido para auditoría nacional de telecomunicaciones';
        }

        return Object.keys(errors).length > 0 ? errors : null;
    },

    gestionarRecurso(data, editId, obsTxt) {
        const errores = this.validarRecursoNegocio(data);
        if (errores) {
            const e = new Error("Violación de reglas de negocio en recurso");
            e.isValidationError = true;
            e.errors = errores;
            throw e;
        }

        const recursos = this.getRecursos();
        
        if (editId) {
            const index = recursos.findIndex(r => r.id === editId);
            if (index === -1) throw new Error("Recurso original no encontrado en el sistema.");
            const rOld = recursos[index];

            // Req 4: Solo recursos disponibles pueden ser asignados
            if (rOld.estatus !== 'disponible' && data.estatus === 'asignado' && rOld.estatus !== 'asignado') {
                throw new Error("Solo los recursos en estado 'Disponible' pueden pasar a 'Asignado'. Restricción de Integridad Operativa.");
            }

            data.historial = rOld.historial || [];
            if (rOld.estatus !== data.estatus || rOld.cuadrante !== data.cuadrante || rOld.funcionario !== data.funcionario) {
                const movimiento = `Origin: ${rOld.cuadrante || 'Base'} -> Nuevo Destino: ${data.cuadrante || 'Base'} | Estado: ${rOld.estatus} -> ${data.estatus}`;
                data.historial.push({
                    fecha: new Date().toLocaleString(),
                    cambio: movimiento,
                    observacion: obsTxt || ''
                });
            }
            recursos[index] = { ...rOld, ...data };
        } else {
            if (recursos.some(r => r.id === data.id)) {
                throw new Error("Código de Inventario Duplicado.");
            }
            data.historial = data.historial || [];
            data.historial.push({ fecha: new Date().toLocaleString(), cambio: 'Alta de recurso en inventario' });
            recursos.push({ ...data, createdAt: new Date().toISOString() });
        }

        DataManager.guardar('cupaz_recursos', recursos);
        AuditService.registrar('LOGISTICA', `Recurso ${data.id} actualizado/creado.`);
        return true;
    },

    guardarRecurso(recursoData) {
        // Compatibilidad hacia atrás si hay otros usos
        return this.gestionarRecurso(recursoData, null, '');
    },

    actualizarEstado(id, nuevoEstado, motivo) {
        const recursos = this.getRecursos();
        const index = recursos.findIndex(r => r.id === id);
        
        if (index !== -1) {
            const anterior = recursos[index].estatus;
            recursos[index].estatus = nuevoEstado;
            
            if (!recursos[index].historial) recursos[index].historial = [];
            recursos[index].historial.push({
                fecha: new Date().toLocaleString(),
                anterior: anterior,
                nuevo: nuevoEstado,
                motivo: motivo
            });

            DataManager.guardar('cupaz_recursos', recursos);
            AuditService.registrar('LOGISTICA', `Cambio de estado unidad ${id}: ${nuevoEstado}`);
            return true;
        }
        return false;
    }
};
