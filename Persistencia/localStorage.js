/**
 * Persistencia/localStorage.js
 * Manejador central de datos para el sistema CUPAZ - Estado Monagas
 */

export const DataManager = {
  /**
   * Lee una tabla del almacenamiento local.
   * @param {string} tabla - Nombre de la llave (ej. 'cupaz_usuarios')
   * @returns {Array|Object}
   */
  leer(tabla) {
    try {
      const data = localStorage.getItem(tabla);

      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error al leer la tabla ${tabla}:`, error);
      return [];
    }
  },

  /**
   * Guarda datos en una tabla específica.
   * @param {string} tabla - Nombre de la llave.
   * @param {any} datos - Datos a guardar (se convertirán a JSON).
   */
  guardar(tabla, datos) {
    try {
      localStorage.setItem(tabla, JSON.stringify(datos));
    } catch (error) {
      console.error(`Error crítico al guardar en ${tabla}. ¿Almacenamiento lleno?`, error);
    }
  },

  eliminar(tabla) {
    localStorage.removeItem(tabla);
  },

  async ping() {
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 150);
    });
  }
};
