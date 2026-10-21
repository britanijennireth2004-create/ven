/**
 * Presentacion/Controllers/Dashboard/Dashboard.controller.js
 */
import { DashboardService } from '../../Service/Dashboard.service.js';

export const controller = {
  chartOp: null,
  chartAdmin: null,

  async init(props) {
    this.updateStats();
    return () => this.destroy();
  },

  updateStats() {
      // 1. Obtener Métricas
      const admStats = DashboardService.getMetricasAdministrativas();
      const opStats = DashboardService.getMetricasOperativas();
      const logStats = DashboardService.getMetricasLogisticas();

      // 2. Poblar Métricas Inferiores (Parque Automotor)
      const elDisp = document.getElementById('dashRecursosDisponibles');
      if (elDisp) elDisp.innerText = logStats.disponibles;
      const elUso = document.getElementById('dashRecursosEnUso');
      if (elUso) elUso.innerText = logStats.enUso;
      const elMant = document.getElementById('dashRecursosMantenimiento');
      if (elMant) elMant.innerText = logStats.mantenimiento;

      // Destruir gráficos previos para evitar errores de canvas en re-render
      this.destroyCharts();

      // 3. Crear Gráfico Operativo (Emergencias e Incidentes)
      const canvasOp = document.getElementById('chartOperativo');
      if (canvasOp) {
          const valEfectividad = opStats.efectividad;
          const valIncidentes = opStats.incidentesActivos;
          const valEmergencias = opStats.llamadasHoy;

          const labels = ['Efectividad y Resolución', 'Incidentes Activos', 'Emergencias Atendidas'];
          const values = [valEfectividad, valIncidentes, valEmergencias];
          const colors = ['#10b981', '#ff9f1c', '#ef4444'];

          // Calcular sumatoria para verificar si hay datos
          const totalOp = valEfectividad + valIncidentes + valEmergencias;
          let datasetData = values;
          let datasetColors = colors;

          if (totalOp === 0) {
              datasetData = [1];
              datasetColors = ['#f1f5f9'];
          }

          this.chartOp = new Chart(canvasOp, {
              type: 'pie',
              data: {
                  labels: labels,
                  datasets: [{
                      data: datasetData,
                      backgroundColor: datasetColors,
                      borderWidth: 1,
                      borderColor: '#ffffff'
                  }]
              },
              options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                      legend: { display: false },
                      tooltip: {
                          enabled: totalOp > 0,
                          callbacks: {
                              label: function(context) {
                                  const label = context.label || '';
                                  const val = context.raw || 0;
                                  if (label === 'Efectividad y Resolución') {
                                      return `${label}: ${val}%`;
                                  }
                                  return `${label}: ${val}`;
                              }
                          }
                      }
                  }
              }
          });

          // Renderizar Leyenda Personalizada Izquierda (Misma distribución visual que el diseño original)
          const legendItems = [
              { label: 'Efectividad y Resolución', value: totalOp > 0 ? `${valEfectividad}%` : '', color: '#10b981' },
              { label: 'Incidentes Activos', value: valIncidentes, color: '#ff9f1c' },
              { label: 'Emergencias Atendidas', value: valEmergencias, color: '#ef4444' }
          ];
          this.renderLegend('op-legend', legendItems);
      }

      // 4. Crear Gráfico Administrativo (Directorio e Infraestructura)
      const canvasAdmin = document.getElementById('chartAdministrativo');
      if (canvasAdmin) {
          const valUsers = admStats.totalUsuarios;
          const valCuadrantes = admStats.totalCuadrantes;
          const valOrgs = admStats.totalOrganismos;

          const labels = ['Usuarios Administrados', 'Cuadrantes de Paz', 'Organismos Vinculados'];
          const values = [valUsers, valCuadrantes, valOrgs];
          const colors = ['#8b5cf6', '#ec4899', '#3b82f6'];

          const totalAdmin = valUsers + valCuadrantes + valOrgs;
          let datasetData = values;
          let datasetColors = colors;

          if (totalAdmin === 0) {
              datasetData = [1];
              datasetColors = ['#f1f5f9'];
          }

          this.chartAdmin = new Chart(canvasAdmin, {
              type: 'pie',
              data: {
                  labels: labels,
                  datasets: [{
                      data: datasetData,
                      backgroundColor: datasetColors,
                      borderWidth: 1,
                      borderColor: '#ffffff'
                  }]
              },
              options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                      legend: { display: false },
                      tooltip: { enabled: totalAdmin > 0 }
                  }
              }
          });

          // Renderizar Leyenda Personalizada Izquierda
          const legendItems = [
              { label: 'Usuarios Administrados', value: valUsers, color: '#8b5cf6' },
              { label: 'Cuadrantes de Paz', value: valCuadrantes, color: '#ec4899' },
              { label: 'Organismos Vinculados', value: valOrgs, color: '#3b82f6' }
          ];
          this.renderLegend('admin-legend', legendItems);
      }
  },

  renderLegend(containerId, items) {
      const container = document.getElementById(containerId);
      if (!container) return;
      container.innerHTML = items.map(item => `
          <div style="display: flex; align-items: center; gap: 8px; font-family: 'Inter', sans-serif; margin-bottom: 6px;">
              <span style="display: inline-block; width: 12px; height: 12px; background-color: ${item.color}; border-radius: 2px; flex-shrink: 0;"></span>
              <span style="font-size: 0.85rem; font-weight: 600; color: #475569;">
                  ${item.label} <strong style="color: #0f172a; font-weight: 800; margin-left: 2px;">${item.value}</strong>
              </span>
          </div>
      `).join('');
  },

  destroyCharts() {
      if (this.chartOp && typeof this.chartOp.destroy === 'function') {
          this.chartOp.destroy();
          this.chartOp = null;
      }
      if (this.chartAdmin && typeof this.chartAdmin.destroy === 'function') {
          this.chartAdmin.destroy();
          this.chartAdmin = null;
      }
  },

  destroy() {
      this.destroyCharts();
  }
};
