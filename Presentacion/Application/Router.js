/**
 * Presentacion/Application/Router.js
 * Manejador de rutas del sistema
 */

import { ViewRenderer } from './ViewRenderer.js';

export const Router = {
  routes: {},

  init(routes) {
    this.routes = routes;
  },

  loadPage(viewName, extraProps = {}) {
    const route = this.routes[viewName];
    if (!route) {
      console.error(`Ruta no encontrada: ${viewName}`);
      return;
    }

    const mergedProps = { ...route.props, ...extraProps };
    ViewRenderer.render(viewName, route.modulePath, mergedProps);
  }
};
