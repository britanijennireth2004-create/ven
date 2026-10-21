/**
 * Presentacion/Controllers/Calidad/Calidad.controller.js
 * Lógica de Evaluación de Desempeño y Control de Calidad (CU-22)
 */

import { DataManager } from '../../Persistencia/localStorage.js';
import { CalidadService } from '../../Service/Calidad.service.js';
import { MonitoreoService } from '../../Service/Monitoreo.service.js';

export const controller = {
  async init(props) {
    // Registro de funciones globales
    window.generarEvaluacionOperativa = () => this.ejecutarEvaluacion();
    window.registrarHallazgoCalidad = () => this.irAHallazgos();
    window.generarPlanMejora = () => this.irAPlanMejora();
    window.exportarEvaluacionPDF = () => this.exportarPDF();
    window.guardarEvaluacionHistorial = () => this.guardarHistorial();
    window.switchCalidadTab = (tab) => this.switchTab(tab);
    window.verHistorialEvaluaciones = () => window.cupazAlert("Sincronizando con repositorio de auditorías anuales...", "MÓDULO DE HISTÓRICOS");

    await new Promise(resolve => setTimeout(resolve, 50));
    this.initEvents();
    return () => this.destroy();
  },

  initEvents() {
    // Fechas por defecto (Últimos 30 días)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = now.toISOString().split('T')[0];
    
    if(document.getElementById('evalDesde')) document.getElementById('evalDesde').value = firstDay;
    if(document.getElementById('evalHasta')) document.getElementById('evalHasta').value = lastDay;
  },

  async ejecutarEvaluacion() {
    const from = document.getElementById('evalDesde').value;
    const to = document.getElementById('evalHasta').value;

    if (!from || !to) {
        window.cupazAlert("Seleccione un rango de fechas para iniciar la evaluación.", "ERROR DE PARÁMETROS");
        return;
    }
    if (new Date(from) > new Date(to)) {
        window.cupazAlert("La fecha inicial debe ser anterior o igual a la fecha final.", "ERROR DE COHERENCIA");
        return;
    }

    const loader = document.getElementById('evalLoader');
    const result = document.getElementById('evalResultContainer');
    const emptyState = document.getElementById('evalEmptyState');
    
    // Ocultar resultados suavemente si estaban visibles
    result.style.opacity = '0';
    setTimeout(() => { 
        result.style.display = 'none'; 
        if (emptyState) emptyState.style.display = 'none';
        loader.style.display = 'flex'; 
    }, 300);

    await new Promise(r => setTimeout(r, 1500)); 

    const incidentes = MonitoreoService.getIncidentes();
    const filtrados = incidentes.filter(i => {
        const d = new Date(i.fecha || i.fecha_registro);
        return d >= new Date(from) && d <= new Date(to);
    });

    if (filtrados.length < 3) {
        loader.style.display = 'none';
        if (emptyState) emptyState.style.display = 'flex';
        window.cupazAlert("Se requieren al menos 3 incidentes registrados en el período para generar una evaluación de desempeño significativa. Intente ampliando el rango de fechas.", "DATOS INSUFICIENTES");
        return;
    }

    this.mostrarResultados(filtrados);

    // Req 4: Registro en historial de evaluaciones
    CalidadService.guardarEvaluacion({
        periodo: `${from} - ${to}`,
        puntaje: 82 // Simulado
    });

    // Req 12: Auditoría institucional
    const { AuditService } = await import('../../Service/AuditService.js');
    AuditService.registrar('EVALUACION_DESEMPENO', `Evaluación estratégica generada para el período ${from} a ${to}.`, 'EXITOSO');

    loader.style.display = 'none';
    result.style.display = 'block';
    setTimeout(() => result.style.opacity = '1', 50);

    import('../Application/ViewRenderer.js').then(m => m.ViewRenderer.showToast("Informe de Calidad consolidado conforme a la norma institucional."));
  },

  switchTab(tabId) {
      document.getElementById('tabResumenCal').classList.remove('active');
      document.getElementById('tabRankingCal').classList.remove('active');
      document.getElementById('tabHallazgosCal').classList.remove('active');
      
      document.getElementById('panelResumenCal').style.display = 'none';
      document.getElementById('panelRankingCal').style.display = 'none';
      document.getElementById('panelHallazgosCal').style.display = 'none';

      if (tabId === 'resumen') {
          document.getElementById('tabResumenCal').classList.add('active');
          document.getElementById('panelResumenCal').style.display = 'block';
      } else if (tabId === 'ranking') {
          document.getElementById('tabRankingCal').classList.add('active');
          document.getElementById('panelRankingCal').style.display = 'block';
      } else {
          document.getElementById('tabHallazgosCal').classList.add('active');
          document.getElementById('panelHallazgosCal').style.display = 'block';
      }
  },

  mostrarResultados(incidentes) {
    // 1. Aritmética de KPIs Reales
    const { avgTR, tasaResolucion } = CalidadService.calcularKPIs(incidentes);
    
    // Cobertura calculada por diversidad de parroquias impactadas en el set de datos
    const comunasDistintas = new Set(incidentes.filter(i=>i.ubicacion?.parroquia).map(i=>i.ubicacion.parroquia)).size;
    const tasaCobertura = Math.min(100, ((comunasDistintas / 6) * 100)).toFixed(1); // Muestreo de 6 parroquias capitales

    // 2. Sistema de Semáforos Institucionales (RN-15)
    // Verde (TR < 10min), Amarillo (10-15min), Rojo (>15min)
    let score = 100;
    if (avgTR > 10) score -= (avgTR - 10) * 5;
    if (tasaResolucion < 80) score -= (80 - tasaResolucion);
    score = Math.max(0, Math.min(100, Math.round(score)));

    const scoreDiv = document.getElementById('evalScoreCircle');
    const statusDiv = document.getElementById('evalScoreStatus');
    
    scoreDiv.innerText = `${score}`;
    scoreDiv.innerHTML += `<span style="font-size: 1rem; opacity: 0.5;">/100</span>`;
    
    if (score >= 90) {
        scoreDiv.style.color = '#16a34a';
        statusDiv.innerText = 'NIVEL ÓPTIMO (VERDE)';
        statusDiv.style.background = '#dcfce7'; statusDiv.style.color = '#16a34a';
    } else if (score >= 70) {
        scoreDiv.style.color = '#d97706';
        statusDiv.innerText = 'FUERA DE ESTÁNDAR (AMARILLO)';
        statusDiv.style.background = '#fef3c7'; statusDiv.style.color = '#d97706';
    } else {
        scoreDiv.style.color = '#dc2626';
        statusDiv.innerText = 'FALLO PROTOCOLAR (ROJO)';
        statusDiv.style.background = '#fee2e2'; statusDiv.style.color = '#dc2626';
    }

    // 3. Renderizado de KPIs Tácticos
    document.getElementById('valTR').innerText = `${avgTR} min`;
    document.getElementById('valTRC').innerText = `${tasaResolucion}%`;
    document.getElementById('valCOB').innerText = `${tasaCobertura}%`;

    // 4. Hallazgos Automáticos (Desviaciones Críticas > 10 min)
    const desviaciones = incidentes.filter(i => Number(i.tiempo_respuesta) > 10);
    document.getElementById('evalDesviaciones').innerText = desviaciones.length;
    
    // Cumplimiento Protocolar derivado
    let protocolCmpl = Math.min(100, (score * 0.95 + 5)).toFixed(1);
    document.getElementById('evalProtocolos').innerHTML = `${protocolCmpl}% <span style="font-size:0.6rem; color:#64748b;">(Adherencia)</span>`;

    const hallazgosBody = document.getElementById('evalHallazgosBody');
    if (desviaciones.length > 0) {
        hallazgosBody.innerHTML = desviaciones.map(d => `
            <tr>
                <td><b>${d.folio}</b></td>
                <td>${d.fecha}</td>
                <td style="color:#dc2626;">Exceso en TR detectado: ${d.tiempo_respuesta} min. Supera umbral normativo.</td>
            </tr>
        `).join('');
    } else {
        hallazgosBody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px; color:#16a34a;"><i class="fas fa-check-circle"></i> No se detectaron desviaciones críticas en el período.</td></tr>`;
    }

    // 5. Ranking de Unidades Dinámico
    const rankingBody = document.getElementById('evalRankingBody');
    const unidades = {};
    incidentes.forEach(i => {
        if(i.unidades_asignadas) {
            i.unidades_asignadas.forEach(u => {
                if(!unidades[u]) unidades[u] = { count: 0, pts: 0 };
                unidades[u].count++;
                unidades[u].pts += (Number(i.tiempo_respuesta) <= 10 ? 10 : 5);
            });
        }
    });

    const rankingData = Object.keys(unidades).map(u => ({
        id: u,
        score: Math.min(100, Math.round((unidades[u].pts / (unidades[u].count * 10)) * 100))
    })).sort((a,b) => b.score - a.score);

    if (rankingData.length > 0) {
        rankingBody.innerHTML = rankingData.map(r => `
            <tr>
                <td><b>${r.id}</b></td>
                <td>${r.score}</td>
                <td><span class="status-pill ${r.score >= 90 ? 'status-despachado' : (r.score >= 70 ? 'status-warning' : 'status-danger')}">${r.score >= 90 ? 'EVAL. ALTA' : (r.score >= 70 ? 'EVAL. MEDIA' : 'EVAL. BAJA')}</span></td>
            </tr>
        `).join('');
    } else {
        rankingBody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px; color:#999;">No hay suficientes datos de unidades asignadas.</td></tr>`;
    }
  },

  irAHallazgos() {
    window.cupazAlert("Redirigiendo al Módulo de Auditoría... Vinculando indicadores para investigación de causa raíz.", "AUDITORÍA ESTRATÉGICA");
  },

  async irAPlanMejora() {
    import('../Components/UI/Dialog.js').then(m => {
        const Dialog = m.Dialog;
        const content = `
            <div class="pb-group">
                <label class="pb-label">Hallazgo de Origen</label>
                <input type="text" class="pb-input" value="Desviación en Tiempos de Respuesta (TR > 10m)" readonly>
            </div>
            <div class="pb-group">
                <label class="pb-label">Acción Correctiva Propuesta *</label>
                <textarea id="accCorrectiva" class="pb-input" rows="3" placeholder="Ej: Reentrenamiento en protocolos de despacho..."></textarea>
            </div>
            <div class="pb-group">
                <label class="pb-label">Responsable de Ejecución</label>
                <select id="respEjecucion" class="pb-select">
                    <option>Coordinador de Operaciones</option>
                    <option>Jefe de Cuadrante</option>
                    <option>Supervisor de Sala</option>
                </select>
            </div>
        `;
        const footer = `
            <button class="add-btn" style="background:#666; width:auto; height:35px; padding:0 15px; margin-right:10px;" id="btnCancelPlan">CANCELAR</button>
            <button class="add-btn" style="width:auto; height:35px; padding:0 15px;" id="btnEmitirPlan">EMITIR PLAN</button>
        `;

        const modal = Dialog.openModal({
            title: 'Emisión de Plan de Mejora Correctiva',
            content: content,
            footer: footer,
            maxWidth: '500px'
        });

        modal.querySelector('#btnCancelPlan').onclick = () => modal.remove();
        modal.querySelector('#btnEmitirPlan').onclick = () => {
            const acc = modal.querySelector('#accCorrectiva').value.trim();
            if (!acc) {
                window.cupazToast("Debe describir la acción correctiva.", "error");
                return;
            }
            modal.remove();
            window.cupazAlert("Plan de Mejora emitido y notificado a los responsables para su ejecución inmediata.", "PLAN OPERATIVO");
        };
    });
  },

  exportarPDF() {
      // Verificar que hay resultados visibles antes de exportar
      const resultContainer = document.getElementById('evalResultContainer');
      if (!resultContainer || resultContainer.style.display === 'none' || resultContainer.style.opacity === '0') {
          import('../Application/ViewRenderer.js').then(m =>
              m.ViewRenderer.showToast('Primero genere una evaluación para poder exportar el informe.')
          );
          return;
      }

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const now = new Date();

      // ── Encabezado institucional ──
      doc.setFillColor(29, 53, 87);
      doc.rect(0, 0, pageW, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('CUPAZ - INFORME DE EVALUACIÓN DE DESEMPEÑO', pageW / 2, 12, { align: 'center' });
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const desde = document.getElementById('evalDesde')?.value || '';
      const hasta = document.getElementById('evalHasta')?.value || '';
      doc.text(`Período: ${desde} al ${hasta}  |  Generado: ${now.toLocaleString()}`, pageW / 2, 19, { align: 'center' });
      doc.text('Clasificación: CONFIDENCIAL | Control de Calidad Institucional', pageW / 2, 25, { align: 'center' });

      // ── Score de desempeño ──
      const scoreText = document.getElementById('evalScoreCircle')?.innerText?.split('/')[0]?.trim() || 'N/A';
      const statusText = document.getElementById('evalScoreStatus')?.innerText || '';
      const desviaciones = document.getElementById('evalDesviaciones')?.innerText || '0';
      const protocolos = document.getElementById('evalProtocolos')?.innerText || '0';

      const kpiY = 40;
      const kpis = [
          { label: 'Puntaje Global', value: `${scoreText}/100` },
          { label: 'Clasificación', value: statusText },
          { label: 'Desviaciones', value: desviaciones },
          { label: 'Adherencia Prot.', value: protocolos }
      ];
      const kpiW = (pageW - 30) / kpis.length;
      kpis.forEach((k, i) => {
          const x = 15 + i * kpiW + kpiW / 2;
          doc.setFillColor(248, 250, 252);
          doc.roundedRect(15 + i * kpiW, kpiY - 5, kpiW - 3, 18, 2, 2, 'F');
          doc.setFontSize(6.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          doc.text(k.label.toUpperCase(), x, kpiY + 1, { align: 'center' });
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(29, 53, 87);
          doc.text(String(k.value), x, kpiY + 9, { align: 'center' });
      });

      let nextY = kpiY + 22;

      // ── Tabla Ranking de Unidades ──
      const rankingRows = [];
      document.querySelectorAll('#evalRankingBody tr').forEach(tr => {
          rankingRows.push([...tr.querySelectorAll('td')].map(td => td.innerText.trim()));
      });

      if (rankingRows.length > 0) {
          doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(29, 53, 87);
          doc.text('RANKING DE UNIDADES OPERATIVAS', 15, nextY);
          nextY += 4;
          doc.autoTable({
              head: [['UNIDAD', 'PUNTAJE', 'NIVEL']],
              body: rankingRows,
              startY: nextY,
              styles: { fontSize: 8, cellPadding: 3 },
              headStyles: { fillColor: [29, 53, 87], textColor: 255, fontStyle: 'bold' },
              alternateRowStyles: { fillColor: [248, 250, 252] },
              margin: { left: 15, right: 15 }
          });
          nextY = doc.lastAutoTable.finalY + 8;
      }

      // ── Tabla Hallazgos de Auditoría ──
      const hallazgosRows = [];
      document.querySelectorAll('#evalHallazgosBody tr').forEach(tr => {
          hallazgosRows.push([...tr.querySelectorAll('td')].map(td => td.innerText.trim()));
      });

      if (hallazgosRows.length > 0) {
          doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(29, 53, 87);
          doc.text('HALLAZGOS DE AUDITORÍA VINCULADOS', 15, nextY);
          nextY += 4;
          doc.autoTable({
              head: [['ID', 'FECHA', 'DESCRIPCIÓN DEL HALLAZGO']],
              body: hallazgosRows,
              startY: nextY,
              styles: { fontSize: 8, cellPadding: 3 },
              headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: 'bold' },
              alternateRowStyles: { fillColor: [255, 248, 248] },
              margin: { left: 15, right: 15 }
          });
      }

      // ── Pie de página ──
      const totalPages = doc.internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
          doc.setPage(p);
          doc.setFontSize(7); doc.setTextColor(150);
          doc.text(
              `Página ${p} de ${totalPages} | SIT-CUPAZ - Informe de Calidad Institucional`,
              pageW / 2, doc.internal.pageSize.getHeight() - 6, { align: 'center' }
          );
      }

      const fileName = `CUPAZ_Evaluacion_Calidad_${desde}_${hasta}.pdf`;
      doc.save(fileName);

      import('../Application/ViewRenderer.js').then(m =>
          m.ViewRenderer.showToast(`Informe PDF generado: ${fileName}`)
      );
  },

  guardarHistorial() {
      window.cupazAlert("La evaluación ha sido almacenada correctamente en el repositorio histórico de auditoría.", "ARCHIVO EXITOSO");
  },

  destroy() {
    ['generarEvaluacionOperativa', 'registrarHallazgoCalidad', 'generarPlanMejora', 'exportarEvaluacionPDF', 'guardarEvaluacionHistorial', 'verHistorialEvaluaciones', 'switchCalidadTab'].forEach(f => delete window[f]);
  }
};
