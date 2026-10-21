/**
 * Presentacion/Components/UI/Feedback.js
 * Componente reutilizable para notificaciones (Toasts) y estados de feedback.
 */

export const Feedback = {
  /**
   * Muestra un toast institucional en la esquina inferior derecha.
   * @param {string} message - Mensaje a mostrar.
   * @param {string} type - 'success', 'error', 'warning', 'info'.
   * @param {number} duration - Duración en ms.
   */
  showToast(message, type = 'success', duration = 3500) {
    const container = this._getOrCreateContainer();
    const toast = document.createElement('div');
    
    // Configuración de colores institucional
    const colors = {
      success: { bg: '#dcfce7', text: '#16a34a', icon: 'fa-check-circle' },
      error: { bg: '#fee2e2', text: '#dc2626', icon: 'fa-exclamation-circle' },
      warning: { bg: '#fef3c7', text: '#d97706', icon: 'fa-exclamation-triangle' },
      info: { bg: '#e0f2fe', text: '#0284c7', icon: 'fa-info-circle' }
    };
    
    const theme = colors[type] || colors.info;
    
    toast.className = 'pb-toast animate-slide-in-right';
    toast.style.cssText = `
      background: ${theme.bg};
      color: ${theme.text};
      padding: 12px 20px;
      border-radius: 8px;
      margin-top: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.82rem;
      font-weight: 600;
      border-left: 4px solid ${theme.text};
      min-width: 280px;
      max-width: 400px;
      position: relative;
    `;
    
    toast.innerHTML = `
      <i class="fas ${theme.icon}"></i>
      <span style="flex: 1;">${message}</span>
      <button onclick="this.parentElement.remove()" style="background:none; border:none; color:inherit; cursor:pointer; opacity:0.5; font-size:1rem;">&times;</button>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(50px)';
        toast.style.transition = 'all 0.4s ease';
        setTimeout(() => toast.remove(), 400);
      }
    }, duration);
  },

  _getOrCreateContainer() {
    let container = document.getElementById('pb-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'pb-toast-container';
      container.style.cssText = `
        position: fixed;
        top: 25px;
        right: 25px;
        z-index: 100000;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
      `;
      document.body.appendChild(container);
    }
    return container;
  }
};
