/**
 * Service/Patrullaje.service.js
 * Capa de servicios para la gestión de actividades de patrullaje y prevención.
 */

import { DataManager } from '../Persistencia/localStorage.js';
import { AuditService } from './AuditService.js';

export const PatrullajeService = {

    getPatrullajes() {
        return DataManager.leer('cupaz_patrullajes') || [];
    },

    getPrevenciones() {
        return DataManager.leer('cupaz_prevenciones') || [];
    },

    iniciarPatrullaje(patrullajeData) {
        const patrullajes = this.getPatrullajes();
        const nuevo = {
            ...patrullajeData,
            id: Date.now(),
            estatus: 'ACTIVO',
            inicio: new Date().toLocaleString()
        };
        patrullajes.push(nuevo);
        DataManager.guardar('cupaz_patrullajes', patrullajes);
        AuditService.registrar('PATRULLAJE', `Inicio de patrullaje: ${patrullajeData.unidad}`);
        return nuevo;
    },

    finalizarPatrullaje(id, reporte) {
        const patrullajes = this.getPatrullajes();
        const index = patrullajes.findIndex(p => p.id === id);
        if (index !== -1) {
            patrullajes[index].estatus = 'FINALIZADO';
            patrullajes[index].estado = 'FINALIZADO'; // Sincroniza ambas props legacy
            patrullajes[index].fin = new Date().toLocaleString();
            patrullajes[index].horaFin = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            patrullajes[index].reporte = reporte;
            DataManager.guardar('cupaz_patrullajes', patrullajes);
            AuditService.registrar('PATRULLAJE', `Fin de patrullaje ID ${id}`);
            return true;
        }
        return false;
    },

    registrarPatrullaje(data) {
        const patrullajes = this.getPatrullajes();
        patrullajes.push(data);
        DataManager.guardar('cupaz_patrullajes', patrullajes);
        AuditService.registrar('PATRULLAJE', `Se registró actividad en cuadrante: ${data.cuadrante}`);
    },

    guardarPrevencion(data) {
        const prevs = this.getPrevenciones();
        prevs.push(data);
        DataManager.guardar('cupaz_prevenciones', prevs);
        AuditService.registrar('PREVENCION', `Registrada actividad preventiva en: ${data.cuadrante}`);
    },

    seedPatrullajes() {
        const data = this.getPatrullajes();
        if (!data || data.length === 0) {
            const dummy = [
                {
                    id: 1, cuadrante: 'CP-01 (CENTRO)', operativo: 'Oficial Martínez', 
                    fecha: new Date().toLocaleDateString(), horaInicio: '08:00', horaFin: '10:00',
                    tipo: 'Vehículo', vehiculo: 'CP-401', ruta: 'Recorrido por casco central y zona bancaria.',
                    novedades: 'Sin novedades relevantes.', estado: 'FINALIZADO'
                },
                {
                    id: 2, cuadrante: 'CP-04 (SUR)', operativo: 'Sgt. Rodríguez', 
                    fecha: new Date().toLocaleDateString(), horaInicio: '09:30', horaFin: '',
                    tipo: 'Motocicleta', vehiculo: 'M-202', ruta: 'Patrullaje preventivo en entrada principal.',
                    novedades: 'Observadas luminarias fallando.', estado: 'ACTIVO'
                }
            ];
            DataManager.guardar('cupaz_patrullajes', dummy);
        }
    }
};
