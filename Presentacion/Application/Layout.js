/**
 * Presentacion/Application/Layout.js
 * Versión Rediseñada con Menú de Doble Columna (Estilo menu.jpg)
 */

import { AuthService } from '../../Service/AuthService.js';
import { App } from './App.js';
import { DataManager } from '../../Persistencia/localStorage.js';

export const Layout = {
  render(user) {
    const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'AD';

    return `
      <div class="dashboard-container">
        <!-- Sidebar con Diseño de Doble Columna (Estilo menu.jpg) -->
        <aside class="sidebar" id="sidebar">
          
          <!-- Columna Primaria (Angosta, Oscura) -->
          <div class="sidebar-primary">
            <div class="sidebar-primary-header">
              <div class="logo-icon" title="SIT-CUPAZ">
                <i class="fas fa-shield-halved"></i>
              </div>
            </div>
            <nav class="sidebar-primary-tabs">
              ${this.getPrimaryTabsByRole(user)}
            </nav>
            <div class="sidebar-primary-footer">
              <button class="logout-icon-btn" id="logoutBtn" title="Cerrar Sesión">
                <i class="fas fa-sign-out-alt"></i>
              </button>
            </div>
          </div>
          
          <!-- Columna Secundaria (Clara, Con Submenús) -->
          <div class="sidebar-secondary">
            <div class="sidebar-secondary-header">
              <span class="logo-secondary">SIT-CUPAZ</span>
            </div>
            <nav class="sidebar-secondary-menu">
              ${this.getSecondaryMenuByRole(user)}
            </nav>
          </div>

        </aside>

        <!-- Main Content -->
        <div class="main-content">
          <header class="header">
            <div class="header-left">
              <h1 class="header-title" id="pageTitle">Panel de Control</h1>
            </div>
            
            <div class="header-center">
              <div class="pb-search-bar">
                <i class="fas fa-search pb-search-icon"></i>
                <input type="text" class="search-input" id="globalSearchInput" placeholder="Buscar módulo...">
                <div class="search-results" id="searchResults"></div>
              </div>
            </div>

            <div class="header-actions">
              <div class="pb-user-profile">
                <div class="pb-user-avatar">${initials}</div>
                <div class="user-info-text" style="display: flex; flex-direction: column; align-items: flex-start; line-height: 1.2;">
                    <span class="pb-user-name" style="font-weight: 700; color: var(--secondary-color); font-size: 0.95rem;">${user?.name || 'Usuario'}</span>
                    <small style="font-size: 0.7rem; color: var(--primary-color); text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;">${user?.role?.replace('_', ' ') || 'SESIÓN ACTIVA'}</small>
                </div>
              </div>
            </div>
          </header>
          
          <div class="dashboard-content" id="pageContentContainer">
            <!-- Contenido dinámico -->
          </div>
        </div>
      </div>
    `;
  },

  initEvents() {
    const searchInput = document.getElementById('globalSearchInput');

    // 1. Manejo de clicks en las pestañas de categorías (Sidebar Izquierdo)
    document.querySelectorAll('.category-tab').forEach(tab => {
      tab.onclick = (e) => {
        e.preventDefault();
        const category = tab.getAttribute('data-category');
        
        // Activar pestaña
        document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Mostrar grupo de submenú correspondiente
        document.querySelectorAll('.submenu-group').forEach(sg => {
          sg.style.display = sg.getAttribute('data-category') === category ? 'block' : 'none';
        });
      };
    });

    // 2. Manejo de clicks en los items del menú (Sidebar Derecho)
    document.querySelectorAll('[data-page]').forEach(item => {
      item.onclick = (e) => {
        e.preventDefault();
        const page = item.getAttribute('data-page');
        if (page) App.navigateTo(page);

        document.querySelectorAll('.menu-item').forEach(m => {
          m.classList.remove('active');
          m.style.display = 'flex'; // Resetear visibilidad por si había filtro
        });
        item.classList.add('active');

        if (searchInput) searchInput.value = '';
      };
    });

    // Buscador Global con Desplegable (Estilo pb_public)
    if (searchInput) {
      const resultsContainer = document.getElementById('searchResults');

      searchInput.oninput = (e) => {
        const term = e.target.value.toLowerCase().trim();
        resultsContainer.innerHTML = '';

        if (term.length < 1) {
          resultsContainer.classList.remove('active');
          return;
        }

        const matches = [];
        document.querySelectorAll('.menu-item').forEach(item => {
          const text = item.innerText.trim();
          const page = item.getAttribute('data-page');
          const icon = item.querySelector('i')?.cloneNode(true);

          if (text.toLowerCase().includes(term)) {
            matches.push({ text, page, icon });
          }
        });

        if (matches.length > 0) {
          matches.forEach(match => {
            const div = document.createElement('div');
            div.className = 'search-result-item';
            div.innerHTML = `${match.icon ? match.icon.outerHTML : ''} <span>${match.text}</span>`;
            div.onclick = () => {
              App.navigateTo(match.page);
              resultsContainer.classList.remove('active');
              searchInput.value = '';

              // Actualizar estado activo y pestaña en el sidebar
              this.setActivePage(match.page);
            };
            resultsContainer.appendChild(div);
          });
          resultsContainer.classList.add('active');
        } else {
          resultsContainer.classList.remove('active');
        }
      };

      // Cerrar resultados al hacer clic fuera
      document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
          resultsContainer.classList.remove('active');
        }
      });
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.onclick = async () => {
        if (!await cupazConfirm("¿Está seguro de que desea cerrar su sesión operativa? Asegúrese de haber guardado todos los cambios pendientes.", "CERRAR SESIÓN")) {
           return;
        }

        const success = await AuthService.logout();
        const msg = success
          ? 'Ha cerrado sesión correctamente. Gracias por utilizar el Sistema de Inteligencia Territorial CUPAZ.'
          : 'Se ha cerrado su sesión. Si el problema persiste, contacte al administrador del sistema CUPAZ.';

        App.navigateTo('login', { logoutMessage: msg });
      };
    }

    // Lógica de campana de notificaciones global
    const bell = document.getElementById('globalNotifBell');
    if (bell) {
      bell.onclick = () => App.navigateTo('administracion');
    }

    // Chequeo inicial de notificaciones
    this.checkGlobalNotifs();

    // Sincronizar el estado del menú con la página inicial activa
    this.setActivePageFromClass();
  },

  checkGlobalNotifs() {
    const user = AuthService.getUserData();
    if ((user?.role || '').toUpperCase() !== 'COORDINADOR CUPAZ') return;

    try {
      const logs = DataManager.leer('cupaz_auditoria') || [];
      const notifs = logs.filter(l => l.resultado === 'NOTIFICACIÓN CUPAZ');
      const revisadas = JSON.parse(localStorage.getItem('cupaz_notif_revisadas') || '[]');
      
      const pendientes = notifs.filter(n => {
          const finalId = n.id ? String(n.id) : `${n.fecha}_${n.hora}_${n.usuario}`;
          return !revisadas.includes(finalId);
      });

      const count = pendientes.length;
      const globalBadge = document.getElementById('globalNotifCount');
      const sideDot = document.getElementById('sidebarNotifDot');

      if (globalBadge) {
        if (count > 0) {
          globalBadge.textContent = count > 9 ? '9+' : count;
          globalBadge.style.display = 'flex';
        } else {
          globalBadge.style.display = 'none';
        }
      }

      if (sideDot) {
        sideDot.style.display = count > 0 ? 'block' : 'none';
      }
    } catch (e) {
      console.warn("Error actualizando notificaciones globales:", e);
    }
  },

  injectContent(html) {
    const container = document.getElementById('pageContentContainer');
    if (container) container.innerHTML = html;
  },

  updateTitle(title) {
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) pageTitle.textContent = title;
    
    // Sincronizar estado de menú lateral tras inyección de página
    this.setActivePageFromClass();
  },

  setActivePage(viewName) {
    const activeItem = document.querySelector(`.menu-item[data-page="${viewName}"]`);
    if (!activeItem) return;

    // 1. Marcar item de submenú como activo
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
    activeItem.classList.add('active');

    // 2. Obtener el grupo contenedor y su categoría
    const submenuGroup = activeItem.closest('.submenu-group');
    if (submenuGroup) {
      const category = submenuGroup.getAttribute('data-category');

      // Mostrar el submenú de esa categoría, ocultar los demás
      document.querySelectorAll('.submenu-group').forEach(sg => {
        sg.style.display = sg.getAttribute('data-category') === category ? 'block' : 'none';
      });

      // Marcar pestaña de categoría como activa
      document.querySelectorAll('.category-tab').forEach(ct => {
        ct.classList.toggle('active', ct.getAttribute('data-category') === category);
      });
    }
  },

  setActivePageFromClass() {
    const app = document.getElementById('app');
    if (!app) return;

    const match = app.className.match(/view-([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      this.setActivePage(match[1]);
    }
  },

  getMenuStructure(user) {
    const role = (user?.role || 'INVITADO').toUpperCase();
    const structure = {
      inicio: {
        title: 'Inicio',
        icon: 'fas fa-home',
        items: [
          { page: 'dashboard', label: 'Inicio', icon: 'fas fa-house' }
        ]
      },
      operaciones: {
        title: 'Operaciones',
        icon: 'fas fa-shield-halved',
        items: []
      },
      gestion: {
        title: 'Gestión',
        icon: 'fas fa-folder-open',
        items: []
      }
    };

    // Mapeo dinámico por Roles
    if (role === 'COORDINADOR CUPAZ') {
      structure.operaciones.items.push(
        { page: 'monitoreo', label: 'Monitoreo General', icon: 'fas fa-video' },
        { page: 'patrullaje', label: 'Actividades', icon: 'fas fa-shield-halved' }
      );
      structure.gestion.items.push(
        { page: 'notificaciones', label: 'Notificaciones', icon: 'fas fa-bell', badge: true },
        { page: 'analisis', label: 'Análisis y Calor', icon: 'fas fa-chart-line' },
        { page: 'administracion', label: 'Administración', icon: 'fas fa-user-shield' },
        { page: 'logistica', label: 'Inventario Global', icon: 'fas fa-box-open' },
        { page: 'calidad', label: 'Estándares y Calidad', icon: 'fas fa-award' }
      );
    } else if (role === 'DIRECTOR GENERAL') {
      structure.operaciones.items.push(
        { page: 'monitoreo', label: 'Resumen Operativo', icon: 'fas fa-video' },
        { page: 'patrullaje', label: 'Seguimiento Actividades', icon: 'fas fa-shield-halved' },
        { page: 'comunicacion', label: 'Comunicación Estratégica', icon: 'fas fa-satellite-dish' }
      );
      structure.gestion.items.push(
        { page: 'analisis', label: 'Reportes Estadísticos', icon: 'fas fa-chart-line' },
        { page: 'logistica', label: 'Inventario Estratégico', icon: 'fas fa-box-open' },
        { page: 'calidad', label: 'Evaluación Desempeño', icon: 'fas fa-award' }
      );
    } else if (role.includes('COORDINADOR DE') || role === 'COMISIONADO ESTADAL' || role === 'COORDINADOR DEL CUADRANTE DE PAZ') {
      structure.operaciones.items.push(
        { page: 'monitoreo', label: 'Monitoreo', icon: 'fas fa-video' },
        { page: 'patrullaje', label: 'Actividades', icon: 'fas fa-shield-halved' }
      );
      structure.gestion.items.push(
        { page: 'analisis', label: 'Análisis', icon: 'fas fa-chart-line' },
        { page: 'calidad', label: 'Calidad', icon: 'fas fa-award' },
        { page: 'administracion', label: 'Gestión Personal', icon: 'fas fa-users-cog' },
        { page: 'logistica', label: 'Recursos', icon: 'fas fa-truck-pickup' }
      );
    } else if (role === 'OPERADOR DE RECEPCIÓN' || role === 'OPERADOR') {
      structure.operaciones.items.push(
        { page: 'emergencias', label: 'Recepción de Llamadas', icon: 'fas fa-headset' }
      );
    } else if (role === 'OPERADOR DE DESPACHO') {
      structure.operaciones.items.push(
        { page: 'despacho', label: 'Despacho de Unidades', icon: 'fas fa-truck-fast' },
        { page: 'monitoreo', label: 'Rastreo GPS', icon: 'fas fa-eye' }
      );
    } else if (role.includes('CUADRANTE') || role.includes('AUXILIAR') || role === 'PERSONAL OPERATIVO') {
      structure.operaciones.items.push(
        { page: 'terminal', label: 'Terminal Móvil', icon: 'fas fa-mobile-alt' },
        { page: 'patrullaje', label: 'Actividades', icon: 'fas fa-clipboard-check' },
        { page: 'comunicacion', label: 'Novedades', icon: 'fas fa-bullhorn' }
      );
    } else if (role.includes('ANALISTA') || role.includes('EVALUADOR') || role.includes('CALIDAD')) {
      structure.gestion.items.push(
        { page: 'analisis', label: 'Rendimiento', icon: 'fas fa-chart-pie' },
        { page: 'calidad', label: 'Evaluación', icon: 'fas fa-check-double' }
      );
    } else if (role === 'PERSONAL DE LOGÍSTICA') {
      structure.gestion.items.push(
        { page: 'logistica', label: 'Gestión de Inventario', icon: 'fas fa-box-open' }
      );
    }

    return structure;
  },

  getPrimaryTabsByRole(user) {
    const structure = this.getMenuStructure(user);
    let html = '';
    
    for (const [key, category] of Object.entries(structure)) {
      if (category.items.length > 0) {
        html += `
          <button class="category-tab" data-category="${key}" title="${category.title}">
            <i class="${category.icon}"></i>
            <span class="category-tab-label">${category.title}</span>
          </button>
        `;
      }
    }
    
    return html;
  },

  getSecondaryMenuByRole(user) {
    const structure = this.getMenuStructure(user);
    let html = '';
    
    for (const [key, category] of Object.entries(structure)) {
      if (category.items.length > 0) {
        html += `
          <div class="submenu-group" data-category="${key}" style="display: none;">
            <div class="submenu-group-header">${category.title}</div>
            <div class="submenu-items">
              ${category.items.map(item => `
                <a href="#" class="menu-item" data-page="${item.page}">
                  <i class="${item.icon}"></i>
                  <span>${item.label}</span>
                  ${item.badge ? `<span class="sidebar-notif-dot" id="sidebarNotifDot" style="display:none;"></span>` : ''}
                </a>
              `).join('')}
            </div>
          </div>
        `;
      }
    }
    
    return html;
  }
};
