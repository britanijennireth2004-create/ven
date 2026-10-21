/**
 * Presentacion/Pages/Monitoreo/TerminalMovil.page.js
 * CU-12: Terminal de Unidad Operativa (Simulación Móvil)
 */

export function render(props = {}) {
  return `
    <div id="terminalPage" class="page-content active terminal-view">
      <div class="terminal-container-inner">
        <!-- HEADER TÁCTICO -->
        <header class="terminal-header">
            <div class="terminal-brand">
                <i class="fas fa-shield-halved"></i>
                <div>
                   <h3>CUPAZ MÓVIL</h3>
                   <span id="lblUnitDevice">NO CONECTADO</span>
                </div>
            </div>
            <div class="terminal-sync-status" id="syncStatus">
                <i class="fas fa-wifi"></i> <span id="syncText">EN LÍNEA</span>
            </div>
        </header>

        <main class="terminal-body" id="terminalMain">
            <!-- SECCIÓN: CONEXIÓN (Inicial) -->
            <div class="terminal-section active" id="secTerminalLogin">
                <div class="terminal-card tac-card">
                    <h4 class="tac-title">INICIO DE SERVICIO</h4>
                    <p class="tac-subtitle">Seleccione su unidad asignada para iniciar el enlace táctico.</p>
                    <div class="pb-group">
                        <label class="pb-label">UNIDAD OPERATIVA</label>
                        <select id="selTerminalUnit" class="pb-select tac-input">
                            <option value="">Seleccione una unidad...</option>
                        </select>
                    </div>
                    <button class="add-btn w-full tac-btn" id="btnConnectTerminal">ESTABLECER CONEXIÓN</button>
                </div>
            </div>

            <!-- SECCIÓN: INCIDENTES (Tareas) -->
            <div class="terminal-section" id="secTerminalIncidents">
                <h4 class="terminal-section-title"><i class="fas fa-bell"></i> INCIDENTES ASIGNADOS</h4>
                <div id="terminalIncidentsContainer" class="vertical-scroll">
                    <!-- Dinámico -->
                </div>
                <div id="terminalIncidentDetail" class="terminal-detail hidden">
                    <!-- Dinámico -->
                </div>
            </div>

            <!-- SECCIÓN: PATRULLAJE -->
            <div class="terminal-section" id="secTerminalPatrol">
                <h4 class="terminal-section-title"><i class="fas fa-route"></i> PATRULLAJE TERRITORIAL</h4>
                <div id="patrolActionArea">
                    <!-- Dinámico (Inicio / Reporte Punto / Fin) -->
                </div>
            </div>

            <!-- SECCIÓN: ACTIVIDADES PREVENTIVAS -->
            <div class="terminal-section" id="secTerminalActivities">
                <h4 class="terminal-section-title"><i class="fas fa-users-rays"></i> ACTIVIDADES PREVENTIVAS</h4>
                <div class="tac-card">
                    <form id="formPrevAct">
                        <div class="pb-group">
                            <label class="pb-label">TIPO DE ACTIVIDAD</label>
                            <select id="prev_tipo" class="tac-input">
                                <option value="CHARLA">Charla Preventiva</option>
                                <option value="VISITA">Visita Institucional</option>
                                <option value="REUNION">Reunión Comunitaria</option>
                                <option value="JORNADA">Jornada de Salud/Social</option>
                            </select>
                        </div>
                        <div class="pb-group">
                            <label class="pb-label">TEMA / PROPÓSITO</label>
                            <input type="text" id="prev_tema" class="tac-input" placeholder="Ej: Prevención del Delito">
                        </div>
                        <div class="pb-group">
                            <label class="pb-label">LUGAR / SECTOR</label>
                            <input type="text" id="prev_lugar" class="tac-input" placeholder="Comuna / Sector">
                        </div>
                        <div class="pb-group">
                            <label class="pb-label">EVIDENCIA FOTOGRÁFICA</label>
                            <div class="tac-file-upload" onclick="window.terminalCtrl.simulatePhoto('prev_evidencia')">
                                <i class="fas fa-camera"></i>
                                <span id="lbl_prev_evidencia">Tocar para tomar foto</span>
                            </div>
                        </div>
                        <button type="button" class="add-btn w-full tac-btn" onclick="window.terminalCtrl.saveActivity()">REGISTRAR ACTIVIDAD</button>
                    </form>
                </div>
            </div>

            <!-- SECCIÓN: CONSULTAS (Historial / Recursos) -->
            <div class="terminal-section" id="secTerminalQuery">
                <h4 class="terminal-section-title"><i class="fas fa-search"></i> CONSULTA DE INFORMACIÓN</h4>
                <div class="tac-tabs">
                    <button class="tac-tab active" data-tab="qHistorial">Historial</button>
                    <button class="tac-tab" data-tab="qRecursos">Recursos</button>
                    <button class="tac-tab" data-tab="qComuna">Comuna</button>
                </div>
                <div id="qContent" class="tac-tab-content">
                    <!-- Dinámico -->
                </div>
            </div>
        </main>

        <!-- NAVEGACIÓN INFERIOR (TÁCTICA) -->
        <nav class="terminal-nav hidden" id="terminalNav">
            <div class="nav-item active" data-sec="secTerminalIncidents">
                <i class="fas fa-bolt"></i>
                <span>Tareas</span>
            </div>
            <div class="nav-item" data-sec="secTerminalPatrol">
                <i class="fas fa-person-walking-luggage"></i>
                <span>Patrulla</span>
            </div>
            <div class="nav-item" data-sec="secTerminalActivities">
                <i class="fas fa-calendar-check"></i>
                <span>Prevención</span>
            </div>
            <div class="nav-item" data-sec="secTerminalQuery">
                <i class="fas fa-database"></i>
                <span>Consulta</span>
            </div>
        </nav>
      </div>

      <!-- MODALES TÁCTICOS -->
      <div class="modal modal-terminal" id="modalConfirmLlegada">
          <div class="modal-container-terminal">
              <!-- Reutilizamos el diseño anterior con ajustes tácticos -->
              <div class="terminal-confirm-header"><i class="fas fa-map-marker-alt"></i> CONFIRMAR POSICIÓN</div>
              <div class="terminal-confirm-body">
                  <div class="confirm-stat"><span>FOLIO:</span> <b id="confFolio">---</b></div>
                  <div class="confirm-stat"><span>ACTUAL:</span> <span id="confLocActual">---</span></div>
                  <div id="geoDiscrepancyAlert" class="geo-alert hidden">
                      <i class="fas fa-exclamation-triangle"></i> FUERA DE RANGO (>200m)
                  </div>
              </div>
              <div class="terminal-confirm-actions">
                  <button class="t-btn cancel" onclick="window.terminalCtrl.closeModal('modalConfirmLlegada')">CANCELAR</button>
                  <button class="t-btn confirm" id="btnConfirmLlegada">CONFIRMAR LLEGADA</button>
              </div>
          </div>
      </div>
    </div>
  `;
}
