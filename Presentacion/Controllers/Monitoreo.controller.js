/**
 * Presentacion/Controllers/Monitoreo/Monitoreo.controller.js
 * Controlador del Módulo 3 - Seguimiento, Cierre y Evidencias (CU-12, CU-14, CU-16)
 */

import { DataManager } from '../../Persistencia/localStorage.js';
import { AuthService } from '../../Service/AuthService.js';
import { MonitoreoService } from '../../Service/Monitoreo.service.js';
import { AuditService } from '../../Service/AuditService.js';

export const controller = {
  map: null,
  layerGroup: null,
  unitMarkers: {},
  isDestroyed: false,
  refreshInterval: null,

  async init(props) {
    this.isDestroyed = false;
    // Registro de funciones globales (AESTHETIC & ARCHITECTURE)
    window.openSeguimientoModal = (folio) => this.openSeguimientoModal(folio);
    window.verDetalleIncidente = (folio) => this.mostrarDetalleFull(folio);
    window.marcarLlegadaManual = () => this.abrirModalLlegada();
    window.confirmarLlegadaEscena = () => this.confirmarLlegadaFinal();
    window.actualizarEstadoInc = () => this.procesarCambioEstado();
    window.switchSeguimientoTab = (tabId) => this.switchTab(tabId);
    window.abrirModalCargaEvidencia = () => this.abrirModalEvidencia();
    window.previewEvidencia = (input) => this.handlePreview(input);
    window.guardarEvidenciaFinal = () => this.registrarEvidencia();
    window.toggleEvidenciaSource = () => this.ajustarInputCaptura();
    window.setEffectiveness = (val) => this.setEffectiveness(val);
    window.ejecutarCierreInstitucional = () => this.ejecutarCierreInstitucional();
    window.abrirModalCierre = () => this.abrirModalCierre();

    // Coordinación Interinstitucional (Req 5, 11)
    window.toggleOrgCoord = (org) => this.actualizarBadgeOrg(org);
    window.notificarOrganismos = () => this.ejecutarNotificacionMulti();
    window.enviarMensajeCoord = () => this.postearMensajeChat();
    window.solicitarRefuerzoCoord = () => this.procesarRefuerzo();

    // Funciones del Mapa (Req 4, 6)
    window.mapZoomIn = () => this.handleZoom(1);
    window.mapZoomOut = () => this.handleZoom(-1);
    window.mapCenter = (id) => this.centerMap(id);
    window.showMarkerInfo = (type, id) => this.displayMarkerTooltip(type, id);

    this.activeMarkers = { incidents: true, units: true, quadrants: true };

    await new Promise(resolve => setTimeout(resolve, 50));
    if (this.isDestroyed) return;

    this.refreshAll();
    this.initEvents();
    this.checkAutoCoordination(); // Req B.1: Activación automática de protocolos

    // Req A.4: Auditoría de acceso al Centro de Monitoreo
    const { AuditService } = await import('../../Service/AuditService.js');
    AuditService.registrar('ACCESO_MONITOREO', 'El usuario ha ingresado al visor táctico en tiempo real.', 'EXITOSO');

    this.refreshInterval = setInterval(() => {
        if (this.isDestroyed) {
            clearInterval(this.refreshInterval);
            return;
        }
        this.refreshAll();
        this.checkPriorityAlerts(); // Req A.8: Alertas sonoras de prioridad alta
    }, 12000); // Req A.1: Actualización cada 12s (Rango 10-15s)
    
    return () => this.destroy();
  },

  checkPriorityAlerts() {
    const session = DataManager.leer('cupaz_sesion');
    const role = session?.role;
    const isJefe = role === 'JEFE DE CUADRANTE' || role === 'AUXILIAR DE CUADRANTE';
    
    const incidentes = MonitoreoService.getIncidentes();
    
    // Alerta General para Mandos
    const criticos = incidentes.filter(i => i.prioridad === 'ALTA' && i.estatus === 'RECEPCIONADO');
    
    // Alerta Específica para Jefe de Cuadrante (RN-NOT-01)
    const misIncidentes = isJefe && session.cuadrante ? 
        incidentes.filter(i => i.cuadrante === session.cuadrante && i.estatus === 'RECEPCIONADO') : [];

    if (misIncidentes.length > 0) {
        new Audio('/Assets/sounds/dispatch_alert.mp3').play().catch(() => {});
        import('../Application/ViewRenderer.js').then(v => {
            v.ViewRenderer.showToast(`[NUEVA ASIGNACIÓN] Tienes ${misIncidentes.length} incidencias reportadas en tu cuadrante (${session.cuadrante}). Procede con la atención.`);
        });
    } else if (criticos.length > 0 && !isJefe) {
        new Audio('/Assets/sounds/priority_alert.mp3').play().catch(() => {});
        import('../Application/ViewRenderer.js').then(v => {
            v.ViewRenderer.showToast(`[ALERTA CRÍTICA] Se han detectado ${criticos.length} nuevos incidentes de prioridad ALTA en el sistema.`);
        });
    }
  },

  checkAutoCoordination() {
    const incidentes = DataManager.leer('cupaz_incidentes') || [];
    const mayores = ['Incendio Estructural', 'Accidente de Tránsito Múltiple', 'Desastre Natural'];
    
    const pendientes = incidentes.filter(i => mayores.includes(i.naturaleza) && i.estatus === 'EN DESPACHO');
    if (pendientes.length > 0) {
        import('../Application/ViewRenderer.js').then(v => {
            v.ViewRenderer.showToast(`[COORDINACIÓN AUTOMÁTICA] Evento mayor detectado (${pendientes[0].naturaleza}). Sugiriendo activación de protocolos multi-agenciales.`);
        });
    }
  },

  refreshAll() {
    this.renderTable();
    this.renderUnitsList();
    this.updateDashboardStats();
    this.refreshMap();
  },

  renderTable() {
    const tbody = document.getElementById('monitoreoTableBody');
    if (!tbody) return;

    const query = document.getElementById('monitoreoSearch')?.value || '';
    const session = DataManager.leer('cupaz_sesion');
    
    // DELEGAR Lógica de Filtrado al SERVICIO (Req P-C-S)
    const filtrados = MonitoreoService.getIncidentesActivos(query, session);

    tbody.innerHTML = filtrados.length === 0 
      ? `<tr><td colspan="5" class="u-empty-state">No hay operaciones activas</td></tr>`
      : filtrados.map(i => `
          <tr class="inc-row-${(i.prioridad || 'GENERAL').toLowerCase()}">
            <td class="u-text-bold u-text-primary">${i.folio || i.id || 'N/A'}</td>
            <td>
                <div class="u-text-bold u-text-sm">${i.fecha || i.date || 'N/A'}</div>
                <div class="u-text-muted u-text-xs">${i.hora_inicio || i.time || ''}</div>
            </td>
            <td>
                <div class="u-text-bold u-text-sm">${(i.naturaleza || 'General').toUpperCase()}</div>
                <div class="u-text-muted u-text-xs">${i.ubicacion?.cuadrante || i.cuadrante || 'N/A'}</div>
            </td>
            <td class="u-text-center">
                <span class="prio-tag prio-${(i.prioridad || 'media').toLowerCase()}">
                    ${i.prioridad || 'MEDIA'}
                </span>
            </td>
            <td class="u-text-center">
              <span class="status-pill status-${(i.estatus || i.status || 'abierto').toLowerCase().replace(' ', '-')} u-text-xs">
                ${i.estatus || i.status || 'ABIERTO'}
              </span>
            </td>
            <td class="u-text-center">
              <div style="display:flex; gap:5px; justify-content:center;">
                <button class="add-btn u-btn-mini" style="background:var(--primary-color);" 
                  onclick="window.verDetalleIncidente('${i.folio || i.id}')" title="Ver Detalles Completos">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="add-btn u-btn-mini" style="background:var(--secondary-color);" 
                  onclick="window.openSeguimientoModal('${i.folio || i.id}')" title="Gestión y Seguimiento">
                  <i class="fas fa-tasks"></i>
                </button>
              </div>
            </td>
          </tr>
        `).join('');
  },

  renderUnitsList() {
    const panel = document.getElementById('unitsPanel');
    if (!panel) return;

    const session = DataManager.leer('cupaz_sesion');
    // DELEGAR Lógica de Filtrado al SERVICIO (Req P-C-S)
    const enServicio = MonitoreoService.getRecursosDesplegados(session);
    
    const now = Date.now();
    const FIVE_MINUTES = 5 * 60 * 1000;

    panel.innerHTML = enServicio.length === 0
      ? `<div class="u-empty-state">No hay unidades desplegadas.</div>`
      : enServicio.map(r => {
          // Req A.7: Chequeo de vitalidad de señal GPS
          const lastUpdate = r.last_gps_update ? new Date(r.last_gps_update).getTime() : (now - (Math.random() * 8 * 60 * 1000));
          const sinSenal = (now - lastUpdate) > FIVE_MINUTES;
          
          return `
            <div class="monitor-unit-card ${sinSenal ? 'signal-lost-alert' : ''}" onclick="window.mapCenter('${r.id}')">
               <div class="unit-icon-box ${(r.estatus || '').toLowerCase() === 'en intervencion' ? 'pulse-alert' : ''}">
                  <i class="fas ${sinSenal ? 'fa-satellite-dish-slash' : this.getIconForUnit(r.tipo)}"></i>
               </div>
               <div class="unit-details">
                  <div class="u-row"><b>${r.id}</b> <span class="u-tag ${(r.estatus || '').toLowerCase().replace(/ /g, '-')}">${r.estatus}</span></div>
                  <div class="u-sub">${r.organismo} | CUADRANTE: ${r.cuadrante || 'S/N'}</div>
                  ${sinSenal ? '<div class="u-alert-text"><i class="fas fa-exclamation-triangle"></i> SIN SEÑAL > 5 MIN</div>' : ''}
               </div>
               <div class="unit-signal">
                  <i class="fas fa-signal ${sinSenal ? 'u-text-red' : 'u-text-green'}"></i>
               </div>
            </div>
          `;
        }).join('');
  },

  getIconForUnit(tipo) {
     if (tipo?.includes('MOTO')) return 'fa-motorcycle';
     if (tipo?.includes('AMB')) return 'fa-ambulance';
     return 'fa-car';
  },

  updateDashboardStats() {
    const session = DataManager.leer('cupaz_sesion');
    const activos = MonitoreoService.getIncidentesActivos('', session).length;
    const desplegadas = MonitoreoService.getRecursosDesplegados(session).length;

    if (document.getElementById('statMonIncActivos')) document.getElementById('statMonIncActivos').innerText = activos;
    if (document.getElementById('statMonUniDesplegadas')) document.getElementById('statMonUniDesplegadas').innerText = desplegadas;
    if (document.getElementById('statMonTiemposR')) document.getElementById('statMonTiemposR').innerText = "08:24"; // Simulado
  },

  refreshMap() {
    const mapContainer = document.getElementById('tacticalMap');
    if (!mapContainer || this.isDestroyed) return;
    
    // Si el contenedor no tiene dimensiones (está oculto o removido), no procesar Leaflet
    if (mapContainer.offsetWidth === 0) return;

    // Simulación de carga Táctica (RF8.1)
    const loader = document.getElementById('mapLoading');
    if (loader && !this.isDestroyed) {
        loader.style.display = 'flex';
        setTimeout(() => { if (loader && !this.isDestroyed) loader.style.display = 'none'; }, 600);
    }

    // Inicializar Motor Geoespacial Leaflet si no existe
    if (!this.map && !this.isDestroyed) {
        try {
            this.map = L.map('tacticalMap', { 
                zoomControl: false, 
                attributionControl: false,
                scrollWheelZoom: true 
            }).setView([9.735, -63.185], 13);
            
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: 'Sistema de Inteligencia Territorial CUPAZ'
            }).addTo(this.map);
            
            L.control.zoom({ position: 'bottomright' }).addTo(this.map);
            this.layerGroup = L.layerGroup().addTo(this.map);
        } catch (e) {
            console.warn("Leaflet Monitoreo init error:", e);
            return;
        }
    }

    // Forzar recálculo de dimensiones
    setTimeout(() => { if (this.map && !this.isDestroyed) this.map.invalidateSize(); }, 100);

    if (this.isDestroyed || !this.layerGroup) return;
    this.layerGroup.clearLayers();
    this.unitMarkers = {}; // Reiniciar mapa de marcadores de unidades

    const session = DataManager.leer('cupaz_sesion');

    // POI: Infraestructura Clave Institucional
    const pois = [
        { lat: 9.740, lng: -63.188, icon: 'fa-hospital', label: 'H. Central', color: '#3b82f6' },
        { lat: 9.745, lng: -63.175, icon: 'fa-building-shield', label: 'Comando Regional', color: '#1e293b' },
        { lat: 9.730, lng: -63.190, icon: 'fa-shield-alt', label: 'Módulo', color: '#1e293b' }
    ];
    
    pois.forEach(p => {
        const colorClass = p.color === '#3b82f6' ? 'marker-color-blue' : 'marker-color-slate';
        const icon = L.divIcon({
            html: `<div class="marker-poi-base u-flex-center ${colorClass} u-icon-poi"><i class="fas ${p.icon}"></i></div>`,
            className: 'custom-leaflet-icon',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
        });
        L.marker([p.lat, p.lng], {icon}).addTo(this.layerGroup).bindPopup(`<b>${p.label}</b><br>Infraestructura Estratégica`);
    });

    // Renderizar Incidentes Activos con coordenadas reales
    const activos = MonitoreoService.getIncidentesActivos('', session);
    
    activos.forEach(i => {
        let lat = 9.735, lng = -63.185;
        if (i.ubicacion && i.ubicacion.coordenadas) {
            const coords = i.ubicacion.coordenadas.split(',');
            if (coords.length === 2) {
                lat = parseFloat(coords[0].trim());
                lng = parseFloat(coords[1].trim());
            }
        }
        
        const colorClass = i.prioridad === 'ALTA' || i.prioridad === 'CRÍTICA' ? 'marker-color-red' : (i.prioridad === 'MEDIA' ? 'marker-color-orange' : 'marker-color-green');
        const color = i.prioridad === 'ALTA' || i.prioridad === 'CRÍTICA' ? '#ef4444' : (i.prioridad === 'MEDIA' ? '#f59e0b' : '#22c55e');
        const pulseClass = i.prioridad === 'ALTA' || i.prioridad === 'CRÍTICA' ? 'pulse-high' : '';

        const icon = L.divIcon({
            html: `<div class="map-marker inc-marker ${pulseClass} marker-inc-base ${colorClass}"><i class="fas fa-exclamation-triangle"></i><div class="marker-label-floating">${i.folio}</div></div>`,
            className: 'custom-leaflet-icon',
            iconSize: [35, 35],
            iconAnchor: [17, 35]
        });
        
        const content = `<b>INCIDENTE: ${i.folio}</b><br>${i.naturaleza}<br>Prioridad: <span style="color:${color};font-weight:bold">${i.prioridad}</span><br>Estatus: ${i.estatus}<br>Cuadrante: ${i.ubicacion?.cuadrante}`;
        L.marker([lat, lng], {icon}).addTo(this.layerGroup).bindPopup(content);
    });

    // Renderizar Unidades Desplegadas
    const desplegados = MonitoreoService.getRecursosDesplegados(session);
    
    let offset = 0.002;
    desplegados.forEach(r => {
        // Asignar coordenadas aleatorias cercanas para visualización de patrullaje
        let lat = 9.740 + offset;
        let lng = -63.180 - offset;
        offset += 0.002;

        const icon = L.divIcon({
            html: `<div class="marker-inc-base marker-color-slate u-icon-poi"><i class="fas ${this.getIconForUnit(r.tipo)}"></i><div class="marker-label-floating">${r.id}</div></div>`,
            className: 'custom-leaflet-icon',
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        });

        const content = `<b>UNIDAD: ${r.id}</b><br>${r.organismo || 'CUPAZ'}<br>Vehículo: ${r.marca} ${r.modelo}<br>Estatus: ${r.estatus}<br>Último Reporte: GPS_OK`;
        const marker = L.marker([lat, lng], {icon}).addTo(this.layerGroup).bindPopup(content);
        
        // Guardar referencia para resaltado (Highlight)
        this.unitMarkers[r.id] = marker;
    });
  },

  displayMarkerTooltip(type, id) {
     // Obsoleto por migración a Leaflet Popups
  },

  handleZoom(delta) {
    if (!this.map) return;
    if (delta > 0) this.map.zoomIn();
    else this.map.zoomOut();
  },

  centerMap(unitId) {
    if (!this.map || this.isDestroyed) return;

    if (unitId && this.unitMarkers[unitId]) {
        const marker = this.unitMarkers[unitId];
        const latLng = marker.getLatLng();
        
        // Efecto visual de resaltado (Pulse & Open)
        this.map.setView(latLng, 15, { animate: true });
        marker.openPopup();
        
        // Agregar clase temporal de resaltado al icono
        const iconElement = marker.getElement();
        if (iconElement) {
            iconElement.classList.add('marker-highlight-pulse');
            setTimeout(() => { if (iconElement) iconElement.classList.remove('marker-highlight-pulse'); }, 3000);
        }
        
        import('../Application/ViewRenderer.js').then(m => m.ViewRenderer.showToast(`Localizando unidad ${unitId}...`));
    } else {
        this.map.setView([9.735, -63.185], 13);
        import('../Application/ViewRenderer.js').then(m => m.ViewRenderer.showToast("Centrando visor táctico general..."));
    }
  },

  initEvents() {
    const btnNovedad = document.getElementById('btnAgregarNovedad');
    const btnCerrar = document.getElementById('btnCerrarIncidente');
    const search = document.getElementById('monitoreoSearch');

    if (btnNovedad) {
      btnNovedad.onclick = () => {
        const txt = document.getElementById('txtNovedadSeguimiento').value;
        if (!txt) return;

        const folio = document.getElementById('hdnFolioSeguimiento').value;
        const inc = MonitoreoService.getIncidentePorFolio(folio);
        
        if (inc) {
            if (!inc.seguimiento) inc.seguimiento = [];
            inc.seguimiento.push({
                fecha: new Date().toLocaleString(),
                novedad: txt
            });
            MonitoreoService.actualizarIncidente(inc);
            this.renderTimeline(inc);
            document.getElementById('txtNovedadSeguimiento').value = '';
        }
      };
    }

    if (btnCerrar) {
      btnCerrar.onclick = () => this.abrirModalCierre();
    }

    const btnFinalizar = document.getElementById('btnFinalizarResolucion');
    if (btnFinalizar) {
      btnFinalizar.onclick = () => this.ejecutarResolucionTactica();
    }

    if (search) {
      search.oninput = (e) => {
        const val = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#monitoreoTableBody tr');
        rows.forEach(r => {
            if(r.cells.length > 1) r.style.display = r.innerText.toLowerCase().includes(val) ? '' : 'none';
        });
      };
    }
  },

  openSeguimientoModal(folio) {
    const inc = MonitoreoService.getIncidentePorFolio(folio);
    if (!inc) return;

    document.getElementById('hdnFolioSeguimiento').value = folio;
    const uIds = inc.unidades_asignadas || [inc.despacho?.unidadId];
    document.getElementById('lblUnidad').innerText = uIds.join(', ') || 'N/A';
    document.getElementById('lblOficial').innerText = inc.despacho?.oficial || 'N/A';

    const groupLlegada = document.getElementById('groupFinalizarDespacho');
    const sectionEstado = document.getElementById('sectionCambioEstado');
    const btnCerrar = document.getElementById('btnCerrarIncidente');
    const btnFinalizarResolucion = document.getElementById('btnFinalizarResolucion');

    // Cargar Estados Personalizados (Req B.7)
    const selE = document.getElementById('selNuevoEstado');
    if (selE) {
        const opc = this.getStatusOptions(inc.naturaleza);
        selE.innerHTML = opc.map(o => `<option value="${o}" ${inc.estatus === o ? 'selected' : ''}>${o}</option>`).join('');
    }

    const session = AuthService.getUserData();
    const isDirectorGeneral = session.role === 'DIRECTOR GENERAL';

    const roleLevel = this.getRoleLevel ? this.getRoleLevel(session.role) : (session.role?.includes('COORDINADOR') ? 500 : 100);

    if (inc.estatus === 'EN DESPACHO') {
        if(groupLlegada) groupLlegada.style.display = isDirectorGeneral ? 'none' : 'block';
        if(sectionEstado) sectionEstado.style.display = 'none';
        if(btnCerrar) btnCerrar.style.display = 'none';
        if(btnFinalizarResolucion) btnFinalizarResolucion.style.display = 'none';
    } else if (inc.estatus === 'EN ATENCION' || inc.estatus === 'REQUIERE APOYO') {
        if(groupLlegada) groupLlegada.style.display = 'none';
        if(sectionEstado) sectionEstado.style.display = isDirectorGeneral ? 'none' : 'block';
        if(btnCerrar) btnCerrar.style.display = 'none';
        if(btnFinalizarResolucion) btnFinalizarResolucion.style.display = (roleLevel === 100) ? 'block' : 'none';
    } else {
        if(groupLlegada) groupLlegada.style.display = 'none';
        if(sectionEstado) sectionEstado.style.display = isDirectorGeneral ? 'none' : 'block';
        if(btnCerrar) btnCerrar.style.display = (inc.estatus === 'RESUELTO' && roleLevel >= 500) ? 'block' : 'none';
        if(btnFinalizarResolucion) btnFinalizarResolucion.style.display = 'none';
    }

    if (isDirectorGeneral) {
        const btnCargaEv = document.getElementById('btnCargaEvidencia');
        if (btnCargaEv) btnCargaEv.style.display = 'none';
        document.querySelectorAll('.btn-notif-org, .btn-refuerzo, .btn-chat-send').forEach(b => b.style.display = 'none');
    }

    this.switchTab('operacion');
    this.renderTimeline(inc);
    this.renderGallery(inc);
    document.getElementById('modalSeguimiento').classList.add('active');
  },

  mostrarDetalleFull(folio) {
    const inc = MonitoreoService.getIncidentePorFolio(folio);
    if (!inc) return;

    // Poblar modal de detalles
    document.getElementById('lblDetalleFolio').innerText = `FOLIO: ${inc.folio || inc.id}`;
    document.getElementById('valDetalleFecha').innerText = `${inc.fecha || inc.date || 'N/A'} - ${inc.hora_inicio || inc.time || ''}`;
    document.getElementById('valDetalleNaturaleza').innerText = (inc.naturaleza || 'General').toUpperCase();
    
    const prioLabel = document.getElementById('valDetallePrioridad');
    prioLabel.innerText = inc.prioridad || 'MEDIA';
    prioLabel.className = `prio-tag prio-${(inc.prioridad || 'media').toLowerCase()}`;

    document.getElementById('valDetalleDireccion').innerText = inc.ubicacion?.direccion || inc.direccion || 'Dirección no especificada';
    document.getElementById('valDetalleParroquia').innerText = `PARROQUIA: ${inc.ubicacion?.parroquia || inc.parroquia || 'N/A'}`;
    
    const statusLabel = document.getElementById('valDetalleEstatus');
    statusLabel.innerText = (inc.estatus || inc.status || 'ABIERTO').toUpperCase();
    statusLabel.className = `status-pill status-${(inc.estatus || inc.status || 'abierto').toLowerCase().replace(/ /g, '-')}`;

    document.getElementById('valDetalleDescripcion').innerText = inc.descripcion || 'Sin descripción detallada registrada.';
    document.getElementById('valDetalleDenunciante').innerText = inc.denunciante || inc.informante || 'ANÓNIMO / OFICIO';
    
    const units = inc.unidades_asignadas || (inc.despacho?.unidadId ? [inc.despacho.unidadId] : []);
    document.getElementById('valDetalleUnidades').innerText = units.length > 0 ? units.join(', ') : 'Ninguna unidad asignada aún';

    document.getElementById('modalDetalleIncidente').classList.add('active');
  },

  switchTab(tabId) {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(t => t.classList.remove('active'));
    contents.forEach(c => c.classList.remove('active'));

    document.getElementById(`tab${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`).classList.add('active');
    document.getElementById(`contentTab${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`).classList.add('active');
  },

  /* LOGICA DE EVIDENCIAS (CU-16) */
  abrirModalEvidencia() {
    const folio = document.getElementById('hdnFolioSeguimiento').value;
    document.getElementById('lblEvidenciaFolio').innerText = folio;
    document.getElementById('selTipoEvidencia').value = 'FOTO';
    document.getElementById('txtDescEvidencia').value = '';
    this.resetPreview();
    document.getElementById('modalCargaEvidencia').classList.add('active');
  },

  ajustarInputCaptura() {
    const tipo = document.getElementById('selTipoEvidencia').value;
    const fileInput = document.getElementById('fileEvidencia');
    
    // Req 6a: Simulación de recursos (Web standard)
    switch(tipo) {
        case 'FOTO': fileInput.accept = "image/*"; fileInput.capture = "environment"; break;
        case 'VIDEO': fileInput.accept = "video/*"; fileInput.capture = "environment"; break;
        case 'AUDIO': fileInput.accept = "audio/*"; fileInput.capture = "microphone"; break;
        default: fileInput.accept = "*/*"; delete fileInput.capture; break;
    }
    this.resetPreview(true); // Al cambiar tipo, sí limpiamos el input
  },

  handlePreview(input) {
    const file = input.files[0];
    if (!file) return;

    this.resetPreview(false); // Al previsualizar, NO limpiamos el input
    document.querySelector('.preview-placeholder').style.display = 'none';

    if (file.type.startsWith('image/')) {
        const img = document.getElementById('imgPreview');
        img.src = URL.createObjectURL(file);
        img.style.display = 'block';
    } else if (file.type.startsWith('video/')) {
        const video = document.getElementById('videoPreview');
        video.src = URL.createObjectURL(file);
        video.style.display = 'block';
    } else {
        const info = document.getElementById('fileInfoPreview');
        document.getElementById('lblFileName').innerText = file.name;
        info.style.display = 'flex';
    }
  },

  resetPreview(clearInput = true) {
    document.getElementById('imgPreview').style.display = 'none';
    document.getElementById('videoPreview').style.display = 'none';
    document.getElementById('fileInfoPreview').style.display = 'none';
    const placeholder = document.querySelector('.preview-placeholder');
    if (placeholder) placeholder.style.display = 'flex';
    if (clearInput) document.getElementById('fileEvidencia').value = '';
  },

  async registrarEvidencia() {
    const fileInput = document.getElementById('fileEvidencia');
    const file = fileInput.files[0];
    const tipo = document.getElementById('selTipoEvidencia').value;
    const desc = document.getElementById('txtDescEvidencia').value;
    const folio = document.getElementById('hdnFolioSeguimiento').value;

    // Req 9: Descripción obligatoria para evidencias visuales críticas
    if (tipo === 'FOTO' && !desc.trim()) {
        await cupazAlert("VALIDACIÓN DE SEGURIDAD: Debe ingresar una descripción obligatoria para evidencias fotográficas (Detalle de hallazgos, personas o bienes).");
        return;
    }

    // Req 10: Validación de Hardware (Simulación Técnica)
    if (tipo === 'FOTO' || tipo === 'VIDEO') {
        const hasCamera = await navigator.mediaDevices?.enumerateDevices()
            .then(devices => devices.some(d => d.kind === 'videoinput'))
            .catch(() => false);
        if (!hasCamera && !file) { // Si no hay cámara y no se subió archivo manual
            await cupazAlert("ERROR DE RECURSOS: No se detecta hardware de captura de video/foto en este terminal.");
            return;
        }
    }

    if (!file) {
        await cupazAlert("VALIDACIÓN: Debe seleccionar o capturar un archivo de evidencia.");
        return;
    }

    // RN: Validar Tamaños (Req 3 de RF5)
    const sizeMB = file.size / (1024 * 1024);
    const limits = { 'FOTO': 10, 'VIDEO': 50, 'AUDIO': 5, 'ARCHIVO': 10 };
    if (sizeMB > (limits[tipo] || 10)) {
        await cupazAlert(`ERROR DE TAMAÑO: El archivo excede el límite permitido para ${tipo} (${limits[tipo] || 10} MB).`);
        return;
    }

    const { AuthService } = await import('../../Service/AuthService.js');
    const user = AuthService.getUserData();

    // Req 13: Procesar y aplicar metadatos y Hash de Integridad (Req 8)
    const mockHash = Array.from({length:32}, () => Math.floor(Math.random()*16).toString(16)).join('');
    
    const evidencia = {
        id: Date.now(),
        tipo: tipo,
        nombre: file.name,
        descripcion: desc,
        fecha: new Date().toLocaleString(),
        operativo: user?.username || 'N/A',
        jefe_asociado: user?.jefe_nombre || '', // Req Association
        tamanio: sizeMB.toFixed(2) + ' MB',
        hash_integridad: mockHash,
        valida: true // Req 5
    };

    const inc = MonitoreoService.getIncidentePorFolio(folio);
    if (inc) {
        if (!inc.evidencias) inc.evidencias = [];
        inc.evidencias.push(evidencia);
        
        // Req 15: Registro en historial
        if (!inc.historial) inc.historial = [];
        inc.historial.push({
            fecha: evidencia.fecha,
            accion: 'EVIDENCIA ADJUNTA',
            nota: `Evidencia [${tipo}] agregada por ${evidencia.operativo}. Desc: ${desc || 'Sin comentarios'}`
        });

        MonitoreoService.actualizarIncidente(inc);

        // Notificar y actualizar UI (Optimizado)
        import('../Application/ViewRenderer.js').then(m => {
            m.ViewRenderer.showToast("Evidencia registrada exitosamente y vinculada al expediente.");
        });

        document.getElementById('modalCargaEvidencia').classList.remove('active');
        this.renderGallery(inc);
        this.renderTimeline(inc);
    } else {
        await cupazAlert("Error crítico: No se puede vincular evidencia a un incidente inexistente.");
    }
  },

  renderGallery(inc) {
    const gallery = document.getElementById('evidenceGallery');
    if (!gallery) return;

    if (!inc.evidencias || inc.evidencias.length === 0) {
        gallery.innerHTML = `
           <div class="empty-gallery">
              <i class="fas fa-photo-video" style="font-size:3rem; color:#cbd5e1; margin-bottom:15px;"></i>
              <p style="color:#94a3b8; font-weight:600;">No hay evidencias registradas en este incidente.</p>
           </div>
        `;
        return;
    }

    gallery.innerHTML = inc.evidencias.map(ev => `
        <div class="evidence-card ${!ev.valida ? 'invalidated' : ''}">
           <div class="evidence-thumb">
              <i class="fas ${this.getIconForType(ev.tipo)}"></i>
              ${!ev.valida ? '<div class="invalid-banner">ANULADA</div>' : ''}
              <div style="position:absolute; bottom:5px; right:5px; background:rgba(0,0,0,0.5); color:white; font-size:0.55rem; padding:2px 5px; border-radius:3px;">
                ${ev.tamanio}
              </div>
           </div>
           <div class="evidence-info">
              <div class="ev-type">${ev.tipo} ${!ev.valida ? '(INVÁLIDA)' : ''}</div>
              <div style="font-size:0.65rem; font-weight:700; color:#334155; margin:3px 0;">${ev.descripcion || 'Sin descripción'}</div>
              <div class="ev-hash" title="${ev.hash_integridad || 'N/A'}">HASH: ${ev.hash_integridad ? ev.hash_integridad.slice(0,8) : 'S/H'}...</div>
              <div class="ev-date">${ev.fecha}</div>
           </div>
        </div>
    `).join('');
  },

  calculateDistance(coord1, coord2) {
      if(!coord1 || !coord2) return 0;
      const [lat1, lon1] = coord1.split(',').map(Number);
      const [lat2, lon2] = coord2.split(',').map(Number);
      // Formula Haversine simplificada para el prototipo (km -> m)
      const d = Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lon1 - lon2, 2)) * 111000;
      return d;
  },

  getIconForType(tipo) {
    switch(tipo) {
        case 'FOTO': return 'fa-image';
        case 'VIDEO': return 'fa-video';
        case 'AUDIO': return 'fa-microphone';
        default: return 'fa-file-alt';
    }
  },

  /* LOGICA DE LLEGADA (COMPATIBILIDAD) */
  abrirModalLlegada() {
    const folio = document.getElementById('hdnFolioSeguimiento').value;
    const inc = MonitoreoService.getIncidentePorFolio(folio);
    if (!inc) return;

    document.getElementById('lblLlegadaFolio').innerText = `Folio: ${folio}`;
    document.getElementById('lblLlegadaUnidad').innerText = inc.unidades_asignadas ? inc.unidades_asignadas.join(', ') : 'N/A';
    document.getElementById('lblLlegadaLoc').innerText = inc.ubicacion.direccion;
    document.getElementById('lblLlegadaHora').innerText = new Date().toLocaleTimeString();
    document.getElementById('modalLlegadaSujeto').classList.add('active');
  },

  async confirmarLlegadaFinal() {
    const folio = document.getElementById('hdnFolioSeguimiento').value;
    const obs = document.getElementById('txtObsLlegada').value;
    const inc = MonitoreoService.getIncidentePorFolio(folio);

    if (inc) {
        // Req: Validación Geo-Posición (200m)
        const posActual = await new Promise((res) => {
            navigator.geolocation.getCurrentPosition(
                (p) => res(`${p.coords.latitude}, ${p.coords.longitude}`),
                () => res("10.48, -66.87") // Mock
            );
        });

        const dist = this.calculateDistance(inc.ubicacion.coordenadas, posActual);
        if (dist > 200) {
            const confirm = await cupazConfirm(`ADVERTENCIA DE GEOCERCA: Se encuentra a ${dist.toFixed(0)}m del incidente (Radio > 200m). ¿Confirma que está en el lugar del evento para iniciar la atención?`, "DISCREPANCIA GPS");
            if (!confirm) return;
        }

        MonitoreoService.confirmarLlegada(folio, obs, posActual);

        document.getElementById('modalLlegadaSujeto').classList.remove('active');
        this.renderTable();
        this.openSeguimientoModal(folio);
    }
  },

  async procesarCambioEstado(folio, nuevo) {
    const { AuthService } = await import('../../Service/AuthService.js');
    const user = AuthService.getUserData();
    const inc = MonitoreoService.getIncidentePorFolio(folio);
    if (!inc) return;

    // Regla de Oro: No modificar incidentes CERRADOS
    if (inc.estatus === 'CERRADO') {
        await cupazAlert("ERROR: El incidente ya está cerrado. Para realizar cambios, debe iniciar el protocolo de REAPERTURA (Requiere Supervisor).");
        return;
    }

    // Req B.8: Validación de transiciones no válidas
    const invalidTransitions = {
        'RESUELTO': ['EN ATENCION', 'EN DESPACHO'],
        'LIQUIDADO': ['COMBATIENDO'],
    };
    if (invalidTransitions[inc.estatus]?.includes(nuevo)) {
        alert(`OPERACIÓN DENEGADA: No es posible retroceder del estado '${inc.estatus}' al estado '${nuevo}' sin autorización de nivel superior.`);
        return;
    }

    // Req B.6: Comentarios obligatorios para transiciones críticas
    const criticas = ['PENDIENTE DE RECURSOS', 'REQUIERE APOYO', 'ABORTADO'];
    if (criticas.includes(nuevo) && !obs.trim()) {
        alert("VALIDACIÓN: Debe ingresar una observación para justificar este cambio de estado (Razón del apoyo/falta de recursos).");
        return;
    }

     // Req B.2: Autorización de Coordinador/Superior para estados críticos
     const roleLevel = this.getRoleLevel ? this.getRoleLevel(user?.role) : (user?.role?.includes('COORDINADOR') ? 500 : 100);
     if (nuevo === 'ABORTADO' && roleLevel < 500 && user?.username !== 'admin') {
         alert("AUTORIZACIÓN REQUERIDA: Solo un Coordinador de Área o el Máximo Admin puede marcar un incidente como ABORTADO.");
         return;
     }

    // Req B.3: Restricción de 'RESUELTO' a la unidad (Simulado)
    if (nuevo === 'RESUELTO' && user?.role === 'OPERADOR') {
        alert("DENEGADO: El estado 'RESUELTO' es responsabilidad exclusiva del equipo operativo en sitio.");
        return;
    }

    inc.estatus = nuevo;
    
    // Req: Notificación automática si requiere apoyo (Nivel 100)
    if (nuevo === 'REQUIERE APOYO' && user.role === 'JEFE DE CUADRANTE') {
        const audit = DataManager.leer('cupaz_auditoria') || [];
        audit.push({
            fecha: new Date().toLocaleString(),
            usuario: user.username,
            accion: 'ALERTA TÁCTICA',
            detalle: `SOLICITUD DE APOYO URGENTE: El Jefe de Cuadrante (${user.cuadrante}) requiere asistencia en Folio ${folio}.`,
            prioridad: 'ALTA'
        });
        DataManager.guardar('cupaz_auditoria', audit);
        cupazToast("Notificación de emergencia enviada a su Coordinador de Área.");
    }

    if (!inc.historial) inc.historial = [];
    inc.historial.push({
        fecha: new Date().toLocaleString(),
        accion: 'CAMBIO DE ESTADO',
        jefe_asociado: user?.jefe_nombre || '', // Req Association
        nota: `Cambio a: ${nuevo}. Resp: ${user?.username}. Obs: ${obs || 'Información de rutina'}`
    });

    DataManager.guardar('cupaz_incidentes', incidentes);
    import('../Application/ViewRenderer.js').then(m => m.ViewRenderer.showToast(`Estado actualizado: ${nuevo}`));
    
    this.renderTable();
    this.openSeguimientoModal(folio);
  },

  getStatusOptions(nature) {
      // Req B.7: Estados personalizados por tipo
      const base = ['EN ATENCION', 'REQUIERE APOYO', 'PENDIENTE DE RECURSOS'];
      if (nature === 'Incendio') return [...base, 'COMBATIENDO', 'CONTROLADO', 'LIQUIDADO'];
      if (nature === 'Salud') return [...base, 'ESTABILIZANDO', 'TRASLADO EN CURSO', 'ENTREGA EN HOSPITAL'];
      return [...base, 'RESUELTO'];
  },


  renderTimeline(inc) {
    const container = document.getElementById('timelineContainer');
    if (!container) return;

    let html = `
      <div class="timeline-item">
         <div class="timeline-time">${inc.fecha}</div>
         <div class="timeline-content"><b>REPORTE INICIAL:</b> Captación del incidente realizada.</div>
      </div>
    `;

    if (inc.fechaLlegada) {
        html += `
          <div class="timeline-item timeline-arrival">
             <div class="timeline-time">${inc.fechaLlegada}</div>
             <div class="timeline-content">
                <i class="fas fa-check-circle"></i> <b>LLEGADA A ESCENA:</b> Unidades en el lugar. 
                <span class="timeline-rt-badge">RT: ${inc.tiempoRespuesta} min.</span>
             </div>
          </div>
        `;
    }

    if (inc.seguimiento) {
        inc.seguimiento.forEach(s => {
            html += `<div class="timeline-item"><div class="timeline-time">${s.fecha}</div><div class="timeline-content">${s.novedad}</div></div>`;
        });
    }

    container.innerHTML = html;
  },

  /* LÓGICA DE COORDINACIÓN INTERINSTITUCIONAL (REQUERIMIENTOS) */
  actualizarBadgeOrg(org) {
    const suffix = org === 'PROTECCION_CIVIL' ? 'PC' : (org === 'CPNB' ? 'Policia' : (org === 'SALUD' ? 'Salud' : 'Bomberos'));
    const chk = document.getElementById(`chkOrg${suffix}`);
    const badge = document.getElementById(`status_${org}`);
    if (badge && chk) {
        badge.innerText = chk.checked ? 'SELECCIONADO' : 'PENDIENTE';
        badge.style.background = chk.checked ? 'var(--primary-color)' : '#94a3b8';
    }
  },

  async ejecutarNotificacionMulti() {
    const selected = [];
    ['BOMBEROS', 'PROTECCION_CIVIL', 'SALUD', 'CPNB'].forEach(o => {
        const suffix = o === 'PROTECCION_CIVIL' ? 'PC' : (o === 'CPNB' ? 'Policia' : (o === 'SALUD' ? 'Salud' : 'Bomberos'));
        if (document.getElementById(`chkOrg${suffix}`)?.checked) selected.push(o);
    });

    if (selected.length === 0) {
        alert("Debe seleccionar al menos un organismo adicional para establecer la coordinación.");
        return;
    }

    // Req 9, 10: Notificación simultánea
    import('../Application/ViewRenderer.js').then(m => m.ViewRenderer.showToast(`Notificando a ${selected.length} organismos... Transmitiendo ubicación y folio.`));
    
    selected.forEach(org => {
        const badge = document.getElementById(`status_${org}`);
        if(badge) {
            badge.innerText = 'NOTIFICADO';
            badge.style.background = 'var(--success)';
        }
        this.addChatMessage(`SISTEMA: Notificación enviada exitosamente a ${org}.`);
    });

    this.addChatMessage(`SISTEMA: Canal de comunicación unificado establecido.`, false, '#ecfdf5');
  },

  postearMensajeChat() {
    const input = document.getElementById('txtMsgCoord');
    const msg = input.value.trim();
    if (!msg) return;

    this.addChatMessage(`OPERADOR: ${msg}`, true);
    input.value = '';
  },

  procesarRefuerzo() {
    const org = document.getElementById('selRefuerzoOrg').value;
    const msg = `SOLICITUD DE REFUERZO: Se requiere apoyo adicional de ${org} en el sitio.`;
    this.addChatMessage(msg, false, '#fee2e2');
    import('../Application/ViewRenderer.js').then(m => m.ViewRenderer.showToast("Solicitud de refuerzo transmitida."));
  },

  async abrirModalCierre() {
      const folio = document.getElementById('hdnFolioSeguimiento').value;
      const incidentes = DataManager.leer('cupaz_incidentes');
      const inc = incidentes.find(i => i.folio === folio);
      if (!inc) return;

      // RN-01: Validaciones de cierre obligatorio ANTES de entrar al modal final
      const unidadesSinLlegada = (inc.unidades_asignadas || []).filter(uId => !inc.fechaLlegada);
      if (unidadesSinLlegada.length > 0) {
          cupazToast("Error: No se puede cerrar. No se ha registrado la LLEGADA A ESCENA.");
          return;
      }

      // RN-03: Evidencia obligatoria por naturaleza
      const naturalezaCritica = ['Homicidio', 'Accidente de Tránsito', 'Incendio'];
      if (naturalezaCritica.includes(inc.naturaleza) && (!inc.evidencias || inc.evidencias.length === 0)) {
          cupazToast("Error: Naturaleza CRÍTICA requiere al menos una evidencia documental.");
          return;
      }

      const evidences = inc.evidencias || [];
      document.getElementById('cierreEvidenceCount').innerText = evidences.length;
      document.getElementById('hdnEffectiveness').value = '';
      document.getElementById('txtObsCierreFinal').value = '';
      
      document.querySelectorAll('.btn-validation').forEach(b => b.classList.remove('active'));

      document.getElementById('modalCierreFinal').classList.add('active');
  },

  async ejecutarResolucionTactica() {
      const folio = document.getElementById('hdnFolioSeguimiento').value;
      const incidentes = DataManager.leer('cupaz_incidentes');
      const inc = incidentes.find(i => i.folio === folio);
      if (!inc) return;

      // Req: Evidencias obligatorias para cerrar/resolver
      if (!inc.evidencias || inc.evidencias.length === 0) {
          await cupazAlert("DENEGADO: Debe adjuntar al menos una evidencia fotográfica o documental de la intervención antes de finalizar la resolución.");
          return;
      }

      // Req: Descripción obligatoria para incidentes críticos
      const criticos = ['Homicidio', 'Accidente de Tránsito', 'Robo', 'Secuestro'];
      if (criticos.includes(inc.naturaleza)) {
          const tieneDesc = inc.evidencias.some(e => e.descripcion && e.descripcion.length > 10);
          if (!tieneDesc) {
              await cupazAlert(`DENEGADO: El incidente es de naturaleza CRÍTICA (${inc.naturaleza}). Requiere una descripción detallada en al menos una de las evidencias adjuntas.`);
              return;
          }
      }

      if (!await cupazConfirm("¿Desea marcar el incidente como RESUELTO? Esta acción notificará a su coordinador para la validación de efectividad y cierre institucional.")) return;

      inc.estatus = 'RESUELTO';
      if (!inc.historial) inc.historial = [];
      inc.historial.push({
          fecha: new Date().toLocaleString(),
          accion: 'RESOLUCION TACTICA',
          nota: 'Incidente resuelto por el Jefe de Cuadrante en campo. Pendiente de validación jerárquica.'
      });

      DataManager.guardar('cupaz_incidentes', incidentes);
      cupazToast("Incidente marcado como RESUELTO. Procediendo a notificación de cierre.");
      
      document.getElementById('modalSeguimiento').classList.remove('active');
      this.renderTable();
  },

  setEffectiveness(val) {
      document.getElementById('hdnEffectiveness').value = val;
      document.querySelectorAll('.btn-validation').forEach(b => b.classList.remove('active'));
      const id = val === 'EFECTIVA' ? 'btnEffEfectivo' : 'btnEffInefectivo';
      document.getElementById(id).classList.add('active');
  },

  async ejecutarCierreInstitucional() {
      const effect = document.getElementById('hdnEffectiveness').value;
      const obs = document.getElementById('txtObsCierreFinal').value;
      const folio = document.getElementById('hdnFolioSeguimiento').value;

      if (!effect) {
          cupazToast('Debe validar la efectividad de la atención antes de proceder con el cierre.');
          return;
      }

      const incidentes = DataManager.leer('cupaz_incidentes');
      const idx = incidentes.findIndex(i => i.folio === folio);
      if (idx === -1) return;

      const session = AuthService.getUserData();
      
      incidentes[idx].estatus = 'CERRADO';
      incidentes[idx].validacion_efectividad = effect;
      incidentes[idx].observaciones_cierre = obs;
      incidentes[idx].responsable_cierre = session.username;
      incidentes[idx].fecha_cierre = new Date().toLocaleString();

      if (!incidentes[idx].historial) incidentes[idx].historial = [];
      incidentes[idx].historial.push({
          fecha: incidentes[idx].fecha_cierre,
          accion: 'CIERRE INSTITUCIONAL',
          nota: `Validación: ${effect}. Supervisor: ${session.username}. Obs: ${obs}`
      });

      // Liberar unidades
      const recursos = DataManager.leer('cupaz_recursos');
      const units = incidentes[idx].unidades_asignadas || [];
      units.forEach(uId => {
          const rIdx = recursos.findIndex(r => r.id === uId);
          if (rIdx !== -1) recursos[rIdx].estatus = 'DISPONIBLE';
      });

      DataManager.guardar('cupaz_incidentes', incidentes);
      DataManager.guardar('cupaz_recursos', recursos);

      cupazToast('Protocolo de Cierre Completado. El expediente ha sido archivado con éxito.');
      
      document.getElementById('modalCierreFinal').classList.remove('active');
      document.getElementById('modalSeguimiento').classList.remove('active');
      this.renderTable();
  },

  addChatMessage(msg, isUser = false, bg = null) {
    const chat = document.getElementById('chatCoordination');
    if (!chat) return;

    const div = document.createElement('div');
    div.style.fontSize = '0.7rem';
    div.style.padding = '5px 10px';
    div.style.borderRadius = '5px';
    div.style.marginBottom = '5px';
    div.style.background = bg || (isUser ? 'white' : '#f1f5f9');
    div.style.border = '1px solid #e2e8f0';
    div.innerHTML = `<span style="font-size:0.55rem; color:#94a3b8; display:block;">${new Date().toLocaleTimeString()}</span>${msg}`;
    
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
  },

  destroy() {
    this.isDestroyed = true;
    
    // Limpiar el intervalo de actualización automática
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }

    // Destruir la instancia de Leaflet de manera absoluta
    if (this.map) {
      try {
        this.map.off();
        this.map.remove();
      } catch (e) { /* ignorar */ }
      this.map = null;
      this.layerGroup = null;
    }

    // Limpiar funciones globales
    [
      'openSeguimientoModal', 'marcarLlegadaManual', 'confirmarLlegadaEscena',
      'actualizarEstadoInc', 'switchSeguimientoTab', 'abrirModalCargaEvidencia',
      'previewEvidencia', 'guardarEvidenciaFinal', 'toggleEvidenciaSource',
      'setEffectiveness', 'ejecutarCierreInstitucional', 'abrirModalCierre',
      'mapZoomIn', 'mapZoomOut', 'mapCenter', 'toggleMapLayer', 'showMarkerInfo'
    ].forEach(fn => delete window[fn]);
  }
};
