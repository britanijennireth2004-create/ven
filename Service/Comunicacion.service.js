/**
 * Service/Comunicacion.service.js
 * Capa de servicios para la gestión de comunicaciones, mensajería y radio.
 */

import { DataManager } from '../Persistencia/localStorage.js';

export const ComunicacionService = {

    getMensajes() {
        return DataManager.leer('cupaz_mensajeria') || [];
    },

    enviarMensaje(mensaje) {
        const mensajes = this.getMensajes();
        const nuevo = {
            ...mensaje,
            id: Date.now(),
            fecha: new Date().toLocaleString()
        };
        mensajes.push(nuevo);
        DataManager.guardar('cupaz_mensajeria', mensajes);
        return nuevo;
    },

    getContactos() {
        // En un sistema real vendría de una tabla de contactos/organismos
        const usuarios = DataManager.leer('cupaz_usuarios') || [];
        return usuarios.map(u => ({ id: u.user, nombre: u.name, role: u.role }));
    }
};
