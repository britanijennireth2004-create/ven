/**
 * Service/Administracion.service.js
 * Capa de servicios para la gestión administrativa del sistema CUPAZ.
 * Centraliza la lógica de usuarios, organismos, cuadrantes y parámetros.
 */

import { DataManager } from '../Persistencia/localStorage.js';
import { AuditService } from './AuditService.js';
import { hashPassword } from './AuthService.js';

export const AdministracionService = {

    // --- GESTIÓN DE USUARIOS ---

    getUsuarios() {
        return DataManager.leer('cupaz_usuarios') || [];
    },

    getUsuarioById(userId) {
        return this.getUsuarios().find(u => u.user === userId) || null;
    },

    guardarUsuario(usuarioData) {
        try {
            const usuarios = this.getUsuarios();
            const session = sessionStorage.getItem('cupaz_userData') ? JSON.parse(sessionStorage.getItem('cupaz_userData')) : null;

            // Jerarquía estricta de creación:
            if (session) {
                const myRole = session.role.toUpperCase();
                const targetRole = usuarioData.role.toUpperCase();

                // Jefes de cuadrante, Auxiliares y demás base no pueden crear ni modificar administrativamente
                if (['JEFE DE CUADRANTE', 'AUXILIAR DE CUADRANTE', 'OPERADOR DE RECEPCIÓN', 'OPERADOR DE DESPACHO', 'EVALUADOR DE CALIDAD', 'ANALISTA DE INFORMACIÓN'].includes(myRole)) {
                    if (window.cupazToast) window.cupazToast("Acceso Denegado. Su rol jerárquico no permite modificar ni crear personal.", "error");
                    return false;
                }

                // Coordinador General (cupaz/Director) solo crea/gestiona Coordinadores. No baja a cuadrantes. (A menos que el sistema carezca de ellos)
                if (myRole === 'COORDINADOR CUPAZ' || myRole === 'DIRECTOR GENERAL') {
                    if (!targetRole.includes('COORDINADOR') && !targetRole.includes('DIRECTOR')) {
                        if (window.cupazToast) window.cupazToast("Regla Jerárquica: El Coordinador General solo puede gestionar directamente a los Coordinadores de Área.", "error");
                        return false;
                    }
                }
            }

            // Validación de duplicados (Cédula y Email) para nuevos registros
            const isUpdate = usuarios.some(u => u.user === usuarioData.user);
            if (!isUpdate) {
                if (usuarios.some(u => u.cedula === usuarioData.cedula)) {
                    if (window.cupazToast) window.cupazToast("La cédula ya se encuentra registrada", "error");
                    return false;
                }
                if (usuarios.some(u => u.email === usuarioData.email)) {
                    if (window.cupazToast) window.cupazToast("El correo electrónico ya está en uso", "error");
                    return false;
                }
            }

            const index = usuarios.findIndex(u => u.user === usuarioData.user);
            let actionType = isUpdate ? 'MODIFICACIÓN_PERSONAL' : 'ALTA_PERSONAL';

            if (index !== -1) {
                // Actualización: Mantener la clave si no se envía una nueva
                const oldPass = usuarios[index].pass;
                usuarios[index] = {
                    ...usuarios[index],
                    ...usuarioData,
                    pass: usuarioData.newPass ? hashPassword(usuarioData.newPass) : oldPass
                };
                delete usuarios[index].newPass;
            } else {
                // Creación: Hashear clave obligatoria
                usuarioData.pass = hashPassword(usuarioData.newPass || 'cupaz123');
                delete usuarioData.newPass;
                usuarios.push(usuarioData);
            }

            DataManager.guardar('cupaz_usuarios', usuarios);

            // REQUERIMIENTO: Notificar automáticamente al Coordinador VEN911
            const metaDetalle = `Cambio de Personal: ${usuarioData.user} (${usuarioData.role}) | Justificación: ${usuarioData.justificacion || 'Sin justificación declarada'}`;

            AuditService.registrar(
                actionType,
                metaDetalle,
                'NOTIFICACIÓN CUPAZ' // Este resultado dispara la alerta visual en el top bar para el Coordinador General
            );

            return true;
        } catch (error) {
            console.error("Error en AdministracionService:", error);
            return false;
        }
    },

    toggleEstadoUsuario(userId) {
        const usuarios = this.getUsuarios();
        const index = usuarios.findIndex(u => u.user === userId);
        if (index !== -1) {
            const current = (usuarios[index].estado || 'ACTIVO').toUpperCase();
            usuarios[index].estado = current === 'ACTIVO' ? 'SUSPENDIDO' : 'ACTIVO';
            DataManager.guardar('cupaz_usuarios', usuarios);
            AuditService.registrar('GESTIÓN_USUARIO', `Estado de ${userId} cambiado a ${usuarios[index].estado}`);
            return true;
        }
        return false;
    },

    // --- GESTIÓN INSTITUCIONAL (Organismos, Módulos, Cuadrantes) ---

    getEntidad(tipo) {
        const tablas = {
            'organismos': 'cupaz_organismos',
            'modulos': 'cupaz_modulos_policiales',
            'cuadrantes': 'cupaz_cuadrantes_paz'
        };
        const tabla = tablas[tipo] || `cupaz_${tipo}`;
        return DataManager.leer(tabla) || [];
    },

    guardarEntidad(tipo, data) {
        const tablas = {
            'organismos': 'cupaz_organismos',
            'modulos': 'cupaz_modulos_policiales',
            'cuadrantes': 'cupaz_cuadrantes_paz'
        };
        const tabla = tablas[tipo] || `cupaz_${tipo}`;
        let items = DataManager.leer(tabla) || [];

        // Validación de unicidad de códigos (solo para nuevos)
        if (!data.id && data.codigo && items.find(i => i.codigo === data.codigo)) {
            if (window.cupazToast) window.cupazToast(`El código ${data.codigo} ya existe`, "error");
            return false;
        }

        if (data.id) {
            const index = items.findIndex(i => i.id == data.id);
            if (index !== -1) {
                items[index] = { ...items[index], ...data };
            }
        } else {
            const newItem = {
                ...data,
                id: Date.now(),
                estado: 'Activo',
                fechaCreado: new Date().toLocaleDateString()
            };
            items.push(newItem);
        }

        DataManager.guardar(tabla, items);
        AuditService.registrar('CONFIG_SISTEMA', `${data.id ? 'Actualización' : 'Registro'} en ${tipo}: ${data.nombre || data.codigo}`);
        return true;
    },

    toggleEntidadStatus(tipo, id) {
        const tablas = {
            'organismos': 'cupaz_organismos',
            'modulos': 'cupaz_modulos_policiales',
            'cuadrantes': 'cupaz_cuadrantes_paz'
        };
        const tabla = tablas[tipo] || `cupaz_${tipo}`;
        const items = DataManager.leer(tabla) || [];
        const index = items.findIndex(i => i.id == id);

        if (index !== -1) {
            const current = (items[index].estado || 'Activo').toUpperCase();
            items[index].estado = current === 'ACTIVO' ? 'Inactivo' : 'Activo';
            DataManager.guardar(tabla, items);
            AuditService.registrar('CONFIG_SISTEMA', `Estado de ${tipo} (ID: ${id}) cambiado a ${items[index].estado}`);
            return true;
        }
        return false;
    },

    eliminarEntidad(tipo, id) {
        const tablas = {
            'organismos': 'cupaz_organismos',
            'modulos': 'cupaz_modulos_policiales',
            'cuadrantes': 'cupaz_cuadrantes_paz'
        };
        const tabla = tablas[tipo] || `cupaz_${tipo}`;
        let items = DataManager.leer(tabla) || [];

        // Reglas de integridad referencial
        if (tipo === 'organismos' && this.getEntidad('modulos').some(m => m.organismoId == id)) {
            if (window.cupazToast) window.cupazToast("No es posible eliminar: existen módulos vinculados", "error");
            return false;
        }
        if (tipo === 'modulos' && this.getEntidad('cuadrantes').some(c => c.moduloId == id)) {
            if (window.cupazToast) window.cupazToast("No es posible eliminar: existen cuadrantes vinculados", "error");
            return false;
        }

        items = items.filter(i => i.id != id);
        DataManager.guardar(tabla, items);
        AuditService.registrar('CONFIG_SISTEMA', `Registro eliminado de ${tipo} (ID: ${id})`);
        return true;
    },

    // --- PARÁMETROS GLOBALES ---

    getParametros() {
        return DataManager.leer('cupaz_config_global') || {
            pass_expire: 90,
            pass_min: 8,
            max_dispatch: 5,
            max_arrival: 15,
            threshold_red: 20
        };
    },

    actualizarParametros(config) {
        DataManager.guardar('cupaz_config_global', config);
        AuditService.registrar('SEGURIDAD', 'Configuración del núcleo administrativo actualizada.');
        return true;
    },

    // --- GESTIÓN DE CATEGORÍAS (NATURALEZA) ---

    getCategorias() {
        return DataManager.leer('cupaz_categorias_incidentes') || [
            { id: 'SALUD', nombre: 'Salud', script: 'CUPAZ Emergencias Médicas, ¿el paciente está consciente? Indique su ubicación.' },
            { id: 'SEGURIDAD', nombre: 'Policial', script: 'CUPAZ Seguridad, mantenga la calma. ¿Hay personas armadas en el sitio?' },
            { id: 'BOMBEROS', nombre: 'Bomberos', script: 'CUPAZ Bomberos, mantenga la distancia. ¿Hay riesgo de incendio o explosión?' },
            { id: 'PROTECCION CIVIL', nombre: 'Protección Civil', script: 'CUPAZ Protección Civil, ¿en qué podemos ayudarle?' }
        ];
    },

    guardarCategorias(categorias) {
        DataManager.guardar('cupaz_categorias_incidentes', categorias);
        AuditService.registrar('CONFIG_SISTEMA', 'Catálogo de naturalezas de incidentes actualizado.');
        return true;
    },

    getMetadata(tipo) {
        const metadata = {
            'cargos': ['OFICIAL', 'INSPECTOR', 'SUPERVISOR', 'COMISIONADO', 'COMISIONADO ESTADAL', 'DIRECTOR', 'CIVIL', 'TÉCNICO', 'ANALISTA'],
            'roles': [
                'COORDINADOR CUPAZ',
                'DIRECTOR GENERAL',
                'COORDINADOR DE SALA',
                'COORDINADOR DE OPERACIÓN',
                'COORDINADOR DE PATRULLAJE',
                'COORDINADOR DE LOGÍSTICA',
                'COORDINADOR DEL CUADRANTE DE PAZ',
                'JEFE DE CUADRANTE',
                'AUXILIAR DE CUADRANTE',
                'OPERADOR DE RECEPCIÓN',
                'OPERADOR DE DESPACHO',
                'ANALISTA DE INFORMACIÓN',
                'EVALUADOR DE CALIDAD',
                'PERSONAL DE LOGÍSTICA'
            ],
            'estatus': ['ACTIVO', 'SUSPENDIDO'],
            'organismo_tipos': [
                'POLICÍA MUNICIPAL',
                'POLICÍA ESTADAL',
                'POLICÍA NACIONAL BOLIVARIANA',
                'CUERPO DE INVESTIGACIONES',
                'GUARDIA NACIONAL BOLIVARIANA',
                'BOMBEROS',
                'PROTECCIÓN CIVIL',
                'ÓRGANO COMUNAL / MINCOMUNAS'
            ],
            'jurisdicciones': ['ESTADAL', 'MUNICIPAL', 'NACIONAL', 'CONSEJO COMUNAL', 'COMUNA / CIRCUITO COMUNAL', 'JUNTA PARROQUIAL'],
            'nacionalidades': ['V-', 'E-', 'J-']
        };
        return metadata[tipo] || [];
    }
};
