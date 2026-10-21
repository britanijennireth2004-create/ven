/**
 * Presentacion/Pages/Logistica/Logistica.page.js
 * Módulo 8 - Gestión de Recursos y Logística
 */

export function render(props = {}) {
  const userRole = (props.role || '').toUpperCase();
  const isDirector = userRole === 'DIRECTOR GENERAL';

  return `
    <div id="logisticaPage" class="page-content active" style="padding-top: 15px;">
      
       <div class="table-container" style="position: relative; min-height: 400px;">
          
          <div class="table-header" style="margin-bottom: 0;">
             <div class="header-texts">
                <h2 class="table-title">Gestión de Recursos Institucionales</h2>
                <p class="table-subtitle">Parque automotor y equipamiento tecnológico del sistema</p>
             </div>
          </div>

          <!-- FILTROS Y CONTROLES (TOOLBAR COMPACTA) -->
          <div class="admin-container" style="padding: 15px 20px; background: white; border-bottom: 1px solid var(--border-light); margin-bottom: 20px; border-radius: 0; display:flex; justify-content:space-between; align-items:center;">
             <div class="search-table" style="width: 350px; margin:0;">
                <input type="text" class="search-table-input" id="resourceSearch" placeholder="Buscar placa, equipo o unidad..." style="background:#f1f5f9; border-radius:4px; padding:10px 15px 10px 40px; width:100%; border:none;">
                <svg class="search-table-icon" style="position:absolute; left:12px; top:11px; opacity:0.5;" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                   <circle cx="11" cy="11" r="8"></circle>
                   <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
             </div>
              <div style="display:flex; gap:10px;">
                <button class="add-btn" id="btnReporteCuadrante" style="width: auto; height: 38px; padding: 0 20px; background:var(--primary-color);">
                    <i class="fas fa-file-invoice"></i> Reporte por Cuadrante
                </button>
                ${!isDirector ? `
                <button class="add-btn" id="btnNuevoRecurso" style="width: auto; height: 38px; padding: 0 20px; background:var(--secondary-color);">
                    <i class="fas fa-plus"></i> Ingresar Recurso
                </button>
                ` : ''}
              </div>
          </div>

          <!-- SISTEMA DE PESTAÑAS -->
          <div class="admin-tabs" style="margin: 0 20px 20px 20px; border-bottom: 1px solid var(--border-light);">
             <div class="admin-tab active" id="tabInventarioLog" onclick="window.switchLogisticaTab('inventario')">
                <i class="fas fa-boxes"></i> Inventario Global
             </div>
             <div class="admin-tab" id="tabBitacoraLog" onclick="window.switchLogisticaTab('bitacora')">
                <i class="fas fa-clipboard-list"></i> Bitácora e Histórico
             </div>
          </div>

          <!-- AREA DE DASHBOARD -->
          <div id="logisticaResultContainer" style="padding: 0 20px 20px 20px;">
             
             <!-- KPIs PRINCIPALES GLOBALES -->
             <div class="patrullaje-stats-grid" style="margin-bottom: 20px; grid-template-columns: repeat(4, 1fr);">
                <div class="stat-card" style="box-shadow: 0 2px 4px rgba(0,0,0,0.05); padding: 15px; border: 1px solid var(--border-light); display:flex; flex-direction:column; justify-content:center;">
                   <span class="stat-label" style="font-size:0.65rem; color:#64748b; font-weight:800; text-transform:uppercase; letter-spacing:1px;">Total Listado</span>
                   <span class="stat-value" id="totRecursos" style="color: var(--primary-color); font-size:1.8rem; font-weight:900;">0</span>
                </div>
                <div class="stat-card" style="box-shadow: 0 2px 4px rgba(0,0,0,0.05); padding: 15px; border: 1px solid var(--border-light); display:flex; flex-direction:column; justify-content:center;">
                   <span class="stat-label" style="font-size:0.65rem; color:#64748b; font-weight:800; text-transform:uppercase; letter-spacing:1px;">Disponibles / Operativos</span>
                   <span class="stat-value" id="totOperativos" style="color: #16a34a; font-size:1.8rem; font-weight:900;">0</span>
                </div>
                <div class="stat-card" style="box-shadow: 0 2px 4px rgba(0,0,0,0.05); padding: 15px; border: 1px solid var(--border-light); display:flex; flex-direction:column; justify-content:center;">
                   <span class="stat-label" style="font-size:0.65rem; color:#64748b; font-weight:800; text-transform:uppercase; letter-spacing:1px;">En Terreno / Asignado</span>
                   <span class="stat-value" id="totDespliegue" style="color: #eab308; font-size:1.8rem; font-weight:900;">0</span>
                </div>
                <div class="stat-card" style="box-shadow: 0 2px 4px rgba(0,0,0,0.05); padding: 15px; border: 1px solid var(--border-light); display:flex; flex-direction:column; justify-content:center;">
                   <span class="stat-label" style="font-size:0.65rem; color:#64748b; font-weight:800; text-transform:uppercase; letter-spacing:1px;">Mantenimiento / Baja</span>
                   <span class="stat-value" id="totMantenimiento" style="color: #dc2626; font-size:1.8rem; font-weight:900;">0</span>
                </div>
             </div>

             <!-- PANEL 1: INVENTARIO -->
             <div id="panelInventarioLog" class="tab-content-logistica active-panel" style="display: block;">
                 <div class="resource-grid" id="resourceGrid" style="grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); margin-top:0;">
                    <!-- Inyectado desde el controlador -->
                 </div>
             </div>

             <!-- PANEL 2: BITÁCORA -->
             <div id="panelBitacoraLog" class="tab-content-logistica" style="display: none;">
                 <div class="pb-card" style="padding: 0; overflow: hidden;">
                    <div style="background: var(--neutral-lighter); padding: 12px 20px; border-bottom: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center;">
                       <h4 style="font-size: 0.85rem; font-weight: 700; color: var(--text-dark);"><i class="fas fa-clipboard-list text-muted" style="margin-right: 5px;"></i> Bitácora de Distribución</h4>
                    </div>
                    <div class="table-wrapper">
                       <table class="data-table">
                          <thead>
                             <tr>
                                <th>Recurso Identificado</th>
                                <th>Última Acción Reportada</th>
                                <th>Ubicación / Cuadrante</th>
                                <th>Estatus Global</th>
                             </tr>
                          </thead>
                          <tbody id="logisticaTableBody">
                             <tr>
                                <td>Unidad Bp-01</td>
                                <td>Despliegue Operativo</td>
                                <td>Cuadrante P-05</td>
                                <td><span class="status-pill status-despachado">EN SERVICIO</span></td>
                             </tr>
                             <tr>
                                <td>Ambulancia Amb-12</td>
                                <td>Mantenimiento Preventivo</td>
                                <td>Taller Central</td>
                                <td><span class="status-pill" style="background:#fef3c7; color:#d97706;">MANTENIMIENTO</span></td>
                             </tr>
                          </tbody>
                       </table>
                    </div>
                 </div>
             </div>

          </div>
       </div>
    </div>

    <!-- Modal Nuevo Recurso con Diseño Premium -->
    <div class="modal modal-overlay-premium" id="modalRecurso">
       <div class="modal-container modal-premium">
          <div class="modal-premium-header">
             <h3 class="modal-premium-title"><i class="fas fa-boxes"></i> <span class="modal-title">Registrar Nuevo Recurso</span></h3>
             <button class="modal-premium-close" id="closeRecursoModal">&times;</button>
          </div>
          <div class="modal-premium-body">
              <form id="formRecurso" class="premium-form-grid">
                  <input type="hidden" id="editResourceID_Hidden">
                  
                  <div class="premium-group">
                     <label class="premium-label">Código de Inventario <span class="asterisk">*</span></label>
                     <input type="text" class="premium-input" id="txtResourceID" placeholder="Ej: CPZ-V001">
                     <span id="err_txtResourceID" class="premium-helper-text pb-error" style="color: var(--primary-color);"></span>
                  </div>
                  <div class="premium-group">
                     <label class="premium-label">Tipo de Recurso <span class="asterisk">*</span></label>
                     <select id="selResourceType" class="premium-input premium-select" onchange="window.logisticaCtrl.toggleTypeFields()">
                        <option value="">Seleccione tipo...</option>
                        <option value="vehiculo">Vehículo / Patrulla</option>
                        <option value="equipo">Equipo Tecnológico</option>
                        <option value="telefono">Teléfono Inteligente (IMEI)</option>
                        <option value="otro">Otro Recurso</option>
                     </select>
                     <span id="err_selResourceType" class="premium-helper-text pb-error" style="color: var(--primary-color);"></span>
                  </div>

                  <!-- CAMPOS DINÁMICOS POR TIPO -->
                  <div id="fields_vehiculo" class="type-specific-fields" style="display:none; grid-column: span 2;">
                      <div class="premium-form-grid" style="grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 15px;">
                          <div class="premium-group"><label class="premium-label">Placa <span class="asterisk">*</span></label><input type="text" class="premium-input" id="v_placa"></div>
                          <div class="premium-group"><label class="premium-label">Marca <span class="asterisk">*</span></label><input type="text" class="premium-input" id="v_marca"></div>
                          <div class="premium-group"><label class="premium-label">Modelo <span class="asterisk">*</span></label><input type="text" class="premium-input" id="v_modelo"></div>
                      </div>
                      <div class="premium-form-grid" style="grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 15px;">
                          <div class="premium-group"><label class="premium-label">Año <span class="asterisk">*</span></label><input type="number" class="premium-input" id="v_anio"></div>
                          <div class="premium-group"><label class="premium-label">Capacidad <span class="asterisk">*</span></label><input type="number" class="premium-input" id="v_capacidad"></div>
                          <div class="premium-group">
                              <label class="premium-label">Tipo Vehículo <span class="asterisk">*</span></label>
                              <select id="v_tipo" class="premium-input premium-select">
                                  <option value="SEDAN">SEDAN</option>
                                  <option value="PICKUP">PICKUP 4X4</option>
                                  <option value="AMBULANCIA">AMBULANCIA</option>
                                  <option value="MOTO">MOTO</option>
                              </select>
                          </div>
                      </div>
                  </div>

                  <div id="fields_equipo" class="type-specific-fields" style="display:none; grid-column: span 2;">
                      <div class="premium-form-grid" style="grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 15px;">
                          <div class="premium-group"><label class="premium-label">Tipo de Equipo <span class="asterisk">*</span></label><input type="text" class="premium-input" id="e_tipo" placeholder="Ej: Radio Harris"></div>
                          <div class="premium-group"><label class="premium-label">Estado Físico <span class="asterisk">*</span></label><input type="text" class="premium-input" id="e_estado_fisico" placeholder="Ej: Operativo / Desgaste Menor"></div>
                      </div>
                  </div>

                  <div id="fields_telefono" class="type-specific-fields" style="display:none; grid-column: span 2;">
                      <div class="premium-form-grid" style="grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 15px;">
                          <div class="premium-group"><label class="premium-label">Número de Línea <span class="asterisk">*</span></label><input type="text" class="premium-input" id="t_linea" placeholder="04120000000"></div>
                          <div class="premium-group"><label class="premium-label">IMEI (15 dígitos) <span class="asterisk">*</span></label><input type="text" class="premium-input" id="t_imei" maxlength="15"></div>
                      </div>
                  </div>

                  <div class="premium-group" style="grid-column: span 2;">
                     <label class="premium-label">Descripción General / Nombre <span class="asterisk">*</span></label>
                     <input type="text" class="premium-input" id="txtResourceName" placeholder="Ej: Patrulla Sector Norte">
                     <span id="err_txtResourceName" class="premium-helper-text pb-error" style="color: var(--primary-color);"></span>
                  </div>

                  <div class="premium-group">
                     <label class="premium-label">Asignación Territorial (Cuadrante)</label>
                     <select id="selResourceCuadrante" class="premium-input premium-select">
                        <option value="">Sin Asignación</option>
                     </select>
                  </div>
                  <div class="premium-group">
                     <label class="premium-label">Funcionario Responsable</label>
                     <select id="selResourceFuncionario" class="premium-input premium-select">
                        <option value="">Sin Asignación</option>
                     </select>
                  </div>

                  <div class="premium-group" style="grid-column: span 2;">
                      <label class="premium-label">Estado del Recurso <span class="asterisk">*</span></label>
                      <select id="selResourceStatus" class="premium-input premium-select">
                         <option value="disponible">DISPONIBLE</option>
                         <option value="asignado">ASIGNADO</option>
                         <option value="en_mantenimiento">EN MANTENIMIENTO</option>
                         <option value="dado_baja">DADO DE BAJA</option>
                      </select>
                  </div>
                  
                  <div class="premium-group" id="groupObservation" style="display:none; grid-column: span 2;">
                       <label class="premium-label" id="lblObs">Observación / Motivo (Obligatorio) <span class="asterisk">*</span></label>
                       <textarea class="premium-input" id="txtObservation" rows="2" placeholder="Describa el motivo del cambio de estado..."></textarea>
                       <span id="err_txtObservation" class="premium-helper-text pb-error" style="color: var(--primary-color);"></span>
                  </div>
              </form>
          </div>
          <div class="premium-footer">
             <button class="premium-circle-btn btn-cancel-circle" id="btnCancelarRecurso" title="Cancelar">
                 <i class="fas fa-times"></i>
             </button>
             <button class="premium-circle-btn btn-save-circle" id="btnGuardarRecurso" title="Guardar Recurso">
                 <i class="fas fa-check"></i>
             </button>
          </div>
       </div>
    </div>
  `;
}
