/**
 * Presentacion/Pages/Notificaciones.page.js
 * Módulo de flujo de actividad y notificaciones operativas (Estilo Gmail)
 */

export function render(props = {}) {
    return `
    <div id="notificacionesPage" class="page-content gmail-container">
        <!-- CONTENIDO PRINCIPAL -->
        <div class="gmail-main u-m-0 u-br-12 u-w-full">
            <!-- TOOLBAR SUPERIOR -->
            <div class="gmail-toolbar">
                <div class="toolbar-right u-w-full">
                    <div class="pb-search-bar u-max-w-full">
                        <i class="fas fa-search pb-search-icon"></i>
                        <input type="text" id="notifSearch" class="search-input" placeholder="Buscar en historial de actividad..." autocomplete="off">
                        <div id="notifSearchResults" class="search-results"></div>
                    </div>
                </div>
            </div>

            <!-- TABS DE CATEGORÍA DESCRIPTIVOS -->
            <div class="gmail-tabs">
                <div class="tab-item active" data-category="PENDING">
                    <i class="fas fa-clock"></i> <span>Pendientes</span>
                </div>
                <div class="tab-item" data-category="ALERTS">
                    <i class="fas fa-exclamation-triangle"></i> <span>Alertas Críticas</span>
                </div>
                <div class="tab-item" data-category="SECURITY">
                    <i class="fas fa-shield-alt"></i> <span>Seguridad y Accesos</span>
                </div>
                <div class="tab-item" data-category="OPERATIONS">
                    <i class="fas fa-project-diagram"></i> <span>Movimientos Operativos</span>
                </div>
                <div class="tab-item" data-category="SUPPORT">
                    <i class="fas fa-headset"></i> <span>Soporte Técnico</span>
                </div>
                <div class="tab-item" data-category="READ">
                    <i class="fas fa-history"></i> <span>Historial Revisado</span>
                </div>
            </div>

            <!-- LISTA DE NOTIFICACIONES -->
            <div id="gmailList" class="gmail-list">
                <!-- Se inyectan filas dinámicamente -->
                <div class="gmail-loading">
                    <div class="spinner"></div>
                    <span>Cargando mensajes tácticos...</span>
                </div>
            </div>
        </div>
    </div>
  `;
}
