/**
 * Presentacion/Controllers/Monitoreo/TerminalMovil.controller.js
 * CU-12: Terminal de Unidad Operativa (Completo - Funciones de Jefe de Cuadrante)
 */

import { DataManager } from '../../Persistencia/localStorage.js';
import { MonitoreoService } from '../../Service/Monitoreo.service.js';
import { LogisticaService } from '../../Service/Logistica.service.js';
import { PatrullajeService } from '../../Service/Patrullaje.service.js';
import { AuthService } from '../../Service/AuthService.js';

export const controller = {
  currentUnitId: null,
  currentIncidente: null,
  activePatrolId: null,
  
  async init(props) {
    window.terminalCtrl = this;
    await new Promise(resolve => setTimeout(resolve, 50));
    this.loadUnits();
    this.initEvents();
    
    // Check if there is an active patrol in local session
    this.activePatrolId = sessionStorage.getItem('cupaz_active_patrol');
    this.renderPatrolArea();
    this.renderQueries();
  },

  loadUnits() {
    const sel = document.getElementById('selTerminalUnit');
    if (!sel) return;
    
    const resources = LogisticaService.getRecursos();
    // En vida real, el dispositivo ya estaría enlazado a la unidad. Aquí simulamos.
    resources.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.id;
        opt.textContent = `${u.id} - ${u.nombre} (${u.estatus})`;
        sel.appendChild(opt);
    });
  },

  initEvents() {
    // Conexión
    const btnConnect = document.getElementById('btnConnectTerminal');
    const sel = document.getElementById('selTerminalUnit');

    if (btnConnect) {
        btnConnect.onclick = () => {
            const uId = sel.value;
            if (!uId) {
                this.showToast('Debe seleccionar una unidad para simular el terminal.', 'error');
                return;
            }
            this.currentUnitId = uId;
            document.getElementById('lblUnitDevice').innerText = `MDT-${uId}`;
            
            // Ocultar login, mostrar nav táctica y primera vista
            document.getElementById('secTerminalLogin').classList.remove('active');
            document.getElementById('terminalNav').classList.remove('hidden');
            this.switchSection('secTerminalIncidents');
        };
    }

    // Navegación Inferior (Tabs)
    document.querySelectorAll('.terminal-nav .nav-item').forEach(item => {
        item.onclick = (e) => {
            const sec = e.currentTarget.getAttribute('data-sec');
            this.switchSection(sec);
        };
    });

    // Consultas Tabs
    document.querySelectorAll('.tac-tabs .tac-tab').forEach(item => {
        item.onclick = (e) => {
            document.querySelectorAll('.tac-tabs .tac-tab').forEach(t => t.classList.remove('active'));
            e.currentTarget.classList.add('active');
            this.renderQueries(e.currentTarget.getAttribute('data-tab'));
        };
    });

    // Modal
    const btnCancel = document.getElementById('btnCancelLlegada');
    if (btnCancel) {
        btnCancel.onclick = () => this.closeModal('modalConfirmLlegada');
    }
    const btnConfirm = document.getElementById('btnConfirmLlegada');
    if(btnConfirm) {
        btnConfirm.onclick = () => this.confirmarLlegada();
    }
  },

  switchSection(sectionId) {
    document.querySelectorAll('.terminal-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.terminal-nav .nav-item').forEach(i => i.classList.remove('active'));
    
    document.getElementById(sectionId).classList.add('active');
    document.querySelector(`.terminal-nav .nav-item[data-sec="${sectionId}"]`)?.classList.add('active');

    if (sectionId === 'secTerminalIncidents') this.renderIncidents();
    if (sectionId === 'secTerminalPatrol') this.renderPatrolArea();
  },

  closeModal(id) {
      document.getElementById(id)?.classList.remove('active');
  },

  // ============================================
  // GESTIÓN DE INCIDENTES (Tareas)
  // ============================================
  renderIncidents() {
    const container = document.getElementById('terminalIncidentsContainer');
    const incidentes = MonitoreoService.getIncidentes();
    const unidad = LogisticaService.getRecursoPorId(this.currentUnitId);
    
    if(!unidad) return;
    
    // Incidentes filtrados por unidad asignada que no estén cerrados
    const asignados = incidentes.filter(i => 
        (i.estatus === 'EN DESPACHO' || i.estatus === 'EN ATENCION' || i.estatus === 'RECURSOS SOLICITADOS') && 
        (i.unidades_asignadas || []).includes(this.currentUnitId)
    );

    if (asignados.length === 0) {
        container.innerHTML = '<div class="terminal-empty-msg">No hay tareas tácticas asignadas.</div>';
        return;
    }

    container.innerHTML = asignados.map(i => `
        <div class="terminal-incident-card" onclick="window.terminalCtrl.verDetalle('${i.folio}')">
            <div class="t-card-header">
                <span class="t-folio">${i.folio}</span>
                <span class="t-priority pill-${i.prioridad.toLowerCase()}">${i.estatus}</span>
            </div>
            <div class="t-card-body">
                <p><strong>CÓDIGO:</strong> ${i.naturaleza}</p>
                <p><strong>LUGAR:</strong> ${i.ubicacion.direccion}</p>
            </div>
        </div>
    `).join('');
  },

  async verDetalle(folio) {
    const inc = MonitoreoService.getIncidentePorFolio(folio);
    if (!inc) return;

    this.currentIncidente = inc;
    const detail = document.getElementById('terminalIncidentDetail');
    const list = document.getElementById('terminalIncidentsContainer');

    list.classList.add('hidden');
    detail.classList.remove('hidden');

    const requiresArrival = inc.estatus === 'EN DESPACHO';

    detail.innerHTML = `
        <div class="terminal-sheet">
            <button class="t-back-btn" onclick="window.terminalCtrl.volverALista()">
                <i class="fas fa-arrow-left"></i> VOLVER
            </button>
            <h2 class="t-sheet-title">FICHA: ${inc.folio}</h2>
            <div class="t-sheet-content">
                <div class="t-field"><label>REPORTE</label><span>${inc.naturaleza}</span></div>
                <div class="t-field"><label>DIRECCIÓN</label><span>${inc.ubicacion.direccion}</span></div>
                <div class="t-field"><label>NOTAS DE SALA</label><span>${inc.detalles}</span></div>
            </div>
            
            <div class="t-sheet-actions">
                ${requiresArrival ? `
                    <button class="add-btn w-full tac-btn" onclick="window.terminalCtrl.abrirConfirmacionLlegada()">
                        <i class="fas fa-location-crosshairs"></i> NOTIFICAR LLEGADA
                    </button>
                ` : `
                    <button class="add-btn w-full tac-btn" style="background:var(--warning)" onclick="window.terminalCtrl.solicitarApoyo()">
                        <i class="fas fa-ambulance"></i> SOLICITAR APOYO
                    </button>
                    <div class="tac-file-upload mt-3" onclick="window.terminalCtrl.simulatePhoto('inc_evidencia')">
                        <i class="fas fa-camera"></i> <span id="lbl_inc_evidencia">Adjuntar Evidencia del Sitio</span>
                    </div>
                    <textarea class="tac-input mt-2" id="inc_novedades" placeholder="Resumen de resolución / Novedades..."></textarea>
                    <button class="add-btn w-full tac-btn mt-3" style="background:var(--primary-dark)" onclick="window.terminalCtrl.cerrarIncidente()">
                        <i class="fas fa-flag-checkered"></i> CERRAR INCIDENTE
                    </button>
                `}
            </div>
        </div>
    `;
  },

  volverALista() {
    document.getElementById('terminalIncidentDetail').classList.add('hidden');
    document.getElementById('terminalIncidentsContainer').classList.remove('hidden');
    this.renderIncidents();
  },

  abrirConfirmacionLlegada() {
    const inc = this.currentIncidente;
    const unidad = LogisticaService.getRecursoPorId(this.currentUnitId);
    
    document.getElementById('confFolio').innerText = inc.folio;
    // document.getElementById('confLocActual').innerText = unidad?.ubicacion_actual || 'Zona Próxima a Escena';

    // Req 5, 7: Otorga alerta si se reporta llegada muy lejos (mayor a 200m)
    const alert = document.getElementById('geoDiscrepancyAlert');
    const distSim = Math.random() * 500; 
    
    if (distSim > 200) {
        alert.classList.remove('hidden');
    } else {
        alert.classList.add('hidden');
        this.showToast("CUPAZ: Geocerca validada in-situ.", "success");
    }
    document.getElementById('modalConfirmLlegada').classList.add('active');
  },

  async confirmarLlegada() {
    MonitoreoService.confirmarLlegada(this.currentIncidente.folio, "Llegada reportada vía Terminal", null);
    LogisticaService.actualizarEstado(this.currentUnitId, 'EN INTERVENCION', 'Personal in situ en evento');
    
    this.closeModal('modalConfirmLlegada');
    this.showToast(`Llegada registrada exitosamente.`, "success");
    this.verDetalle(this.currentIncidente.folio); // Refresh
  },

  solicitarApoyo() {
    // Actualiza a requiere apoyo y notifica automáticamente al coordinador (via audit service indirectamente)
    MonitoreoService.actualizarEstatus(this.currentIncidente.folio, 'RECURSOS SOLICITADOS', 'Unidad solicitó unidades de apoyo en el sitio');
    this.showToast("Alerta al Coordinador: Apoyo solicitado en el lugar.", "warning");
    this.verDetalle(this.currentIncidente.folio);
  },

  cerrarIncidente() {
    const evt = document.getElementById('lbl_inc_evidencia').innerText;
    const notas = document.getElementById('inc_novedades').value;

    if (evt === 'Adjuntar Evidencia del Sitio') {
        this.showToast("Es obligatorio adjuntar evidencia fotográfica para cerrar.", "error");
        return;
    }
    if (!notas || notas.trim().length < 5) {
        this.showToast("Debe describir las novedades del cierre.", "error");
        return;
    }

    // Funcionalidad de cierre
    MonitoreoService.actualizarEstatus(this.currentIncidente.folio, 'CERRADO', notas);
    LogisticaService.liberarUnidad(this.currentUnitId);
    
    this.showToast("Incidente Cerrado. Unidad Liberada.", "success");
    this.volverALista();
  },

  // ============================================
  // PATRULLAJE TERRITORIAL
  // ============================================
  renderPatrolArea() {
      const area = document.getElementById('patrolActionArea');
      if (!area) return;

      if (this.activePatrolId) {
          // Patrol activo
          area.innerHTML = `
              <div class="tac-card mt-3">
                  <div class="t-success-icon"><i class="fas fa-route" style="color:var(--primary-color)"></i></div>
                  <h3 class="tac-title" style="text-align:center; color:white">EN PATRULLAJE</h3>
                  <p style="text-align:center; color:#ccc; margin-bottom:20px;">Geotracking activado...</p>
                  
                  <div class="tac-file-upload mt-3" onclick="window.terminalCtrl.showToast('Novedad reportada','success')">
                      <i class="fas fa-comment-dots"></i> <span>Reportar Novedad de Ruta</span>
                  </div>
                  
                  <textarea class="tac-input mt-3" id="patrol_notes" placeholder="Novedades al finalizar recorrido..."></textarea>
                  
                  <button class="add-btn w-full tac-btn mt-4" style="background:var(--danger)" onclick="window.terminalCtrl.endPatrol()">
                     <i class="fas fa-hand-paper"></i> FINALIZAR PATRULLAJE
                  </button>
              </div>
          `;
      } else {
          // Iniciar Patrol
          area.innerHTML = `
             <div class="tac-card mt-3">
                  <p class="tac-subtitle">Inicie el registro de ruta para cálculo automático de alcance y cobertura.</p>
                  <div class="pb-group">
                      <label class="pb-label">TIPO DE DESPLAZAMIENTO</label>
                      <select id="patrol_tipo" class="tac-input">
                          <option value="VEHICULAR">Vehicular</option>
                          <option value="MOTOCICLETA">Motocicleta</option>
                          <option value="PIE (PUNTO A PIE)">Recorrido a Pie</option>
                      </select>
                  </div>
                  <button class="add-btn w-full tac-btn mt-3" onclick="window.terminalCtrl.startPatrol()">
                     <i class="fas fa-play"></i> INICIAR PATRULLAJE
                  </button>
             </div>
          `;
      }
  },

  startPatrol() {
      const u = AuthService.getUserData();
      const miCuadrante = u?.cuadrante || 'CUPAZ-ASIGNADO';
      const responsable = u?.role === 'AUXILIAR DE CUADRANTE' ? u?.jefe : u?.username;
      
      const tipo = document.getElementById('patrol_tipo').value;
      const data = {
          unidad: this.currentUnitId,
          tipo: tipo,
          cuadrante: miCuadrante,
          operativo_id: responsable
      };
      const res = PatrullajeService.iniciarPatrullaje(data);
      this.activePatrolId = res.id;
      sessionStorage.setItem('cupaz_active_patrol', res.id);
      this.showToast("Patrullaje iniciado. Tracking GPS activado.", "success");
      this.renderPatrolArea();
      LogisticaService.actualizarEstado(this.currentUnitId, 'EN PATRULLAJE', 'Inicio de ruta sectorizada');
  },

  endPatrol() {
      if(!this.activePatrolId) return;
      const notas = document.getElementById('patrol_notes').value;
      if(!notas) {
          this.showToast('Debe ingresar el reporte o novedades detectadas del patrullaje', 'error');
          return;
      }
      PatrullajeService.finalizarPatrullaje(this.activePatrolId, notas);
      this.activePatrolId = null;
      sessionStorage.removeItem('cupaz_active_patrol');
      this.showToast("Patrullaje finalizado. Datos de cobertura enviados.", "success");
      this.renderPatrolArea();
      LogisticaService.actualizarEstado(this.currentUnitId, 'DISPONIBLE', 'Base');
  },

  // ============================================
  // ACTIVIDADES PREVENTIVAS
  // ============================================
  saveActivity() {
      const t = document.getElementById('prev_tipo').value;
      const te = document.getElementById('prev_tema').value;
      const l = document.getElementById('prev_lugar').value;
      const ev = document.getElementById('lbl_prev_evidencia').innerText;

      if(!te || !l) {
          this.showToast('Por favor complete tema y lugar de la actividad', 'error');
          return;
      }
      if(ev === 'Tocar para tomar foto') {
          this.showToast('Evidencia requerida para auditar la actividad', 'error');
          return;
      }

      const u = AuthService.getUserData();
      const miCuadrante = u?.cuadrante || 'CUPAZ-ASIGNADO';
      const responsable = u?.role === 'AUXILIAR DE CUADRANTE' ? u?.jefe : u?.username;

      PatrullajeService.guardarPrevencion({
          unidad: this.currentUnitId,
          fecha: new Date().toLocaleString(),
          tipo: t,
          tema: te,
          lugar: l,
          cuadrante: miCuadrante,
          operativo_id: responsable
      });

      this.showToast("Actividad preventiva registrada en base de datos.", "success");
      document.getElementById('formPrevAct').reset();
      document.getElementById('lbl_prev_evidencia').innerText = 'Tocar para tomar foto';
  },

  simulatePhoto(labelId) {
      document.getElementById(labelId).innerText = `IMG_${Date.now()}.jpg`;
      this.showToast("Foto capturada y anexada", "success");
  },

  // ============================================
  // CONSULTAS
  // ============================================
  renderQueries(tab = 'qHistorial') {
      const content = document.getElementById('qContent');
      if(!content) return;
      const u = AuthService.getUserData();
      const miCuadrante = u?.cuadrante || 'NO ASIGNADO';
      const miJefe = u?.role === 'AUXILIAR DE CUADRANTE' ? u?.jefe : 'Usted';

      if(tab === 'qHistorial') {
          // Filtramos primero por el cuadrante del usuario
          const prevs = PatrullajeService.getPrevenciones().filter(p => p.cuadrante === miCuadrante);
          const acts = prevs.slice(-3);
          if (acts.length == 0) {
              content.innerHTML = `<div class="p-3 text-center" style="color:#aaa">No hay historial reciente de su cuadrante.</div>`;
          } else {
              content.innerHTML = acts.map(a => `
                  <div style="padding:10px; border-bottom:1px solid #334155; margin-bottom:5px;">
                      <div style="color:var(--primary-color); font-weight:bold">${a.tipo}</div>
                      <div style="color:#fff; font-size:0.9rem">${a.tema} - ${a.lugar}</div>
                      <div style="color:#64748b; font-size:0.8rem">${a.fecha}</div>
                  </div>
              `).join('');
          }
      } 
      else if(tab === 'qRecursos') {
          content.innerHTML = `
              <div style="padding:10px; color:#ddd;">
                  <li><strong>UNIDAD BASE:</strong> MDT-${this.currentUnitId || 'N/A'}</li>
                  <li><strong>TELÉFONO:</strong> +58-XXX-XXXX</li>
                  <li><strong>EQUIPO:</strong> Radio Táctico CH-4</li>
              </div>
          `;
      }
      else if(tab === 'qComuna') {
          content.innerHTML = `
              <div class="tac-card mt-3">
                  <div style="color:var(--primary-color); font-weight:bold;">CUADRANTE Y COMUNA: ${miCuadrante}</div>
                  <p style="color:#fff;">Responsable (Jefe): ${miJefe || 'No Especificado'}</p>
                  <p style="color:#aaa; font-size:0.85rem; margin-top:5px;">Esta terminal registra incidencias bajo la cadena de custodia de la jefatura de cuadrante especificada.</p>
              </div>
          `;
      }
  },

  async showToast(msg, type = 'info') {
    const v = await import('../Application/ViewRenderer.js');
    v.ViewRenderer.showToast(msg, type);
  }
};
