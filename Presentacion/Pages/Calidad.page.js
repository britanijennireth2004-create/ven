/**
 * Presentacion/Pages/Calidad/Calidad.page.js
 * Módulo de Gestión de Calidad y Evaluación del Servicio (CU-22)
 */

export function render(props = {}) {
  const userRole = (props.role || '').toUpperCase();
  const isDirector = userRole === 'DIRECTOR GENERAL';

  return `
    <div id="calidadPage" class="page-content active" style="padding-top: 15px;">
      
      <div class="table-container" style="position: relative; min-height: 400px;">
        
        <div class="table-header" style="margin-bottom: 0;">
          <div class="header-texts">
            <h2 class="table-title">Gestión de Calidad y Evaluación</h2>
            <p class="table-subtitle">Auditoría de desempeño y control de mejora continua</p>
          </div>
        </div>

        <!-- FILTROS (TOOLBAR COMPACTA) -->
        <div class="admin-container" style="padding: 15px 20px; background: white; border-bottom: 1px solid var(--border-light); margin-bottom: 20px; border-radius: 0;">
          <div style="display: flex; gap: 15px; align-items: flex-end; flex-wrap: wrap;">
              <div class="pb-group" style="flex: 1; min-width: 200px; margin-bottom: 0;">
                  <label class="pb-label" style="font-size: 0.7rem;">Tipo de Evaluación</label>
                  <select id="selTipoEvaluacion" class="pb-select" style="padding: 8px;">
                      <option value="PERIODO">Evaluación por Período</option>
                      <option value="UNIDAD">Evaluación por Unidad / Recurso</option>
                      <option value="PERSONAL">Evaluación por Funcionario</option>
                      <option value="CUADRANTE">Evaluación por Cuadrante</option>
                  </select>
              </div>
              <div class="pb-group" style="flex: 1; min-width: 140px; margin-bottom: 0;">
                  <label class="pb-label" style="font-size: 0.7rem;">Desde</label>
                  <input type="date" id="evalDesde" class="pb-input" style="padding: 8px;">
              </div>
              <div class="pb-group" style="flex: 1; min-width: 140px; margin-bottom: 0;">
                  <label class="pb-label" style="font-size: 0.7rem;">Hasta</label>
                  <input type="date" id="evalHasta" class="pb-input" style="padding: 8px;">
              </div>
              <div class="pb-group" style="flex: 1; min-width: 180px; margin-bottom: 0;">
                  <label class="pb-label" style="font-size: 0.7rem;">Sujeto a Evaluar</label>
                  <select id="selAmbitoEval" class="pb-select" style="padding: 8px;">
                      <option value="TODO">Todo el Sistema</option>
                      <option value="CPNB">Policía (CPNB)</option>
                      <option value="PC">Protección Civil</option>
                      <option value="BOMBEROS">Bomberos</option>
                  </select>
              </div>
              <div class="pb-group" style="flex: 1; min-width: 180px; margin-bottom: 0;">
                  <label class="pb-label" style="font-size: 0.7rem;">Referencia</label>
                  <select id="selCompararCon" class="pb-select" style="padding: 8px;">
                      <option value="ESTANDAR">Estándares ISO</option>
                      <option value="ANTERIOR">Período Anterior</option>
                  </select>
              </div>
              <button class="add-btn" style="height: 38px; padding: 0 20px; width: auto; background: var(--secondary-color);" onclick="window.generarEvaluacionOperativa()">
                  <i class="fas fa-award"></i> EVALUAR
              </button>
          </div>
        </div>

        <!-- SISTEMA DE PESTAÑAS -->
        <div class="admin-tabs" style="margin: 0 20px 20px 20px; border-bottom: 1px solid var(--border-light);">
           <div class="admin-tab active" id="tabResumenCal" onclick="window.switchCalidadTab('resumen')">
              <i class="fas fa-chart-line"></i> Desempeño y Puntajes
           </div>
           <div class="admin-tab" id="tabRankingCal" onclick="window.switchCalidadTab('ranking')">
              <i class="fas fa-list-ol"></i> Ranking Operativo
           </div>
           <div class="admin-tab" id="tabHallazgosCal" onclick="window.switchCalidadTab('hallazgos')">
              <i class="fas fa-exclamation-triangle"></i> Control de Hallazgos
           </div>
        </div>

        <!-- ESTADO INICIAL / VACÍO -->
        <div id="evalEmptyState" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; text-align: center;">
            <i class="fas fa-clipboard-check" style="font-size: 4rem; color: #cbd5e1; margin-bottom: 20px;"></i>
            <h3 style="color: #64748b; font-size: 1.1rem; margin-bottom: 10px;">No hay evaluaciones generadas</h3>
            <p style="color: #94a3b8; font-size: 0.85rem; max-width: 400px;">Seleccione los parámetros de evaluación en la barra superior y haga clic en "EVALUAR" para emitir un reporte de auditoría y desempeño de calidad operativa.</p>
        </div>

        <!-- AREA DE DASHBOARD -->
        <div id="evalResultContainer" style="padding: 0 20px 20px 20px; opacity: 1; transition: opacity 0.3s; position: relative; overflow: hidden; display: none;">
           
           <!-- KPIs PRINCIPALES GLOBALES -->
           <div class="calidad-overview-grid" style="margin-bottom: 25px; margin-top: 5px;">
              <div class="calidad-score-card" style="box-shadow: 0 4px 6px rgba(0,0,0,0.05); padding: 15px; border-radius: 8px; border: 1px solid var(--border-light); display: flex; align-items:center; justify-content:space-between; flex-direction: row;">
                  <div style="flex: 1;">
                      <span style="font-size: 0.65rem; font-weight: 800; color: #64748b; letter-spacing: 1px; text-transform: uppercase;">Calificación General</span>
                      <div id="evalScoreCircle" style="font-size: 2rem; font-weight: 900; color: #16a34a; margin-top: 5px;">0<span style="font-size: 1rem; opacity: 0.5;">/100</span></div>
                  </div>
                  <span id="evalScoreStatus" class="u-tag en-desplazamiento" style="background:#dcfce7; color:#16a34a; white-space: nowrap;">NIVEL ÓPTIMO</span>
              </div>
              
              <div class="patrullaje-stats-grid" style="grid-template-columns: repeat(2, 1fr); margin:0;">
                  <div class="stat-card-mini">
                      <div class="stat-info">
                         <span class="stat-label">Desviaciones Detectadas</span>
                         <span class="stat-value" id="evalDesviaciones" style="color: var(--danger);">0</span>
                      </div>
                  </div>
                  <div class="stat-card-mini">
                      <div class="stat-info">
                         <span class="stat-label">Cumplimiento Protocolar</span>
                         <span class="stat-value" id="evalProtocolos">0%</span>
                      </div>
                  </div>
              </div>
           </div>

           <!-- PANEL 1: RESUMEN Y KPIs DE SERVICIO -->
           <div id="panelResumenCal" class="tab-content-calidad active-panel" style="display: block;">
               <h4 style="font-size: 0.75rem; font-weight: 800; color: #94a3b8; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px;">Indicadores Tácticos</h4>
               <div class="form-grid-3" style="gap: 20px;">
                  <div class="pb-card calidad-indicator-card success" style="padding: 20px;">
                      <div style="display:flex; justify-content:space-between; align-items:start;">
                          <span style="font-size: 0.65rem; font-weight: 800; color: #64748b;">TIEMPO DE RESPUESTA</span>
                          <i class="fas fa-circle" style="color:#16a34a; font-size: 0.7rem;"></i>
                      </div>
                      <div style="margin-top: 10px;">
                          <span id="valTR" style="font-size: 1.25rem; font-weight: 800;">-- min</span>
                          <p style="font-size: 0.6rem; color: #94a3b8; margin-top:5px;">Estándar requerido: < 10 min</p>
                      </div>
                  </div>
                  <div class="pb-card calidad-indicator-card warning" style="padding: 20px;">
                      <div style="display:flex; justify-content:space-between; align-items:start;">
                          <span style="font-size: 0.65rem; font-weight: 800; color: #64748b;">TASA DE RESOLUCIÓN</span>
                          <i class="fas fa-circle" style="color:#eab308; font-size: 0.7rem;"></i>
                      </div>
                      <div style="margin-top: 10px;">
                          <span id="valTRC" style="font-size: 1.25rem; font-weight: 800;">--%</span>
                          <p style="font-size: 0.6rem; color: #94a3b8; margin-top:5px;">Estándar requerido: > 75%</p>
                      </div>
                  </div>
                  <div class="pb-card calidad-indicator-card success" style="padding: 20px;">
                      <div style="display:flex; justify-content:space-between; align-items:start;">
                          <span style="font-size: 0.65rem; font-weight: 800; color: #64748b;">COBERTURA TERRITORIAL</span>
                          <i class="fas fa-circle" style="color:#16a34a; font-size: 0.7rem;"></i>
                      </div>
                      <div style="margin-top: 10px;">
                          <span id="valCOB" style="font-size: 1.25rem; font-weight: 800;">--%</span>
                          <p style="font-size: 0.6rem; color: #94a3b8; margin-top:5px;">Estándar requerido: > 85%</p>
                      </div>
                  </div>
               </div>
           </div>

           <!-- PANEL 2: RANKING -->
           <div id="panelRankingCal" class="tab-content-calidad" style="display: none;">
               <div class="pb-card" style="padding: 0; overflow: hidden;">
                  <div style="background: var(--neutral-lighter); padding: 12px 20px; border-bottom: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center;">
                     <h4 style="font-size: 0.85rem; font-weight: 700; color: var(--text-dark);"><i class="fas fa-list-ol text-muted" style="margin-right: 5px;"></i> Desglose de Puntuación</h4>
                  </div>
                  <div class="table-wrapper" style="max-height: 400px; overflow-y: auto;">
                     <table class="data-table">
                        <thead><tr><th>UNIDAD PERTENECIENTE</th><th>PUNTUACIÓN OBTENIDA</th><th>RESULTADO EVALUATIVO</th></tr></thead>
                        <tbody id="evalRankingBody">
                            <tr><td colspan="3" style="text-align:center; padding:20px; color:#999;">No hay auditoría generada</td></tr>
                        </tbody>
                     </table>
                  </div>
               </div>
           </div>
           
           <!-- PANEL 3: HALLAZGOS -->
           <div id="panelHallazgosCal" class="tab-content-calidad" style="display: none;">
               <div class="pb-card" style="padding: 0; overflow: hidden; margin-bottom: 20px;">
                  <div style="background: var(--neutral-lighter); padding: 12px 20px; border-bottom: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center;">
                     <h4 style="font-size: 0.85rem; font-weight: 700; color: var(--danger);"><i class="fas fa-exclamation-triangle" style="margin-right: 5px;"></i> Desviaciones Críticas Registradas</h4>
                     ${!isDirector ? `
                     <button class="add-btn" style="background:#ff4747; padding: 6px 12px; height: auto; font-size: 0.7rem; width: auto;" onclick="window.registrarHallazgoCalidad()">
                        <i class="fas fa-plus"></i> Registrar Hallazgo
                     </button>
                     ` : ''}
                  </div>
                  <div class="table-wrapper" style="max-height: 400px; overflow-y: auto;">
                     <table class="data-table">
                        <thead><tr><th>INCIDENTE ORIGEN</th><th>FECHA</th><th>FALLA DETECTADA / INCUMPLIMIENTO</th></tr></thead>
                        <tbody id="evalHallazgosBody">
                            <tr><td colspan="3" style="text-align:center; padding:20px; color:#999;">No hay auditoría generada</td></tr>
                        </tbody>
                     </table>
                  </div>
               </div>
           </div>

           <!-- ACCIONES INFERIORES -->
           <div style="margin-top: 20px; display: flex; justify-content: space-between; padding-top: 20px; border-top: 1px solid var(--border-light);">
              <div>
                ${!isDirector ? `
                <button class="btn-upload-simple" onclick="window.generarPlanMejora()" style="color: var(--primary-color);">
                    <i class="fas fa-clipboard-check"></i> Emitir Plan de Mejora Correctiva
                </button>
                ` : '<span class="u-text-muted u-text-xs"><i class="fas fa-info-circle"></i> Vista de Supervisión Estratégica (Solo Lectura)</span>'}
              </div>
              <div style="display: flex; gap: 10px;">
                 <button class="add-btn" style="background:#ff4747; padding: 0 15px; height: 35px; width:auto; font-size: 0.75rem;" onclick="window.exportarEvaluacionPDF()"><i class="fas fa-file-pdf"></i> Exportar Informe</button>
                 ${!isDirector ? `
                 <button class="add-btn" style="background:var(--secondary-color); padding: 0 15px; height: 35px; width:auto; font-size: 0.75rem;" onclick="window.guardarEvaluacionHistorial()"><i class="fas fa-save"></i> Archivar</button>
                 ` : ''}
              </div>
           </div>

        </div>

        <!-- LOADER -->
        <div id="evalLoader" style="display:none; position: absolute; top:0; left:0; width:100%; height:100%; background:rgba(255,255,255,0.85); z-index: 100; flex-direction:column; justify-content:center; align-items:center; border-radius:12px;">
           <div class="spinner" style="width: 40px; height: 40px; border-width: 4px;"></div>
           <span style="font-weight: 800; font-size: 0.75rem; margin-top: 15px; color: var(--primary-color); letter-spacing:1px;">AUDITANDO MÉTRICAS DE SERVICIO...</span>
           <p style="font-size: 0.6rem; color: #64748b; margin-top: 5px;">Contrastando operativa contra estándares institucionales</p>
        </div>

      </div>
    </div>
  `;
}
