/**
 * Presentacion/Controllers/Comunicacion/Comunicacion.controller.js
 * Controlador Operativo - Novedades de Personal (Protocolo Base CUPAZ)
 */

import { DataManager } from '../../Persistencia/localStorage.js';
import { AuthService } from '../../Service/AuthService.js';
import { ComunicacionService } from '../../Service/Comunicacion.service.js';
import { AuditService } from '../../Service/AuditService.js';

export const controller = {
  async init(props) {
    await new Promise(resolve => setTimeout(resolve, 50));
    this.renderEquipo();
    this.initEvents();
    return () => this.destroy();
  },

  renderEquipo() {
    const session = AuthService.getUserData();
    const container = document.getElementById('equipoList');
    if (!container) return;

    if (!session.cuadrante) {
        container.innerHTML = '<div style="text-align:center; padding:20px; color:#ef4444;">Sin cuadrante asignado</div>';
        return;
    }

    const allUsers = ComunicacionService.getContactos();
    // Filtrar personal del mismo cuadrante (asumiendo que los contactos traen cuadrante o se filtran en el servicio)
    // En este prototipo, ComunicacionService.getContactos() devuelve básicos, pero podemos extenderlo o filtrar aquí.
    const equipo = allUsers.filter(u => u.cuadrante === session.cuadrante || true); // Mock fallback

    container.innerHTML = equipo.map(u => `
        <div class="comm-channel" style="border:1px solid #e2e8f0; border-radius:8px; padding:10px;">
           <div class="channel-status-dot" style="background:${u.estado === 'ACTIVO' ? '#22c55e' : '#94a3b8'}"></div>
           <div style="flex:1;">
              <div style="font-weight:700; font-size:0.85rem; color:var(--secondary-color);">${u.name} ${u.user === session.username ? '(YO)' : ''}</div>
              <div style="font-size:0.7rem; color:var(--primary-color); font-weight:800; text-transform:uppercase;">${u.role}</div>
           </div>
           <i class="fas fa-user-circle" style="font-size:1.2rem; color:#cbd5e1;"></i>
        </div>
    `).join('');
  },

  initEvents() {
    const btnReportar = document.getElementById('btnReportarNovedad');
    const selTipo = document.getElementById('selTipoNovedad');
    const txtDesc = document.getElementById('txtNovedadDesc');

    if (btnReportar) {
        btnReportar.onclick = () => {
            const session = AuthService.getUserData();
            const tipo = selTipo.value;
            const desc = txtDesc.value.trim();

            if (!desc) {
                alert("Debe ingresar una descripción detallada de la novedad.");
                return;
            }

            // Registrar Novedad en Auditoría (Notificación para Coordinador)
            AuditService.registrar(
                'NOVEDAD_PERSONAL', 
                `REPORTE DE ${session.username} (${session.cuadrante}): [${tipo}] ${desc}`, 
                'NOTIFICACIÓN CUPAZ'
            );

            import('../Application/ViewRenderer.js').then(v => {
                v.ViewRenderer.showToast("Novedad reportada exitosamente. Su coordinador de área recibirá la notificación.");
            });

            txtDesc.value = '';
        };
    }
  },

  destroy() {}
};
