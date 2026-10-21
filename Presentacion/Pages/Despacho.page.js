/**
 * Presentacion/Pages/Despacho/Despacho.page.js
 * Módulo de Gestión de Incidentes y Asignación de Recursos (CU-10)
 * Diseño: Operativo de Alta Disponibilidad
 */

export function render(props = {}) {
  return `
    <div id="despachoPage" class="page-content active">
      <div class="table-container">
        <div class="table-header">
          <div class="header-texts">
            <h2 class="table-title">Gestión de Incidentes y Despacho</h2>
            <p class="table-subtitle">Asignación de recursos tácticos según prioridad y proximidad</p>
          </div>
          <div class="table-controls">
            <div class="search-table">
               <input type="text" class="search-table-input" id="searchIncidentesDespacho" placeholder="Buscar incidente pendiente...">
               <i class="fas fa-search search-table-icon"></i>
            </div>
          </div>
        </div>

        <div class="dispatch-tabs">
            <button class="dispatch-tab active" id="tabCaptados">
                <i class="fas fa-Clock"></i> Asignación Táctica (Pendientes)
            </button>
            <button class="dispatch-tab" id="tabAsignados">
                <i class="fas fa-Broadcast-Tower"></i> Transmisión de Orden (Radio)
            </button>
        </div>

        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr id="despachoTableHead">
                <th>Prioridad</th>
                <th>Folio</th>
                <th>T. Transcurrido</th>
                <th>Naturaleza</th>
                <th>Ubicación</th>
                <th>Estatus</th>
                <th class="text-right">Acción</th>
              </tr>
            </thead>
            <tbody id="despachoTableBody">
                <tr><td colspan="7" class="text-center">Cargando incidentes...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="modal" id="modalTransmision">
        <div class="modal-container-tx">
            <div class="modal-header-dispatch">
                <div class="dispatch-header-title">
                    <i class="fas fa-satellite-dish"></i>
                    <div>
                        <h3>Protocolo de Transmisión de Orden</h3>
                        <span id="txIncidenteHeader" style="color:var(--primary-color); font-weight:bold;">Folio: ---</span>
                    </div>
                </div>
                <button class="modal-close-btn" id="closeTransmisionModal">&times;</button>
            </div>
            
            <div class="modal-body-tx">
                <div class="tx-alert-header">ESTADO: ESPERANDO TRANSMISIÓN DE DATOS</div>
                
                <div id="txIncidenteSummary" class="tx-incident-summary">
                    </div>

                <div class="dispatch-actions tx-actions">
                    <button class="call-btn reject" id="btnCancelarTx">CANCELAR MISIÓN</button>
                    <button class="call-btn active" id="btnIniciarTx">
                        <i class="fas fa-microphone"></i> INICIAR TRANSMISIÓN RADIO/DATA
                    </button>
                </div>
            </div>
        </div>
    </div>
  `;
}
