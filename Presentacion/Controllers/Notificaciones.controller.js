/**
 * Presentacion/Controllers/Notificaciones/Notificaciones.controller.js
 * Controlador para el feed de alertas y notificaciones en tiempo real.
 */

import { DataManager } from '../../Persistencia/localStorage.js';
import { NotificacionesService } from '../../Service/Notificaciones.service.js';
import { AuditService } from '../../Service/AuditService.js';

export const controller = {
    async init(props) {
        window.notifCtrl = this;
        this.currentCategory = 'PENDING';
        this.searchQuery = '';
        
        await new Promise(resolve => setTimeout(resolve, 50));
        this.refresh();
        this.initEvents();
    },

    initEvents() {
        // Tabs (Categories)
        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.onclick = () => {
                document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentCategory = tab.getAttribute('data-category');
                this.render();
            };
        });

        // Search Input Logic (Desplegable dinámico)
        const searchInput = document.getElementById('notifSearch');
        const resultsContainer = document.getElementById('notifSearchResults');

        if (searchInput && resultsContainer) {
            searchInput.oninput = (e) => this.handleSearch(e.target.value);
            
            // Cerrar al hacer clic fuera
            document.addEventListener('click', (e) => {
                if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
                    resultsContainer.classList.remove('active');
                }
            });
        }
    },

    refresh() {
        this.render();
    },

    render() {
        const list = document.getElementById('gmailList');
        if (!list) return;

        let data = NotificacionesService.getEnrichedLogs();
        if (this.currentCategory === 'PENDING') data = data.filter(n => !n.isRead);
        else if (this.currentCategory === 'ALERTS') data = data.filter(n => (n.prioridad === 'ALTA' || n.resultado === 'NOTIFICACIÓN CUPAZ') && !n.accion.includes('SOPORTE'));
        else if (this.currentCategory === 'SECURITY') data = data.filter(n => n.accion.includes('ACCESO') || n.accion.includes('LOGIN') || n.accion.includes('LOGOUT') || n.accion.includes('SEGURIDAD'));
        else if (this.currentCategory === 'OPERATIONS') data = data.filter(n => n.accion.includes('MODIFICACION') || n.accion.includes('RECURSOS') || n.accion.includes('PERSONAL') || n.accion.includes('ESTATUS') || n.accion.includes('INCIDENTE'));
        else if (this.currentCategory === 'SUPPORT') data = data.filter(n => n.accion.includes('SOPORTE') || n.accion.includes('MENSAJERIA') || n.accion.includes('AYUDA') || n.accion.includes('CHATS'));
        else if (this.currentCategory === 'READ') data = data.filter(n => n.isRead);

        // Si hay búsqueda activa en la lista principal (no solo en el dropdown)
        if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase();
            data = data.filter(n => 
                (n.detalle || '').toLowerCase().includes(q) || 
                (n.accion || '').toLowerCase().includes(q) || 
                (n.usuario || '').toLowerCase().includes(q)
            );
        }

        if (data.length === 0) {
            list.innerHTML = `
                <div class="gmail-loading">
                    <i class="fas fa-history" style="font-size: 3rem; opacity: 0.2; margin-bottom: 20px; display: block;"></i>
                    <span>No hay actividad registrada en esta sección</span>
                </div>`;
            return;
        }

        list.innerHTML = data.map(n => `
            <div class="gmail-row ${n.isRead ? '' : 'unread'}" id="row-${n.id}" onclick="window.notifCtrl.openMessage('${n.id}')">
                <div class="row-star ${n.isStarred ? '' : 'inactive'}" onclick="event.stopPropagation(); window.notifCtrl.toggleStar('${n.id}')">
                    <i class="fas fa-star"></i>
                </div>
                <div class="row-status-icon">
                    <i class="fas ${n.isRead ? 'fa-check-circle' : 'fa-circle'}" style="color: ${n.isRead ? '228993b' : '2628bb2'}"></i>
                </div>
                <div class="row-sender">
                    ${n.usuario || 'Sistema'}
                </div>
                <div class="row-subject">
                    <span class="row-title">${n.accion}</span>
                    <span class="row-snippet"> - ${n.detalle}</span>
                </div>
                <div class="row-date">
                    ${n.hora}
                </div>
            </div>
        `).join('');
    },

    handleSearch(query) {
        this.searchQuery = query;
        const resultsContainer = document.getElementById('notifSearchResults');
        if (!resultsContainer) return;

        if (!query.trim()) {
            resultsContainer.classList.remove('active');
            this.render();
            return;
        }

        // DELEGAR búsqueda al SERVICIO
        const matches = NotificacionesService.search(query);

        if (matches.length > 0) {
            resultsContainer.innerHTML = matches.map(m => `
                <div class="search-result-item" onclick="window.notifCtrl.selectSearchResult('${m.id}')">
                    <i class="fas ${m.isRead ? 'fa-check-circle' : 'fa-circle'}" style="color: ${m.isRead ? '228993b' : '2628bb2'}; font-size: 0.8rem;"></i>
                    <div style="display:flex; flex-direction:column; gap:2px;">
                        <span style="font-weight:700; color:var(--secondary-color); font-size: 0.85rem;">${m.accion}</span>
                        <small style="font-size: 0.7rem; color: 2666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 320px;">${m.detalle}</small>
                    </div>
                </div>
            `).join('');
            resultsContainer.classList.add('active');
        } else {
            resultsContainer.classList.remove('active');
        }

        this.render(); // También filtrar la lista principal en tiempo real
    },

    selectSearchResult(id) {
        const resultsContainer = document.getElementById('notifSearchResults');
        const searchInput = document.getElementById('notifSearch');
        
        if (resultsContainer) resultsContainer.classList.remove('active');
        if (searchInput) searchInput.value = '';
        this.searchQuery = '';
        
        this.openMessage(id);
    },

    toggleStar(id) {
        NotificacionesService.toggleStar(id);
        this.render();
    },

    openMessage(id) {
        const enrichedLogs = NotificacionesService.getEnrichedLogs();
        const n = enrichedLogs.find(x => x.id === id);
        if (!n) return;

        NotificacionesService.marcarComoLeida(id);

        if (window.cupazAlert) {
            window.cupazAlert(`
                <div style="text-align: left; padding: 10px;">
                    <h3 style="margin-top:0; color:var(--secondary-color);">${n.accion}</h3>
                    <p style="color: 2666; font-size: 0.8rem;">Origen: ${n.usuario} | ${n.fecha} ${n.hora}</p>
                    <hr style="border:0; border-top:1px solid 2eee; margin: 15px 0;">
                    <div style="font-size: 0.95rem; line-height: 1.6; color: 2333;">
                        ${n.detalle}
                    </div>
                    ${n.motivo ? `<div style="background:2f1f5f9; padding:12px; border-left:4px solid var(--primary-color); margin-top:20px; font-style:italic; border-radius:4px;">Motivo Operativo: ${n.motivo}</div>` : ''}
                </div>
            `, "Detalle de Supervisión").then(() => {
                this.refresh();
                this.actualizarSidebarUI();
            });
        }
    },

    actualizarSidebarUI() {
        import('../Application/Layout.js').then(m => {
            if (m.Layout && m.Layout.checkGlobalNotifs) {
                m.Layout.checkGlobalNotifs();
            }
        }).catch(() => {});
    }
};
