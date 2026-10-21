/**
 * Presentacion/Pages/Analisis/Analisis.page.js
 * Módulo de Análisis y Gestión de Información - Centro de Inteligencia Operativa
 */

export function render(props = {}) {
   return `
    <div id="analisisPage" class="page-content active">
        
      <div class="table-container" style="position: relative; min-height: 400px;">
        
        <div class="table-header" style="margin-bottom: 0;">
          <div class="header-texts">
            <h2 class="table-title">Centro de Inteligencia Operativa</h2>
            <p class="table-subtitle">Análisis estadístico y trazabilidad en tiempo real</p>
          </div>
        </div>

        <!-- FILTROS (TOOLBAR AVANZADA) -->
        <div class="admin-container" style="padding: 15px 20px; background: white; border-bottom: 1px solid var(--border-light); margin-bottom: 20px; border-radius: 0;">
          <div style="display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap;">
              <div class="pb-group" style="flex: 1; min-width: 180px; margin-bottom: 0;">
                  <label class="pb-label" style="font-size: 0.65rem;">Métrica Operativa</label>
                  <select id="selTipoReporte" class="pb-select" style="padding: 7px; font-size: 0.75rem;">
                      <option value="INCIDENTES">Volumen de Incidentes</option>
                      <option value="TIEMPOS">Tiempos de Respuesta</option>
                      <option value="PREVENCION">Actividades Preventivas</option>
                      <option value="PATRULLAJE">Patrullajes Realizados</option>
                  </select>
              </div>
              <div class="pb-group" style="flex: 0.8; min-width: 130px; margin-bottom: 0;">
                  <label class="pb-label" style="font-size: 0.65rem;">Desde</label>
                  <input type="date" id="dateDesde" class="pb-input" style="padding: 7px; font-size: 0.75rem;">
              </div>
              <div class="pb-group" style="flex: 0.8; min-width: 130px; margin-bottom: 0;">
                  <label class="pb-label" style="font-size: 0.65rem;">Hasta</label>
                  <input type="date" id="dateHasta" class="pb-input" style="padding: 7px; font-size: 0.75rem;">
              </div>
              <div class="pb-group" style="flex: 1; min-width: 160px; margin-bottom: 0;">
                  <label class="pb-label" style="font-size: 0.65rem;">Ámbito Geo.</label>
                  <select id="selAmbitoGeo" class="pb-select" style="padding: 7px; font-size: 0.75rem;">
                      <option value="TODO">Todo el Territorio</option>
                      <option value="CUADRANTE">Por Cuadrante de Paz</option>
                      <option value="COMUNA">Por Comuna</option>
                  </select>
              </div>
              <div class="pb-group" style="flex: 1; min-width: 150px; margin-bottom: 0;">
                  <label class="pb-label" style="font-size: 0.65rem;">Sub-Filtro Táctico</label>
                  <select id="selSubFiltro" class="pb-select" style="padding: 7px; font-size: 0.75rem;">
                      <option value="TODOS">Todos los eventos</option>
                      <option value="ALTA_CRITICA">Prioridad Alta/Crítica</option>
                      <option value="POLICIAL">Solo Policial</option>
                      <option value="SALUD">Solo Salud</option>
                      <option value="BOMBEROS">Solo Bomberos</option>
                  </select>
              </div>
              <div class="pb-group" style="flex: 0.7; min-width: 120px; margin-bottom: 0;">
                  <label class="pb-label" style="font-size: 0.65rem;">Plantilla</label>
                  <select id="selPlantillaReporte" class="pb-select" style="padding: 7px; font-size: 0.75rem; border-color: var(--primary-color);">
                      <option value="NUEVO">Personalizado</option>
                      <option value="RESUMEN_DIARIO">Resumen Diario</option>
                      <option value="ALERTA_SEMANAL">Fricción Semanal</option>
                      <option value="INFORME_MENSUAL">Cierre de Mes</option>
                  </select>
              </div>
              <div style="display: flex; gap: 5px; align-items: flex-end;">
                <button class="add-btn" style="height: 34px; padding: 0 15px; width: auto; font-size: 0.75rem;" onclick="window.generarReportePrincipal()">
                    <i class="fas fa-sync-alt"></i> ANALIZAR
                </button>
                <button class="add-btn" style="height: 34px; padding: 0 12px; width: auto; font-size: 0.75rem; background: var(--secondary-color);" onclick="window.guardarConfiguracionActual()" title="Guardar como Plantilla">
                    <i class="fas fa-save"></i>
                </button>
              </div>
          </div>
        </div>

        <!-- SISTEMA DE PESTAÑAS TÁCTICAS -->
        <div class="admin-tabs" style="margin: 0 20px 20px 20px; border-bottom: 1px solid var(--border-light);">
            <div class="admin-tab active" id="tabGraficos" onclick="window.switchAnalisisTab('graficos')">
               <i class="fas fa-chart-pie"></i> Visualización Estratégica
            </div>
            <div class="admin-tab" id="tabMapa" onclick="window.switchAnalisisTab('mapa')">
               <i class="fas fa-fire-flame-curved"></i> Mapa de Calor
            </div>
            <div class="admin-tab" id="tabTabla" onclick="window.switchAnalisisTab('tabla')">
               <i class="fas fa-table"></i> Desglose Operativo
            </div>
        </div>

        <!-- AREA DE DASHBOARD -->
        <div id="reportContainer" style="padding: 0 20px 20px 20px; opacity: 1; transition: opacity 0.3s; position: relative;">
           
           <div class="patrullaje-stats-grid" style="margin-bottom: 25px; margin-top: 5px;">
              <div class="stat-card-mini">
                  <div class="stat-info">
                     <span class="stat-label">Registros Procesados</span>
                     <span class="stat-value" id="repTotalRegistros" style="color:var(--primary-dark);">0</span>
                  </div>
              </div>
              <div class="stat-card-mini">
                  <div class="stat-info">
                     <span class="stat-label" id="repVariacionLabel">Variación Periodo Anterior</span>
                     <span class="stat-value" id="repVariacion">0%</span>
                  </div>
              </div>
              <div class="stat-card-mini">
                  <div class="stat-info">
                     <span class="stat-label" id="repPromedioLabel">Métrica Promedio</span>
                     <span class="stat-value" id="repPromedio" style="color:var(--accent-color);">0.0</span>
                  </div>
              </div>
           </div>

           <!-- PANEL 1: GRÁFICOS -->
           <div id="panelGraficos" class="tab-content-analisis active-panel" style="display: block;">
               <div class="form-grid-2">
                  <div class="pb-card" style="padding: 20px;">
                      <h4 style="font-size: 0.85rem; margin-bottom: 5px; color: var(--text-dark); display: flex; align-items: center; gap: 8px;"><i class="fas fa-chart-line text-muted"></i> Tendencia Temporal</h4>
                      <p style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 15px; line-height: 1.4;">Evolución cronológica del indicador comparada con estándares operativos.</p>
                      <div id="chartTrend" class="simulated-chart-bars" style="height: 160px; display: flex; align-items: flex-end; justify-content: center; color: var(--text-muted); font-size: 0.8rem;">Cargando...</div>
                  </div>
                  <div class="pb-card" style="padding: 20px;">
                      <h4 style="font-size: 0.85rem; margin-bottom: 5px; color: var(--text-dark); display: flex; align-items: center; gap: 8px;"><i class="fas fa-chart-pie text-muted"></i> Distribución Estructural</h4>
                      <p style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 15px; line-height: 1.4;">Desglose porcentual por naturaleza y prioridad del evento.</p>
                      <div id="chartPie" class="simulated-chart-pie" style="height: 160px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 0.8rem;">Analizando...</div>
                  </div>
               </div>
           </div>

           <!-- PANEL 1.5: MAPA DE CALOR -->
           <div id="panelMapa" class="tab-content-analisis" style="display: none;">
               <div class="pb-card" style="padding: 0; min-height: 400px; overflow: hidden; position: relative;">
                   <div id="mapaInteligencia" style="width: 100%; height: 400px; background: #f8fafc;"></div>
                   <div style="padding: 15px; background: #fff; border-top: 1px solid var(--border-light); font-size: 0.7rem; color: var(--text-muted); display: flex; align-items: center; gap: 10px;">
                       <i class="fas fa-info-circle"></i>
                       Representación geoespacial de densidad de incidentes (Heatmap) basada en coordenadas de captación.
                   </div>
               </div>
           </div>

           <!-- PANEL 2: TABLA Y EXPORTACIÓN -->
           <div id="panelTabla" class="tab-content-analisis" style="display: none;">
               <div class="pb-card" style="padding: 0; overflow: hidden;">
                  <div style="background: var(--neutral-lighter); padding: 12px 20px; border-bottom: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center;">
                     <h4 style="font-size: 0.82rem; font-weight: 700; color: var(--text-dark);"><i class="fas fa-list text-muted" style="margin-right: 5px;"></i> Desglose Operativo Detallado</h4>
                     <div style="display: flex; gap: 10px;">
                        <button class="add-btn" style="background: #107c10; padding: 6px 12px; height: auto; font-size: 0.65rem; width: auto;" onclick="window.exportarReporte('EXCEL')"><i class="fas fa-file-excel"></i> EXCEL</button>
                        <button class="add-btn" style="background: var(--danger); padding: 6px 12px; height: auto; font-size: 0.65rem; width: auto;" onclick="window.exportarReporte('PDF')"><i class="fas fa-file-pdf"></i> PDF</button>
                     </div>
                  </div>
                  <div class="table-wrapper" style="max-height: 400px; overflow-y: auto;">
                     <table class="data-table">
                        <thead id="reportTableHeader"></thead>
                        <tbody id="reportTableBody">
                            <tr><td colspan="5" style="text-align:center; padding: 20px; color: var(--text-muted);">Iniciando motor analítico...</td></tr>
                        </tbody>
                     </table>
                  </div>
               </div>
           </div>

        </div>

        <!-- LOADER SISTÉMICO -->
        <div id="reportLoader" style="display:none; position: absolute; top:0; left:0; width:100%; height:100%; background:rgba(255,255,255,0.85); z-index: 100; flex-direction:column; justify-content:center; align-items:center; border-radius:12px;">
           <div class="spinner" style="width: 40px; height: 40px; border-width: 4px;"></div>
           <span style="font-weight: 800; font-size: 0.7rem; margin-top: 15px; color: var(--primary-color); letter-spacing:1px;">PROCESANDO INTELIGENCIA OPERATIVA...</span>
           <div style="width: 200px; height: 4px; background: var(--neutral-light); margin-top: 15px; border-radius: 5px; overflow: hidden;">
              <div id="reportProgressBar" style="width: 0%; height: 100%; background: var(--primary-color); transition: width 0.1s;"></div>
           </div>
        </div>

      </div>
    </div>
   `;
}
