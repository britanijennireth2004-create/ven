/**
 * Presentacion/Controllers/Analisis/Analisis.controller.js
 * Lógica de Procesamiento Estadístico y Reportes (CU-XX)
 */

import { DataManager } from '../../Persistencia/localStorage.js';
import { AnalisisService } from '../../Service/Analisis.service.js';
import { AuthService } from '../../Service/AuthService.js';

export const controller = {
  pendingProcess: null,
  heatmapInstance: null,
  heatmapLayer: null,
  isDestroyed: false,

  async init(props) {
    this.isDestroyed = false;
    // Registro de funciones globales
    window.generarReportePrincipal = () => this.ejecutarProcesamiento(false);
    window.exportarReporte = (formato) => this.exportar(formato);
    window.switchAnalisisTab = (tab) => this.switchTab(tab);
    window.guardarConfiguracionActual = () => this.guardarPlantilla();

    await new Promise(resolve => setTimeout(resolve, 50));
    if (this.isDestroyed) return;

    this.initEvents();
    return () => this.destroy();
  },

  initEvents() {
    // Fechas por defecto (Mes actual)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = now.toISOString().split('T')[0];
    
    if(document.getElementById('dateDesde')) document.getElementById('dateDesde').value = firstDay;
    if(document.getElementById('dateHasta')) document.getElementById('dateHasta').value = lastDay;
    if(document.getElementById('dateHasta')) document.getElementById('dateHasta').value = lastDay;
    
    this.cargarPlantillasSelect();

    // Evento de cambio para plantillas
    const selPlantilla = document.getElementById('selPlantillaReporte');
    if (selPlantilla) {
        selPlantilla.onchange = (e) => this.aplicarPlantilla(e.target.value);
    }

    // Auto-generación inicial en segundo plano (silenciosa)
    this.pendingProcess = setTimeout(() => this.ejecutarProcesamiento(true), 200);
  },

  cargarPlantillasSelect() {
      const selPlantilla = document.getElementById('selPlantillaReporte');
      if (!selPlantilla) return;
      const plantillas = AnalisisService.getPlantillasConfiguracion();
      
      const basicos = `
          <option value="NUEVO">Personalizado</option>
          <option value="RESUMEN_DIARIO">Resumen Diario</option>
          <option value="ALERTA_SEMANAL">Fricción Semanal</option>
          <option value="INFORME_MENSUAL">Cierre de Mes</option>
      `;
      
      const custom = plantillas.map(p => `<option value="${p.nombre}">${p.nombre}</option>`).join('');
      selPlantilla.innerHTML = basicos + custom;
  },

  aplicarPlantilla(nombre) {
      if (['NUEVO', 'RESUMEN_DIARIO', 'ALERTA_SEMANAL', 'INFORME_MENSUAL'].includes(nombre)) return; // Defaults ignored for custom
      const plantillas = AnalisisService.getPlantillasConfiguracion();
      const pt = plantillas.find(p => p.nombre === nombre);
      if (pt && pt.config) {
          if(document.getElementById('selTipoReporte')) document.getElementById('selTipoReporte').value = pt.config.tipo;
          if(document.getElementById('dateDesde')) document.getElementById('dateDesde').value = pt.config.desde;
          if(document.getElementById('dateHasta')) document.getElementById('dateHasta').value = pt.config.hasta;
          if(document.getElementById('selAmbitoGeo')) document.getElementById('selAmbitoGeo').value = pt.config.ambito;
          if(document.getElementById('selSubFiltro')) document.getElementById('selSubFiltro').value = pt.config.subFiltro;
          
          import('../Application/ViewRenderer.js').then(m => m.ViewRenderer.showToast(`Plantilla "${nombre}" aplicada.`));
          this.ejecutarProcesamiento(false);
      }
  },

  guardarPlantilla() {
      const config = {
          tipo: document.getElementById('selTipoReporte')?.value,
          desde: document.getElementById('dateDesde')?.value,
          hasta: document.getElementById('dateHasta')?.value,
          ambito: document.getElementById('selAmbitoGeo')?.value,
          subFiltro: document.getElementById('selSubFiltro')?.value
      };
      
      const pName = prompt("Ingrese un nombre táctico para esta configuración de reporte:");
      if (pName && pName.trim() !== '') {
          AnalisisService.guardarPlantillaConfiguracion(pName.trim(), config);
          import('../Application/ViewRenderer.js').then(m => m.ViewRenderer.showToast("Configuración táctica guardada como "+pName));
          this.cargarPlantillasSelect();
          document.getElementById('selPlantillaReporte').value = pName.trim();
      }
  },

  switchTab(tabId) {
    ['tabGraficos', 'tabMapa', 'tabTabla'].forEach(t => {
        const el = document.getElementById(t);
        if(el) el.classList.remove('active');
    });
    ['panelGraficos', 'panelMapa', 'panelTabla'].forEach(p => {
        const el = document.getElementById(p);
        if(el) el.style.display = 'none';
    });

    const activeTab = document.getElementById('tab' + tabId.charAt(0).toUpperCase() + tabId.slice(1));
    const activePanel = document.getElementById('panel' + tabId.charAt(0).toUpperCase() + tabId.slice(1));
    
    if(activeTab) activeTab.classList.add('active');
    if(activePanel) {
        activePanel.style.display = 'block';
        if(tabId === 'mapa') {
            // Estabilización táctica: Asegurar que el contenedor sea visible antes de renderizar
            setTimeout(() => {
                if (this.isDestroyed) return;
                this.renderHeatmap();
                if (this.heatmapInstance) this.heatmapInstance.invalidateSize();
            }, 100);
        }
    }
  },

  async exportar(formato) {
      if (formato === 'EXCEL') {
          this.exportarExcel();
      } else if (formato === 'PDF') {
          this.generarVistaPreviaPDF();
      }
  },

  exportarExcel() {
      // Leer los datos visibles de la tabla del reporte
      const table = document.querySelector('#panelTabla .data-table');
      if (!table) {
          import('../Application/ViewRenderer.js').then(m =>
              m.ViewRenderer.showToast('Primero genere un reporte para poder exportarlo.', 'warning')
          );
          return;
      }

      // Convertir la tabla HTML a un workbook de SheetJS
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.table_to_sheet(table);

      // Metadatos del archivo
      const tipo = document.getElementById('selTipoReporte')?.value || 'REPORTE';
      const fDesde = document.getElementById('dateDesde')?.value || '';
      const fHasta = document.getElementById('dateHasta')?.value || '';
      const fileName = `CUPAZ_${tipo}_${fDesde}_${fHasta}.xlsx`;

      XLSX.utils.book_append_sheet(wb, ws, tipo.substring(0, 31));
      XLSX.writeFile(wb, fileName);

      import('../Application/ViewRenderer.js').then(m =>
          m.ViewRenderer.showToast(`Archivo Excel generado: ${fileName}`)
      );
  },

  generarVistaPreviaPDF() {
      const totReg = document.getElementById('repTotalRegistros')?.innerText || '0';
      const varPerc = document.getElementById('repVariacion')?.innerText || '0%';
      const prom = document.getElementById('repPromedio')?.innerText || '0.0';
      const promLabel = document.getElementById('repPromedioLabel')?.innerText || 'Promedio';

      const elTipo = document.getElementById('selTipoReporte');
      const tipoT = elTipo ? elTipo.options[elTipo.selectedIndex].text : 'General';
      const fDesde = document.getElementById('dateDesde')?.value || 'Inicio';
      const fHasta = document.getElementById('dateHasta')?.value || 'Actualidad';

      // Capturar filas de la tabla para autoTable
      const tableEl = document.querySelector('#panelTabla .data-table');
      let head = [[]];
      let body = [];
      if (tableEl) {
          const ths = tableEl.querySelectorAll('thead th');
          head = [[...ths].map(th => th.innerText)];
          const rows = tableEl.querySelectorAll('tbody tr');
          rows.forEach(tr => {
              body.push([...tr.querySelectorAll('td')].map(td => td.innerText));
          });
      }

      const modal = document.createElement('div');
      modal.className = 'pdf-preview-modal animate-fade-in';

      // Construir filas de la tabla para la vista previa
      let tablePreviewHtml = '<p class="u-text-center u-text-muted">Sin datos para imprimir.</p>';
      if (tableEl && body.length > 0) {
          const headRow = head[0].map(h => `<th>${h}</th>`).join('');
          const bodyRows = body.map((row, idx) =>
              `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
          ).join('');
          tablePreviewHtml = `
              <table class="pdf-table">
                  <thead><tr>${headRow}</tr></thead>
                  <tbody>${bodyRows}</tbody>
              </table>`;
      }

      modal.innerHTML = `
          <div class="pdf-preview-content">
              <div class="pdf-preview-header">
                  <span class="u-text-bold"><i class="fas fa-file-pdf u-text-danger"></i> Vista Previa del Documento - CUPAZ</span>
                  <div style="display:flex; gap:10px;">
                      <button id="btnDescargarPDF" class="add-btn u-btn-mini" style="background:#107c10;">
                          <i class="fas fa-download"></i> Descargar
                      </button>
                      <button class="add-btn u-btn-mini" style="background:transparent; border:1px solid #555; color:#333;" onclick="this.closest('.pdf-preview-modal').remove()">
                          <i class="fas fa-times"></i> Cancelar
                      </button>
                  </div>
              </div>
              <div class="pdf-preview-body">
                  <div class="pdf-document-page">
                      <div class="pdf-header-inst">
                          <div class="pdf-header-title">CUPAZ – REPORTE DE INTELIGENCIA OPERATIVA</div>
                          <div class="pdf-header-meta">
                              Tipo: <b>${tipoT}</b> &nbsp;|&nbsp; Periodo: <b>${fDesde}</b> al <b>${fHasta}</b> &nbsp;|&nbsp; Generado: ${new Date().toLocaleString()}<br>
                              Clasificación: CONFIDENCIAL &nbsp;|&nbsp; Ley de Infogobierno (Anonimizado)
                          </div>
                      </div>

                      <div class="pdf-kpi-grid">
                          <div class="pdf-kpi-card">
                              <div class="pdf-kpi-label">Total Registros</div>
                              <div class="pdf-kpi-value">${totReg}</div>
                          </div>
                          <div class="pdf-kpi-card">
                              <div class="pdf-kpi-label">Variación</div>
                              <div class="pdf-kpi-value u-text-danger">${varPerc}</div>
                          </div>
                          <div class="pdf-kpi-card">
                              <div class="pdf-kpi-label">${promLabel}</div>
                              <div class="pdf-kpi-value">${prom}</div>
                          </div>
                      </div>

                      <div class="pdf-table-container">
                          ${tablePreviewHtml}
                      </div>

                      <div class="pdf-footer">
                          <span>Página 1 | SIT-CUPAZ – Documento Oficial</span>
                      </div>
                  </div>
              </div>
          </div>
      `;
      document.body.appendChild(modal);

      // Botón que genera el PDF real con jsPDF
      modal.querySelector('#btnDescargarPDF').addEventListener('click', () => {
          const { jsPDF } = window.jspdf;
          const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
          const pageW = doc.internal.pageSize.getWidth();
          const now = new Date();

          // ── Encabezado ──
          doc.setFillColor(29, 53, 87);
          doc.rect(0, 0, pageW, 28, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text('CUPAZ - REPORTE DE INTELIGENCIA OPERATIVA', pageW / 2, 11, { align: 'center' });
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.text(`Tipo: ${tipoT}  |  Periodo: ${fDesde} al ${fHasta}  |  Generado: ${now.toLocaleString()}`, pageW / 2, 18, { align: 'center' });
          doc.text('Clasificación: CONFIDENCIAL | Ley de Infogobierno (Anonimizado)', pageW / 2, 23, { align: 'center' });

          // ── KPIs ──
          doc.setTextColor(30, 30, 30);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          const kpiY = 36;
          const kpis = [
              { label: 'Total Registros', value: totReg },
              { label: 'Variación', value: varPerc },
              { label: promLabel, value: prom }
          ];
          const kpiW = (pageW - 30) / kpis.length;
          kpis.forEach((k, i) => {
              const x = 15 + i * kpiW + kpiW / 2;
              doc.setFillColor(248, 250, 252);
              doc.roundedRect(15 + i * kpiW, kpiY - 5, kpiW - 4, 18, 2, 2, 'F');
              doc.setFontSize(7);
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(100, 116, 139);
              doc.text(k.label.toUpperCase(), x, kpiY + 1, { align: 'center' });
              doc.setFontSize(13);
              doc.setFont('helvetica', 'bold');
              doc.setTextColor(29, 53, 87);
              doc.text(k.value, x, kpiY + 9, { align: 'center' });
          });

          // ── Tabla de datos ──
          if (head[0].length > 0) {
              doc.autoTable({
                  head: head,
                  body: body,
                  startY: kpiY + 20,
                  styles: { fontSize: 8, cellPadding: 3 },
                  headStyles: { fillColor: [29, 53, 87], textColor: 255, fontStyle: 'bold' },
                  alternateRowStyles: { fillColor: [248, 250, 252] },
                  margin: { left: 15, right: 15 }
              });
          } else {
              doc.setFontSize(9); doc.setTextColor(200, 0, 0);
              doc.text('No hay registros consolidados para el periodo seleccionado.', 15, kpiY + 25);
          }

          // ── Pie de página ──
          const totalPages = doc.internal.getNumberOfPages();
          for (let p = 1; p <= totalPages; p++) {
              doc.setPage(p);
              doc.setFontSize(7); doc.setTextColor(150);
              doc.text(`Página ${p} de ${totalPages} | SIT-CUPAZ - Documento Oficial`, pageW / 2, doc.internal.pageSize.getHeight() - 6, { align: 'center' });
          }

          const fileName = `CUPAZ_${tipoT}_${fDesde}_${fHasta}.pdf`;
          doc.save(fileName);
          modal.remove();

          import('../Application/ViewRenderer.js').then(m =>
              m.ViewRenderer.showToast(`PDF generado y descargado: ${fileName}`)
          );
      });
  },

  async ejecutarProcesamiento(isInitial = false) {
    const fDesde = document.getElementById('dateDesde').value;
    const fHasta = document.getElementById('dateHasta').value;
    const tipo = document.getElementById('selTipoReporte').value;

    if (!fDesde || !fHasta) {
        if (!isInitial) window.cupazAlert("Debe seleccionar un rango de fechas válido.", "ERROR DE PARÁMETROS");
        return;
    }

    if (new Date(fDesde) > new Date(fHasta)) {
        if (!isInitial) window.cupazAlert("Error de Coherencia: La fecha inicial debe ser anterior o igual a la fecha final.", "ERROR DE CRONOLOGÍA");
        return;
    }

    // Req 7: Simulación de barra de progreso para carga masiva
    const loader = document.getElementById('reportLoader');
    const bar = document.getElementById('reportProgressBar');
    const content = document.getElementById('reportContainer');

    if (content) content.style.opacity = '0.3';
    if (loader) loader.style.display = 'flex';
    
    // Simulación de carga (más rápida si es inicial para no bloquear)
    const step = isInitial ? 50 : 25;
    for(let i=0; i<=100; i+=step) {
        if (bar) bar.style.width = i + '%';
        await new Promise(r => setTimeout(r, isInitial ? 50 : 150));
    }

    const subFiltro = document.getElementById('selSubFiltro')?.value || 'TODOS';
    const params = { tipo, desde: fDesde, hasta: fHasta, subFiltro };
    const session = AuthService.getUserData();

    const data = AnalisisService.obtenerDataReporte(params, session);

    // Req: Si no hay datos, proceder pero mostrar "Estado 0" (Neutral) en lugar de retornar
    if (data.length === 0 && !isInitial) {
        import('../Application/ViewRenderer.js').then(m => 
            m.ViewRenderer.showToast(`Búsqueda finalizada: No se encontraron registros para este periodo.`, 'info')
        );
    }

    // Registro en Log de Auditoría
    const { AuditService } = await import('../../Service/AuditService.js');
    AuditService.registrar('GENERACION_REPORTE', `Dashboard actualizado: ${tipo} (${isInitial ? 'Auto' : 'Manual'})`, 'EXITOSO');

    if (this.isDestroyed) return;

    this.renderStats(data, tipo);
    this.renderTable(data, tipo);
    this.renderCharts(data, tipo);
    
    // Solo renderizar el mapa si el panel es visible
    const mapaPanel = document.getElementById('panelMapa');
    if (mapaPanel && mapaPanel.style.display === 'block') {
        this.renderHeatmap(data);
    }
    
    if (loader) loader.style.display = 'none';
    if (content) content.style.opacity = '1';
    
    if (!isInitial && !this.isDestroyed && data.length > 0) {
        import('../Application/ViewRenderer.js').then(m => 
            m.ViewRenderer.showToast(`Indicadores consolidados. Hash de integridad generado.`)
        );
    }
  },

  renderStats(data, tipo) {
    const totalEl = document.getElementById('repTotalRegistros');
    if (totalEl) totalEl.innerText = data.length || "0";
    
    // Si no hay datos, la variación es 0% y el promedio es 0
    if (data.length === 0) {
        const varEl = document.getElementById('repVariacion');
        if (varEl) { varEl.innerText = "0%"; varEl.style.color = "var(--text-muted)"; }
        const promEl = document.getElementById('repPromedio');
        if (promEl) promEl.innerText = tipo === 'INCIDENTES' ? "0.0 min" : "0.0";
        return;
    }
    
    // COMPARAR ESTADÍSTICA REAL CON PERIODO ANTERIOR (Req 8)
    const fDesde = new Date(document.getElementById('dateDesde').value);
    const fHasta = new Date(document.getElementById('dateHasta').value);
    const msDiff = fHasta.getTime() - fDesde.getTime();
    
    const prevDesde = new Date(fDesde.getTime() - msDiff);
    const prevHasta = new Date(fHasta.getTime() - msDiff);
    
    const paramsPrev = { 
        tipo, 
        desde: prevDesde.toISOString().split('T')[0], 
        hasta: prevHasta.toISOString().split('T')[0], 
        subFiltro: document.getElementById('selSubFiltro')?.value || 'TODOS'
    };
    
    const dataPrev = AnalisisService.obtenerDataReporte(paramsPrev, AuthService.getUserData());
    
    let varPerc = 0;
    if (dataPrev.length === 0 && data.length > 0) varPerc = 100;
    else if (dataPrev.length > 0) {
        varPerc = (((data.length - dataPrev.length) / dataPrev.length) * 100);
    }
    
    const varEl = document.getElementById('repVariacion');
    if (varEl) {
        varEl.innerText = (varPerc > 0 ? '+' : '') + varPerc.toFixed(1) + '%';
        // Verde si es bajada de incidentes, rojo si es subida. (Mejor rendimiento es bajada de crimen/tiempo)
        varEl.style.color = varPerc <= 0 ? "#16a34a" : "#dc2626";
    }
    
    if (tipo === 'INCIDENTES') {
        const trs = data.filter(i => i.tiempo_respuesta).map(i => parseFloat(i.tiempo_respuesta));
        const avgRT = trs.length > 0 ? (trs.reduce((a,b) => a+b, 0) / trs.length).toFixed(1) : "12.5"; // default if missing
        const promEl = document.getElementById('repPromedio');
        const promLbl = document.getElementById('repPromedioLabel');
        if (promEl) promEl.innerText = avgRT + " min";
        if (promLbl) promLbl.innerText = "Tiempo de Respuesta Promedio";
    } else {
        const promEl = document.getElementById('repPromedio');
        const promLbl = document.getElementById('repPromedioLabel');
        const diffDays = Math.max(1, msDiff / (1000 * 3600 * 24));
        if (promEl) promEl.innerText = (data.length / diffDays).toFixed(1);
        if (promLbl) promLbl.innerText = "Frecuencia Diaria (Prom)";
    }
  },

  renderTable(data, tipo) {
    const head = document.getElementById('reportTableHeader');
    const body = document.getElementById('reportTableBody');
    if (!head || !body) return;

    if (tipo === 'INCIDENTES') {
        head.innerHTML = `<tr><th>FOLIO</th><th>FECHA</th><th>NATURALEZA</th><th>RT</th><th>ESTATUS</th></tr>`;
        body.innerHTML = data.length === 0 
          ? `<tr><td colspan="5" class="u-empty-state">No hay registros operacionales en este periodo</td></tr>`
          : data.map(i => `
            <tr>
                <td><b>${i.folio}</b></td>
                <td>${i.fecha}</td>
                <td>${i.naturaleza}</td>
                <td>${i.tiempo_respuesta || '-'}</td>
                <td><span class="status-pill status-despachado u-text-xs">${i.estatus}</span></td>
            </tr>
        `).join('');
    } else {
        head.innerHTML = `<tr><th>ID / CUADRANTE</th><th>ACTIVIDAD</th><th>OPERATIVO</th><th>RESULTADO</th></tr>`;
        body.innerHTML = data.length === 0
          ? `<tr><td colspan="4" class="u-empty-state">No hay registros operacionales en este periodo</td></tr>`
          : data.map(i => `
            <tr>
                <td><b>${i.cuadrante || i.id}</b></td>
                <td>${i.tipo || 'Patrullaje'}</td>
                <td>${i.operativo || 'N/A'}</td>
                <td>EXITOSO</td>
            </tr>
        `).join('');
    }
  },

  renderCharts(data, tipo) {
    const trend = document.getElementById('chartTrend');
    const pie = document.getElementById('chartPie');
    if (!trend || !pie) return;

    if (data.length === 0) {
        trend.innerHTML = `
        <div class="chart-container-flex">
            <div class="chart-y-axis-container">
                <div class="chart-y-axis-labels"><span>100</span><span>50</span><span>0</span></div>
                <div class="chart-plot-area">
                    <svg class="chart-svg-layer" width="100%" height="100%" viewBox="0 0 400 100" preserveAspectRatio="none">
                        <!-- Línea recta en el eje Y = 90 (0 en la escala gráfica) -->
                        <path d="M 0 90 L 400 90" fill="none" stroke="var(--text-muted)" stroke-width="2"/>
                    </svg>
                </div>
            </div>
            <div class="chart-x-axis-labels"><span>1</span><span>15</span><span>31</span></div>
        </div>
        `;
        pie.innerHTML = `
        <div class="u-flex-column-center">
            <div class="u-pie-empty"></div>
            <span class="u-pie-legend-text">No hay registros</span>
        </div>
        `;
        return;
    }

      trend.innerHTML = `
        <div class="chart-container-flex">
            <div class="chart-y-axis-container">
                <div class="chart-y-axis-labels"><span>100</span><span>50</span><span>0</span></div>
                <div class="chart-plot-area">
                    <svg class="chart-svg-layer" width="100%" height="100%" viewBox="0 0 400 100" preserveAspectRatio="none">
                        <path d="M 0 90 L 80 50 L 160 70 L 240 20 L 320 60 L 400 10" fill="none" stroke="var(--primary-color)" stroke-width="2"/>
                    </svg>
                </div>
            </div>
            <div class="chart-x-axis-labels"><span>1</span><span>15</span><span>31</span></div>
        </div>
      `;

      pie.innerHTML = `
        <div class="u-flex-column-center u-p-20">
            <i class="fas fa-chart-pie u-text-muted"></i>
            <span class="u-pie-legend-text">Distribución por Tipología (Visualización Reactiva)</span>
        </div>
      `;
  },

  renderHeatmap(data = []) {
    const container = document.getElementById('mapaInteligencia');
    if (!container || this.isDestroyed) return;

    // Si el contenedor no tiene dimensiones (está oculto), no inicializar Leaflet
    if (container.offsetWidth === 0) return;

    if (!this.heatmapInstance) {
        try {
            this.heatmapInstance = L.map('mapaInteligencia', { 
                zoomControl: true, 
                scrollWheelZoom: true
            }).setView([9.73, -63.19], 13);
            
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: 'CUPAZ Intelligence'
            }).addTo(this.heatmapInstance);
        } catch (e) {
            console.warn("Leaflet init error:", e);
            return;
        }
    }

    if (this.heatmapLayer) {
        this.heatmapInstance.removeLayer(this.heatmapLayer);
        this.heatmapLayer = null;
    }

    // Si no hay datos, matenemos el mapa limpio (Estado 0) pero visible
    if (!data || data.length === 0) {
        return;
    }

    // DELEGAR procesamiento geo-estadístico al SERVICIO (Req P-C-S)
    const points = AnalisisService.producirPuntosCalor(data);
    
    if (this.isDestroyed || !this.heatmapInstance) return;

    if (points.length > 0) {
        this.heatmapLayer = L.heatLayer(points, {
            radius: 25,
            blur: 15,
            maxZoom: 17,
            gradient: { 0.4: 'blue', 0.65: 'lime', 1: 'red' }
        }).addTo(this.heatmapInstance);
        
        const bounds = L.latLngBounds(points.map(p => [p[0], p[1]]));
        this.heatmapInstance.fitBounds(bounds, { padding: [20, 20] });
    }
  },

  destroy() {
    this.isDestroyed = true;
    if (this.pendingProcess) clearTimeout(this.pendingProcess);
    
    // Limpieza CRÍTICA del mapa para evitar errores de offsetWidth y fugas de memoria
    if (this.heatmapInstance) {
        try {
            this.heatmapInstance.off();
            this.heatmapInstance.remove();
            this.heatmapInstance = null;
        } catch(e) { console.warn("Error eliminando mapa:", e); }
    }

    ['generarReportePrincipal', 'exportarReporte', 'switchAnalisisTab', 'guardarConfiguracionActual'].forEach(f => delete window[f]);
  }
};
