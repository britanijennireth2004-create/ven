/**
 * Presentacion/Pages/Splash/Splash.page.js
 * Vista inicial de carga
 */

export function render(props = {}) {
  return `
    <div id="splashScreen">
      <div class="splash-container">
        <div class="splash-logo-container">
          <div class="splash-logo-outer">
            <div class="splash-logo-inner">CPZ</div>
          </div>
        </div>
        <div class="splash-text-container">
          <h1 class="splash-title">Cuadrantes de Paz</h1>
          <p class="splash-subtitle">Sistema de Inteligencia Territorial</p>
          <div class="splash-progress">
            <div class="splash-progress-bar" id="splashBar"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}
