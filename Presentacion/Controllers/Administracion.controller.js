/**
 * Presentacion/Controllers/Administracion/Administracion.controller.js
 * Controlador Refactorizado - Proyecto CUPAZ Monagas
 */

import { AuthService } from '../../Service/AuthService.js';
import { AdministracionService } from '../../Service/Administracion.service.js';
import { AuditService } from '../../Service/AuditService.js';
import { Validator } from '../Components/UI/Validator.js';

export const controller = {
    async init(props) {
        await new Promise(resolve => setTimeout(resolve, 50));

        // Carga inicial de datos
        this.refreshAll();
        this.initEvents();

        // Exponer controlador globalmente para los botones de la UI (onclick)
        window.adminCtrl = this;

        return () => { window.adminCtrl = null; };
    },

    refreshAll() {
        this.renderAuditoria();
        this.renderUsers();
        this.renderOrganismos();
        this.renderModulos();
        this.renderCuadrantes();
        this.renderParametros();
    },

    // --- RENDERERS (Pintado de Tablas) ---

    renderAuditoria() {
        const tbody = document.getElementById('auditoriaTableBody');
        if (!tbody) return;
        const logs = AuditService.getLogs();

        tbody.innerHTML = logs.slice(0, 50).map(l => `
            <tr>
                <td class="u-text-xs u-text-muted">
                    <div>${l.fecha}</div>
                    <div>${l.hora}</div>
                </td>
                <td>
                    <div class="u-text-bold">${l.usuario}</div>
                    <div class="u-text-xs u-text-muted">IP: ${l.ip || '0.0.0.0'}</div>
                </td>
                <td class="u-text-xs u-text-bold u-text-primary"><i class="fas fa-shield-alt u-pr-5"></i> ${l.accion}</td>
                <td class="u-text-xs">${l.detalle}</td>
                <td><span class="status-pill status-${(l.resultado === 'EXITOSO' || l.resultado === 'ÉXITO') ? 'active' : 'inactive'} u-text-xs">${l.resultado}</span></td>
            </tr>
        `).join('');
    },

    renderUsers() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;
        const users = AdministracionService.getUsuarios();
        const search = document.getElementById('adminUserSearch')?.value.toLowerCase() || '';
        const session = AuthService.getUserData();

        let filteredUsers = users.filter(u =>
            u.user.toLowerCase().includes(search) ||
            (u.name && u.name.toLowerCase().includes(search)) ||
            (u.role && u.role.toLowerCase().includes(search))
        );

        // FILTRADO POR ÁREA (Jerarquía CUPAZ)
        // Si no es Coordinador General (admin), solo ve personal de su competencia
        if (session && session.role.toUpperCase() !== 'COORDINADOR CUPAZ' && session.role.toUpperCase() !== 'DIRECTOR GENERAL') {
            const area = session.role.split('DE ').pop().toUpperCase(); // Obtiene 'PATRULLAJE', 'SALA', etc.
            filteredUsers = filteredUsers.filter(u => {
                const uRole = (u.role || '').toUpperCase();
                const uCargo = (u.cargo || '').toUpperCase();
                // Regla: Ve a los que pertenecen a su área o roles base que supervisan
                return uRole.includes(area) || uCargo.includes(area) || 
                       uRole === 'PERSONAL OPERATIVO' || 
                       (uRole === 'OPERADOR' && area === 'SALA');
            });
        }

        tbody.innerHTML = filteredUsers.length === 0
            ? `<tr><td colspan="6" class="u-empty-state">No se encontraron usuarios</td></tr>`
            : filteredUsers.map(u => {
                const isSelf = session && session.user === u.user;
                return `
            <tr>
                <td>
                  <div class="u-flex u-items-center">
                    <span class="admin-user-title">${u.user}</span>
                  </div>
                </td>
                <td>${u.name}</td>
                <td>
                    <span class="admin-role-title">${u.role}</span>
                    <span class="admin-role-subtitle">CUPAZ - Acceso Concedido</span>
                </td>
                <td class="u-text-center"><span class="admin-badge-intentos">${u.intentos || 0}</span></td>
                <td class="u-text-center"><span class="admin-status-${(u.estado || 'ACTIVO').toLowerCase()}">${u.estado || 'ACTIVO'}</span></td>
                <td class="text-right u-text-nowrap">
                    ${tbody.dataset.readonly !== 'true' ? `
                    <button class="admin-btn admin-btn-edit" ${isSelf ? 'disabled title="Usted no puede modificar su propia información de acceso desde aquí"' : `onclick="window.adminCtrl.prepareEditUser('${u.user}')"`}>
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="admin-btn btn-status-toggle ${(u.estado || 'ACTIVO').toUpperCase() === 'ACTIVO' ? 'power-active' : 'power-inactive'} u-ml-5" ${isSelf ? 'disabled title="No puede alterar su propio estado"' : `onclick="window.adminCtrl.toggleUserStatus('${u.user}')"`} title="Cambiar Estado">
                        <i class="fas fa-power-off"></i>
                    </button>
                    ` : '<span class="u-text-muted u-text-xs">Solo Lectura</span>'}
                </td>
            </tr>
        `}).join('');
    },

    async toggleUserStatus(userId) {
        if (!await this.validar2FA()) return;
        if (!await cupazConfirm(`¿Está seguro de cambiar el estado de acceso de ${userId}?`, "Confirmación Administrativa")) return;

        if (AdministracionService.toggleEstadoUsuario(userId)) {
            this.renderUsers();
            window.cupazToast("Estatus de usuario actualizado", "success");
        }
    },

    renderOrganismos() {
        const tbody = document.getElementById('orgsTableBody');
        if (!tbody) return;
        const search = document.getElementById('adminOrgSearch')?.value.toLowerCase() || '';
        const data = AdministracionService.getEntidad('organismos').filter(o => 
            o.nombre.toLowerCase().includes(search) || o.siglas.toLowerCase().includes(search)
        );
        
        tbody.innerHTML = data.length === 0 
            ? `<tr><td colspan="5" class="u-empty-state">No se encontraron organismos</td></tr>`
            : data.map(o => {
                const isActive = (o.estado || 'Activo').toUpperCase() === 'ACTIVO';
                return `
            <tr>
                <td class="u-text-bold">${o.nombre}</td>
                <td><span class="admin-badge-intentos" style="background:var(--secondary-color); color:white;">${o.siglas}</span></td>
                <td>${o.tipo}</td>
                <td class="u-text-center">
                    <span class="admin-status-${(o.estado || 'Activo').toLowerCase()}">${o.estado || 'Activo'}</span>
                </td>
                <td class="text-right">
                    ${tbody.dataset.readonly !== 'true' ? `
                    <button class="admin-btn admin-btn-edit" title="Editar" onclick="window.adminCtrl.prepareEditEntidad('organismos', '${o.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="admin-btn btn-status-toggle ${isActive ? 'power-active' : 'power-inactive'} u-ml-5" onclick="window.adminCtrl.toggleEntidadStatus('organismos', '${o.id}')" title="Cambiar Estado">
                        <i class="fas fa-power-off"></i>
                    </button>
                    ` : '<span class="u-text-muted u-text-xs">Solo Lectura</span>'}
                </td>
            </tr>
        `}).join('');
    },

    renderModulos() {
        const tbody = document.getElementById('modulosTableBody');
        if (!tbody) return;
        const search = document.getElementById('adminModSearch')?.value.toLowerCase() || '';
        const data = AdministracionService.getEntidad('modulos').filter(m => 
            m.nombre.toLowerCase().includes(search) || m.codigo.toLowerCase().includes(search)
        );
        
        tbody.innerHTML = data.length === 0 
            ? `<tr><td colspan="5" class="u-empty-state">No se encontraron módulos</td></tr>`
            : data.map(m => {
                const isActive = (m.estado || 'Activo').toUpperCase() === 'ACTIVO';
                return `
            <tr>
                <td class="u-text-bold">${m.codigo}</td>
                <td>${m.nombre}</td>
                <td class="u-text-primary u-text-bold">${m.organismoNombre || 'N/A'}</td>
                <td class="u-text-center">
                    <span class="admin-status-${(m.estado || 'Activo').toLowerCase()}">${m.estado || 'Activo'}</span>
                </td>
                <td class="text-right">
                    ${tbody.dataset.readonly !== 'true' ? `
                    <button class="admin-btn admin-btn-edit" title="Editar" onclick="window.adminCtrl.prepareEditEntidad('modulos', '${m.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="admin-btn btn-status-toggle ${isActive ? 'power-active' : 'power-inactive'} u-ml-5" onclick="window.adminCtrl.toggleEntidadStatus('modulos', '${m.id}')" title="Cambiar Estado">
                        <i class="fas fa-power-off"></i>
                    </button>
                    ` : '<span class="u-text-muted u-text-xs">Solo Lectura</span>'}
                </td>
            </tr>
        `}).join('');
    },

    renderCuadrantes() {
        const tbody = document.getElementById('cuadrantesTableBody');
        if (!tbody) return;
        const search = document.getElementById('adminCuadSearch')?.value.toLowerCase() || '';
        const data = AdministracionService.getEntidad('cuadrantes').filter(c => 
            c.nombre.toLowerCase().includes(search) || c.codigo.toLowerCase().includes(search)
        );
        
        tbody.innerHTML = data.length === 0 
            ? `<tr><td colspan="5" class="u-empty-state">No se encontraron cuadrantes</td></tr>`
            : data.map(c => {
                const isActive = (c.estado || 'Activo').toUpperCase() === 'ACTIVO';
                return `
            <tr>
                <td class="u-text-bold">${c.codigo}</td>
                <td>${c.nombre}</td>
                <td class="u-text-primary">${c.moduloNombre || 'N/A'}</td>
                <td class="u-text-center">
                    <span class="admin-status-${(c.estado || 'Activo').toLowerCase()}">${c.estado || 'Activo'}</span>
                </td>
                <td class="text-right">
                    ${tbody.dataset.readonly !== 'true' ? `
                    <button class="admin-btn admin-btn-edit" title="Editar" onclick="window.adminCtrl.prepareEditEntidad('cuadrantes', '${c.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="admin-btn btn-status-toggle ${isActive ? 'power-active' : 'power-inactive'} u-ml-5" onclick="window.adminCtrl.toggleEntidadStatus('cuadrantes', '${c.id}')" title="Cambiar Estado">
                        <i class="fas fa-power-off"></i>
                    </button>
                    ` : '<span class="u-text-muted u-text-xs">Solo Lectura</span>'}
                </td>
            </tr>
        `}).join('');
    },

    renderParametros() {
        const config = AdministracionService.getParametros();
        const fields = ['pass_expire', 'pass_min', 'max_dispatch', 'max_arrival', 'threshold_red'];
        fields.forEach(f => {
            const el = document.getElementById(`cfg_${f}`);
            if (el) el.value = config[f];
        });

        // Render Naturalezas (Categorías)
        const cats = AdministracionService.getCategorias();
        const list = document.getElementById('listCategorias');
        if (list) {
            list.innerHTML = cats.map(c => `
                <div class="u-flex u-items-center u-justify-between u-pb-5 u-mb-5" style="border-bottom: 1px solid #eee;">
                    <div style="flex:1">
                        <div class="u-text-bold u-text-sm">${c.nombre} <small class="u-text-muted">(${c.id})</small></div>
                        <div class="u-text-xs u-text-muted u-italic" title="${c.script}">${c.script.substring(0, 40)}...</div>
                    </div>
                    <div>
                        <button class="admin-btn admin-btn-edit" onclick="window.adminCtrl.abrirModalCategoria('${c.id}')"><i class="fas fa-edit"></i></button>
                        <button class="admin-btn btn-status-toggle power-inactive" onclick="window.adminCtrl.handleDeleteCategoria('${c.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `).join('') || '<div class="u-text-xs u-text-muted">No hay naturalezas configuradas</div>';
        }
    },

    // --- LOGICA DE EVENTOS Y MODALES ---

    initEvents() {
        this.bindClick('btnSaveUser', () => this.handleSaveUser());
        this.bindClick('btnSaveConfig', () => this.handleSaveConfig());
        this.bindClick('btnOpenUserModal', async () => {
            if (await this.validar2FA()) this.openUserModal();
        });
        this.bindClick('btnCloseUserModal', () => this.closeUserModal());
        this.bindClick('btnCancelUserModal', () => this.closeUserModal());

        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.onclick = () => {
                document.querySelectorAll('.admin-tab, .admin-section').forEach(el => el.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(tab.dataset.target).classList.add('active');
            };
        });

        // Eventos para validar form en tiempo real (limpieza y filtrado)
        document.querySelectorAll('.premium-input').forEach(input => {
            input.oninput = (e) => {
                const el = e.target;
                
                // Filtro restrictivo inmediato
                if (el.id === 'user_cedula') el.value = el.value.replace(/\D/g, '').slice(0, 9);
                if (el.id === 'user_nombres' || el.id === 'user_apellidos') el.value = el.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
                if (el.id.includes('codigo')) el.value = el.value.toUpperCase();

                // Validación de reglas completa mientras escribe
                this.validateField(el.id);

                if (el.value) el.classList.add('has-value');
                else el.classList.remove('has-value');
            };

            input.onblur = (e) => {
                this.validateField(e.target.id);
                if (e.target.value) e.target.classList.add('has-value');
            };

            if (input.value) input.classList.add('has-value');
        });

        // Evento select Organismo para mostrar Cuadrante
        const orgSelect = document.getElementById('user_org');
        if (orgSelect) {
            orgSelect.addEventListener('change', (e) => {
                const cuadGroup = document.getElementById('group_user_cuadrante');
                if (e.target.value === 'CUADRANTE DE PAZ') {
                    cuadGroup.style.display = 'block';
                    const selectC = document.getElementById('user_cuadrante');
                    const cuadrantes = AdministracionService.getEntidad('cuadrantes').filter(c => c.estado === 'Activo');
                    selectC.innerHTML = '<option value="" disabled selected>Seleccione el Cuadrante...</option>' + 
                        cuadrantes.map(q => `<option value="${q.codigo}">${q.nombre} (${q.codigo})</option>`).join('');
                } else {
                    cuadGroup.style.display = 'none';
                    document.getElementById('user_cuadrante').value = '';
                }
            });
        }

        // Evento select Rol para mostrar Jefe de Cuadrante
        const roleSelect = document.getElementById('user_role');
        if (roleSelect) {
            roleSelect.addEventListener('change', (e) => {
                const jefeGroup = document.getElementById('group_user_jefe');
                if (e.target.value === 'AUXILIAR DE CUADRANTE') {
                    jefeGroup.style.display = 'block';
                    const selectJ = document.getElementById('user_jefe');
                    const jefes = AdministracionService.getUsuarios().filter(u => u.role === 'JEFE DE CUADRANTE' || u.role.includes('COORD'));
                    selectJ.innerHTML = '<option value="" disabled selected>Seleccione Jefe de Cuadrante...</option>' + 
                        jefes.map(j => `<option value="${j.user}">${j.user} - ${j.nombres || j.name}</option>`).join('');
                } else {
                    jefeGroup.style.display = 'none';
                    document.getElementById('user_jefe').value = '';
                }
            });
        }
    },

    showError(id, msg) {
        const el = document.getElementById(id);
        if (!el) return;
        const group = el.closest('.premium-group');
        if (group) {
            group.classList.add('is-error');
            const helper = group.querySelector('.premium-helper-text');
            if (helper) helper.textContent = msg;
        }
    },

    bindClick(id, fn) {
        const el = document.getElementById(id);
        if (el) el.onclick = fn;
    },

    openUserModal() {
        document.getElementById('formUsuario').reset();
        document.getElementById('user_id').readOnly = false;
        document.querySelectorAll('.premium-input').forEach(i => i.classList.remove('has-value', 'invalid'));
        document.querySelectorAll('.premium-group').forEach(g => g.classList.remove('is-error'));
        
        // Poblar selects desde Metadatos del Servicio
        const meta = AdministracionService.getMetadata;
        Validator.renderSelectOptions('user_nac', meta('nacionalidades').map(n => ({v:n})), {value:'v', text:'v'}, 'V-');
        Validator.renderSelectOptions('user_org', AdministracionService.getEntidad('organismos'), {value:'nombre', text:'nombre'}, 'Seleccione un organismo...');
        Validator.renderSelectOptions('user_cargo', meta('cargos').map(c => ({v:c})), {value:'v', text:'v'}, 'Seleccione un cargo...');
        Validator.renderSelectOptions('user_role', meta('roles').map(r => ({v:r})), {value:'v', text:'v'}, 'Seleccione un rol...');
        Validator.renderSelectOptions('user_status', meta('estatus').map(e => ({v:e})), {value:'v', text:'v'});

        this.openModal('modalUsuario');
    },

    openModal(id) {
        const modal = document.getElementById(id);
        if(modal) {
            modal.style.display = 'flex'; // Asegurar display flex para centrado
            setTimeout(() => modal.classList.add('active'), 10);
        }
    },

    closeModal(id) {
        const modal = document.getElementById(id);
        if(modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.style.display = 'none', 300);
        }
    },

    closeUserModal() {
        Validator.clearErrors('formUsuario', { groupClass: '.premium-group', errClass: 'premium-helper-text' });
        this.closeModal('modalUsuario');
    },

    async openOrganismoModal() {
        if (!await this.validar2FA()) return;
        Validator.clearErrors('formOrganismo', { groupClass: '.premium-group', errClass: 'premium-helper-text' });
        document.getElementById('formOrganismo').reset();
        delete document.getElementById('formOrganismo').dataset.id;
        const meta = AdministracionService.getMetadata;
        Validator.renderSelectOptions('org_tipo', meta('organismo_tipos').map(t => ({v:t})), {value:'v', text:'v'}, 'Seleccione tipo...');
        Validator.renderSelectOptions('org_jurisdiccion', meta('jurisdicciones').map(j => ({v:j})), {value:'v', text:'v'}, 'Seleccione jurisdicción...');
        this.openModal('modalOrganismo');
    },

    closeOrganismoModal() {
        Validator.clearErrors('formOrganismo', { groupClass: '.premium-group', errClass: 'premium-helper-text' });
        this.closeModal('modalOrganismo');
    },

    async openModuloModal() {
        if (!await this.validar2FA()) return;
        Validator.clearErrors('formModulo', { groupClass: '.premium-group', errClass: 'premium-helper-text' });
        const orgs = AdministracionService.getEntidad('organismos');
        if (orgs.length === 0) {
            return window.cupazToast("Primero debe registrar al menos un Organismo", "warning");
        }
        Validator.renderSelectOptions('mod_organismo', orgs, {value:'id', text:(o) => `${o.nombre} (${o.siglas})`}, 'Seleccione Organismo...');
        
        document.getElementById('formModulo').reset();
        delete document.getElementById('formModulo').dataset.id;
        this.openModal('modalModulo');
    },

    closeModuloModal() {
        Validator.clearErrors('formModulo', { groupClass: '.premium-group', errClass: 'premium-helper-text' });
        this.closeModal('modalModulo');
    },

    async openCuadranteModal() {
        if (!await this.validar2FA()) return;
        Validator.clearErrors('formCuadrante', { groupClass: '.premium-group', errClass: 'premium-helper-text' });
        const mods = AdministracionService.getEntidad('modulos');
        if (mods.length === 0) {
            return window.cupazToast("Primero debe registrar al menos un Módulo Policial", "warning");
        }
        Validator.renderSelectOptions('cuad_modulo', mods, {value:'id', text:(o) => `${o.nombre} (${o.codigo})`}, 'Seleccione Módulo...');
        
        document.getElementById('formCuadrante').reset();
        delete document.getElementById('formCuadrante').dataset.id;
        this.openModal('modalCuadrante');
    },

    closeCuadranteModal() {
        Validator.clearErrors('formCuadrante', { groupClass: '.premium-group', errClass: 'premium-helper-text' });
        this.closeModal('modalCuadrante');
    },

    async prepareEditUser(userId) {
        if (!await this.validar2FA()) return;
        this.openUserModal();
        const u = AdministracionService.getUsuarioById(userId);
        if(!u) return;

        // Repoblar organismos por si acaso
        const organismos = AdministracionService.getEntidad('organismos');
        Validator.renderSelectOptions('user_org', organismos, { value: 'nombre', text: 'nombre' }, 'Seleccione un organismo...');

        const fields = ['id', 'nac', 'cedula', 'nombres', 'apellidos', 'email', 'org', 'cargo', 'role', 'status', 'vehiculo', 'moto', 'telefono', 'horario', 'jefe'];
        const datamap = {
            id: u.user, nac: u.nac || 'V-', cedula: u.cedula || '', 
            nombres: u.nombres || u.name?.split(' ')[0] || '', apellidos: u.apellidos || u.name?.split(' ').slice(1).join(' ') || '',
            email: u.email || '', org: u.organismo || '', cargo: u.cargo || '', 
            role: u.role || '', status: u.estado || 'ACTIVO',
            vehiculo: u.vehiculo || '', moto: u.moto || '', teléfono: u.telefono || '', horario: u.horario || '', jefe: u.jefe || ''
        };

        fields.forEach(f => {
            const el = document.getElementById('user_' + (f === 'id' ? 'id' : f));
            if(el) {
                el.value = datamap[f] || '';
                if(datamap[f]) el.classList.add('has-value');
                if(f === 'id') el.readOnly = true;
            }
        });
        
        const orgSelect = document.getElementById('user_org');
        if (orgSelect && u.organismo === 'CUADRANTE DE PAZ') {
            // Trigger change para que despliegue el campo de cuadrante
            orgSelect.dispatchEvent(new Event('change'));
            // Cargar el cuadrante guardado (asumiendo que u.cuadrante existe)
            setTimeout(() => {
                const sC = document.getElementById('user_cuadrante');
                if (sC) {
                    sC.value = u.cuadrante || '';
                    sC.classList.add('has-value');
                }
            }, 50);
        }

        const roleSelect = document.getElementById('user_role');
        if (roleSelect && u.role === 'AUXILIAR DE CUADRANTE') {
            roleSelect.dispatchEvent(new Event('change'));
            setTimeout(() => {
                const sJ = document.getElementById('user_jefe');
                if (sJ) {
                    sJ.value = u.jefe || '';
                    sJ.classList.add('has-value');
                }
            }, 50);
        }
        // Justificación se limpia siempre para obligar a poner una nueva
        const justEl = document.getElementById('user_justificacion');
        if (justEl) { 
            justEl.value = ''; 
            justEl.classList.remove('has-value');
        }
    },

    async validar2FA() {
        if (!window.cupazMFA) {
            console.error("Administracion.controller: window.cupazMFA no definido.");
            return true; 
        }
        return await window.cupazMFA("VERIFICACIÓN DE SEGURIDAD", "Para autorizar esta operación administrativa, ingrese el código enviado a su dispositivo móvil.");
    },

    getUserFormSchema(isNewUser = true) {
        const rules = {
            id: 'required|min:4|no-spaces',
            cedula: 'required|numeric|min:7|max:9',
            nombres: 'required|letters',
            apellidos: 'required|letters',
            email: 'required|email',
            org: 'required',
            cargo: 'required',
            role: 'required',
            status: 'required'
        };
        const messages = {
            cedula: "La cédula de identidad es obligatoria y debe ser válida.",
            id: "El nombre de usuario es obligatorio.",
            nombres: "Los nombres son obligatorios.",
            apellidos: "Los apellidos son obligatorios.",
            email: "El correo institucional es obligatorio.",
            pass: "Debe generar una contraseña inicial válida.",
            org: "Debe seleccionar un organismo de la lista.",
            cargo: "Debe seleccionar un cargo de la lista.",
            role: "Debe seleccionar un rol de la lista.",
            status: "Debe seleccionar un estatus de la lista.",
            cuadrante: "Debe seleccionar el cuadrante al que pertenece.",
            jefe: "Los auxiliares deben tener un Jefe asignado."
        };

        if (isNewUser) rules.pass = 'required|password';
        else rules.pass = 'password';

        if (document.getElementById('user_org')?.value === 'CUADRANTE DE PAZ') {
            rules.cuadrante = 'required';
        }

        if (document.getElementById('user_role')?.value === 'AUXILIAR DE CUADRANTE') {
            rules.jefe = 'required';
        }

        // Justificación obligatoria para cualquier cambio de personal
        rules.justificacion = 'required|min:10';

        return { rules, messages };
    },

    getOrgFormSchema() {
        return {
            rules: { nombre: 'required|min:4', siglas: 'required|min:2', tipo: 'required', jurisdiccion: 'required' },
            messages: { 
                nombre: "El nombre institucional es obligatorio.", 
                siglas: "Las siglas son obligatorias.", 
                tipo: "Debe seleccionar un tipo de organismo.", 
                jurisdiccion: "Debe seleccionar una jurisdicción." 
            }
        };
    },

    getModFormSchema() {
        return {
            rules: { codigo: 'required|min:3', nombre: 'required|min:4', organismo: 'required', ubicacion: 'required' },
            messages: {
                codigo: "El código de módulo es requerido.",
                nombre: "El nombre del módulo es requerido.",
                organismo: "Debe seleccionar un organismo responsable.",
                ubicacion: "La ubicación física es requerida."
            }
        };
    },

    getCuadFormSchema() {
        return {
            rules: { codigo: 'required|min:2', nombre: 'required|min:4', modulo: 'required', territorio: 'required' },
            messages: {
                codigo: "El código del cuadrante es requerido.",
                nombre: "El nombre/alias del cuadrante es requerido.",
                modulo: "Debe seleccionar el módulo adscrito.",
                territorio: "Debe describir el territorio de cobertura."
            }
        };
    },

    validateField(htmlId) {
        let prefix = htmlId.split('_')[0];
        let field = htmlId.split('_')[1];
        let schema;

        switch(prefix) {
            case 'user': schema = this.getUserFormSchema(!document.getElementById('user_id')?.readOnly); break;
            case 'org': schema = this.getOrgFormSchema(); break;
            case 'mod': schema = this.getModFormSchema(); break;
            case 'cuad': schema = this.getCuadFormSchema(); break;
            default: return;
        }

        const { rules, messages } = schema;
        if (!rules[field]) return;

        const data = { [field]: document.getElementById(htmlId).value.trim() };
        const errors = Validator.validate(data, { [field]: rules[field] }, messages);
        
        const group = document.getElementById(htmlId).closest('.premium-group');
        if (errors) {
            group.classList.add('is-error');
            group.classList.remove('is-success');
            const helper = group.querySelector('.premium-helper-text');
            if (helper) helper.textContent = errors[field];
        } else {
            group.classList.remove('is-error');
            // Indica que la información es correcta (Req. Usuario)
            if (data[field] && data[field].length > 0) {
                group.classList.add('is-success');
            } else {
                group.classList.remove('is-success');
            }
        }
    },

    async handleSaveUser() {
        const idEl = document.getElementById('user_id');
        const isNewUser = idEl && !idEl.readOnly;
        const { rules, messages } = this.getUserFormSchema(isNewUser);

        const userData = {
            user: document.getElementById('user_id').value.trim(),
            nac: document.getElementById('user_nac').value,
            cedula: document.getElementById('user_cedula').value.trim(),
            nombres: document.getElementById('user_nombres').value.trim(),
            apellidos: document.getElementById('user_apellidos').value.trim(),
            email: document.getElementById('user_email').value.trim(),
            organismo: document.getElementById('user_org').value,
            cuadrante: document.getElementById('user_cuadrante').value,
            cargo: document.getElementById('user_cargo').value,
            role: document.getElementById('user_role').value,
            estado: document.getElementById('user_status').value,
            newPass: document.getElementById('user_pass').value.trim(),
            name: `${document.getElementById('user_nombres').value} ${document.getElementById('user_apellidos').value}`
        };

        // Data map for validator
        const validateData = {
            id: userData.user, cedula: userData.cedula, nombres: userData.nombres, 
            apellidos: userData.apellidos, email: userData.email, org: userData.organismo,
            cuadrante: userData.cuadrante, cargo: userData.cargo, role: userData.role,
            status: userData.estado, pass: userData.newPass,
            justificacion: document.getElementById('user_justificacion').value.trim(),
            jefe: document.getElementById('user_jefe')?.value || ''
        };
        userData.justificacion = validateData.justificacion;
        userData.jefe = validateData.jefe;

        // Nuevos campos de recursos
        userData.vehiculo = document.getElementById('user_vehiculo').value.trim();
        userData.moto = document.getElementById('user_moto').value.trim();
        userData.telefono = document.getElementById('user_telefono').value.trim();
        userData.horario = document.getElementById('user_horario').value.trim();

        const formErrors = Validator.validate(validateData, rules, messages);

        if (formErrors) {
            Validator.clearErrors('formUsuario', { groupClass: '.premium-group', errClass: 'premium-helper-text' });
            Validator.paintErrors(formErrors, {
                id: 'user_id', cedula: 'user_cedula', nombres: 'user_nombres',
                apellidos: 'user_apellidos', email: 'user_email', org: 'user_org', 
                cuadrante: 'user_cuadrante', cargo: 'user_cargo', role: 'user_role', 
                status: 'user_status', pass: 'user_pass', justificacion: 'user_justificacion',
                jefe: 'user_jefe'
            }, { groupClass: '.premium-group', errClass: 'premium-helper-text' });
            
            if(window.cupazToast) window.cupazToast("Por favor, revise los errores en el formulario", "error");
            return;
        }

        // Validación extendida de duplicados institucional
        if (isNewUser) {
           const allUsers = AdministracionService.getUsuarios();
           if (allUsers.some(u => u.cedula === userData.cedula)) {
               Validator.paintErrors({ cedula: 'Esta cédula ya existe en la base de datos' }, { cedula: 'user_cedula' }, { groupClass: '.premium-group', errClass: 'premium-helper-text' });
               return window.cupazToast("Cédula duplicada detectada", "error");
           }
           if (allUsers.some(u => u.email === userData.email)) {
               Validator.paintErrors({ email: 'Este correo electrónico ya está registrado' }, { email: 'user_email' }, { groupClass: '.premium-group', errClass: 'premium-helper-text' });
               return window.cupazToast("Correo electrónico duplicado", "error");
           }
           if (allUsers.some(u => u.user === userData.user)) {
               Validator.paintErrors({ id: 'El ID de usuario ya se encuentra en uso' }, { id: 'user_id' }, { groupClass: '.premium-group', errClass: 'premium-helper-text' });
               return window.cupazToast("ID de usuario duplicado", "error");
           }
        }

        if (!await this.validar2FA()) return;

        const res = AdministracionService.guardarUsuario(userData);
        if (res) {
            this.renderUsers();
            this.closeUserModal();
            window.cupazToast("Usuario guardado exitosamente", "success");
        }
    },

    async handleSaveConfig() {
        const config = {
            pass_expire: document.getElementById('cfg_pass_expire').value,
            pass_min: document.getElementById('cfg_pass_min').value
            // ... resto de campos
        };
        AdministracionService.actualizarParametros(config);
        window.cupazToast("Parámetros actualizados exitosamente", "success");
    },

    async handleSaveOrganismo() {
        const { rules, messages } = this.getOrgFormSchema();
        const data = {
            id: document.getElementById('formOrganismo').dataset.id || null,
            nombre: document.getElementById('org_nombre').value.trim(),
            siglas: document.getElementById('org_siglas').value.trim(),
            tipo: document.getElementById('org_tipo').value,
            jurisdiccion: document.getElementById('org_jurisdiccion').value
        };

        const errors = Validator.validateForm('formOrganismo', {
            nombre: 'org_nombre', siglas: 'org_siglas', tipo: 'org_tipo', jurisdiccion: 'org_jurisdiccion'
        }, rules, messages, { groupClass: '.premium-group', errClass: 'premium-helper-text' });

        if (errors) {
            window.cupazToast("Por favor, revise los errores en el formulario", "error");
            return;
        }

        if (!await this.validar2FA()) return;

        if (AdministracionService.guardarEntidad('organismos', data)) {
            this.renderOrganismos();
            this.closeModal('modalOrganismo');
            window.cupazToast(data.id ? "Organismo actualizado" : "Organismo registrado", "success");
        }
    },

    async handleSaveModulo() {
        const { rules, messages } = this.getModFormSchema();
        const orgId = document.getElementById('mod_organismo').value;
        const orgs = AdministracionService.getEntidad('organismos');
        const org = orgs.find(o => o.id == orgId);

        const data = {
            id: document.getElementById('formModulo').dataset.id || null,
            codigo: document.getElementById('mod_codigo').value.trim(),
            nombre: document.getElementById('mod_nombre').value.trim(),
            organismoId: orgId,
            organismoNombre: org ? org.siglas : '',
            ubicacion: document.getElementById('mod_ubicacion').value.trim()
        };

        const errors = Validator.validateForm('formModulo', {
            codigo: 'mod_codigo', nombre: 'mod_nombre', organismo: 'mod_organismo', ubicacion: 'mod_ubicacion'
        }, rules, messages, { groupClass: '.premium-group', errClass: 'premium-helper-text' });

        if (errors) {
            window.cupazToast("Por favor, revise los errores en el formulario", "error");
            return;
        }

        if (!await this.validar2FA()) return;

        if (AdministracionService.guardarEntidad('modulos', data)) {
            this.renderModulos();
            this.closeModal('modalModulo');
            window.cupazToast(data.id ? "Módulo actualizado" : "Módulo registrado", "success");
        }
    },

    async handleSaveCuadrante() {
        const { rules, messages } = this.getCuadFormSchema();
        const modId = document.getElementById('cuad_modulo').value;
        const mods = AdministracionService.getEntidad('modulos');
        const mod = mods.find(m => m.id == modId);

        const data = {
            id: document.getElementById('formCuadrante').dataset.id || null,
            codigo: document.getElementById('cuad_codigo').value.trim(),
            nombre: document.getElementById('cuad_nombre').value.trim(),
            moduloId: modId,
            moduloNombre: mod ? mod.nombre : '',
            territorio: document.getElementById('cuad_territorio').value.trim()
        };

        const errors = Validator.validateForm('formCuadrante', {
            codigo: 'cuad_codigo', nombre: 'cuad_nombre', modulo: 'cuad_modulo', territorio: 'cuad_territorio'
        }, rules, messages, { groupClass: '.premium-group', errClass: 'premium-helper-text' });

        if (errors) {
            window.cupazToast("Por favor, revise los errores en el formulario", "error");
            return;
        }

        if (!await this.validar2FA()) return;

        if (AdministracionService.guardarEntidad('cuadrantes', data)) {
            this.renderCuadrantes();
            this.closeModal('modalCuadrante');
            window.cupazToast(data.id ? "Cuadrante actualizado" : "Cuadrante registrado", "success");
        }
    },

    async toggleEntidadStatus(entidad, id) {
        if (!await this.validar2FA()) return;
        if (!await cupazConfirm("¿Desea cambiar el estado de este registro institucional?", "CONFIRMACIÓN")) return;

        if (AdministracionService.toggleEntidadStatus(entidad, id)) {
            if (entidad === 'organismos') this.renderOrganismos();
            else if (entidad === 'modulos') this.renderModulos();
            else if (entidad === 'cuadrantes') this.renderCuadrantes();
            window.cupazToast("Estado institucional actualizado", "success");
        }
    },

    async prepareEditEntidad(entidad, id) {
        if (!await this.validar2FA()) return;
        const data = AdministracionService.getEntidad(entidad).find(e => e.id == id);
        if (!data) return;

        if (entidad === 'organismos') {
            this._openModalDirectly('modalOrganismo'); // Evita re-validar 2FA si ya se hizo aquí
            this._populateOrganismoForm(data, id);
        } else if (entidad === 'modulos') {
            this._openModalDirectly('modalModulo');
            this._populateModuloForm(data, id);
        } else if (entidad === 'cuadrantes') {
            this._openModalDirectly('modalCuadrante');
            this._populateCuadranteForm(data, id);
        }

        document.querySelectorAll('.premium-input').forEach(i => {
            if (i.value) i.classList.add('has-value');
        });
    },

    // Métodos auxiliares para no duplicar 2FA cuando ya se validó en la entrada
    _openModalDirectly(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('active'), 10);
        }
    },

    _populateOrganismoForm(data, id) {
        document.getElementById('formOrganismo').reset();
        document.getElementById('formOrganismo').dataset.id = id;
        const meta = AdministracionService.getMetadata;
        Validator.renderSelectOptions('org_tipo', meta('organismo_tipos').map(t => ({v:t})), {value:'v', text:'v'}, 'Seleccione tipo...');
        Validator.renderSelectOptions('org_jurisdiccion', meta('jurisdicciones').map(j => ({v:j})), {value:'v', text:'v'}, 'Seleccione jurisdicción...');
        
        document.getElementById('org_nombre').value = data.nombre;
        document.getElementById('org_siglas').value = data.siglas;
        document.getElementById('org_tipo').value = data.tipo;
        document.getElementById('org_jurisdiccion').value = data.jurisdiccion;
    },

    _populateModuloForm(data, id) {
        const orgs = AdministracionService.getEntidad('organismos');
        Validator.renderSelectOptions('mod_organismo', orgs, {value:'id', text:(o) => `${o.nombre} (${o.siglas})`}, 'Seleccione Organismo...');
        document.getElementById('formModulo').reset();
        document.getElementById('formModulo').dataset.id = id;
        document.getElementById('mod_codigo').value = data.codigo;
        document.getElementById('mod_nombre').value = data.nombre;
        document.getElementById('mod_organismo').value = data.organismoId;
        document.getElementById('mod_ubicacion').value = data.ubicacion;
    },

    _populateCuadranteForm(data, id) {
        const mods = AdministracionService.getEntidad('modulos');
        Validator.renderSelectOptions('cuad_modulo', mods, {value:'id', text:(o) => `${o.nombre} (${o.codigo})`}, 'Seleccione Módulo...');
        document.getElementById('formCuadrante').reset();
        document.getElementById('formCuadrante').dataset.id = id;
        document.getElementById('cuad_codigo').value = data.codigo;
        document.getElementById('cuad_nombre').value = data.nombre;
        document.getElementById('cuad_modulo').value = data.moduloId;
        document.getElementById('cuad_territorio').value = data.territorio;
    },

    async handleDeleteEntidad(tipo, id) { // Renamed to avoid collision or clarify
        if (!await window.cupazConfirm(`¿Seguro que desea eliminar este registro de ${tipo}?`, "Advertencia")) return;
        
        if (AdministracionService.eliminarEntidad(tipo, id)) {
            if (tipo === 'organismos') this.renderOrganismos();
            if (tipo === 'modulos') this.renderModulos();
            if (tipo === 'cuadrantes') this.renderCuadrantes();
            window.cupazToast("Registro eliminado", "success");
        }
    },

    // --- NUEVAS FUNCIONES PARA CATEGORÍAS ---
    abrirModalCategoria(id = null) {
        document.getElementById('cat_id').value = '';
        document.getElementById('cat_nombre').value = '';
        document.getElementById('cat_script').value = '';
        document.getElementById('cat_id').readOnly = false;

        if (id) {
            const cats = AdministracionService.getCategorias();
            const c = cats.find(x => x.id === id);
            if (c) {
                document.getElementById('cat_id').value = c.id;
                document.getElementById('cat_id').readOnly = true;
                document.getElementById('cat_nombre').value = c.nombre;
                document.getElementById('cat_script').value = c.script;
            }
        }
        this.openModal('modalCategoria');
    },

    async handleSaveCategoria() {
        const id = document.getElementById('cat_id').value.trim().toUpperCase();
        const nombre = document.getElementById('cat_nombre').value.trim();
        const script = document.getElementById('cat_script').value.trim();

        if (!id || !nombre || !script) {
            return window.cupazToast("Todos los campos con * son obligatorios", "error");
        }

        const cats = AdministracionService.getCategorias();
        const index = cats.findIndex(c => c.id === id);
        
        if (index !== -1) {
            cats[index] = { id, nombre, script };
        } else {
            cats.push({ id, nombre, script });
        }

        AdministracionService.guardarCategorias(cats);
        this.closeModal('modalCategoria');
        this.renderParametros();
        window.cupazToast("Catálogo de naturalezas actualizado", "success");
        
        // Disparar evento para que otros módulos se enteren si es necesario
        window.dispatchEvent(new CustomEvent('cupaz_config_updated'));
    },

    async handleDeleteCategoria(id) {
        if (!await window.cupazConfirm("¿Seguro que desea eliminar esta naturaleza de incidente?", "ADVERTENCIA")) return;
        
        let cats = AdministracionService.getCategorias();
        cats = cats.filter(c => c.id !== id);
        
        AdministracionService.guardarCategorias(cats);
        this.renderParametros();
        window.cupazToast("Naturaleza eliminada", "success");
    }
};
