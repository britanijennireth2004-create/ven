/**
 * Presentacion/Application/App.js
 * Orquestador principal del Sistema CUPAZ Monagas
 */

import { Router } from './Router.js';
import { ViewRenderer } from './ViewRenderer.js';
import { AuthService } from '../../Service/AuthService.js';
import { DataManager } from '../../Persistencia/localStorage.js';

export const App = {
  inactivityTimer: null,

  async init() {
    const { DataSeed } = await import('../../Persistencia/DataSeed.js');
    DataSeed.init();

    ViewRenderer.init();
    this.setupInactivityMonitor();
    this.setupMultiTabSupport();

    const routes = {
      splash: {
        modulePath: 'Presentacion/Pages/Splash.page.js',
        props: { onComplete: () => this.navigateTo('login') }
      },
      login: {
        modulePath: 'Presentacion/Pages/Login.page.js',
        props: { onLoginSuccess: () => this.navigateTo('dashboard') }
      },
      dashboard: {
        modulePath: 'Presentacion/Pages/Dashboard.page.js',
        title: 'INICIO',
        props: {}
      },
      administracion: {
        modulePath: 'Presentacion/Pages/Administracion.page.js',
        title: 'ADMINISTRACIÓN',
        props: {}
      },
      emergencias: {
        modulePath: 'Presentacion/Pages/Emergencias.page.js',
        title: 'RECEPCIÓN',
        props: {}
      },
      despacho: {
        modulePath: 'Presentacion/Pages/Despacho.page.js',
        title: 'DESPACHO',
        props: {}
      },
      monitoreo: {
        modulePath: 'Presentacion/Pages/Monitoreo.page.js',
        title: 'MONITOREO',
        props: {}
      },
      analisis: {
        modulePath: 'Presentacion/Pages/Analisis.page.js',
        title: 'ANÁLISIS Y ESTADÍSTICAS',
        props: {}
      },
      logistica: {
        modulePath: 'Presentacion/Pages/Logistica.page.js',
        title: 'INVENTARIO Y LOGÍSTICA',
        props: {}
      },
      calidad: {
        modulePath: 'Presentacion/Pages/Calidad.page.js',
        title: 'CONTROL DE CALIDAD',
        props: {}
      },
      patrullaje: {
        modulePath: 'Presentacion/Pages/Patrullaje.page.js',
        title: 'ACTIVIDADES DE PATRULLAJE',
        props: {}
      },
      comunicacion: {
        modulePath: 'Presentacion/Pages/Comunicacion.page.js',
        title: 'COMUNICACIONES',
        props: {}
      },
      notificaciones: {
        modulePath: 'Presentacion/Pages/Notificaciones.page.js',
        title: 'NOTIFICACIONES',
        props: {}
      },
      terminal: {
        modulePath: 'Presentacion/Pages/TerminalMovil.page.js',
        title: 'TERMINAL MÓVIL',
        props: {}
      }
    };

    Router.init(routes);
    this.navigateTo('splash');
  },

  setupInactivityMonitor() {
    const reset = () => {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = setTimeout(() => {
        if (AuthService.isAuthenticated()) {
          this.forceLogout('Sesión finalizada por inactividad prolongada.');
        }
      }, 30 * 60 * 1000);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(name => window.addEventListener(name, reset, true));
    reset();
  },

  setupMultiTabSupport() {
    window.addEventListener('storage', (e) => {
      if (e.key === 'cupaz_logout_event' && e.newValue) {
        this.forceLogout('La sesión ha sido cerrada en otra ventana del navegador.');
      }
    });
  },

  async navigateTo(viewName, extraProps = {}) {
    if (AuthService.isAuthenticated()) {
      const session = AuthService.getUserData();
      const users = DataManager.leer('cupaz_usuarios');
      const dbUser = users.find(u => u.user === session.username);

      if (!dbUser || dbUser.estado === 'INACTIVO') {
        this.forceLogout('Acceso denegado. Su cuenta no está activa en el sistema actual.');
        return;
      }
    }

    if (viewName !== 'splash' && viewName !== 'login' && !AuthService.isAuthenticated()) {
      Router.loadPage('login');
      return;
    }

    // Inyectar datos de sesión en las props de la página
    if (AuthService.isAuthenticated()) {
      const session = AuthService.getUserData();
      extraProps = { 
        ...extraProps, 
        role: session.role,
        userId: session.user 
      };
    }

    Router.loadPage(viewName, extraProps);
  },

  async forceLogout(message) {
    localStorage.setItem('cupaz_logout_event', Date.now());
    await AuthService.logout(message);

    setTimeout(() => {
      localStorage.removeItem('cupaz_logout_event');
      this.navigateTo('login', { logoutMessage: message });
    }, 100);
  }
};
