/**
 * Presentacion/Controllers/Logistica/Logistica.controller.js
 * Controlador del Módulo 8 - Gestión de Recursos
 */

import { DataManager } from '../../Persistencia/localStorage.js';
import { LogisticaService } from '../../Service/Logistica.service.js';
import { AdministracionService } from '../../Service/Administracion.service.js';
import { Validator } from '../Components/UI/Validator.js';

export const controller = {
  async init(props) {
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Initializar inventario si no existe (RF-14)
    LogisticaService.inicializarInventario();

    this.renderGrid();
    this.updateKPIs();
    this.renderTableBitacora();
    this.initEvents();
    window.logisticaCtrl = this;
    window.switchLogisticaTab = (tab) => this.switchTab(tab);
    return () => {
        this.destroy();
        window.logisticaCtrl = null;
    };
  },

  renderGrid(filteredData = null) {
    const grid = document.getElementById('resourceGrid');
    if (!grid) return;

    const data = filteredData || LogisticaService.getRecursos();
    if (data.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--text-muted);">
            <i class="fas fa-search" style="font-size: 2rem; opacity: 0.2; margin-bottom: 10px;"></i><br>
            No se encontraron recursos que coincidan con la búsqueda.
        </div>`;
        return;
    }
    
    grid.innerHTML = data.map(r => `
        <div class="resource-card">
            <span class="status-pill status-${this.getStatusClass(r.estatus)}">${r.estatus}</span>
            <div class="resource-icon-box">
                <i class="fas ${this.getIcon(r.tipo)}"></i>
            </div>
            <div>
                <div class="resource-id-tag">${r.id}</div>
                <div class="resource-subtext">${r.nombre}</div>
                <div style="font-size:0.6rem; color:var(--text-muted); margin-top:5px;">
                    <i class="fas fa-map-marker-alt"></i> ${r.cuadrante || 'Sin Asignación'} <br>
                    <i class="fas fa-user-shield"></i> ${r.funcionario || 'S/R'}
                </div>
            </div>
            <div class="resource-footer">
                <button class="btn-action-admin w-full" onclick="window.logisticaCtrl.openModal('${r.id}')">
                    <i class="fas fa-edit"></i> GESTIONAR
                </button>
            </div>
        </div>
    `).join('');
  },

  updateKPIs() {
     const stats = LogisticaService.getEstadisticas();

     if(document.getElementById('totRecursos')) document.getElementById('totRecursos').innerText = stats.total;
     if(document.getElementById('totOperativos')) document.getElementById('totOperativos').innerText = stats.operativos;
     if(document.getElementById('totDespliegue')) document.getElementById('totDespliegue').innerText = stats.despliegue;
     if(document.getElementById('totMantenimiento')) document.getElementById('totMantenimiento').innerText = stats.mantenimiento;
  },

  switchTab(tabId) {
      document.getElementById('tabInventarioLog').classList.remove('active');
      document.getElementById('tabBitacoraLog').classList.remove('active');
      
      document.getElementById('panelInventarioLog').style.display = 'none';
      document.getElementById('panelBitacoraLog').style.display = 'none';

      if (tabId === 'inventario') {
          document.getElementById('tabInventarioLog').classList.add('active');
          document.getElementById('panelInventarioLog').style.display = 'block';
      } else {
          document.getElementById('tabBitacoraLog').classList.add('active');
          document.getElementById('panelBitacoraLog').style.display = 'block';
      }
  },

  getStatusClass(estatus) {
    const e = (estatus || '').toLowerCase();
    if (e === 'disponible') return 'captado';
    if (e === 'asignado') return 'despachado';
    if (e === 'en_mantenimiento' || e === 'en mantenimiento') return 'mantenimiento';
    if (e === 'dado_baja' || e === 'dado baja') return 'inactivo';
    return 'inactivo';
  },

  getIcon(tipo) {
    const icons = { 
        'vehiculo': 'fa-car', 
        'equipo': 'fa-walkie-talkie',
        'telefono': 'fa-mobile-alt',
        'otro': 'fa-box'
    };
    return icons[tipo] || 'fa-box';
  },

  toggleTypeFields() {
      const type = document.getElementById('selResourceType').value;
      document.querySelectorAll('.type-specific-fields').forEach(el => el.style.display = 'none');
      if (type) {
          const target = document.getElementById(`fields_${type}`);
          if (target) target.style.display = 'block';
      }
  },

  initEvents() {
    const btnNuevo = document.getElementById('btnNuevoRecurso');
    if (btnNuevo) btnNuevo.onclick = () => this.openModal();
    
    document.getElementById('closeRecursoModal').onclick = () => this.hide();
    document.getElementById('btnCancelarRecurso').onclick = () => this.hide();

    const btnGuardar = document.getElementById('btnGuardarRecurso');
    if (btnGuardar) btnGuardar.onclick = () => this.executeSave();

    // Se deshabilita validación reactiva que dependía del controlador
    document.querySelectorAll('#formRecurso input, #formRecurso select, #formRecurso textarea').forEach(el => {
        el.addEventListener('input', () => this.clearErrors());
    });

    const selStatus = document.getElementById('selResourceStatus');
    if (selStatus) {
        selStatus.onchange = () => {
            const obs = document.getElementById('groupObservation');
            const val = selStatus.value;
            obs.style.display = (val === 'en_mantenimiento' || val === 'dado_baja') ? 'block' : 'none';
        };
    }

    const btnReporte = document.getElementById('btnReporteCuadrante');
    if (btnReporte) btnReporte.onclick = () => this.abrirSelectorCuadranteReporte();

    // FILTRO EN TIEMPO REAL (REQ: Búsqueda dinámica)
    const searchInput = document.getElementById('resourceSearch');
    if (searchInput) {
        searchInput.oninput = (e) => {
            const filtered = LogisticaService.buscarRecursos(e.target.value);
            this.renderGrid(filtered);
            this.renderTableBitacora(filtered);
        };
    }
  },

  openModal(resourceId = null) {
      const modal = document.getElementById('modalRecurso');
      const form = document.getElementById('formRecurso');
      const title = modal.querySelector('.modal-title');
      form.reset();
      this.clearErrors();
      this.toggleTypeFields();

      // CARGA DE SELECTS DINÁMICOS
      const selCuad = document.getElementById('selResourceCuadrante');
      const cuadrantes = AdministracionService.getEntidad('cuadrantes').filter(c => c.estado === 'Activo');
      
      if (cuadrantes.length === 0) {
          window.cupazAlert("Advertencia: No hay cuadrantes activos registrados en el sistema. Debe crear cuadrantes antes de gestionar recursos, ya que la asignación es estricta.", "DEPENDENCIAS FALTANTES");
      }

      selCuad.innerHTML = '<option value="">-- Seleccione un Cuadrante --</option>' + 
          cuadrantes.map(q => `<option value="${q.codigo}">${q.nombre} (${q.codigo})</option>`).join('');

      const selFunc = document.getElementById('selResourceFuncionario');
      const funcionarios = AdministracionService.getUsuarios().filter(u => u.estado === 'ACTIVO');
      selFunc.innerHTML = '<option value="">-- Seleccione un Funcionario --</option>' + 
          funcionarios.map(u => `<option value="${u.name}">${u.name} (${u.role})</option>`).join('');

      if (resourceId) {
          const r = LogisticaService.getRecursoPorId(resourceId);
          if (r) {
              title.innerText = 'Gestionar Recurso';
              document.getElementById('editResourceID_Hidden').value = r.id;
              document.getElementById('txtResourceID').value = r.id;
              document.getElementById('txtResourceID').disabled = true;
              document.getElementById('selResourceType').value = r.tipo;
              this.toggleTypeFields();
              
              document.getElementById('txtResourceName').value = r.nombre;
              document.getElementById('selResourceStatus').value = r.estatus;
              document.getElementById('selResourceCuadrante').value = r.cuadrante || '';
              document.getElementById('selResourceFuncionario').value = r.funcionario || '';

              // Cargar campos específicos
              if (r.tipo === 'vehiculo') {
                  document.getElementById('v_placa').value = r.placa || '';
                  document.getElementById('v_marca').value = r.marca || '';
                  document.getElementById('v_modelo').value = r.modelo || '';
                  document.getElementById('v_anio').value = r.anio || '';
                  document.getElementById('v_capacidad').value = r.capacidad || '';
                  document.getElementById('v_tipo').value = r.tipo_v || 'SEDAN';
              } else if (r.tipo === 'equipo') {
                  document.getElementById('e_tipo').value = r.tipo_e || '';
                  document.getElementById('e_estado_fisico').value = r.estado_f || '';
              } else if (r.tipo === 'telefono') {
                  document.getElementById('t_linea').value = r.linea || '';
                  document.getElementById('t_imei').value = r.imei || '';
              }
          }
      } else {
          title.innerText = 'Registrar Nuevo Recurso';
          document.getElementById('editResourceID_Hidden').value = '';
          document.getElementById('txtResourceID').disabled = false;
          document.getElementById('selResourceStatus').value = 'disponible';
      }
      modal.classList.add('active');
  },

  hide() { document.getElementById('modalRecurso').classList.remove('active'); },

  clearErrors() {
      document.querySelectorAll('#formRecurso span.pb-error').forEach(s => { s.innerText = ''; s.style.display = 'none'; });
      document.querySelectorAll('#formRecurso .pb-input, #formRecurso .pb-select').forEach(el => el.classList.remove('invalid'));
  },

  showError(id, msg) {
      const span = document.getElementById(id);
      const inp = document.getElementById(id.replace('err_', ''));
      if (span) { span.innerText = msg; span.style.display = 'block'; }
      if (inp) inp.classList.add('invalid');
  },

  executeSave() {
      const editId = document.getElementById('editResourceID_Hidden').value;
      const tipo = document.getElementById('selResourceType').value;
      const nextStatus = document.getElementById('selResourceStatus').value;
      const nextCuad = document.getElementById('selResourceCuadrante').value;
      const nextFunc = document.getElementById('selResourceFuncionario').value;
      const obsTxt = document.getElementById('txtObservation') ? document.getElementById('txtObservation').value.trim() : '';

      this.clearErrors();

      const data = {
          id: document.getElementById('txtResourceID').value.trim().toUpperCase(),
          tipo: tipo,
          nombre: document.getElementById('txtResourceName').value.trim(),
          estatus: nextStatus,
          cuadrante: nextCuad,
          funcionario: nextFunc,
          placa: (document.getElementById('v_placa') || {}).value || '',
          marca: (document.getElementById('v_marca') || {}).value || '',
          modelo: (document.getElementById('v_modelo') || {}).value || '',
          anio: (document.getElementById('v_anio') || {}).value || '',
          capacidad: (document.getElementById('v_capacidad') || {}).value || '',
          tipo_v: (document.getElementById('v_tipo') || {}).value || '',
          tipo_e: (document.getElementById('e_tipo') || {}).value || '',
          estado_f: (document.getElementById('e_estado_fisico') || {}).value || '',
          linea: (document.getElementById('t_linea') || {}).value || '',
          imei: (document.getElementById('t_imei') || {}).value || ''
      };

      // Ficha Técnica específica limpeza
      if (tipo === 'vehiculo') {
          data.placa = data.placa.toUpperCase().trim();
          data.marca = data.marca.trim();
          data.modelo = data.modelo.trim();
      } else if (tipo === 'telefono') {
          data.linea = data.linea.trim();
          data.imei = data.imei.trim();
      }

      // USO DEL COMPONENTE UI VALIDADOR
      const baseRules = {
          id: 'required',
          tipo: 'required',
          nombre: 'required',
          cuadrante: 'required',
          funcionario: 'required',
          estatus: 'required'
      };

      if (tipo === 'vehiculo') {
          Object.assign(baseRules, { placa: 'required', marca: 'required', modelo: 'required', anio: 'required', capacidad: 'required', tipo_v: 'required' });
      } else if (tipo === 'equipo') {
          Object.assign(baseRules, { tipo_e: 'required', estado_f: 'required' });
      } else if (tipo === 'telefono') {
          Object.assign(baseRules, { linea: 'required', imei: 'required|length:15' });
      }

      const formErrors = Validator.validate(data, baseRules);
      
      if (formErrors) {
          const mapaIds = {
              id: 'txtResourceID', tipo: 'selResourceType', nombre: 'txtResourceName',
              cuadrante: 'selResourceCuadrante', funcionario: 'selResourceFuncionario', estatus: 'selResourceStatus',
              placa: 'v_placa', marca: 'v_marca', modelo: 'v_modelo', anio: 'v_anio', capacidad: 'v_capacidad', tipo_v: 'v_tipo',
              tipo_e: 'e_tipo', estado_f: 'e_estado_fisico',
              linea: 't_linea', imei: 't_imei'
          };
          for (const [key, msg] of Object.entries(formErrors)) {
              if (mapaIds[key]) this.showError('err_' + mapaIds[key], msg);
          }
          window.cupazToast("Por favor corrija los campos requeridos marcados en el formulario", "error");
          return;
      }

      // Req 3: Observación obligatoria para Mantenimiento/Baja
      if ((nextStatus === 'en_mantenimiento' || nextStatus === 'dado_baja') && !obsTxt) {
          this.showError('err_txtObservation', 'Debe indicar el motivo detallado para mantenimiento o baja');
          return;
      }

      try {
          LogisticaService.gestionarRecurso(data, editId, obsTxt);
          
          this.hide();
          this.renderGrid();
          this.updateKPIs();
          this.renderTableBitacora();

          // Feedback visual institucional (REQ: Éxito visual)
          window.cupazToast(`Recurso ${data.id} ${editId ? 'actualizado' : 'registrado'} correctamente en el Inventario Nacional.`, 'success');
      } catch (error) {
          if (error.isValidationError) {
              const mapaIds = {
                  id: 'txtResourceID', tipo: 'selResourceType', nombre: 'txtResourceName',
                  cuadrante: 'selResourceCuadrante', funcionario: 'selResourceFuncionario', estatus: 'selResourceStatus',
                  placa: 'v_placa', marca: 'v_marca', modelo: 'v_modelo', anio: 'v_anio', capacidad: 'v_capacidad', tipo_v: 'v_tipo',
                  tipo_e: 'e_tipo', estado_f: 'e_estado_fisico',
                  linea: 't_linea', imei: 't_imei'
              };
              for (const [key, msg] of Object.entries(error.errors)) {
                  if (mapaIds[key]) this.showError('err_' + mapaIds[key], msg);
              }
              window.cupazToast("Por favor corrija los errores marcados en el formulario", "error");
          } else if (error.message && error.message.includes("Restricción")) {
              window.cupazAlert(error.message, "ERROR DE NEGOCIO");
          } else if (error.message && error.message.includes("Duplicado")) {
              this.showError('err_txtResourceID', error.message);
          } else {
              window.cupazAlert(error.message, "ERROR");
          }
      }
  },

  renderTableBitacora(filteredData = null) {
      const data = filteredData || LogisticaService.getRecursos() || [];
      const tb = document.getElementById('logisticaTableBody');
      if (!tb) return;
      
      let allLogs = [];
      data.forEach(r => {
          if (r.historial && r.historial.length > 0) {
              r.historial.forEach(h => {
                  allLogs.push({ ...h, r_id: r.id, r_nombre: r.nombre, r_estatus: r.estatus });
              });
          }
      });

      // Ordenar por fecha descendente
      allLogs.sort((a,b) => {
          const tA = new Date(a.fecha.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3')).getTime() || 0;
          const tB = new Date(b.fecha.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3')).getTime() || 0;
          return tB - tA;
      });
      
      if (allLogs.length === 0) {
          tb.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:var(--text-muted);">No hay historiales de movimiento.</td></tr>';
          return;
      }

      tb.innerHTML = allLogs.map(log => `
          <tr>
              <td><b>${log.r_id}</b> <br> <span class="log-cell-sub">${log.r_nombre}</span></td>
              <td><span class="log-small-text"><b>${log.fecha}</b></span></td>
              <td style="font-size:0.75rem; color:#475569;">${log.cambio} <br><i style="color:#94a3b8">${log.observacion ? '('+log.observacion+')' : ''}</i></td>
              <td><span class="status-pill status-${this.getStatusClass(log.r_estatus)}">${(log.r_estatus || 'N/A').toUpperCase().replace('_', ' ')}</span></td>
          </tr>
      `).join('');
  },

  abrirSelectorCuadranteReporte() {
      const cuadrantes = AdministracionService.getEntidad('cuadrantes').filter(c => c.estado === 'Activo');
      if (cuadrantes.length === 0) {
          window.cupazAlert("No hay cuadrantes registrados para generar reportes.", "SIN DATOS");
          return;
      }

      const options = cuadrantes.map(q =>
          `<option value="${q.codigo}">${q.nombre} (${q.codigo})</option>`
      ).join('');

      import('../Components/UI/Dialog.js').then(m => {
          const Dialog = m.Dialog;
          const content = `
            <div class="pb-group">
                <label class="pb-label">Cuadrante de Paz *</label>
                <select id="reportQuadId" class="pb-select">
                    <option value="">-- Seleccione un cuadrante --</option>
                    ${options}
                </select>
                <p class="u-text-xs u-text-muted u-mt-8">Seleccione el cuadrante para consolidar la dotación táctica en PDF.</p>
            </div>
          `;
          const footer = `
            <button class="modal-btn cancel" id="btnCancelRep">CANCELAR</button>
            <button class="modal-btn save" id="btnGenerateRep">GENERAR PDF</button>
          `;

          const modal = Dialog.openModal({
              title: 'Selector de Reporte de Dotación',
              content: content,
              footer: footer,
              maxWidth: '420px'
          });

          modal.querySelector('#btnCancelRep').onclick = () => modal.remove();
          modal.querySelector('#btnGenerateRep').onclick = () => {
              const cod = modal.querySelector('#reportQuadId').value;
              if (!cod) {
                  window.cupazToast("Debe seleccionar un cuadrante.", "error");
                  return;
              }
              const c = cuadrantes.find(q => q.codigo === cod);
              if (c) {
                  modal.remove();
                  this.generarReporteCuadrantePDF(c);
              } else {
                  window.cupazToast("Cuadrante no encontrado en la base de datos.", "error");
              }
          };
      });
  },

  generarReporteCuadrantePDF(quad) {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      const pageW = doc.internal.pageSize.getWidth();
      
      // Metadatos
      const recursos = LogisticaService.getRecursos().filter(r => r.cuadrante === quad.codigo);
      const usuarios = AdministracionService.getUsuarios() || [];
      const jefe = usuarios.find(u => u.role === 'JEFE DE CUADRANTE' && u.cuadrante === quad.codigo) || { name: 'PENDIENTE ASIGNACIÓN' };
      const auxs = usuarios.filter(u => u.role === 'AUXILIAR').slice(0, 2); // Simulado

      // Encabezado
      doc.setFillColor(29, 53, 87);
      doc.rect(0, 0, pageW, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16); doc.setFont('helvetica', 'bold');
      doc.text('CUPAZ - REPORTE FORMAL DE DOTACIÓN Y LOGÍSTICA', pageW / 2, 12, { align: 'center' });
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      doc.text(`CUADRANTE DE PAZ: ${quad.nombre} (${quad.codigo})`, pageW / 2, 22, { align: 'center' });
      doc.text(`Fecha de Emisión: ${new Date().toLocaleString()}`, pageW / 2, 28, { align: 'center' });

      doc.setTextColor(33, 33, 33);
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('1. PERSONAL OPERATIVO RESPONSABLE', 15, 45);
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.text(`Jefe de Cuadrante: ${jefe.name}`, 15, 52);
      doc.text(`Auxiliares Asignados: ${auxs.map(a => a.name).join(', ') || 'Sín Auxiliares'}`, 15, 57);

      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('2. ESTADO DE BIENES NACIONALES ASIGNADOS', 15, 67);
      
      const rows = recursos.map(r => [
          r.id,
          r.tipo,
          r.nombre,
          r.estatus.toUpperCase(),
          r.estatus === 'disponible' ? 'OPERATIVO' : 'REVISIÓN/DESPLIEGUE'
      ]);

      doc.autoTable({
          startY: 72,
          head: [['CÓDIGO', 'TIPO', 'DESCRIPCIÓN', 'ESTATUS', 'CONDICIÓN']],
          body: rows.length > 0 ? rows : [['-', '-', 'Sin recursos asociados', '-', '-']],
          styles: { fontSize: 8 },
          headStyles: { fillColor: [29, 53, 87] }
      });

      let nextY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('3. ELEMENTOS DE SEGURIDAD Y DOTACIÓN (CONTEO)', 15, nextY);
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      nextY += 7;
      doc.text(`• Radios Portátiles: ${recursos.filter(r => r.tipo === 'equipo').length} uds.`, 15, nextY);
      doc.text(`• Linternas / Conos / Esposas: 02 / 04 / 02 uds. (Dotación Base)`, 15, nextY + 5);

      nextY += 15;
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('4. CARACTERÍSTICAS TÉCNICAS (VEHÍCULO Y COMUNICACIÓN)', 15, nextY);
      const vehs = recursos.filter(r => r.tipo === 'vehiculo');
      const tels = recursos.filter(r => r.tipo === 'telefono');
      
      nextY += 7;
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      if (vehs.length > 0) {
          doc.text(`Vehículo: ${vehs[0].marca} ${vehs[0].modelo} | Placa: ${vehs[0].placa} | Año: ${vehs[0].anio}`, 15, nextY);
      } else doc.text('Vehículo: NO ASIGNADO', 15, nextY);

      if (tels.length > 0) {
          doc.text(`Teléfono: ${tels[0].linea} | IMEI: ${tels[0].imei} | Marca: Samsung/Modelo G`, 15, nextY + 5);
      } else doc.text('Comunicación: SIN TELÉFONO OFICIAL', 15, nextY + 5);

      doc.setFontSize(8); doc.setTextColor(150);
      doc.text('SIT-CUPAZ Documento de Control Logístico Confidencial', pageW/2, 285, { align: 'center' });

      doc.save(`Reporte_Logistica_${quad.codigo}.pdf`);
  },

  destroy() {
      delete window.switchLogisticaTab;
      delete window.logisticaCtrl;
  }
};

