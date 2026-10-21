/**
 * Presentacion/Application/ViewRenderer.js
 * Orquestador de renderizado con soporte de Layout (Pattern pb_public)
 */

import { Layout } from './Layout.js';
import { AuthService } from '../../Service/AuthService.js';
import { Feedback } from '../Components/UI/Feedback.js';
import { Dialog } from '../Components/UI/Dialog.js';
import { Loader } from '../Components/UI/Loader.js';
import { Security } from '../Components/UI/Security.js';

export const ViewRenderer = {
  appContainer: null,
  layoutRendered: false,
  currentCleanup: null,

  init() {
    this.appContainer = document.getElementById('app');
  },

  async render(viewName, modulePath, props = {}) {
    await this.cleanup();

    const user = AuthService.getUserData();
    const isPublicPage = ['splash', 'login'].includes(viewName);

    // 1. Manejo del Layout para páginas privadas
    if (!isPublicPage) {
      if (!this.layoutRendered) {
        this.appContainer.innerHTML = Layout.render(user);
        Layout.initEvents();
        this.layoutRendered = true;
      }
      
      this.appContainer.className = `view-${viewName}`;
      
      const rolesMoviles = ['JEFE DE CUADRANTE', 'AUXILIAR'];
      const isMobile = user && rolesMoviles.includes(user.role);
      document.body.className = `dashboard-mode ${isMobile ? 'mobile-experience' : ''}`;

      const pageModule = await import(`../../${modulePath}`);
      const contentHtml = pageModule.render(props);
      Layout.injectContent(contentHtml);
      Layout.updateTitle(props.title || viewName.toUpperCase());

    } else {
      // 2. Manejo para páginas públicas (sin layout)
      this.layoutRendered = false;
      this.appContainer.innerHTML = '';
      this.appContainer.className = `view-${viewName}`;
      document.body.className = `${viewName}-mode`;

      const viewContainer = document.createElement('div');
      viewContainer.id = `view-${viewName}`;
      this.appContainer.appendChild(viewContainer);

      const pageModule = await import(`../../${modulePath}`);
      viewContainer.innerHTML = pageModule.render(props);
    }

    // 3. Inicializar Controlador
    const controllerPath = this.getControllerPath(modulePath);
    try {
      const controllerModule = await import(`../../${controllerPath}`);
      if (controllerModule.controller?.init) {
        this.currentCleanup = await controllerModule.controller.init(props);
      }
    } catch (e) {
      console.error(`Error cargando controlador para ${viewName}:`, e);
      console.warn(`Controlador no encontrado para ${viewName}`);
    }
  },

  getControllerPath(modulePath) {
    return modulePath.replace('Pages', 'Controllers').replace('.page.js', '.controller.js');
  },

  async cleanup() {
    if (typeof this.currentCleanup === 'function') await this.currentCleanup();
    this.currentCleanup = null;
    Loader.hide(); // Ocultar loaders persistentes al cambiar de página
  },

  /**
   * Muestra un toast institucional (Reemplazo táctico)
   */
  showToast(message, type = 'success') {
    Feedback.showToast(message, type);
  },

  /**
   * Reemplazo institucional para window.alert
   */
  alert(message, title) {
    return Dialog.alert(message, title);
  },

  /**
   * Reemplazo institucional para window.confirm
   */
  confirm(message, title) {
    return Dialog.confirm(message, title);
  }
};

// Exponer globalmente para reemplazo institucional unificado
window.cupazAlert = (msg, title) => Dialog.alert(msg, title);
window.cupazConfirm = (msg, title) => Dialog.confirm(msg, title);
window.cupazPrompt = (msg, title) => Dialog.prompt(msg, title);
window.cupazToast = (msg, type) => Feedback.showToast(msg, type);
window.cupazLoader = {
    show: (txt, id) => Loader.show(txt, id),
    hide: (id) => Loader.hide(id)
};
