/**
 * Presentacion/Pages/Login/Login.page.js
 */
export function render(props = {}) {
  return `
    <div class="login-container">
      
      <!-- Panel Izquierdo: Bienvenida y Gráficos -->
      <div class="left-panel">
        <!-- Esferas con gradientes orgánicos -->
        <div class="sphere sphere-1"></div>
        <div class="sphere sphere-2"></div>
        <div class="sphere sphere-3"></div>
        
        <div class="welcome-content">
          <h2 class="welcome-title">BIENVENIDO</h2>
          <h3 class="welcome-headline">SISTEMA CUPAZ</h3>
          <p class="welcome-text">Centro de Comando, Control y Telecomunicaciones de Monagas. Respuesta Inmediata y Seguridad Ciudadana.</p>
        </div>
      </div>
      
      <!-- Panel Derecho: Formulario de Login -->
      <div class="right-panel">
        <div class="login-form-wrapper">
          <h2 class="form-title">Iniciar sesión</h2>
          <p class="form-subtitle">Ingrese sus credenciales de acceso institucional</p>
          
          <form id="loginForm" class="modern-form">
            <!-- Campo Usuario -->
            <div class="input-group-premium">
              <i class="fas fa-user input-icon"></i>
              <input type="text" id="username" class="premium-input-login" placeholder="Usuario o Correo" required autocomplete="username">
            </div>
            
            <!-- Campo Contraseña -->
            <div class="input-group-premium">
              <i class="fas fa-lock input-icon"></i>
              <input type="password" id="password" class="premium-input-login" placeholder="Contraseña" required autocomplete="current-password">
              <span class="toggle-password" id="btnTogglePassword">MOSTRAR</span>
            </div>
            
            <!-- Opciones y soporte -->
            <div class="form-options">
              <a href="#" id="btnOpenSupport" class="forgot-password">¿Problemas de acceso?</a>
            </div>

            <div id="loginError" class="login-error-box" style="display: none;"></div>
            
            <!-- Botón de Envío -->
            <button type="submit" class="sign-in-btn">ACCEDER AL SISTEMA</button>
          </form>

          <form id="2faForm" class="modern-form" style="display: none;"></form>
          
          <div class="login-footer">
            <span>SIT-CUPAZ Monagas • v2.0</span>
          </div>
        </div>
      </div>
      
    </div>
  `;
}
