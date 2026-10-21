/**
 * Presentacion/Pages/Emergencias/Emergencias.page.js
 * Vista de Recepción de Incidentes - CUPAZ Monagas
 * Diseño: Réplica fiel de mockups institucionales (Imágenes 1, 2 y 3)
 */

export function render(props = {}) {
  return `
    <div id="emergenciasPage" class="page-content active">

      <!-- ====== IMAGEN 1: Panel principal con tabla ====== -->
      <div class="emer-main-panel">
        <div class="emer-card">
          <div class="emer-card-header">
            <div>
              <h2 class="emer-card-title">Recepción de Emergencias</h2>
              <p class="emer-card-subtitle">Gestión y registro de incidentes en tiempo real</p>
            </div>
            <div class="emer-search-box">
              <input type="text" id="emergenciaSearch" placeholder="Buscar incidente..." class="emer-search-input">
              <i class="fas fa-search emer-search-icon"></i>
            </div>
          </div>

          <div class="emer-table-wrap">
            <table class="emer-table">
              <thead>
                <tr>
                  <th>FOLIO</th>
                  <th>FECHA/HORA</th>
                  <th>PRIORIDAD</th>
                  <th>NATURALEZA</th>
                  <th>ESTATUS</th>
                </tr>
              </thead>
              <tbody id="emergenciasTableBody">
                <!-- Inyectado por controller -->
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ====== IMAGEN 2: FAB + Popover RESPONDER + Timer espera ====== -->
      <div id="fabContainer" class="emer-fab-container">
        <div id="fabWaitTimer" class="emer-fab-timer" style="display:none;">
          TIEMPO ESPERA: <span id="fabWaitSeconds">0</span>s
        </div>
        <div id="fabActions" class="emer-fab-actions" style="display:none;">
          <div id="popoverResponder" class="emer-fab-respond-btn">
            <i class="fas fa-phone"></i> RESPONDER
          </div>
          <div id="popoverRechazar" class="emer-fab-reject-btn">
            <i class="fas fa-phone-slash"></i> RECHAZAR
          </div>
        </div>
        <button id="fabCall" class="emer-fab-btn" title="Recibir llamada">
          <i class="fas fa-phone"></i>
        </button>
      </div>

      <!-- ====== IMAGEN 3: Modal de Llamada en Curso ====== -->
      <div id="modalLlamada" class="emer-modal-overlay" style="display:none;">
        <div class="emer-modal-box">

          <!-- Header Bar -->
          <div class="emer-modal-header">
            <div class="emer-modal-header-left">
              <span class="emer-dot-green"></span>
              <span class="emer-header-label">EN LÍNEA:</span>
              <span class="emer-header-status">CONEXIÓN ESTABLECIDA</span>
            </div>
            <div class="emer-modal-header-right">
              <span id="callTimer" class="emer-timer-display">00 : 00</span>
              <button id="btnCerrarModal" class="emer-modal-close" title="Cerrar">&times;</button>
            </div>
          </div>

          <!-- Body: Two columns -->
          <div class="emer-modal-body">

            <!-- COLUMNA IZQUIERDA: Formulario -->
            <div class="emer-modal-left">
              <form id="emergenciasForm" autocomplete="off">
                <div class="emer-form-row">
                  <div class="emer-form-group">
                    <label class="emer-label">FOLIO DE INCIDENTE</label>
                    <input type="text" id="emergenciaFolio" class="emer-input" readonly>
                  </div>
                  <div class="emer-form-group">
                    <label class="emer-label">PRIORIDAD OPERATIVA *</label>
                    <select id="emergenciaPrioridad" class="emer-select" required>
                      <option value="">Seleccione prioridad</option>
                      <option value="BAJA">Baja</option>
                      <option value="MEDIA">Media</option>
                      <option value="ALTA">Alta</option>
                      <option value="CRITICA">Crítica</option>
                    </select>
                  </div>
                </div>

                <div class="emer-form-group">
                  <label class="emer-label">NATURALEZA DEL INCIDENTE *</label>
                  <select id="emergenciaNaturaleza" class="emer-select" required>
                    <option value="">Cargando naturalezas...</option>
                  </select>
                </div>

                <div class="emer-form-row">
                  <div class="emer-form-group">
                    <label class="emer-label">NOMBRE DEL INFORMANTE *</label>
                    <input type="text" id="emergenciaDenunciante" class="emer-input" placeholder="Pedro Infante">
                  </div>
                  <div class="emer-form-group">
                    <label class="emer-label">TELÉFONO / IDENTIFICADOR *</label>
                    <input type="text" id="emergenciaTelefono" class="emer-input" placeholder="0416-8465666">
                  </div>
                </div>

                <div class="emer-form-group">
                  <label class="emer-label">DIRECCIÓN Y GEORREFERENCIACIÓN *</label>
                  <div class="emer-input-geo-row">
                    <input type="text" id="emergenciaDireccion" class="emer-input" placeholder="Vía Principal Zona Industrial, adyacente a...">
                    <button type="button" id="btnGeoModal" class="emer-geo-btn" title="Calcular geolocalización"><i class="fas fa-crosshairs"></i></button>
                  </div>
                </div>

                <div class="emer-form-row">
                  <div class="emer-form-group">
                    <label class="emer-label">COORDENADAS ESTIMADAS</label>
                    <input type="text" id="emergenciaGPS" class="emer-input emer-input-readonly" readonly placeholder="—">
                  </div>
                  <div class="emer-form-group">
                    <label class="emer-label">CUADRANTE DE PAZ *</label>
                    <input type="text" id="emergenciaCuadrante" class="emer-input emer-input-readonly" readonly placeholder="—">
                  </div>
                </div>

                <div class="emer-form-group">
                  <label class="emer-label">DETALLE DEL REPORTE *</label>
                  <textarea id="emergenciaDescripcion" class="emer-textarea" rows="4" placeholder="Transcriba la situación descrita por el informante..." required></textarea>
                </div>
              </form>
            </div>

            <!-- COLUMNA DERECHA: Monitor + Terminal + Script -->
            <div class="emer-modal-right">

              <!-- Audio Real-Time Monitor -->
              <div class="emer-monitor-section">
                <div class="emer-monitor-label">AUDIO REAL-TIME MONITOR</div>
                <div class="wave-container">
                  <div class="wave-bar" style="animation-delay:0s;"></div>
                  <div class="wave-bar" style="animation-delay:0.12s;"></div>
                  <div class="wave-bar" style="animation-delay:0.24s;"></div>
                  <div class="wave-bar" style="animation-delay:0.36s;"></div>
                  <div class="wave-bar" style="animation-delay:0.48s;"></div>
                  <div class="wave-bar" style="animation-delay:0.60s;"></div>
                  <div class="wave-bar" style="animation-delay:0.72s;"></div>
                  <div class="wave-bar" style="animation-delay:0.84s;"></div>
                  <div class="wave-bar" style="animation-delay:0.96s;"></div>
                  <div class="wave-bar" style="animation-delay:1.08s;"></div>
                  <div class="wave-bar" style="animation-delay:1.20s;"></div>
                  <div class="wave-bar" style="animation-delay:1.32s;"></div>
                  <div class="wave-bar" style="animation-delay:1.44s;"></div>
                  <div class="wave-bar" style="animation-delay:1.56s;"></div>
                  <div class="wave-bar" style="animation-delay:1.68s;"></div>
                </div>
                <style>
                  .wave-container {
                    height: 90px;
                    background: #000a14;
                    border-radius: 8px;
                    border: 1px solid #0d3a5a;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    padding: 10px 20px;
                  }
                  .wave-bar {
                    width: 7px;
                    height: 10%;
                    background: #22c55e;
                    border-radius: 3px;
                    animation: stadiumWave 2s ease-in-out infinite;
                  }
                  @keyframes stadiumWave {
                    0%, 100% { height: 10%; }
                    50%      { height: 90%; }
                  }
                </style>
              </div>

              <!-- Terminal / Audit Recorder -->
              <div class="emer-terminal-section">
                <div class="emer-terminal-bar">
                  <span class="emer-tdot" style="background:#ef4444;"></span>
                  <span class="emer-tdot" style="background:#f59e0b;"></span>
                  <span class="emer-tdot" style="background:#22c55e;"></span>
                  <span class="emer-terminal-title">AUDIT_RECORDER_S3</span>
                </div>
                <div id="modalTerminal" class="emer-terminal-body">
                  <div class="emer-tlog">> ENLAZANDO TRONCAL SIP...</div>
                </div>
              </div>

              <!-- Script de Respuesta -->
              <div class="emer-script-section">
                <div class="emer-script-header"><i class="fas fa-headset"></i> SCRIPT DE RESPUESTA</div>
                <div id="lblScriptVozModal" class="emer-script-body">
                  "CUPAZ, ¿cuál es su emergencia? Mantenga la calma, por favor indique su ubicación exacta."
                </div>
              </div>

              <!-- Botón Registrar dentro de columna derecha -->
              <div style="margin-top:auto; padding-top:16px;">
                <button type="button" id="btnCompletarRegistro" class="emer-register-btn">
                  <i class="fas fa-save"></i> REGISTRAR
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  `;
}
