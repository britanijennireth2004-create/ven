/**
 * Presentacion/Components/UI/Loader.js
 * Componente reutilizable para estados de carga y skeletons.
 */

export const Loader = {
  /**
   * Muestra un loader de pantalla completa o bloqueado a un contenedor.
   * @param {string} text - Texto de carga opcional.
   * @param {string} containerId - Si se provee, el loader se queda dentro de ese elemento.
   */
  show(text = 'PROCESANDO...', containerId = null) {
    const parent = containerId ? document.getElementById(containerId) : document.body;
    if (!parent) return;

    this.hide(containerId); // Limpiar previos

    const loader = document.createElement('div');
    loader.id = containerId ? `loader-${containerId}` : 'global-loader';
    
    loader.style.cssText = `
      position: ${containerId ? 'absolute' : 'fixed'};
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(2px);
      z-index: 99999;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      border-radius: inherit;
    `;

    loader.innerHTML = `
      <div class="spinner" style="width: 45px; height: 45px; border-width: 5px;"></div>
      <span style="font-weight: 800; font-size: 0.75rem; margin-top: 20px; color: var(--primary-color); letter-spacing: 2px; text-transform: uppercase;">${text}</span>
      <div style="width: 150px; height: 3px; background: #e2e8f0; margin-top: 15px; border-radius: 5px; overflow: hidden;">
         <div class="loader-progress-bar" style="width: 30%; height: 100%; background: var(--primary-color); animation: loader-pulse 2s infinite ease-in-out;"></div>
      </div>
    `;

    parent.style.position = containerId ? 'relative' : '';
    parent.appendChild(loader);
  },

  hide(containerId = null) {
    const id = containerId ? `loader-${containerId}` : 'global-loader';
    const el = document.getElementById(id);
    if (el) el.remove();
  },

  /**
   * Genera un skeleton simple para tablas o tarjetas.
   */
  renderSkeleton(type = 'table', rows = 5) {
    if (type === 'table') {
      return Array(rows).fill(0).map(() => `
        <tr class="skeleton-row">
          <td colspan="100%"><div class="skeleton-line" style="height: 35px; margin: 5px 0; opacity: 0.1; background: #666; width: 100%;"></div></td>
        </tr>
      `).join('');
    }
    return `<div class="skeleton-box" style="height: 150px; background: #eee; width: 100%; border-radius: 8px; animation: pulse 1.5s infinite;"></div>`;
  }
};
