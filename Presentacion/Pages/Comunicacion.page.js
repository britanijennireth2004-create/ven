/**
 * Presentacion/Pages/Comunicacion/Comunicacion.page.js
 * Módulo 6 - Comunicación e Integración Tecnológica
 */

export function render(props = {}) {
  return `
    <div id="comunicacionPage" class="page-content active">
       <div class="comm-grid">
          <!-- Mi Equipo (Jefes y Auxiliares) -->
          <div class="channels-panel">
             <div class="table-container auto-style-20">
                <h3 class="table-title">Mi Equipo de Cuadrante</h3>
                <p class="auto-style-21">Personal asignado a la operatividad del cuadrante</p>
                
                <div id="equipoList" style="display:flex; flex-direction:column; gap:10px; margin-top:20px;">
                    <!-- Se carga dinámicamente -->
                    <div style="text-align:center; padding:20px; color:#888;">Cargando personal...</div>
                </div>
             </div>
          </div>

          <!-- Formulario de Novedades -->
          <div class="alerts-panel">
              <div class="table-container auto-style-20">
                <h3 class="table-title">Reportar Novedad de Personal</h3>
                <p class="auto-style-21">Notificación directa al Coordinador de Área</p>
                
                <div class="pb-group" style="margin-top:20px;">
                    <label class="pb-label">Tipo de Novedad</label>
                    <select id="selTipoNovedad" class="pb-select">
                        <option value="FALTA">Falta / Inasistencia</option>
                        <option value="RELEVO">Cambio de Relevo</option>
                        <option value="AVERIA">Avería de Recurso (Vehículo/Radio)</option>
                        <option value="OTRO">Otro (Describir abajo)</option>
                    </select>
                </div>

                <div class="pb-group">
                    <label class="pb-label">Descripción Detallada</label>
                    <textarea id="txtNovedadDesc" class="pb-input" rows="4" placeholder="Indique nombres de involucrados y detalles de la novedad..."></textarea>
                </div>

                <div style="margin-top:20px;">
                    <button class="add-btn" id="btnReportarNovedad" style="width:100%; height:45px; font-weight:700;">
                        <i class="fas fa-paper-plane"></i> ENVIAR REPORTE A COORDINACIÓN
                    </button>
                </div>
              </div>
          </div>
       </div>
    </div>
  `;
}
