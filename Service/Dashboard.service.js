/**
 * Service/Dashboard.service.js
 * Servicio de Inteligencia de Negocio y Métricas para el Dashboard
 */
import { DataManager } from '../Persistencia/localStorage.js';

export const DashboardService = {
    getMetricasAdministrativas() {
        const usuarios = DataManager.leer('cupaz_usuarios') || [];
        const totalUsers = usuarios.length;
        
        // Separación explícita por categoría solicitada
        const admins = usuarios.filter(u => {
            const r = (u.role || '').toUpperCase();
            return r.includes('DIRECTOR') || r.includes('ADMIN') || r.includes('COORDINADOR');
        }).length;
        const operativos = totalUsers - admins;

        const orgs = DataManager.leer('cupaz_organismos') || [];
        const cuadrantes = DataManager.leer('cupaz_cuadrantes') || [];

        return {
            totalUsuarios: totalUsers,
            admins: admins,
            operativos: operativos,
            totalOrganismos: orgs.length > 0 ? orgs.length : 12, // Default visual mientras se hace el módulo
            totalCuadrantes: cuadrantes.length > 0 ? cuadrantes.length : 45
        };
    },

    getMetricasOperativas() {
        const incidentes = DataManager.leer('cupaz_incidentes') || [];
        
        const hoyStr = new Date().toLocaleDateString();
        const llamadasHoy = incidentes.filter(i => (i.fecha || i.date) === hoyStr).length;
        
        const activos = incidentes.filter(i => (i.estatus || '').toUpperCase() !== 'RESUELTO' && (i.estatus || '').toUpperCase() !== 'CERRADO').length;
        const resueltos = incidentes.filter(i => (i.estatus || '').toUpperCase() === 'RESUELTO').length;
        
        let resolucion = 100;
        if (incidentes.length > 0) resolucion = Math.round((resueltos / incidentes.length) * 100);

        return {
            llamadasHoy: llamadasHoy > 0 ? llamadasHoy : incidentes.length, // Fallback visual
            incidentesActivos: activos,
            efectividad: resolucion
        };
    },

    getMetricasLogisticas() {
        const recursos = DataManager.leer('cupaz_recursos') || [];
        
        const disponibles = recursos.filter(r => (r.estatus || '').toLowerCase() === 'disponible').length;
        const enUso = recursos.filter(r => {
            const e = (r.estatus || '').toLowerCase();
            return e === 'asignado' || e === 'operativo' || e === 'en uso';
        }).length;
        const mantenimiento = recursos.filter(r => {
            const e = (r.estatus || '').toLowerCase();
            return e === 'mantenimiento' || e === 'inoperativo' || e === 'taller';
        }).length;

        return {
            disponibles,
            enUso,
            mantenimiento
        };
    }
};
