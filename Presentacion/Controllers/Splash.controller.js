/**
 * Presentacion/Controllers/Splash/Splash.controller.js
 * Lógica del Splash Screen
 */

export const controller = {
  timeoutId: null,

  async init(props) {
    const { onComplete } = props;

    // Asegurar que el DOM esté listo
    await new Promise(resolve => setTimeout(resolve, 50));

    // Animación
    this.startProgress();

    // Redirección tras la carga
    this.timeoutId = setTimeout(() => {
      if (onComplete) onComplete();
    }, 2500);

    return () => this.destroy();
  },

  startProgress() {
    const bar = document.getElementById('splashBar');
    if (bar) {
      bar.style.transition = 'width 2.2s ease-in-out';
      setTimeout(() => bar.style.width = '100%', 100);
    }
  },

  destroy() {
    if (this.timeoutId) clearTimeout(this.timeoutId);
  }
};
