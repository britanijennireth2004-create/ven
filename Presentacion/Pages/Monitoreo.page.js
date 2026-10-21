/**
 * Presentacion/Pages/Monitoreo/Monitoreo.page.js
 * Módulo 3 - Monitoreo y Seguimiento Operacional (SEGÚN DOCUMENTO)
 */

export function render(props = {}) {
   const userRole = (props.role || '').toUpperCase();
   const isDirector = userRole === 'DIRECTOR GENERAL';
   const hideIncidents = userRole === 'OPERADOR DE DESPACHO';

   return `
    <div id="monitoreoPage" class="page-content active">
      <!-- DASHBOARD DE INDICADORES EN TIEMPO REAL (Req 2) -->
      <div class="patrullaje-stats-grid">
         <div class="stat-card-mini">
            <div class="stat-icon stat-icon-danger">
               <i class="fas fa-exclamation-circle"></i>
            </div>
            <div class="stat-info">
               <span class="stat-value" id="statMonIncActivos">0</span>
               <span class="stat-label">Incidentes Activos</span>
            </div>
         </div>
         <div class="stat-card-mini">
            <div class="stat-icon stat-icon-primary">
               <i class="fas fa-truck-medical"></i>
            </div>
            <div class="stat-info">
               <span class="stat-value" id="statMonUniDesplegadas">0</span>
               <span class="stat-label">Unidades en Servicio</span>
            </div>
         </div>
         <div class="stat-card-mini">
            <div class="stat-icon stat-icon-success">
               <i class="fas fa-clock"></i>
            </div>
            <div class="stat-info">
               <span class="stat-value" id="statMonTiemposR">00:00</span>
               <span class="stat-label">T. Respuesta Prom.</span>
            </div>
         </div>
      </div>

      <!-- LAYOUT PRINCIPAL DE MONITOREO (Req 2) -->
      <div class="modal-layout-dispatch monitoreo-layout">
         
         <!-- PANEL IZQUIERDO: MAPA OPERATIVO INTERACTIVO (Req 3, 4) -->
         <div class="modal-left-panel monitoreo-left-panel">
            <div class="map-loading-overlay" id="mapLoading">
                <div class="spinner"></div>
                <span>CONECTANDO CON SATÉLITE...</span>
            </div>
            
            <div class="map-controls">
                <button class="map-btn" onclick="window.mapZoomIn()"><i class="fas fa-plus"></i></button>
                <button class="map-btn" onclick="window.mapZoomOut()"><i class="fas fa-minus"></i></button>
                <button class="map-btn" onclick="window.mapCenter()"><i class="fas fa-crosshairs"></i></button>
            </div>

            <!-- SIMULADOR DE MAPA (REQ 3, 4) -->
            <div id="tacticalMap" class="tactical-map-render">
                <!-- Se inyectan marcadores SVG dinámicamente -->
                <div id="mapMarkers"></div>
                <div id="mapInfoTooltip" class="map-tooltip hidden"></div>
            </div>
         </div>

         <!-- PANEL DERECHO: PANELES DE INFORMACIÓN (Req 2) -->
         <div class="modal-right-panel monitoreo-right-panel">
            
            ${hideIncidents ? '' : `
            <!-- LISTA DE INCIDENTES -->
            <div class="pb-card monitoreo-card">
                <div class="card-header-tactical" >
                    <div class="header-title">
                        <h3 >Incidentes en Curso</h3>
                    </div>
                </div>
                <div class="table-responsive" class="table-responsive flex-scrollable">
                    <table class="data-table table-compact" >
                        <thead>
                            <tr>
                                <th>FOLIO</th>
                                <th>PRIORIDAD</th>
                                <th>ESTATUS</th>
                                <th>${isDirector ? 'DETALLE' : 'ACCION'}</th>
                            </tr>
                        </thead>
                        <tbody id="monitoreoTableBody"></tbody>
                    </table>
                </div>
            </div>`}

            <!-- LISTA DE UNIDADES GPS (Req 2) -->
            <div class="pb-card monitoreo-card">
                <div class="card-header-tactical" >
                    <div class="header-title">
                        <h3 >Unidades Desplegadas (GPS)</h3>
                    </div>
                </div>
                <div id="unitsPanel" class="units-status-list" >
                    <!-- Inyectado dinámicamente -->
                </div>
            </div>

         </div>
      </div>
    </div>

    <!-- Modal de Seguimiento y Cierre -->
    <div class="modal" id="modalSeguimiento">
      <div class="modal-container modal-wide">
        <div class="modal-header">
          <i class="fas fa-chart-line modal-icon-font"></i>
          <h3 class="modal-title">Gestión de Seguimiento y Cierre</h3>
          <button class="modal-close-btn" onclick="document.getElementById('modalSeguimiento').classList.remove('active')">&times;</button>
        </div>
        <div class="modal-body">
          <input type="hidden" id="hdnFolioSeguimiento">
          
          <div class="tab-system-seguimiento">
             <div class="tab-header-seguimiento">
                <button class="tab-btn active" id="tabOperacion" onclick="window.switchSeguimientoTab('operacion')">
                   <i class="fas fa-tasks"></i> ACTIVIDAD OPERATIVA
                </button>
                <button class="tab-btn" id="tabCoordinacion" onclick="window.switchSeguimientoTab('coordinacion')">
                   <i class="fas fa-handshake"></i> COORDINACIÓN INTERINSTITUCIONAL
                </button>
                <button class="tab-btn" id="tabEvidencias" onclick="window.switchSeguimientoTab('evidencias')">
                   <i class="fas fa-camera"></i> EVIDENCIAS DIGITALES
                </button>
             </div>

             <!-- CONTENIDO TAB 1: OPERACION -->
             <div id="contentTabOperacion" class="tab-content active">
                <div class="modal-layout-split-seguimiento">
                  <!-- Panel Izquierdo: Datos y Cierre -->
                  <div class="seguimiento-left">
                     <h4 class="section-subtitle">Detalles del Recurso</h4>
                     <div class="unit-status-card">
                        <i class="fas fa-ambulance unit-icon-main"></i>
                        <div>
                          <div id="lblUnidad" class="unit-id-text">---</div>
                          <div id="lblOficial" class="unit-officer-text">---</div>
                        </div>
                     </div>
                     
                     ${!isDirector ? `
                     <div class="pb-group text-left seguimiento-llegada-card" id="groupFinalizarDespacho" style="display:none;">
                       <label class="pb-label" class="text-success-dark">Estado de Respuesta:</label>
                       <p class="text-success-dark text-sm mb-10">La unidad se encuentra actualmente en desplazamiento al sitio.</p>
                       <button class="add-btn btn-marcar-llegada" onclick="window.marcarLlegadaManual()">
                          <i class="fas fa-map-marker-alt"></i> REGISTRAR LLEGADA A ESCENA
                       </button>
                     </div>
                     ` : ''}

                     ${!isDirector ? `
                     <!-- SECCIÓN ACTUALIZAR ESTADO (CU-14) -->
                     <div id="sectionCambioEstado" class="seguimiento-status-update-card" style="display:none;">
                        <label class="pb-label" class="text-info-dark">Cambiar Estado Operativo:</label>
                        <div class="form-grid-2">
                          <select id="selNuevoEstado" class="pb-select" class="text-sm">
                              <option value="EN PROCESO">EN PROCESO</option>
                              <option value="REQUIERE APOYO">REQUIERE APOYO</option>
                              <option value="CONTROLADO">CONTROLADO</option>
                              <option value="RESUELTO">RESUELTO</option>
                              <option value="EN ESPERA">EN ESPERA</option>
                          </select>
                          <button class="add-btn btn-actualizar-status" class="text-xs" onclick="window.actualizarEstadoInc()">
                              <i class="fas fa-sync-alt"></i> ACTUALIZAR
                          </button>
                        </div>
                        <div class="mt-8">
                          <input type="text" id="txtObsEstado" class="pb-input" placeholder="Justificación del cambio..." class="text-sm bg-white p-5">
                        </div>
                     </div>
                     ` : ''}

                     ${!isDirector ? `
                     <div class="pb-group text-left" class="mt-20">
                       <label class="pb-label">Añadir Novedad / Actuación</label>
                       <textarea id="txtNovedadSeguimiento" placeholder="Escriba el progreso de la operación..." class="pb-input" style="min-height: 80px; resize: vertical;"></textarea>
                       <button class="add-btn w-full" id="btnAgregarNovedad" class="mt-10">
                          REGISTRAR NOVEDAD
                       </button>
                     </div>
                     ` : ''}
                  </div>

                  <!-- Panel Derecho: Timeline de la operación -->
                  <div class="seguimiento-right">
                     <h4 class="section-subtitle">Línea de Tiempo Operativa</h4>
                     <div id="timelineContainer" class="timeline-container">
                        <!-- Inyectado dinámicamente -->
                     </div>
                  </div>
                </div>
             </div>

             <!-- CONTENIDO TAB 2: COORDINACIÓN INTERINSTITUCIONAL (REQUERIMIENTO) -->
             <div id="contentTabCoordinacion" class="tab-content">
                <div class="modal-layout-split-seguimiento">
                   <div class="seguimiento-left" style="border-right: 1px solid #e2e8f0; padding-right: 20px;">
                      <h4 class="section-subtitle">Gestión de Organismos (Req 5)</h4>
                      <div class="organismos-coord-grid">
                         <div class="org-item-check">
                            <input type="checkbox" id="chkOrgBomberos" onchange="window.toggleOrgCoord('BOMBEROS')">
                            <label for="chkOrgBomberos"><i class="fas fa-fire-extinguisher"></i> BOMBEROS</label>
                            <span class="badge-org-status" id="status_BOMBEROS">PENDIENTE</span>
                         </div>
                         <div class="org-item-check">
                            <input type="checkbox" id="chkOrgPC" onchange="window.toggleOrgCoord('PROTECCION_CIVIL')">
                            <label for="chkOrgPC"><i class="fas fa-helmet-safety"></i> PROTECCIÓN CIVIL</label>
                            <span class="badge-org-status" id="status_PROTECCION_CIVIL">PENDIENTE</span>
                         </div>
                         <div class="org-item-check">
                            <input type="checkbox" id="chkOrgSalud" onchange="window.toggleOrgCoord('SALUD')">
                            <label for="chkOrgSalud"><i class="fas fa-heart-pulse"></i> SALUD / SEM</label>
                            <span class="badge-org-status" id="status_SALUD">PENDIENTE</span>
                         </div>
                         <div class="org-item-check">
                            <input type="checkbox" id="chkOrgPolicia" onchange="window.toggleOrgCoord('CPNB')">
                            <label for="chkOrgPolicia"><i class="fas fa-shield-halved"></i> POLICÍA (CPNB)</label>
                            <span class="badge-org-status" id="status_CPNB">PENDIENTE</span>
                         </div>
                      </div>

                      ${!isDirector ? `
                      <div class="mt-20">
                         <button class="add-btn u-w-full-btn" onclick="window.notificarOrganismos()">
                            <i class="fas fa-paper-plane"></i> NOTIFICAR Y ACTIVAR CANAL UNIFICADO
                         </button>
                      </div>

                      <div class="reinforcement-box" style="margin-top:20px; border-top: 1px solid #eee; padding-top:10px;">
                         <label class="pb-label">Solicitar Refuerzos Adicionales</label>
                         <div class="form-grid-2">
                             <select id="selRefuerzoOrg" class="pb-select" style="font-size:0.7rem;">
                                <option value="SALUD">2 Ambulancias Adic.</option>
                                <option value="BOMBEROS">Unidad de Rescate</option>
                                <option value="CPNB">Apoyo de Seguridad</option>
                             </select>
                             <button class="add-btn" style="background:#475569; font-size:0.7rem;" onclick="window.solicitarRefuerzoCoord()">SOLICITAR</button>
                         </div>
                      </div>
                      ` : ''}
                   </div>

                   <div class="seguimiento-right">
                      <h4 class="section-subtitle">Canal Unificado de Comunicaciones (Req 10)</h4>
                      <div class="coord-chat-container">
                         <div id="chatCoordination" class="chat-messages-box">
                            <div class="chat-notif">Canal de coordinación interinstitucional activo. Esperando confirmación de organismos.</div>
                         </div>
                         ${!isDirector ? `
                         <div class="chat-input-row" style="margin-top:10px; display:flex; gap:10px;">
                            <input type="text" id="txtMsgCoord" class="pb-input" placeholder="Enviar mensaje a todos los organismos...">
                            <button class="add-btn" style="background:var(--success); width:auto;" onclick="window.enviarMensajeCoord()">
                               <i class="fas fa-comment-dots"></i>
                            </button>
                         </div>
                         ` : ''}
                      </div>
                   </div>
                </div>
             </div>

             <!-- CONTENIDO TAB 3: EVIDENCIAS (CU-16) -->
             <div id="contentTabEvidencias" class="tab-content">
                <div class="evidencias-header">
                   <div>
                      <h4 class="section-subtitle">Repositorio Digital del Incidente</h4>
                      <p style="font-size:0.7rem; color:#64748b;">Archivos multimedia vinculados legalmente al folio.</p>
                   </div>
                   ${!isDirector ? `
                   <button class="add-btn" class="bg-secondary btn-auto p-10-20" onclick="window.abrirModalCargaEvidencia()">
                      <i class="fas fa-plus-circle"></i> AGREGAR EVIDENCIA
                   </button>
                   ` : ''}
                </div>
                
                <div id="evidenceGallery" class="evidence-gallery">
                   <!-- Inyectado dinámicamente -->
                   <div class="empty-gallery">
                      <i class="fas fa-photo-video" style="font-size:3rem; color:#cbd5e1; margin-bottom:15px;"></i>
                      <p style="color:#94a3b8; font-weight:600;">No hay evidencias registradas en este incidente.</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-btn cancel" onclick="document.getElementById('modalSeguimiento').classList.remove('active')" title="Cerrar y Regresar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
          <button class="modal-btn save" id="btnCerrarIncidente" title="CERRAR INCIDENTE DEFINITIVAMENTE" style="display:none;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>
          </button>
        </div>
      </div>
    </div>
    <!-- Modal de Registro de Llegada (CU-12 Desktop Version) -->
    <div class="modal" id="modalLlegadaSujeto">
      <div class="modal-container-dispatch" style="max-width: 500px; height: auto;">
        <div class="modal-header-dispatch">
            <div class="dispatch-header-title">
                <i class="fas fa-check-double"></i>
                <div>
                    <h3>Confirmación de Llegada a Escena</h3>
                    <span id="lblLlegadaFolio">Folio: ---</span>
                </div>
            </div>
            <button class="modal-close-btn" onclick="document.getElementById('modalLlegadaSujeto').classList.remove('active')">&times;</button>
        </div>
        <div class="modal-body" style="padding: 25px;">
            <div class="seguimiento-llegada-confirm-box">
                <div class="confirm-row">
                    <span class="c-label">UNIDAD:</span>
                    <span class="c-value" id="lblLlegadaUnidad">---</span>
                </div>
                <div class="confirm-row">
                    <span class="c-label">UBICACIÓN REGISTRADA:</span>
                    <span class="c-value" id="lblLlegadaLoc">---</span>
                </div>
                <div class="confirm-row">
                    <span class="c-label">HORA ACTUAL SISTEMA:</span>
                    <span class="c-value" id="lblLlegadaHora">---</span>
                </div>
            </div>

            <div id="alertGeofence" class="geofence-alert-box hidden">
                <i class="fas fa-exclamation-triangle"></i>
                <b>DISCREPANCIA GEOGRÁFICA:</b> La unidad se reporta a más de 200m del sitio. Por favor verifique o solicite confirmación verbal del oficial.
            </div>

            <div class="pb-group">
                <label class="pb-label">Observaciones de Llegada (Opcional)</label>
                <input type="text" id="txtObsLlegada" class="pb-input" placeholder="Ej: Unidad en el sitio, iniciando inspección...">
            </div>
        </div>
            ${!isDirector ? `
            <div class="modal-footer" style="padding: 15px 25px;">
                <button class="add-btn btn-marcar-llegada" onclick="window.confirmarLlegadaEscena()">
                    <i class="fas fa-check"></i> CONFIRMAR LLEGADA Y ACTUALIZAR ESTATUS
                </button>
            </div>
            ` : ''}
      </div>
    </div>

    <!-- Modal de Carga de Evidencia (CU-16) -->
    <div class="modal" id="modalCargaEvidencia">
       <div class="modal-container-dispatch" style="max-width: 550px;">
          <div class="modal-header-dispatch">
             <div class="dispatch-header-title">
                <i class="fas fa-cloud-upload-alt"></i>
                <div>
                   <h3>Registrar Nueva Evidencia</h3>
                   <span style="font-size:0.7rem; color:#64748b;">Vínculo legal con Folio <span id="lblEvidenciaFolio">---</span></span>
                </div>
             </div>
             <button class="modal-close-btn" onclick="document.getElementById('modalCargaEvidencia').classList.remove('active')">&times;</button>
          </div>
          <div class="modal-body" style="padding:25px;">
             <div class="form-grid-2" style="margin-bottom:20px;">
                <div class="pb-group">
                   <label class="pb-label">Tipo de Evidencia</label>
                   <select id="selTipoEvidencia" class="pb-select" onchange="window.toggleEvidenciaSource()">
                      <option value="FOTO">FOTOGRAFÍA</option>
                      <option value="VIDEO">VIDEO</option>
                      <option value="AUDIO">AUDIO / NOTA DE VOZ</option>
                      <option value="ARCHIVO">DOCUMENTO / OTROS</option>
                   </select>
                </div>
                <div class="pb-group">
                   <label class="pb-label">Origen / Captura</label>
                   <div style="display:flex; gap:10px;">
                      <button class="add-btn" style="background:#64748b; font-size:0.7rem; padding:8px;" onclick="document.getElementById('fileEvidencia').click()">
                         <i class="fas fa-search"></i> EXPLORAR
                      </button>
                      <button id="btnCapturaDirecta" class="add-btn" style="background:var(--primary-color); font-size:0.7rem; padding:8px;">
                         <i class="fas fa-camera"></i> CAPTURAR
                      </button>
                   </div>
                   <input type="file" id="fileEvidencia" style="display:none;" onchange="window.previewEvidencia(this)">
                </div>
             </div>

             <!-- Vista Previa (Req 10) -->
             <div id="previewContainer" class="evidence-preview-box" style="margin-top:10px;">
                <div class="preview-placeholder">
                   <i class="fas fa-file-import"></i>
                   <p>Seleccione o capture un archivo para previsualizar</p>
                </div>
                <img id="imgPreview" style="display:none; max-width:100%; max-height:250px; object-fit:contain; border-radius:8px; border:1px solid #e2e8f0;">
                <video id="videoPreview" controls style="display:none; max-width:100%; max-height:250px; border-radius:8px;"></video>
                <div id="fileInfoPreview" style="display:none; padding:15px; background:#f1f5f9; border-radius:8px; width:100%; justify-content:center; align-items:center;">
                   <i class="fas fa-file-pdf" style="font-size:2rem; color:#ef4444;"></i>
                   <span id="lblFileName" style="font-weight:700; font-size:0.8rem; margin-left:10px;">---</span>
                </div>
             </div>

             <div class="pb-group" class="mt-20">
                <label class="pb-label">Descripción / Comentario (RN-02)</label>
                <textarea id="txtDescEvidencia" class="pb-input" placeholder="Ej: Daños observados en la unidad 402..." style="min-height:80px;"></textarea>
                <small style="color:#94a3b8; font-size:0.65rem;">Indique detalles específicos de la evidencia capturada.</small>
             </div>
          </div>
           ${!isDirector ? `
           <div class="modal-footer" style="padding:15px 25px;">
              <button class="add-btn" class="bg-success w-full" onclick="window.guardarEvidenciaFinal()">
                 <i class="fas fa-save"></i> GUARDAR E INCORPORAR AL EXPEDIENTE
              </button>
           </div>
           ` : ''}
      </div>
    
    <!-- Modal de Cierre Institucional y Validación de Efectividad (Nivel 500+) -->
    <div class="modal" id="modalCierreFinal">
       <div class="modal-container-dispatch" style="max-width: 500px;">
          <div class="modal-header-dispatch" style="background: var(--primary-color);">
             <div class="dispatch-header-title" style="color: white;">
                <i class="fas fa-file-signature"></i>
                <div>
                   <h3 style="color:white;">Cierre Definitivo de Incidente</h3>
                   <span style="font-size:0.7rem; opacity:0.8;">Protocolo de Validación de Efectividad</span>
                </div>
             </div>
             <button class="modal-close-btn" style="color:white;" onclick="document.getElementById('modalCierreFinal').classList.remove('active')">&times;</button>
          </div>
          <div class="modal-body" style="padding:25px;">
             <div class="pb-group">
                <label class="pb-label">Validación de la Atención *</label>
                <div class="form-grid-2" style="gap: 10px;">
                   <button class="btn-validation effective" id="btnEffEfectivo" onclick="window.setEffectiveness('EFECTIVA')">
                      <i class="fas fa-check-circle"></i> ATENCIÓN EFECTIVA
                   </button>
                   <button class="btn-validation ineffective" id="btnEffInefectivo" onclick="window.setEffectiveness('INEFECTIVA')">
                      <i class="fas fa-times-circle"></i> INEFECTIVA
                   </button>
                </div>
                <input type="hidden" id="hdnEffectiveness">
             </div>

             <div class="pb-group" style="margin-top:20px;">
                <label class="pb-label">Observaciones Finales de Supervisión</label>
                <textarea id="txtObsCierreFinal" class="pb-input" placeholder="Resumen del cierre y hallazgos de efectividad..." style="min-height:100px;"></textarea>
             </div>

             <div id="cierreEvidenceCheck" class="evidence-status-box" style="margin-top:15px; padding:10px; background:#f1f5f9; border-radius:5px; font-size:0.75rem; display:flex; align-items:center; gap:10px;">
                <i class="fas fa-images" style="color:var(--primary-color);"></i>
                <span><b id="cierreEvidenceCount">0</b> Evidencia(s) vinculada(s) registradas en sistema.</span>
             </div>
          </div>
           ${!isDirector ? `
           <div class="modal-footer" style="padding:15px 25px;">
              <button class="add-btn w-full" style="background:var(--primary-color);" onclick="window.ejecutarCierreInstitucional()">
                 <i class="fas fa-lock"></i> FINALIZAR Y ARCHIVAR EXPEDIENTE
              </button>
           </div>
           ` : ''}
       </div>
    <!-- Modal de Detalles del Incidente (Requerido por Usuario) -->
    <div class="modal" id="modalDetalleIncidente">
       <div class="modal-container-dispatch" style="max-width: 700px;">
          <div class="modal-header-dispatch">
             <div class="dispatch-header-title">
                <i class="fas fa-file-invoice"></i>
                <div>
                   <h3>Detalles Completos del Incidente</h3>
                   <span id="lblDetalleFolio" style="font-size:0.7rem; color:#64748b;">Folio: ---</span>
                </div>
             </div>
             <button class="modal-close-btn" onclick="document.getElementById('modalDetalleIncidente').classList.remove('active')">&times;</button>
          </div>
          
          <div class="modal-body" style="padding:25px;">
             <!-- Grid Informacion Principal -->
             <div class="form-grid-3">
                <div class="pb-group">
                   <label class="pb-label">Fecha / Hora</label>
                   <div id="valDetalleFecha" style="font-weight:700; color:var(--secondary-color);">---</div>
                </div>
                <div class="pb-group">
                   <label class="pb-label">Naturaleza</label>
                   <div id="valDetalleNaturaleza" style="font-weight:700; color:var(--primary-color);">---</div>
                </div>
                <div class="pb-group">
                   <label class="pb-label">Prioridad</label>
                   <span id="valDetallePrioridad" class="prio-tag">---</span>
                </div>
             </div>

             <div class="form-grid-2" style="margin-top:15px;">
                <div class="pb-group">
                   <label class="pb-label">Ubicación / Dirección</label>
                   <div id="valDetalleDireccion" style="font-size:0.85rem; line-height:1.4;">---</div>
                   <div id="valDetalleParroquia" style="font-size:0.7rem; color:#64748b; font-weight:700; margin-top:4px;">---</div>
                </div>
                <div class="pb-group">
                   <label class="pb-label">Estatus Actual</label>
                   <div><span id="valDetalleEstatus" class="status-pill">---</span></div>
                </div>
             </div>

             <div class="pb-group" style="margin-top:15px; background:#f8fafc; padding:15px; border-radius:8px; border:1px solid #e2e8f0;">
                <label class="pb-label">Descripción del Suceso</label>
                <div id="valDetalleDescripcion" style="font-size:0.85rem; color:#334155; font-style:italic;">---</div>
             </div>

             <div class="form-grid-2" style="margin-top:15px;">
                <div class="pb-group">
                   <label class="pb-label">Denunciante / Contacto</label>
                   <div id="valDetalleDenunciante" style="font-size:0.85rem; font-weight:600;">---</div>
                </div>
                <div class="pb-group">
                   <label class="pb-label">Unidades en Escena</label>
                   <div id="valDetalleUnidades" style="font-weight:700; color:var(--info);">---</div>
                </div>
             </div>
          </div>

          <div class="modal-footer" style="padding:15px 25px;">
             <button class="add-btn" style="background:#64748b; width:100%;" onclick="document.getElementById('modalDetalleIncidente').classList.remove('active')">
                 <i class="fas fa-times"></i> CERRAR VISTA DE DETALLES
             </button>
          </div>
       </div>
    </div>
  `;
}



