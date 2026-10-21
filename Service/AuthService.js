/**
 * Service/AuthService.js
 * Servicio especializado en la gestión de identidad, autenticación y sesiones.
 * Versión: 3.0 - Identidad Consolidada CUPAZ
 */
import { DataManager } from '../Persistencia/localStorage.js';
import { AuditService } from './AuditService.js';

// CORRECCIÓN: Migración de Salt de seguridad para encriptación local
export const hashPassword = (password) => {
  if (!password) return '';
  // Si ya está hasheado (comienza por el prefijo de Base64 del nuevo salt), lo devolvemos
  if (password.startsWith('Y3VwYXpf')) return password;
  return btoa('cupaz_monagas_' + password);
};

export const AuthService = {
  hashPassword: hashPassword,

  /**
   * Usuarios semilla con roles normalizados para Layout y Administracion
   */
  getSeedUsers() {
      return [
        { user: 'admin', pass: this.hashPassword('admin123'), name: 'Coordinador General', role: 'COORDINADOR CUPAZ', estado: 'ACTIVO', organismo: 'CUPAZ' },
        { user: 'amerida', pass: this.hashPassword('admin123'), name: 'Coronel Amerida', role: 'DIRECTOR GENERAL', estado: 'ACTIVO', organismo: 'CUPAZ' },
        { user: 'coord_sala', pass: this.hashPassword('admin123'), name: 'Coord. de Sala Interna', role: 'COORDINADOR DE SALA', estado: 'ACTIVO', organismo: 'CUPAZ' },
        { user: 'coord_ope', pass: this.hashPassword('admin123'), name: 'Coord. Operativo Central', role: 'COORDINADOR DE OPERACIÓN', estado: 'ACTIVO', organismo: 'POLICÍA ESTADAL' },
        { user: 'coord_pat', pass: this.hashPassword('admin123'), name: 'Coord. Patrullaje Táctico', role: 'COORDINADOR DE PATRULLAJE', estado: 'ACTIVO', organismo: 'CUPAZ' },
        { user: 'coord_log', pass: this.hashPassword('admin123'), name: 'Coord. Logística', role: 'COORDINADOR DE LOGÍSTICA', estado: 'ACTIVO', organismo: 'CUPAZ' },
        { user: 'coord_cuad', pass: this.hashPassword('admin123'), name: 'Coord. de Cuadrantes', role: 'COORDINADOR DEL CUADRANTE DE PAZ', estado: 'ACTIVO', organismo: 'CUPAZ' },
        { user: 'jefe1', pass: this.hashPassword('admin123'), name: 'Jefe P-01 (Maturín)', role: 'JEFE DE CUADRANTE', estado: 'ACTIVO', organismo: 'POLICÍA MUNICIPAL', cuadrante: 'P-01' },
        { user: 'auxiliar1', pass: this.hashPassword('admin123'), name: 'Oficial Auxiliar Norte', role: 'AUXILIAR DE CUADRANTE', estado: 'ACTIVO', organismo: 'POLICÍA MUNICIPAL', cuadrante: 'P-01', jefe: 'jefe1' },
        { user: 'recepcion1', pass: this.hashPassword('admin123'), name: 'Recepción Central 1', role: 'OPERADOR DE RECEPCIÓN', estado: 'ACTIVO', organismo: 'CUPAZ' },
        { user: 'despacho1', pass: this.hashPassword('admin123'), name: 'Despachador Táctico', role: 'OPERADOR DE DESPACHO', estado: 'ACTIVO', organismo: 'CUPAZ' },
        { user: 'analista1', pass: this.hashPassword('admin123'), name: 'Analista de Datos', role: 'ANALISTA DE INFORMACIÓN', estado: 'ACTIVO', organismo: 'CUPAZ' },
        { user: 'evaluador1', pass: this.hashPassword('admin123'), name: 'Auditor de Protocolos', role: 'EVALUADOR DE CALIDAD', estado: 'ACTIVO', organismo: 'CUPAZ' },
        { user: 'logistica1', pass: this.hashPassword('admin123'), name: 'Supervisor de Parque', role: 'PERSONAL DE LOGÍSTICA', estado: 'ACTIVO', organismo: 'CUPAZ' }
      ];
  },

  async login(username, password) {
    // Simulación de latencia de red para seguridad (anti-brute force)
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // CORRECCIÓN: Prefijo unificado cupaz_
      const savedUsers = DataManager.leer('cupaz_usuarios') || [];
      const allUsers = savedUsers.length > 0 ? savedUsers : this.getSeedUsers();

      const user = allUsers.find(u =>
        (u.user === username || u.email === username) &&
        u.pass === this.hashPassword(password)
      );

      if (user) {
        if (user.estado !== 'ACTIVO') {
          AuditService.registrar('ACCESO', `Intento de entrada: Usuario suspendido (${username})`, 'FALLIDO');
          return { success: false, message: "Su cuenta se encuentra inactiva. Contacte al administrador." };
        }

        const sessionData = {
          uid: btoa(user.user + Date.now()),
          username: user.user,
          fullName: user.name || user.nombres + ' ' + (user.apellidos || ''),
          role: user.role, // Importante: Coincide con Layout.js
          organismo: user.organismo,
          cuadrante: user.cuadrante || null,
          jefe: user.jefe || null,
          loginTime: new Date().toISOString()
        };

        this.saveSession(sessionData);
        AuditService.registrar('ACCESO', `Inicio de sesión exitoso: ${user.role}`, 'EXITOSO');

        return { success: true, user: sessionData };
      }

      AuditService.registrar('ACCESO', `Credenciales inválidas para: ${username}`, 'FALLIDO');
      return { success: false, message: "Usuario o contraseña incorrectos" };

    } catch (error) {
      console.error("Auth Critical Error:", error);
      return { success: false, message: "Error en el motor de autenticación" };
    }
  },

  logout(reason = 'Cierre de sesión voluntario') {
    const userData = this.getUserData();
    if (userData) {
      AuditService.registrar('ACCESO', `Cierre de sesión: ${reason}`, 'EXITOSO');
    }

    sessionStorage.removeItem('cupaz_token');
    sessionStorage.removeItem('cupaz_userData');

    // Disparar evento para otras pestañas abiertas
    localStorage.setItem('cupaz_logout_event', Date.now());
    return true;
  },

  saveSession(data) {
    sessionStorage.setItem('cupaz_token', 'active_' + data.uid);
    sessionStorage.setItem('cupaz_userData', JSON.stringify(data));
  },

  isAuthenticated() {
    return !!sessionStorage.getItem('cupaz_token');
  },

  getUserData() {
    const data = sessionStorage.getItem('cupaz_userData');
    return data ? JSON.parse(data) : null;
  }
};
