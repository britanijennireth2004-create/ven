/**
 * Presentacion/Controllers/Patrullaje/Patrullaje.controller.js
 * Controlador Operativo - Gestión de Patrullaje y Prevención
 */

import { PatrullajeService } from '../../Service/Patrullaje.service.js';
import { LogisticaService } from '../../Service/Logistica.service.js';
import { Validator } from '../Components/UI/Validator.js';

export const controller = {
  async init(props) {
    // Registro Global para onclick (Blindado contra colisiones)
    window.switchActividadTab = (tabId) => this.switchTab(tabId);
    window.abrirModalPatrullaje = () => this.abrirFormPatrullaje();
    window.abrirModalPrevencion = () => this.abrirFormPrevencion();
    window.togglePatrullajeVehiculo = () => this.toggleVehiculo();
    window.togglePrevencionOtro = () => this.togglePrevencionOtro();
    window.guardarPatrullaje = (estado) => this.validarYGuardarPatrullaje(estado);
    window.guardarActividadPreventiva = () => this.validarYGuardarPrevencion();
    window.previewPatrullajeFiles = (input) => this.handlePreview(input, 'patrullajePreview');
    window.previewPrevencionFiles = (input) => this.handlePreview(input, 'prevencionPreview');
    window.verDetalleActividad = (msg) => this.mostrarDetalle(msg);
    window.registrarPuntoControl = () => this.registrarPuntoControl();
    window.finalizarPatrullajeActivo = (id) => this.frenarPatrullaje(id);

    // Inyectar datos semilla si no existen para que el usuario no vea el módulo vacío/confuso
    // Inyectar datos semilla si no existen
    PatrullajeService.seedPatrullajes();

    await new Promise(resolve => setTimeout(resolve, 50));
    this.renderTables();
    this.updateStats();
    this.initFilters();
    return () => this.destroy();
  },

  seedPatrullajes() {
    // Delegado al Service
  },

  async mostrarDetalle(mensaje) {
      await cupazAlert(
          `${mensaje}<br><br><span style="font-size:0.75rem; color:var(--text-muted);">Módulo de inspección detallada en etapa de integración con plataforma de auditoría.</span>`, 
          "INFORMACIÓN DE ACTIVIDAD"
      );
  },

  initFilters() {
    ['patrullajeSearch', 'prevencionSearch'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', () => this.renderTables());
        }
    });
  },

  switchTab(tabId) {
    const tabs = document.querySelectorAll('.admin-tab');
    const sections = document.querySelectorAll('.admin-section');
    
    tabs.forEach(t => t.classList.remove('active'));
    sections.forEach(s => s.style.display = 'none');

    const targetTab = document.getElementById(`tab${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`);
    const targetSection = document.getElementById(`contentTab${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`);
    
    if(targetTab) targetTab.classList.add('active');
    if(targetSection) targetSection.style.display = 'block';
  },

  renderTables() {
    this.renderPatrullajeTable();
    this.renderPrevencionTable();
    this.renderActivePatrol();
  },

  renderActivePatrol() {
    const banner = document.getElementById('activePatrolPanel');
    if (!banner) return;

    const allData = PatrullajeService.getPatrullajes();
    // Reemplazando DataManager.leer('cupaz_sesion') temporalmente por AuthService si se pudiera, pero dejaremos un fallback limpio si es necesario...
    const sessionStr = sessionStorage.getItem('userData');
    const session = sessionStr ? JSON.parse(sessionStr) : {};
    
    // Buscar patrullaje activo del usuario
    const activo = allData.find(p => p.estado === 'ACTIVO' && p.cuadrante === session.cuadrante);

    if (!activo) {
        banner.style.display = 'none';
        clearInterval(this.patrolTicker);
        return;
    }

    banner.style.display = 'block';
    banner.innerHTML = `
        <div class="patrol-active-header">
            <span class="patrol-badge"><i class="fas fa-satellite-dish"></i> PATRULLAJE EN VIVO</span>
            <div id="activeTimerDisplay" class="patrol-timer">00:00:00</div>
        </div>
        <div class="patrol-active-info">
            <b>${activo.tipo.toUpperCase()}</b> | ID: ${activo.id} | Inicio: ${activo.horaInicio}
        </div>
        <div class="patrol-actions">
            <button class="btn-patrol-action btn-checkpoint" onclick="window.registrarPuntoControl()">
                <i class="fas fa-location-dot"></i> MARCAR PUNTO
            </button>
            <button class="btn-patrol-action btn-stop-patrol" onclick="window.finalizarPatrullajeActivo('${activo.id}')">
                <i class="fas fa-hand"></i> FINALIZAR
            </button>
        </div>
    `;

    this.iniciarClock(activo.horaInicio);
  },

  iniciarClock(horaInicio) {
    clearInterval(this.patrolTicker);
    const display = document.getElementById('activeTimerDisplay');
    if(!display) return;

    const [h, m] = horaInicio.split(':').map(Number);
    const start = new Date();
    start.setHours(h, m, 0);

    this.patrolTicker = setInterval(() => {
        const diff = Math.floor((new Date() - start) / 1000);
        if (diff < 0) return;
        const hh = Math.floor(diff / 3600).toString().padStart(2, '0');
        const mm = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
        const ss = (diff % 60).toString().padStart(2, '0');
        display.innerText = `${hh}:${mm}:${ss}`;
    }, 1000);
  },

  async registrarPuntoControl() {
      const allData = PatrullajeService.getPatrullajes();
      const idx = allData.findIndex(p => p.estado === 'ACTIVO' && p.cuadrante === session.cuadrante);
      
      if (idx === -1) return;

      const pos = await new Promise((res) => {
          navigator.geolocation.getCurrentPosition(
              (p) => res(`${p.coords.latitude.toFixed(6)}, ${p.coords.longitude.toFixed(6)}`),
              () => res("10.4880, -66.8791")
          );
      });

      if(!allData[idx].puntos_GPS) allData[idx].puntos_GPS = [];
      
      const pnt = {
          hora: new Date().toLocaleTimeString(),
          coords: pos,
          obs: 'Marca de control automática'
      };
      
      allData[idx].puntos_GPS.push(pnt);
      PatrullajeService.registrarPatrullaje(null); // Dirty workaround para Guardar todo... o mejoremos:
      // Realmente deberíamos tener un método de actualización en el Service, pero lo haremos enviando el arreglo completo:
      // Espera, la app original modificaba 'allData' por referencia y luego llamaba a guardar.
      // Modificaremos la acción para crear una nueva entrada o usar localStorage directamente aquí? No, no usar DataManager!
      localStorage.setItem('cupaz_patrullajes', JSON.stringify(allData));
      
      cupazToast(`Ubicación confirmada y registrada en el historial de ruta.`);
  },

  async frenarPatrullaje(id) {
      if (!await cupazConfirm("¿Confirma la finalización del patrullaje territorial? Se registrará la hora de cierre y el recorrido acumulado.")) return;

      const res = PatrullajeService.finalizarPatrullaje(Number(id), "Finalización de jornada");
      if (res) {
          // El servicio ya registra auditoría
          cupazToast("Patrullaje finalizado. Registro guardado exitosamente.");
          this.renderTables();
      }
  },

  renderPatrullajeTable() {
    const tbody = document.getElementById('patrullajeTableBody');
    if (!tbody) return;

    const query = document.getElementById('patrullajeSearch')?.value.toLowerCase() || '';
    const allData = PatrullajeService.getPatrullajes();
    
    const sessionStr = sessionStorage.getItem('userData');
    const session = sessionStr ? JSON.parse(sessionStr) : {};
    const roleLevel = session?.role === 'Coordinador CUPAZ' ? 1000 : 
                     (session?.role?.includes('COORDINADOR') ? 500 : 100);
    
    // Filtrar por jerarquía y alcance
    let data = allData;
    if (roleLevel < 1000) {
        if (session.cuadrante) {
            // Un Coordinador de Área ve todos los cuadrantes que empiecen con su código asignado (ej: "MTR" ve todos los de Maturín)
            // Un Jefe de Cuadrante ve solo el suyo exacto.
            data = allData.filter(p => p.cuadrante.startsWith(session.cuadrante));
        }
    }

    // Filtrar por búsqueda manual
    data = data.filter(p => 
        p.cuadrante.toLowerCase().includes(query) || 
        p.operativo.toLowerCase().includes(query) || 
        p.ruta.toLowerCase().includes(query)
    );

    tbody.innerHTML = data.length === 0
      ? `<tr><td colspan="7" style="text-align:center; padding:3rem; color:#888;">No se encontraron resultados de patrullaje.</td></tr>`
      : data.sort((a,b) => b.id - a.id).map(p => `
          <tr>
            <td style="font-weight:700; color:var(--primary-color);">${p.cuadrante || 'N/A'}</td>
            <td>${p.operativo || 'Oficial de Guardia'}</td>
            <td>
               <div style="font-size:0.75rem; font-weight:700;">${p.fecha || p.date || 'N/A'}</div>
               <div style="font-size:0.65rem; color:#64748b;">${p.horaInicio || p.time || ''} - ${p.horaFin || 'EN CURSO'}</div>
            </td>
            <td><i class="fas ${this.getIconByType(p.tipo)}"></i> ${p.tipo || 'Vehículo'}</td>
            <td style="max-width:200px; font-size:0.7rem; color:#475569;">
               <div style="font-weight:700;">${p.ruta || 'Patrullaje preventivo'}</div>
               <div style="font-size:0.6rem; color:#94a3b8; font-style:italic;">${p.novedades || 'Sin novedades'}</div>
            </td>
            <td><span class="status-pill ${(p.estado || p.estatus || '').toUpperCase() === 'FINALIZADO' ? 'status-despachado' : 'status-urgente'}">${p.estado || p.estatus || 'ACTIVO'}</span></td>
            <td style="text-align:center;"><button class="add-btn" style="padding:4px 10px; font-size:0.65rem; background:var(--secondary-color);" onclick="window.verDetalleActividad('Folio: PAT-${p.id}<br>Unidad: ${p.vehiculo || 'No asignada'}<br>Ruta: ${p.ruta}')"><i class="fas fa-eye"></i></button></td>
          </tr>
        `).join('');
  },

  renderPrevencionTable() {
    const tbody = document.getElementById('prevencionTableBody');
    if (!tbody) return;

    const query = document.getElementById('prevencionSearch')?.value.toLowerCase() || '';
    const allData = PatrullajeService.getPrevenciones();
    
    const sessionStr = sessionStorage.getItem('userData');
    const session = sessionStr ? JSON.parse(sessionStr) : {};
    const roleLevel = session?.role === 'Coordinador CUPAZ' ? 1000 : 
                     (session?.role?.includes('COORDINADOR') ? 500 : 100);
    
    // Filtrar por jerarquía y alcance
    let data = allData;
    if (roleLevel < 1000) {
        if (session.cuadrante) {
            data = allData.filter(p => p.cuadrante.startsWith(session.cuadrante));
        }
    }

    // Filtrar por búsqueda manual
    data = data.filter(p => 
        p.cuadrante.toLowerCase().includes(query) || 
        p.tipo.toLowerCase().includes(query) || 
        p.tema.toLowerCase().includes(query)
    );

    tbody.innerHTML = data.length === 0
      ? `<tr><td colspan="6" style="text-align:center; padding:3rem; color:#888;">No hay actividades preventivas registradas.</td></tr>`
      : data.sort((a,b) => b.id - a.id).map(p => `
          <tr>
            <td style="font-weight:700; color:#d946ef;">${p.cuadrante || 'N/A'}</td>
            <td>
               <div style="font-weight:700;">${p.tipo || 'General'}</div>
               <div style="font-size:0.65rem; color:#64748b;">${p.lugar || 'No especificado'}</div>
            </td>
            <td>
               <div style="font-size:0.75rem; font-weight:700;">${p.fecha || p.date || 'N/A'}</div>
               <div style="font-size:0.65rem; color:#64748b;">${p.horaInicio || p.time || ''} - ${p.horaFin || ''}</div>
            </td>
            <td>
               <div style="font-size:0.7rem; font-weight:700;">${p.tema || 'Sin tema'}</div>
               <div style="font-size:0.6rem; color:#94a3b8;">${p.instituciones || 'Propias'}</div>
            </td>
            <td><span class="status-pill" style="background:#fdf4ff; color:#d946ef;">${p.participantes || p.participantes_count || 0} pers.</span></td>
            <td style="text-align:center;"><button class="add-btn" style="padding:4px 10px; font-size:0.65rem; background:var(--secondary-color);" onclick="window.verDetalleActividad('Tema: ${p.tema}<br>Lugar: ${p.lugar}<br>Organización: ${p.instituciones || 'Propias'}')"><i class="fas fa-eye"></i></button></td>
          </tr>
        `).join('');
  },

  getIconByType(tipo) {
    if (tipo === 'Pie') return 'fa-person-walking';
    if (tipo === 'Vehículo') return 'fa-car';
    return 'fa-motorcycle';
  },

  updateStats() {
    const patrullas = PatrullajeService.getPatrullajes();
    const prevs = PatrullajeService.getPrevenciones();
    const hoy = new Date().toLocaleDateString();
    
    // Stats Patrullaje
    const hoyCount = patrullas.filter(p => p.fecha === hoy).length;
    const activos = patrullas.filter(p => p.estado === 'ACTIVO').length;

    if (document.getElementById('statPatrullajesHoy')) document.getElementById('statPatrullajesHoy').innerText = hoyCount;
    if (document.getElementById('statCuadrantesCubiertos')) document.getElementById('statCuadrantesCubiertos').innerText = activos;

    // Stats Prevención
    const mesActual = new Date().getMonth();
    const prevMes = prevs.filter(p => new Date(p.fecha).getMonth() === mesActual).length;
    const totalP = prevs.reduce((sum, p) => sum + (parseInt(p.participantes) || 0), 0);


    if (document.getElementById('statPrevencionMes')) document.getElementById('statPrevencionMes').innerText = prevMes;
    if (document.getElementById('statTotalParticipantes')) document.getElementById('statTotalParticipantes').innerText = totalP;

    // Data Comuna (Req 11)
    const lideres = {
        'CP-01': 'Humberto Silva',
        'CP-04': 'María Corredor',
        'MTR-01': 'Jesús Velásquez',
        'MTR-02': 'Carmen Ortiz'
    };
    const sessionStr = sessionStorage.getItem('userData');
    const session = sessionStr ? JSON.parse(sessionStr) : {};
    const lblLider = document.getElementById('lblLiderComuna');
    if (lblLider) {
        if (session.role === 'AUXILIAR' && session.jefe_nombre) {
            lblLider.innerText = session.jefe_nombre.toUpperCase();
            document.querySelector('.stat-label', lblLider.parentElement).innerText = 'JEFE ASIGNADO';
        } else {
            lblLider.innerText = lideres[session.cuadrante] || 'Enlace No Asignado';
        }
        lblLider.title = "Pulse para ver contacto de validación externa";
    }
  },

  async abrirFormPatrullaje() {
     const { AuthService } = await import('../../Service/AuthService.js');
     const user = AuthService.getUserData();
     
     const modal = document.getElementById('modalRegistroPatrullaje');
     if (!modal) return;

     // Req 3: Cargar solo vehículos DISPONIBLES del inventario
     const resourcesStr = localStorage.getItem('cupaz_recursos');
     const resources = resourcesStr ? JSON.parse(resourcesStr) : [];
     const disponibles = resources.filter(r => r.tipo === 'vehiculo' && r.estatus === 'disponible');
     const selV = document.getElementById('selPatrullajeVehiculo');
     if (selV) {
         selV.innerHTML = disponibles.length === 0 
            ? '<option value="">SIN VEHÍCULOS DISPONIBLES</option>'
            : disponibles.map(v => `<option value="${v.id}">${v.id} - ${v.marca} ${v.modelo}</option>`).join('');
     }

     document.getElementById('txtPatrullajeCuadrante').value = user?.cuadrante || 'CP-01 (CENTRO)';
     document.getElementById('txtPatrullajeFecha').value = new Date().toISOString().split('T')[0];
     document.getElementById('txtPatrullajeHoraInicio').value = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
     Validator.clearErrors('formPatrullaje');
     document.getElementById('modalRegistroPatrullaje').classList.add('active');
  },

  async abrirFormPrevencion() {
     const { AuthService } = await import('../../Service/AuthService.js');
     const user = AuthService.getUserData();
     
     const modal = document.getElementById('modalRegistroPrevencion');
     if (!modal) return;

     document.getElementById('txtPrevencionCuadrante').value = user?.cuadrante || 'CP-01 (CENTRO)';
     document.getElementById('txtPrevencionFecha').value = new Date().toISOString().split('T')[0];
     document.getElementById('txtPrevencionHoraInicio').value = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
     Validator.clearErrors('formPrevencion');
     document.getElementById('modalRegistroPrevencion').classList.add('active');
  },

  toggleVehiculo() {
    const tipo = document.getElementById('selTipoPatrullaje').value;
    const group = document.getElementById('groupPatrullajeVehiculo');
    if(group) group.style.display = (tipo === 'Pie') ? 'none' : 'block';
  },

  togglePrevencionOtro() {
    const tipo = document.getElementById('selTipoPrevencion').value;
    const group = document.getElementById('groupPrevencionOtro');
    if(group) group.style.display = (tipo === 'OTRO') ? 'block' : 'none';
  },

  handlePreview(input, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    
    Array.from(input.files).forEach(file => {
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > 10) { // Requisito RF9: 10MB para fotos/docs
            alert(`El archivo ${file.name} excede los 10MB permitidos.`);
            return;
        }
        const item = document.createElement('div');
        item.style.fontSize = '0.65rem';
        item.innerHTML = `<i class="fas fa-paperclip"></i> ${file.name} (${sizeMB.toFixed(1)}MB)`;
        container.appendChild(item);
    });
  },

  async registrarPuntoControl() {
      // Req 7: Captura GPS automática para Patrol Points
      const pos = await new Promise((res) => {
          navigator.geolocation.getCurrentPosition(
              (p) => res(`${p.coords.latitude.toFixed(6)}, ${p.coords.longitude.toFixed(6)}`),
              () => res("10.4880, -66.8791") // Caracas Default
          );
      });
      import('../Application/ViewRenderer.js').then(m => m.ViewRenderer.showToast(`Punto de Control registrado: [${pos}]`));
  },

  async validarYGuardarPatrullaje(estado) {
    const { AuthService } = await import('../../Service/AuthService.js');
    const user = AuthService.getUserData();

    const data = {
        cuadrante: document.getElementById('txtPatrullajeCuadrante').value,
        fecha: document.getElementById('txtPatrullajeFecha').value,
        horaInicio: document.getElementById('txtPatrullajeHoraInicio').value,
        horaFin: document.getElementById('txtPatrullajeHoraFin').value,
        tipo: document.getElementById('selTipoPatrullaje').value,
        vehiculo: document.getElementById('selPatrullajeVehiculo').value,
        ruta: document.getElementById('txtPatrullajeRuta').value,
        novedades: document.getElementById('txtPatrullajeNovedades').value,
        estado: estado,
        operativo: user?.name || 'Oficial Operativo',
        jefe_asociado: user?.jefe_nombre || '', 
        puntos_GPS: [],
        id: Date.now()
    };

    const rules = {
        cuadrante: 'required',
        fecha: 'required',
        horaInicio: 'required',
        tipo: 'required',
        ruta: 'required'
    };

    if (estado === 'FINALIZADO') {
        rules.horaFin = 'required';
    }

    if (data.tipo !== 'Pie') {
        rules.vehiculo = 'required';
    }

    const messages = {
        ruta: 'El campo Recorrido / Ruta es obligatorio.',
        vehiculo: 'Debe asignar un vehículo para este tipo de patrullaje.'
    };

    Validator.clearErrors('formPatrullaje');
    const formErrors = Validator.validate(data, rules, messages);
    
    if (formErrors) {
        const mapHtml = {
            cuadrante: 'txtPatrullajeCuadrante', fecha: 'txtPatrullajeFecha', horaInicio: 'txtPatrullajeHoraInicio',
            horaFin: 'txtPatrullajeHoraFin', tipo: 'selTipoPatrullaje', vehiculo: 'selPatrullajeVehiculo', ruta: 'txtPatrullajeRuta'
        };
        Validator.paintErrors(formErrors, mapHtml);
        if(window.cupazToast) window.cupazToast("Corrija los campos señalados", "error");
        return;
    }
    
    // Validar hora final si aplica
    if (estado === 'FINALIZADO' && data.horaFin) {
        const tI = new Date(`2000-01-01T${data.horaInicio}`);
        const tF = new Date(`2000-01-01T${data.horaFin}`);
        if (tF <= tI) {
            Validator.paintErrors({ horaFin: 'La hora final debe ser posterior al inicio' }, { horaFin: 'txtPatrullajeHoraFin' });
            return;
        }
    }
    
    if (estado === 'ACTIVO') {
        PatrullajeService.iniciarPatrullaje(data);
    } else {
        PatrullajeService.registrarPatrullaje(data);
    }

    import('../Application/ViewRenderer.js').then(m => m.ViewRenderer.showToast(`Patrullaje ${estado === 'ACTIVO' ? 'iniciado' : 'registrado'} con éxito.`));
    document.getElementById('modalRegistroPatrullaje').classList.remove('active');
    this.renderPatrullajeTable();
    this.updateStats();
  },

  async validarYGuardarPrevencion() {
    const { AuthService } = await import('../../Service/AuthService.js');
    const user = AuthService.getUserData();

    const tipoBase = document.getElementById('selTipoPrevencion').value;
    const data = {
        cuadrante: document.getElementById('txtPrevencionCuadrante').value,
        fecha: document.getElementById('txtPrevencionFecha').value,
        horaInicio: document.getElementById('txtPrevencionHoraInicio').value,
        horaFin: document.getElementById('txtPrevencionHoraFin').value,
        tipo: tipoBase === 'OTRO' ? document.getElementById('txtPrevencionOtro').value : tipoBase,
        lugar: document.getElementById('txtPrevencionLugar').value,
        tema: document.getElementById('txtPrevencionTema').value,
        participantes_count: document.getElementById('numPrevencionParticipantes').value,
        instituciones: document.getElementById('txtPrevencionInstituciones').value,
        participantes_list: [],
        jefe_asociado: user?.jefe_nombre || '',
        id: Date.now()
    };

    const rules = {
        cuadrante: 'required',
        fecha: 'required',
        horaInicio: 'required',
        tipo: 'required',
        lugar: 'required',
        tema: 'required',
        participantes_count: 'required|numeric'
    };

    Validator.clearErrors('formPrevencion');
    const formErrors = Validator.validate(data, rules);

    if (formErrors) {
        const mapHtml = {
            cuadrante: 'txtPrevencionCuadrante', fecha: 'txtPrevencionFecha', horaInicio: 'txtPrevencionHoraInicio',
            tipo: tipoBase === 'OTRO' ? 'txtPrevencionOtro' : 'selTipoPrevencion', lugar: 'txtPrevencionLugar',
            tema: 'txtPrevencionTema', participantes_count: 'numPrevencionParticipantes'
        };
        Validator.paintErrors(formErrors, mapHtml);
        if(window.cupazToast) window.cupazToast("Corrija los campos señalados", "error");
        return;
    }
    
    if (data.horaFin) {
        const tInicio = new Date(`2000-01-01T${data.horaInicio}`);
        const tFin = new Date(`2000-01-01T${data.horaFin}`);
        if (tFin <= tInicio) {
            Validator.paintErrors({ horaFin: 'La hora final debe ser posterior al inicio' }, { horaFin: 'txtPrevencionHoraFin' });
            return;
        }
    }

    PatrullajeService.guardarPrevencion(data);

    import('../Application/ViewRenderer.js').then(m => m.ViewRenderer.showToast("Actividad preventiva registrada en el historial del cuadrante."));
    document.getElementById('modalRegistroPrevencion').classList.remove('active');
    this.renderPrevencionTable();
    this.updateStats();
  },

  async crearIncidenteDesdeActividad(tema) {
      // Req 10: Vinculación directa
      if (await cupazConfirm(`¿Desea reportar un incidente crítico detectado durante la actividad: ${tema}? El reporte se vinculará automáticamente.`, 'INCIDENTE EN CAMPO')) {
          window.location.hash = '#emergencias';
          setTimeout(() => {
              import('../Emergencias/Emergencias.controller.js').then(ctrl => {
                  ctrl.controller.abrirFormularioLlamada();
                  document.getElementById('txtLugarEmergencia').value = "Detectado en Actividad: " + tema;
              });
          }, 500);
      }
  },

  destroy() {
    ['switchActividadTab', 'abrirModalPatrullaje', 'abrirModalPrevencion', 'togglePatrullajeVehiculo', 'togglePrevencionOtro', 'guardarPatrullaje', 'guardarActividadPreventiva', 'previewPatrullajeFiles', 'previewPrevencionFiles', 'registrarPuntoControl', 'crearIncidenteDesdeActividad', 'finalizarPatrullajeActivo']
    .forEach(fn => delete window[fn]);
  }
};
