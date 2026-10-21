/**
 * Presentacion/Pages/Administracion/Administracion.page.js
 * Módulo 5 - Administración del Sistema (Versión Limpia y Segura)
 */

export function render(props = {}) {
  // El rol ahora viene inyectado desde App.js
  const userRole = (props.role || '').toUpperCase();
  const userId = (props.userId || '').toLowerCase();
  
  const isCoordinador = userRole.includes('COORDINADOR') || (userId === 'admin');
  const isDirector = userRole === 'DIRECTOR GENERAL';
  
  const hasAdminAccess = isCoordinador || isDirector;
  const isReadOnly = isDirector; // Director solo lectura en este módulo

  return `
    <div id="adminPage" class="page-content active">
      <div class="table-container admin-container">
              <div class="admin-tabs">
          <div class="admin-tab active" data-target="secUsuarios"><i class="fas fa-users-cog"></i> Usuarios</div>
          <div class="admin-tab" data-target="secAuditoria"><i class="fas fa-history"></i> Auditoría</div>
          ${hasAdminAccess ? `
            <div class="admin-tab" data-target="secOrganismos"><i class="fas fa-building"></i> Organismos</div>
            <div class="admin-tab" data-target="secModulos"><i class="fas fa-broadcast-tower"></i> Módulos</div>
            <div class="admin-tab" data-target="secCuadrantes"><i class="fas fa-map-marked-alt"></i> Cuadrantes</div>
          ` : ''}
          ${isCoordinador ? `
            <div class="admin-tab" data-target="secParametros"><i class="fas fa-cogs"></i> Parámetros</div>
          ` : ''}
        </div>

        <div class="admin-tab-content">
          <!-- SECCIÓN: USUARIOS -->
          <div id="secUsuarios" class="admin-section active">
            <div class="table-header">
              <div class="header-texts">
                <h2 class="table-title">Gestión de Usuarios</h2>
                <p class="table-subtitle">Control de identidades y niveles de acceso institucional</p>
              </div>
              <div class="table-controls u-flex u-gap-10 u-items-center">
                <div class="admin-search-box u-m-0">
                  <i class="fas fa-search"></i>
                  <input type="text" id="adminUserSearch" placeholder="Buscar funcionario..." onkeyup="window.adminCtrl.renderUsers()">
                </div>
                ${!isReadOnly ? `
                  <button class="admin-add-user-btn" id="btnOpenUserModal">
                    <i class="fas fa-user-plus"></i> NUEVO USUARIO
                  </button>
                ` : ''}
              </div>
            </div>
            <div class="table-wrapper admin-card">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Usuario ID</th>
                    <th>Nombres y Apellidos</th>
                    <th>Cargo/Rol</th>
                    <th class="u-text-center">Intentos</th>
                    <th class="u-text-center">Estado</th>
                    <th class="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody id="usersTableBody" data-readonly="${isReadOnly}"></tbody>
              </table>
            </div>
          </div>

          <!-- SECCIÓN: AUDITORÍA -->
          <div id="secAuditoria" class="admin-section">
             <div class="table-header">
              <div class="header-texts">
                <h2 class="table-title">Logs de Auditoría</h2>
                <p class="table-subtitle">Trazabilidad histórica de acciones administrativas e IP</p>
              </div>
            </div>
            <div class="table-wrapper admin-card">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Fecha / Hora</th>
                    <th>Identidad Responsable</th>
                    <th>Acción</th>
                    <th>Detalle Institucional</th>
                    <th>Resultado</th>
                  </tr>
                </thead>
                <tbody id="auditoriaTableBody"></tbody>
              </table>
            </div>
          </div>

          ${hasAdminAccess ? `
          <!-- SECCIÓN: ORGANISMOS -->
          <div id="secOrganismos" class="admin-section">
            <div class="table-header">
              <div class="header-texts">
                <h2 class="table-title">Estructura de Organismos</h2>
                <p class="table-subtitle">Instituciones integradas al centro de inteligencia</p>
              </div>
              <div class="table-controls u-flex u-gap-10 u-items-center">
                <div class="admin-search-box u-m-0">
                  <i class="fas fa-search"></i>
                  <input type="text" id="adminOrgSearch" placeholder="Buscar organismo..." onkeyup="window.adminCtrl.renderOrganismos()">
                </div>
                ${!isReadOnly ? `
                  <button class="admin-add-user-btn" onclick="window.adminCtrl.openOrganismoModal()">
                    <i class="fas fa-building"></i> NUEVO ORGANISMO
                  </button>
                ` : ''}
              </div>
            </div>
            <div class="table-wrapper admin-card">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Siglas</th>
                    <th>Tipo</th>
                    <th class="u-text-center">Estatus</th>
                    <th class="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody id="orgsTableBody" data-readonly="${isReadOnly}"></tbody>
              </table>
            </div>
          </div>

          <!-- SECCIÓN: MÓDULOS -->
          <div id="secModulos" class="admin-section">
            <div class="table-header">
              <div class="header-texts">
                <h2 class="table-title">Módulos Policiales</h2>
                <p class="table-subtitle">Infraestructura de respuesta primaria en el territorio</p>
              </div>
              <div class="table-controls u-flex u-gap-10 u-items-center">
                <div class="admin-search-box u-m-0">
                  <i class="fas fa-search"></i>
                  <input type="text" id="adminModSearch" placeholder="Buscar módulo..." onkeyup="window.adminCtrl.renderModulos()">
                </div>
                ${!isReadOnly ? `
                  <button class="admin-add-user-btn" onclick="window.adminCtrl.openModuloModal()">
                    <i class="fas fa-broadcast-tower"></i> NUEVO MÓDULO
                  </button>
                ` : ''}
              </div>
            </div>
            <div class="table-wrapper admin-card">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Organismo</th>
                    <th class="u-text-center">Estatus</th>
                    <th class="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody id="modulosTableBody" data-readonly="${isReadOnly}"></tbody>
              </table>
            </div>
          </div>

          <!-- SECCIÓN: CUADRANTES DE PAZ -->
          <div id="secCuadrantes" class="admin-section">
            <div class="table-header">
              <div class="header-texts">
                <h2 class="table-title">Cuadrantes de Paz</h2>
                <p class="table-subtitle">Unidades territoriales de seguridad ciudadana (División Macro)</p>
              </div>
              <div class="table-controls u-flex u-gap-10 u-items-center">
                <div class="admin-search-box u-m-0">
                  <i class="fas fa-search"></i>
                  <input type="text" id="adminCuadSearch" placeholder="Buscar cuadrante..." onkeyup="window.adminCtrl.renderCuadrantes()">
                </div>
                ${!isReadOnly ? `
                  <button class="admin-add-user-btn" onclick="window.adminCtrl.openCuadranteModal()">
                    <i class="fas fa-map-marked-alt"></i> NUEVO CUADRANTE
                  </button>
                ` : ''}
              </div>
            </div>
            <div class="table-wrapper admin-card">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre / Alias</th>
                    <th>Módulo Adscrito</th>
                    <th class="u-text-center">Estatus</th>
                    <th class="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody id="cuadrantesTableBody" data-readonly="${isReadOnly}"></tbody>
              </table>
            </div>
          </div>
          ` : ''}

          ${isCoordinador ? `
            <div id="secParametros" class="admin-section">
               <div class="config-grid">
                  <div class="config-card">
                      <h3>Políticas de Acceso</h3>
                      <div class="pb-group">
                          <label class="pb-label">Expiración de Claves (Días)</label>
                          <input type="number" id="cfg_pass_expire" class="pb-input">
                      </div>
                      <div class="pb-group">
                          <label class="pb-label">Longitud Mínima Clave</label>
                          <input type="number" id="cfg_pass_min" class="pb-input">
                      </div>
                      <button class="add-btn" id="btnSaveConfig">APLICAR POLÍTICAS</button>
                  </div>

                  <div class="config-card">
                      <h3>Catálogo de Naturalezas</h3>
                      <p class="u-text-xs u-pb-10">Configure las categorías de incidentes y sus scripts de respuesta inicial.</p>
                      <div id="listCategorias" class="u-mb-15">
                          <!-- Se carga dinámicamente -->
                      </div>
                      <button class="btn-upload-simple w-full" onclick="window.adminCtrl.abrirModalCategoria()">
                          <i class="fas fa-plus-circle"></i> AGREGAR NUEVA NATURALEZA
                      </button>
                  </div>
               </div>
            </div>

            <!-- Modal Categoría -->
            <div class="modal modal-overlay-premium" id="modalCategoria" style="display:none;">
               <div class="modal-container" style="max-width: 450px; background: white; border-radius: 12px; overflow: hidden; display:flex; flex-direction:column; position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); z-index:10001; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
                   <div class="modal-premium-header">
                       <h3 class="modal-premium-title"><i class="fas fa-list"></i> Configurar Naturaleza</h3>
                       <button class="modal-premium-close" onclick="window.adminCtrl.closeModal('modalCategoria')">&times;</button>
                   </div>
                   <div class="modal-premium-body" style="padding: 20px;">
                       <div class="premium-group" style="margin-bottom:15px;">
                           <label class="premium-label">ID / CÓDIGO (MAYÚSCULAS) *</label>
                           <input type="text" id="cat_id" class="premium-input" placeholder="EJ: HOMICIDIO" style="width:100%;">
                       </div>
                       <div class="premium-group" style="margin-bottom:15px;">
                           <label class="premium-label">NOMBRE VISIBLE *</label>
                           <input type="text" id="cat_nombre" class="premium-input" placeholder="EJ: Homicidio / Muerte Violenta" style="width:100%;">
                       </div>
                       <div class="premium-group" style="margin-bottom:15px;">
                           <label class="premium-label">SCRIPT DE RESPUESTA (VOZ) *</label>
                           <textarea id="cat_script" class="premium-input" rows="3" placeholder="Script que leerá el operador al recibir la llamada..." style="width:100%; resize:vertical;"></textarea>
                       </div>
                   </div>
                   <div class="modal-premium-footer u-flex u-justify-end u-gap-10" style="padding: 15px; border-top: 1px solid #eee; display:flex; justify-content:flex-end; gap:10px;">
                       <button class="btn-upload-simple" onclick="window.adminCtrl.closeModal('modalCategoria')">CANCELAR</button>
                       <button class="add-btn" onclick="window.adminCtrl.handleSaveCategoria()">GUARDAR CAMBIOS</button>
                   </div>
               </div>
            </div>
          ` : ''}
        </div>

      <div class="modal modal-overlay-premium" id="modalUsuario">
        <div class="modal-container modal-premium">
          <div class="modal-premium-header">
            <h3 class="modal-premium-title"><i class="fas fa-star"></i> Crear Nuevo Usuario</h3>
            <button class="modal-premium-close" id="btnCloseUserModal">&times;</button>
          </div>
          <div class="modal-premium-body">
            <form id="formUsuario" class="premium-form-grid">
              <!-- Fila 1 -->
              <div class="premium-group">
                <label class="premium-label">Documento de Identidad <span class="asterisk">*</span></label>
                <div class="premium-input-group">
                  <select id="user_nac" class="premium-select-small">
                    <option value="" disabled selected>Nac.</option>
                  </select>
                  <input type="text" id="user_cedula" class="premium-input premium-input-small" placeholder="Ej: 12345678">
                </div>
                <span class="premium-helper-text">El número de documento es obligatorio</span>
              </div>
              <div class="premium-group">
                <label class="premium-label">Nombre de Usuario (ID) <span class="asterisk">*</span></label>
                <input type="text" id="user_id" class="premium-input" placeholder="Ej: PGarcia">
                <span class="premium-helper-text">El usuario (ID) es requerido</span>
              </div>

              <!-- Fila 2 -->
              <div class="premium-group">
                <label class="premium-label">Nombres Completos <span class="asterisk">*</span></label>
                <input type="text" id="user_nombres" class="premium-input" placeholder="Ej: Pedro José">
                <span class="premium-helper-text">El nombre es requerido</span>
              </div>
              <div class="premium-group">
                <label class="premium-label">Apellidos Completos <span class="asterisk">*</span></label>
                <input type="text" id="user_apellidos" class="premium-input" placeholder="Ej: Garcia Lopez">
                <span class="premium-helper-text">El apellido es requerido</span>
              </div>

              <!-- Fila 3 -->
              <div class="premium-group">
                <label class="premium-label">Correo Electrónico <span class="asterisk">*</span></label>
                <input type="email" id="user_email" class="premium-input" placeholder="Ej: correo@institucion.gob.ve">
                <span class="premium-helper-text">El correo es requerido</span>
              </div>
              <div class="premium-group">
                <label class="premium-label">Contraseña <span class="asterisk">*</span></label>
                <div class="premium-input-icon-wrapper">
                  <input type="password" id="user_pass" class="premium-input" placeholder="Clave de acceso">
                  <i class="fas fa-eye" id="togglePassVis" onclick="const x = document.getElementById('user_pass'); const i = this; if(x.type === 'password'){x.type='text'; i.classList.replace('fa-eye','fa-eye-slash');} else {x.type='password'; i.classList.replace('fa-eye-slash','fa-eye');}"></i>
                </div>
                <span class="premium-helper-text">La contraseña es requerida para un usuario nuevo</span>
              </div>

              <!-- Fila 4 -->
              <div class="premium-group">
                <label class="premium-label">Organismo <span class="asterisk">*</span></label>
                <select id="user_org" class="premium-input premium-select">
                  <option value="" disabled selected>Cargando organismos...</option>
                </select>
                <span class="premium-helper-text">Debe seleccionar un organismo</span>
              </div>
              <div class="premium-group">
                <label class="premium-label">Cargo Administrativo / Operativo <span class="asterisk">*</span></label>
                <select id="user_cargo" class="premium-input premium-select">
                  <option value="" disabled selected>Cargando...</option>
                </select>
                <span class="premium-helper-text">Debe seleccionar un cargo</span>
              </div>

              <!-- Fila 5 -->
              <div class="premium-group">
                <label class="premium-label">Roles del Sistema <span class="asterisk">*</span></label>
                <select id="user_role" class="premium-input premium-select">
                  <option value="" disabled selected>Cargando...</option>
                </select>
                <span class="premium-helper-text">Debe seleccionar un rol</span>
              </div>
              <div class="premium-group">
                <label class="premium-label">Estatus en el Sistema <span class="asterisk">*</span></label>
                <select id="user_status" class="premium-input premium-select">
                  <option value="" disabled selected>Cargando...</option>
                </select>
                <span class="premium-helper-text">Debe seleccionar un estatus</span>
              </div>

              <!-- Fila 6 (Recursos y Horario para Coordinación) -->
              <div class="premium-group">
                <label class="premium-label">Recursos Asignados (Vehículo/Moto)</label>
                <div class="premium-input-group">
                  <input type="text" id="user_vehiculo" class="premium-input" placeholder="Placa/ID Vehículo">
                  <input type="text" id="user_moto" class="premium-input" placeholder="Placa/ID Moto">
                </div>
                <span class="premium-helper-text">Asignación de unidades móviles</span>
              </div>
              <div class="premium-group">
                <label class="premium-label">Teléfono y Horario</label>
                <div class="premium-input-group">
                  <input type="text" id="user_telefono" class="premium-input" placeholder="Nro. Teléfono">
                  <input type="text" id="user_horario" class="premium-input" placeholder="Ej: 08:00 - 20:00">
                </div>
                <span class="premium-helper-text">Equipamiento y jornada laboral</span>
              </div>

              <!-- Fila 7 (Justificación Obligatoria para Coordinadores) -->
              <div class="premium-group" style="grid-column: span 2;">
                <label class="premium-label">Justificación del Cambio / Registro <span class="asterisk">*</span></label>
                <textarea id="user_justificacion" class="premium-input" rows="2" placeholder="Describa el motivo de esta acción administrativa (Se notificará a VEN911)..."></textarea>
                <span class="premium-helper-text">Obligatorio para auditoría y notificación VEN911</span>
              </div>

              <!-- Fila 8 (Dinámica - Cuadrante y Jefe) -->
              <div class="premium-group" id="group_user_cuadrante" style="display: none;">
                <label class="premium-label">Cuadrante Asignado <span class="asterisk">*</span></label>
                <select id="user_cuadrante" class="premium-input premium-select">
                  <option value="" disabled selected>Cargando cuadrantes...</option>
                </select>
                <span class="premium-helper-text">Debe seleccionar el cuadrante al que pertenece</span>
              </div>
              <div class="premium-group" id="group_user_jefe" style="display: none;">
                <label class="premium-label">Jefe de Cuadrante (Para Auxiliares)</label>
                <select id="user_jefe" class="premium-input premium-select">
                  <option value="" disabled selected>Cargando Jefes Activos...</option>
                </select>
                <span class="premium-helper-text">Obligatorio si el rol es Auxiliar de Cuadrante</span>
              </div>
            </form>
            <div class="premium-footer">
              <button class="premium-circle-btn btn-cancel-circle" id="btnCancelUserModal" title="Cancelar"><i class="fas fa-times"></i></button>
              <button class="premium-circle-btn btn-save-circle" id="btnSaveUser" title="Guardar Usuario"><i class="fas fa-check"></i></button>
            </div>
          </div>
        </div>
      </div>

      </div>

      <!-- MODAL: REGISTRO DE ORGANISMO -->
      <div class="modal modal-overlay-premium" id="modalOrganismo">
        <div class="modal-container modal-premium" style="max-width: 500px;">
          <div class="modal-premium-header">
            <h3 class="modal-premium-title"><i class="fas fa-building"></i> Registro de Organismo</h3>
            <button class="modal-premium-close" onclick="window.adminCtrl.closeModal('modalOrganismo')">&times;</button>
          </div>
          <div class="modal-premium-body">
            <form id="formOrganismo" class="premium-form-grid" style="grid-template-columns: 1fr;">
              <div class="premium-group">
                <label class="premium-label">Nombre Institucional <span class="asterisk">*</span></label>
                <input type="text" id="org_nombre" class="premium-input" placeholder="Ej: POLICIA DEL ESTADO MONAGAS">
                <span class="premium-helper-text">El nombre es requerido</span>
              </div>
              <div class="premium-group">
                <label class="premium-label">Siglas <span class="asterisk">*</span></label>
                <input type="text" id="org_siglas" class="premium-input" placeholder="Ej: POLIMONAGAS">
                 <span class="premium-helper-text">Las siglas son requeridas</span>
              </div>
              <div class="premium-group">
                <label class="premium-label">Tipo de Organismo <span class="asterisk">*</span></label>
                <select id="org_tipo" class="premium-input premium-select">
                  <option value="" disabled selected>Cargando...</option>
                </select>
                <span class="premium-helper-text">Debe seleccionar un tipo</span>
              </div>
              <div class="premium-group">
                <label class="premium-label">Jurisdicción <span class="asterisk">*</span></label>
                <select id="org_jurisdiccion" class="premium-input premium-select">
                    <option value="" disabled selected>Cargando...</option>
                </select>
                <span class="premium-helper-text">Debe seleccionar una jurisdicción</span>
              </div>
            </form>
            <div class="premium-footer">
              <button class="premium-circle-btn btn-cancel-circle" onclick="window.adminCtrl.closeModal('modalOrganismo')"><i class="fas fa-times"></i></button>
              <button class="premium-circle-btn btn-save-circle" onclick="window.adminCtrl.handleSaveOrganismo()"><i class="fas fa-check"></i></button>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL: REGISTRO DE MÓDULO -->
      <div class="modal modal-overlay-premium" id="modalModulo">
        <div class="modal-container modal-premium" style="max-width: 500px;">
          <div class="modal-premium-header">
            <h3 class="modal-premium-title"><i class="fas fa-microchip"></i> Registro de Módulo Policial</h3>
            <button class="modal-premium-close" onclick="window.adminCtrl.closeModal('modalModulo')">&times;</button>
          </div>
          <div class="modal-premium-body">
            <form id="formModulo" class="premium-form-grid" style="grid-template-columns: 1fr;">
              <div class="premium-group">
                <label class="premium-label">Código del Módulo <span class="asterisk">*</span></label>
                <input type="text" id="mod_codigo" class="premium-input" placeholder="Ej: MOD-001">
                <span class="premium-helper-text">El código es requerido</span>
              </div>
              <div class="premium-group">
                <label class="premium-label">Nombre del Módulo <span class="asterisk">*</span></label>
                <input type="text" id="mod_nombre" class="premium-input" placeholder="Ej: ESTACIÓN POLICIAL JUNÍN">
                <span class="premium-helper-text">El nombre es requerido</span>
              </div>
              <div class="premium-group">
                <label class="premium-label">Organismo Responsable <span class="asterisk">*</span></label>
                <select id="mod_organismo" class="premium-input premium-select">
                  <!-- Dinámico -->
                </select>
                <span class="premium-helper-text">Debe seleccionar un organismo</span>
              </div>
              <div class="premium-group">
                <label class="premium-label">Ubicación Física <span class="asterisk">*</span></label>
                <input type="text" id="mod_ubicacion" class="premium-input" placeholder="Dirección detallada">
                <span class="premium-helper-text">La ubicación es requerida</span>
              </div>
            </form>
            <div class="premium-footer">
              <button class="premium-circle-btn btn-cancel-circle" onclick="window.adminCtrl.closeModal('modalModulo')"><i class="fas fa-times"></i></button>
              <button class="premium-circle-btn btn-save-circle" onclick="window.adminCtrl.handleSaveModulo()"><i class="fas fa-check"></i></button>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL: REGISTRO DE CUADRANTE -->
      <div class="modal modal-overlay-premium" id="modalCuadrante">
        <div class="modal-container modal-premium" style="max-width: 500px;">
          <div class="modal-premium-header">
            <h3 class="modal-premium-title"><i class="fas fa-map-marked-alt"></i> Registro de Cuadrante de Paz</h3>
            <button class="modal-premium-close" onclick="window.adminCtrl.closeModal('modalCuadrante')">&times;</button>
          </div>
          <div class="modal-premium-body">
            <form id="formCuadrante" class="premium-form-grid" style="grid-template-columns: 1fr;">
              <div class="premium-group">
                <label class="premium-label">Código de Cuadrante <span class="asterisk">*</span></label>
                <input type="text" id="cuad_codigo" class="premium-input" placeholder="Ej: P-01">
                <span class="premium-helper-text">El código es requerido</span>
              </div>
              <div class="premium-group">
                <label class="premium-label">Nombre / Alias <span class="asterisk">*</span></label>
                <input type="text" id="cuad_nombre" class="premium-input" placeholder="Ej: CASCO CENTRAL">
                <span class="premium-helper-text">El nombre es requerido</span>
              </div>
              <div class="premium-group">
                <label class="premium-label">Módulo Policial Adscrito <span class="asterisk">*</span></label>
                <select id="cuad_modulo" class="premium-input premium-select">
                  <!-- Dinámico -->
                </select>
                <span class="premium-helper-text">Debe seleccionar un módulo</span>
              </div>
              <div class="premium-group">
                <label class="premium-label">Territorio (Comunas/Sectores) <span class="asterisk">*</span></label>
                <textarea id="cuad_territorio" class="premium-input" placeholder="Describa el área de cobertura..." rows="3"></textarea>
                <span class="premium-helper-text">La descripción del territorio es requerida</span>
              </div>
            </form>
            <div class="premium-footer">
              <button class="premium-circle-btn btn-cancel-circle" onclick="window.adminCtrl.closeModal('modalCuadrante')"><i class="fas fa-times"></i></button>
              <button class="premium-circle-btn btn-save-circle" onclick="window.adminCtrl.handleSaveCuadrante()"><i class="fas fa-check"></i></button>
            </div>
          </div>
        </div>
      </div>

    </div>
  `;
}
