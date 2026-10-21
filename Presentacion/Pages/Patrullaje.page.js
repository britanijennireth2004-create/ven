/**
 * Presentacion/Pages/Patrullaje/Patrullaje.page.js
 * Vista del Módulo de Patrullaje Territorial (CU-XX)
 */

export function render(props = {}) {
   const userRole = (props.role || '').toUpperCase();
   const isDirector = userRole === 'DIRECTOR GENERAL';

   return `
      <div class="patrullaje-container animate-fade-in">
      <div class="table-container admin-container animate-fade-in">
        <div class="admin-tabs">
          <div class="admin-tab active" id="tabPatrullaje" onclick="window.switchActividadTab('patrullaje')">Patrullaje Territorial</div>
          <div class="admin-tab" id="tabPrevencion" onclick="window.switchActividadTab('prevencion')">Prevención Ciudadana</div>
        </div>

        <!-- SECCIÓN PATRULLAJE -->
        <div id="contentTabPatrullaje" class="admin-section active" style="display:block;">
            
            <!-- PANEL DE PATRULLAJE ACTIVO (NUEVO) -->
            <div id="activePatrolPanel" class="active-patrol-banner" style="display:none;">
               <!-- Inyectado dinámicamente cuando hay un patrullaje activo -->
            </div>

            <div class="table-header" style="padding: 20px 0;">
              <div class="header-texts">
                <h2 class="table-title">Recorridos Territoriales</h2>
                <p class="table-subtitle">Seguimiento de patrullaje preventivo por Cuadrantes de Paz</p>
              </div>
              <div class="table-controls">
                <div class="search-table">
                  <input type="text" class="search-table-input" id="patrullajeSearch" placeholder="Buscar patrullaje...">
                  <svg class="search-table-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
                ${!isDirector ? `
                <button class="add-btn" onclick="window.abrirModalPatrullaje()">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <line x1="20" y1="8" x2="20" y2="14"></line>
                    <line x1="23" y1="11" x2="17" y2="11"></line>
                  </svg>
                  Registrar Patrullaje
                </button>
                ` : ''}
              </div>
            </div>

             <div class="patrullaje-stats-grid">
                <div class="stat-card-mini">
                   <div class="stat-icon" style="background:rgba(37, 99, 235, 0.1); color:var(--primary-color);">
                      <i class="fas fa-person-walking"></i>
                   </div>
                   <div class="stat-info">
                      <span class="stat-value" id="statPatrullajesHoy">0</span>
                      <span class="stat-label">Patrullajes Hoy</span>
                   </div>
                </div>
                <div class="stat-card-mini">
                   <div class="stat-icon" style="background:rgba(16, 185, 129, 0.1); color:var(--success);">
                      <i class="fas fa-shield-halved"></i>
                   </div>
                   <div class="stat-info">
                      <span class="stat-value" id="statCuadrantesCubiertos">0</span>
                      <span class="stat-label">Cuadrantes Activos</span>
                   </div>
                </div>
                <div class="stat-card-mini" style="background: var(--primary-lighter-alt); border: 1px dashed var(--primary-color);">
                   <div class="stat-icon" style="background: var(--primary-color); color: white;">
                      <i class="fas fa-user-tie"></i>
                   </div>
                   <div class="stat-info">
                      <span class="stat-value" style="font-size: 0.8rem;" id="lblLiderComuna">CARGANDO...</span>
                      <span class="stat-label">Enlace Comunal</span>
                   </div>
                </div>
             </div>

            <div class="table-wrapper">
               <table class="data-table">
                  <thead>
                    <tr>
                       <th>CUADRANTE</th>
                       <th>OPERATIVO</th>
                       <th>FECHA/HORA</th>
                       <th>TIPO</th>
                       <th>RUTA / NOVEDADES</th>
                       <th>ESTADO</th>
                       <th class="text-center">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody id="patrullajeTableBody"></tbody>
               </table>
            </div>
        </div>

        <!-- SECCIÓN PREVENCIÓN -->
        <div id="contentTabPrevencion" class="admin-section" style="display:none;">
            <div class="table-header" style="padding: 20px 0;">
              <div class="header-texts">
                <h2 class="table-title">Vinculación Ciudadana</h2>
                <p class="table-subtitle">Gestión de charlas, jornadas y actividades preventivas institucionales</p>
              </div>
              <div class="table-controls">
                <div class="search-table">
                  <input type="text" class="search-table-input" id="prevencionSearch" placeholder="Buscar actividad...">
                  <svg class="search-table-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
                ${!isDirector ? `
                <button class="add-btn" style="background:var(--success);" onclick="window.abrirModalPrevencion()">
                  <i class="fas fa-plus-circle" style="margin-right:8px;"></i>
                  Crear Actividad
                </button>
                ` : ''}
              </div>
            </div>

            <div class="patrullaje-stats-grid">
               <div class="stat-card-mini">
                  <div class="stat-icon" style="background:rgba(217, 70, 239, 0.1); color:#d946ef;">
                     <i class="fas fa-bullhorn"></i>
                  </div>
                  <div class="stat-info">
                     <span class="stat-value" id="statPrevencionMes">0</span>
                     <span class="stat-label">Actividades (Mes)</span>
                  </div>
               </div>
               <div class="stat-card-mini">
                  <div class="stat-icon" style="background:rgba(245, 158, 11, 0.1); color:#f59e0b;">
                     <i class="fas fa-users"></i>
                  </div>
                  <div class="stat-info">
                     <span class="stat-value" id="statTotalParticipantes">0</span>
                     <span class="stat-label">Impacto Social</span>
                  </div>
               </div>
            </div>

            <div class="table-wrapper">
               <table class="data-table">
                  <thead>
                    <tr>
                       <th>CUADRANTE</th>
                       <th>CATEGORÍA</th>
                       <th>FECHA/HORA</th>
                       <th>LUGAR / TEMA</th>
                       <th>PARTICIPANTES</th>
                       <th class="text-center">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody id="prevencionTableBody"></tbody>
               </table>
            </div>
        </div>
      </div>

        <!-- MODAL REGISTRO PATRULLAJE (Existente) -->
        <div class="modal" id="modalRegistroPatrullaje">
           <div class="modal-container-dispatch" style="max-width: 700px;">
              <div class="modal-header-dispatch">
                 <div class="dispatch-header-title">
                    <i class="fas fa-route"></i>
                    <div>
                       <h3>Formulario de Patrullaje Territorial</h3>
                       <span style="font-size:0.7rem; color:#64748b;">Registro de actividad en Cuadrante de Paz</span>
                    </div>
                 </div>
                 <button class="modal-close-btn" onclick="document.getElementById('modalRegistroPatrullaje').classList.remove('active')">&times;</button>
              </div>
              
              <div class="modal-body" style="padding:25px;">
                 <form id="formPatrullaje">
                    <div class="form-grid-3">
                       <div class="pb-group">
                          <label class="pb-label">Cuadrante (Asignado)</label>
                          <input type="text" id="txtPatrullajeCuadrante" class="pb-input" readonly style="background:#f1f5f9; font-weight:700;">
                       </div>
                       <div class="pb-group">
                          <label class="pb-label">Fecha</label>
                          <input type="date" id="txtPatrullajeFecha" class="pb-input" readonly style="background:#f1f5f9;">
                       </div>
                       <div class="pb-group">
                          <label class="pb-label">Tipo de Patrullaje</label>
                          <select id="selTipoPatrullaje" class="pb-select" onchange="window.togglePatrullajeVehiculo()">
                             <option value="Pie">A Pie</option>
                             <option value="Vehículo">Vehículo</option>
                             <option value="Motocicleta">Motocicleta</option>
                          </select>
                       </div>
                    </div>

                    <div class="form-grid-2" style="margin-top:15px;">
                       <div class="pb-group">
                          <label class="pb-label">Hora Inicio</label>
                          <input type="time" id="txtPatrullajeHoraInicio" class="pb-input">
                       </div>
                       <div class="pb-group">
                          <label class="pb-label">Hora Fin</label>
                          <input type="time" id="txtPatrullajeHoraFin" class="pb-input">
                       </div>
                    </div>

                    <div class="pb-group" id="groupPatrullajeVehiculo" style="display:none; margin-top:15px;">
                       <label class="pb-label">Vehículo Asignado</label>
                       <select id="selPatrullajeVehiculo" class="pb-select">
                          <option value="">Seleccione vehículo...</option>
                          <option value="CP-401 (PATRULLA)">CP-401 (Toyota Hilux)</option>
                          <option value="CP-402 (PATRULLA)">CP-402 (Toyota Hilux)</option>
                          <option value="M-202 (MOTO)">M-202 (Suzuki DR650)</option>
                       </select>
                    </div>

                    <div class="pb-group" style="margin-top:15px;">
                       <label class="pb-label">Recorrido / Ruta Realizada</label>
                       <textarea id="txtPatrullajeRuta" class="pb-input" placeholder="Detalle las calles, avenidas o sectores recorridos..." style="min-height:80px;"></textarea>
                    </div>

                    <div class="pb-group" style="margin-top:15px;">
                       <label class="pb-label">Novedades / Observaciones</label>
                       <textarea id="txtPatrullajeNovedades" class="pb-input" placeholder="Incidentes menores, hallazgos o novedades relevantes..." style="min-height:60px;"></textarea>
                    </div>

                    <div class="pb-group" style="margin-top:15px;">
                       <label class="pb-label">Evidencias Fotográficas</label>
                       <div class="evidencias-upload-box">
                          <button type="button" class="btn-upload-simple" onclick="document.getElementById('filePatrullaje').click()">
                             <i class="fas fa-camera"></i> ADJUNTAR EVIDENCIA
                          </button>
                          <input type="file" id="filePatrullaje" style="display:none;" multiple accept="image/*" onchange="window.previewPatrullajeFiles(this)">
                          <div id="patrullajePreview" class="patrullaje-previews"></div>
                       </div>
                    </div>
                 </form>
              </div>

              <div class="modal-footer" style="padding:15px 25px;">
                 <div style="display:flex; gap:10px; width:100%;">
                    <button class="add-btn" style="background:#64748b; flex:1;" onclick="window.guardarPatrullaje('ACTIVO')">
                        <i class="fas fa-play"></i> GUARDAR EN CURSO
                    </button>
                    <button class="add-btn" style="background:var(--success); flex:1;" onclick="window.guardarPatrullaje('FINALIZADO')">
                        <i class="fas fa-check-double"></i> FINALIZAR RECORRIDO
                    </button>
                 </div>
              </div>
           </div>
        </div>

        <!-- MODAL REGISTRO PREVENCIÓN (NUEVO CU) -->
        <div class="modal" id="modalRegistroPrevencion">
           <div class="modal-container-dispatch" style="max-width: 800px;">
              <div class="modal-header-dispatch">
                 <div class="dispatch-header-title">
                    <i class="fas fa-people-carry-box"></i>
                    <div>
                       <h3>Registro de Actividad Preventiva</h3>
                       <span style="font-size:0.7rem; color:#64748b;">Vinculación Social y Gestión Comunitaria</span>
                    </div>
                 </div>
                 <button class="modal-close-btn" onclick="document.getElementById('modalRegistroPrevencion').classList.remove('active')">&times;</button>
              </div>
              
              <div class="modal-body" style="padding:25px;">
                 <form id="formPrevencion">
                    <div class="form-grid-3">
                       <div class="pb-group">
                          <label class="pb-label">Cuadrante</label>
                          <input type="text" id="txtPrevencionCuadrante" class="pb-input" readonly style="background:#f1f5f9; font-weight:700;">
                       </div>
                       <div class="pb-group">
                          <label class="pb-label">Fecha Actividad</label>
                          <input type="date" id="txtPrevencionFecha" class="pb-input" readonly style="background:#f1f5f9;">
                       </div>
                       <div class="pb-group">
                          <label class="pb-label">Tipo de Actividad</label>
                          <select id="selTipoPrevencion" class="pb-select" onchange="window.togglePrevencionOtro()">
                             <option value="Charla informativa">Charla informativa</option>
                             <option value="Visita institucional">Visita institucional</option>
                             <option value="Reunión comunitaria">Reunión comunitaria</option>
                             <option value="Contacto ciudadano">Contacto ciudadano</option>
                             <option value="Jornada preventiva">Jornada preventiva</option>
                             <option value="OTRO">OTRO (ESPECIFICAR)</option>
                          </select>
                       </div>
                    </div>

                    <div id="groupPrevencionOtro" class="pb-group" style="display:none; margin-top:15px;">
                       <label class="pb-label">Especifique el Tipo de Actividad</label>
                       <input type="text" id="txtPrevencionOtro" class="pb-input" placeholder="Ej: Operativo de Salud, etc.">
                    </div>

                    <div class="form-grid-3" style="margin-top:15px;">
                       <div class="pb-group">
                          <label class="pb-label">Hora Inicio</label>
                          <input type="time" id="txtPrevencionHoraInicio" class="pb-input">
                       </div>
                       <div class="pb-group">
                          <label class="pb-label">Hora Fin</label>
                          <input type="time" id="txtPrevencionHoraFin" class="pb-input">
                       </div>
                       <div class="pb-group">
                          <label class="pb-label">Lugar de Realización</label>
                          <input type="text" id="txtPrevencionLugar" class="pb-input" placeholder="Dirección o punto de referencia">
                       </div>
                    </div>

                    <div class="form-grid-2" style="margin-top:15px;">
                       <div class="pb-group">
                          <label class="pb-label">Tema / Asunto Tratado</label>
                          <input type="text" id="txtPrevencionTema" class="pb-input" placeholder="Ej: Prevención de delitos informáticos">
                       </div>
                       <div class="pb-group">
                          <label class="pb-label">Participantes (Cant.)</label>
                          <input type="number" id="numPrevencionParticipantes" class="pb-input" placeholder="Cantidad aproximada">
                       </div>
                    </div>

                    <div class="pb-group" style="margin-top:15px;">
                       <label class="pb-label">Otras Instituciones Participantes</label>
                       <input type="text" id="txtPrevencionInstituciones" class="pb-input" placeholder="Ej: Bomberos, PC, Alcaldía...">
                    </div>

                    <div class="pb-group" style="margin-top:15px;">
                       <label class="pb-label">Observaciones / Resultados Finales</label>
                       <textarea id="txtPrevencionObservaciones" class="pb-input" placeholder="Comentarios adicionales sobre el desarrollo de la actividad..." style="min-height:80px;"></textarea>
                    </div>

                    <div class="pb-group" style="margin-top:15px;">
                       <label class="pb-label">Documentación y Asistencia (JPG, PNG, PDF)</label>
                       <div class="evidencias-upload-box">
                          <button type="button" class="btn-upload-simple" onclick="document.getElementById('filePrevencion').click()">
                             <i class="fas fa-file-upload"></i> ADJUNTAR ARCHIVOS
                          </button>
                          <input type="file" id="filePrevencion" style="display:none;" multiple accept="image/*,.pdf" onchange="window.previewPrevencionFiles(this)">
                          <div id="prevencionPreview" class="patrullaje-previews"></div>
                       </div>
                    </div>
                 </form>
              </div>

              <div class="modal-footer" style="padding:15px 25px;">
                 <button class="add-btn" style="background:var(--success); width:100%;" onclick="window.guardarActividadPreventiva()">
                     <i class="fas fa-save"></i> GUARDAR ACTIVIDAD PREVENTIVA
                 </button>
              </div>
           </div>
        </div>
      </div>
    `;
}
