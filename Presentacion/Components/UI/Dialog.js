/**
 * Presentacion/Components/UI/Dialog.js
 * Componente reutilizable para Ventanas Modales y Diálogos de Confirmación.
 */

export const Dialog = {
  /**
   * Cierra cualquier modal por ID.
   */
  closeModal(id = 'dynamicModal') {
    const el = document.getElementById(id);
    if (el) {
      el.style.animation = 'scaleUp 0.15s ease-in reverse';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 150);
    }
  },

  /**
   * Abre un modal personalizado con contenido dinámico.
   */
  openModal({ id, title, content, footer, maxWidth = '500px' }) {
    this.closeModal(id);
    
    const overlay = document.createElement('div');
    overlay.id = id;
    overlay.className = 'cupaz-dialog-overlay';
    
    overlay.innerHTML = `
      <div class="cupaz-dialog-box" style="max-width: ${maxWidth};">
        <div class="cupaz-dialog-header">
          <h3 class="cupaz-dialog-title">${title}</h3>
        </div>
        <div class="cupaz-dialog-body">
          ${content}
        </div>
        <div class="cupaz-dialog-footer">
          ${footer}
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    return overlay;
  },

  /**
   * Diálogo de confirmación institucional (Usado para Cierre de Sesión).
   */
  async confirm(message, title = 'Confirmación Táctica') {
    return new Promise((resolve) => {
      const modalId = 'confirm-dialog';
      this.closeModal(modalId);
      
      const overlay = document.createElement('div');
      overlay.id = modalId;
      overlay.className = 'cupaz-dialog-overlay';
      
      // Si el título habla de cerrar sesión, usamos icono de logout rojo
      const isLogout = title.toUpperCase().includes('CERRAR SESIÓN');
      const iconClass = isLogout ? 'fas fa-sign-out-alt' : 'fas fa-question';
      const typeClass = isLogout ? '' : 'warning';
      const btnConfirmText = isLogout ? 'Cerrar Sesión' : 'Confirmar';
      const btnConfirmClass = isLogout ? 'cupaz-dialog-btn-confirm' : 'cupaz-dialog-btn-primary';

      overlay.innerHTML = `
        <div class="cupaz-dialog-box">
          <div class="cupaz-dialog-header">
            <div class="cupaz-dialog-icon ${typeClass}">
              <i class="${iconClass}"></i>
            </div>
            <h3 class="cupaz-dialog-title">${title}</h3>
          </div>
          <div class="cupaz-dialog-body">
            <p class="cupaz-dialog-text">${message}</p>
          </div>
          <div class="cupaz-dialog-footer">
            <button class="cupaz-dialog-btn cupaz-dialog-btn-cancel" id="confirm-cancel">
              Cancelar
            </button>
            <button class="cupaz-dialog-btn ${btnConfirmClass}" id="confirm-ok">
              ${btnConfirmText} <i class="fas fa-check"></i>
            </button>
          </div>
        </div>
      `;
      
      document.body.appendChild(overlay);
      
      overlay.querySelector('#confirm-ok').onclick = () => {
        this.closeModal(modalId);
        resolve(true);
      };
      
      overlay.querySelector('#confirm-cancel').onclick = () => {
        this.closeModal(modalId);
        resolve(false);
      };
    });
  },

  /**
   * Alerta institucional informativa
   */
  async alert(message, title = 'Notificación Institucional') {
    return new Promise((resolve) => {
      const modalId = 'alert-dialog';
      this.closeModal(modalId);
      
      const overlay = document.createElement('div');
      overlay.id = modalId;
      overlay.className = 'cupaz-dialog-overlay';
      
      overlay.innerHTML = `
        <div class="cupaz-dialog-box">
          <div class="cupaz-dialog-header">
            <div class="cupaz-dialog-icon info">
              <i class="fas fa-info"></i>
            </div>
            <h3 class="cupaz-dialog-title">${title}</h3>
          </div>
          <div class="cupaz-dialog-body">
            <p class="cupaz-dialog-text">${message}</p>
          </div>
          <div class="cupaz-dialog-footer">
            <button class="cupaz-dialog-btn cupaz-dialog-btn-primary" id="alert-ok" style="flex: none; width: 100%;">
              ENTENDIDO
            </button>
          </div>
        </div>
      `;
      
      document.body.appendChild(overlay);
      
      overlay.querySelector('#alert-ok').onclick = () => {
        this.closeModal(modalId);
        resolve();
      };
    });
  },

  /**
   * Diálogo de entrada institucional
   */
  async prompt(message, title = 'Entrada Requerida') {
    return new Promise((resolve) => {
      const modalId = 'prompt-dialog';
      this.closeModal(modalId);
      
      const overlay = document.createElement('div');
      overlay.id = modalId;
      overlay.className = 'cupaz-dialog-overlay';
      
      overlay.innerHTML = `
        <div class="cupaz-dialog-box">
          <div class="cupaz-dialog-header">
            <div class="cupaz-dialog-icon" style="background:#f1f5f9; color:#475569; box-shadow:none;">
              <i class="fas fa-keyboard"></i>
            </div>
            <h3 class="cupaz-dialog-title">${title}</h3>
          </div>
          <div class="cupaz-dialog-body">
            <p class="cupaz-dialog-text" style="margin-bottom:15px;">${message}</p>
            <input type="text" id="prompt-input" class="pb-input" style="width:100%; text-align:center; box-sizing:border-box;" autocomplete="off" autofocus>
          </div>
          <div class="cupaz-dialog-footer">
            <button class="cupaz-dialog-btn cupaz-dialog-btn-cancel" id="prompt-cancel">
              Cancelar
            </button>
            <button class="cupaz-dialog-btn cupaz-dialog-btn-primary" id="prompt-ok">
              Enviar <i class="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      `;
      
      document.body.appendChild(overlay);
      
      const input = overlay.querySelector('#prompt-input');
      
      overlay.querySelector('#prompt-ok').onclick = () => {
        const value = input.value;
        this.closeModal(modalId);
        resolve(value);
      };
      
      overlay.querySelector('#prompt-cancel').onclick = () => {
        this.closeModal(modalId);
        resolve(null);
      };

      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') overlay.querySelector('#prompt-ok').click();
      });
      
      // Auto focus fix
      setTimeout(() => input.focus(), 100);
    });
  }
};
