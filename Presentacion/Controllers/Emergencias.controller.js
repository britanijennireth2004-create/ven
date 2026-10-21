/**
 * Presentacion/Controllers/Emergencias/Emergencias.controller.js
 * Controlador de Recepción y Captura de Incidentes - CUPAZ Monagas
 * Flujo: FAB idle → Vibración → Popover RESPONDER → Modal → Registro → CAPTADO
 */

import { EmergenciasService } from '../../Service/Emergencias.service.js';
import { AuditService } from '../../Service/AuditService.js';

export const controller = {
    isVibrating: false,
    showRespondButton: false,
    timerInterval: null,
    waitTimerInterval: null,
    waitSeconds: 0,

    async init(props) {
        await new Promise(resolve => setTimeout(resolve, 50));

        this.initEvents();
        this.renderHistorico();
        this.poblarNaturalezas();

        // Simulación: Comienza a vibrar la línea después de 3.5 segundos
        setTimeout(() => this.triggerLlamada(), 3500);

        window.emergenciaCtrl = this;
        return () => {
            window.emergenciaCtrl = null;
            if (this.timerInterval) clearInterval(this.timerInterval);
            if (this.waitTimerInterval) clearInterval(this.waitTimerInterval);
        };
    },

    // ==========================================
    // ESTADO 1→2: Trigger de llamada entrante
    // ==========================================
    triggerLlamada() {
        this.isVibrating = true;
        this.showRespondButton = false;
        this.waitSeconds = 0;

        const fab = document.getElementById('fabCall');
        const timerBox = document.getElementById('fabWaitTimer');
        const secSpan = document.getElementById('fabWaitSeconds');

        if (fab) fab.classList.add('fab-call-vibrate');

        // Iniciar contador de espera visible (Imagen 2: "TIEMPO ESPERA: 4s")
        if (timerBox) timerBox.style.display = 'block';
        if (secSpan) secSpan.innerText = '0';

        this.waitTimerInterval = setInterval(() => {
            this.waitSeconds++;
            if (secSpan) secSpan.innerText = this.waitSeconds;
        }, 1000);
    },

    // Limpia el estado de llamada entrante (usado por Responder y Rechazar)
    dismissCall() {
        this.isVibrating = false;
        this.showRespondButton = false;

        const fab = document.getElementById('fabCall');
        if (fab) fab.classList.remove('fab-call-vibrate');

        const fabActions = document.getElementById('fabActions');
        if (fabActions) fabActions.style.display = 'none';

        const timerBox = document.getElementById('fabWaitTimer');
        if (timerBox) timerBox.style.display = 'none';

        if (this.waitTimerInterval) clearInterval(this.waitTimerInterval);
    },

    // ==========================================
    // EVENTOS
    // ==========================================
    initEvents() {
        const fab = document.getElementById('fabCall');
        const fabActions = document.getElementById('fabActions');
        const popover = document.getElementById('popoverResponder');
        const popoverReject = document.getElementById('popoverRechazar');

        // Click en FAB: siempre desplegar botones RESPONDER + RECHAZAR
        if (fab) {
            fab.onclick = () => {
                if (fabActions.style.display === 'flex') {
                    fabActions.style.display = 'none';
                } else {
                    fabActions.style.display = 'flex';
                }
            };
        }

        // Click en RESPONDER: abrir modal
        if (popover) {
            popover.onclick = () => {
                this.dismissCall();
                this.poblarNaturalezas();
                this.openModal();
            };
        }

        // Click en RECHAZAR: descartar llamada
        if (popoverReject) {
            popoverReject.onclick = () => {
                this.dismissCall();
                import('../Application/ViewRenderer.js').then(v => {
                    v.ViewRenderer.showToast('Llamada rechazada. Se registró en auditoría.', 'warning');
                });
                AuditService.registrar('LLAMADA_RECHAZADA', 'El operador rechazó una llamada entrante.', 'NOTIFICACIÓN CUPAZ');
                // Simular nueva llamada tras 10 segundos
                setTimeout(() => this.triggerLlamada(), 10000);
            };
        }

        // Cerrar modal (X)
        const btnClose = document.getElementById('btnCerrarModal');
        if (btnClose) {
            btnClose.onclick = () => this.closeModal();
        }

        // Registrar incidente
        const btnReg = document.getElementById('btnCompletarRegistro');
        if (btnReg) {
            btnReg.onclick = () => this.handleRegistro();
        }

        // Cambio de naturaleza → Script de voz
        const selNat = document.getElementById('emergenciaNaturaleza');
        if (selNat) {
            selNat.onchange = (e) => {
                const script = EmergenciasService.getScriptVoz(e.target.value);
                const el = document.getElementById('lblScriptVozModal');
                if (el) el.innerText = `"${script}"`;
                this.logTerminal(`> GEO_ANALYSIS: Protocolo cambiado a [${e.target.value}].`);
            };
        }

        // Geolocalización
        const btnGeo = document.getElementById('btnGeoModal');
        if (btnGeo) {
            btnGeo.onclick = () => {
                this.logTerminal('> ANALIZANDO TORRE CELULAR REFERENCIAL...');
                setTimeout(() => {
                    const lat = (9.7 + Math.random() * 0.1).toFixed(4);
                    const lng = (-63.1 - Math.random() * 0.1).toFixed(4);
                    const cuad = `MTR-${String(Math.floor(Math.random() * 12 + 1)).padStart(2, '0')}`;

                    const gpsEl = document.getElementById('emergenciaGPS');
                    const cuadEl = document.getElementById('emergenciaCuadrante');
                    if (gpsEl) gpsEl.value = `${lat}, ${lng}`;
                    if (cuadEl) cuadEl.value = `${cuad} (Oeste Industrial)`;

                    this.logTerminal(`> GEO_ANALYSIS: Ubicación detectada en perímetro [${cuad}].`);
                }, 800);
            };
        }

        // Búsqueda en tabla
        const searchInput = document.getElementById('emergenciaSearch');
        if (searchInput) {
            searchInput.oninput = () => this.renderHistorico(searchInput.value.trim());
        }
    },

    // ==========================================
    // ESTADO 3: Modal de llamada en curso
    // ==========================================
    openModal() {
        const modal = document.getElementById('modalLlamada');
        if (modal) modal.style.display = 'flex';

        // Generar folio automático
        const folioEl = document.getElementById('emergenciaFolio');
        if (folioEl) folioEl.value = 'INC-' + Math.floor(Math.random() * 900000 + 100000);

        this.logTerminal(`> RECORDER_ID: AUDIT-${document.getElementById('emergenciaFolio')?.value || 'N/A'}`);

        // Iniciar cronómetro de llamada (Imagen 3: "00 : 04")
        let seconds = 0;
        const timerEl = document.getElementById('callTimer');
        this.timerInterval = setInterval(() => {
            seconds++;
            const m = String(Math.floor(seconds / 60)).padStart(2, '0');
            const s = String(seconds % 60).padStart(2, '0');
            if (timerEl) timerEl.innerText = `${m} : ${s}`;
        }, 1000);
    },

    closeModal() {
        const modal = document.getElementById('modalLlamada');
        if (modal) modal.style.display = 'none';

        const form = document.getElementById('emergenciasForm');
        if (form) form.reset();

        const timer = document.getElementById('callTimer');
        if (timer) timer.innerText = '00 : 00';

        if (this.timerInterval) clearInterval(this.timerInterval);
    },

    // ==========================================
    // Registro del incidente
    // ==========================================
    async handleRegistro() {
        const nat = document.getElementById('emergenciaNaturaleza');
        const dir = document.getElementById('emergenciaDireccion');
        const desc = document.getElementById('emergenciaDescripcion');

        if (!nat?.value || !dir?.value || !desc?.value) {
            import('../Application/ViewRenderer.js').then(v => {
                v.ViewRenderer.showToast('Debe completar todos los campos obligatorios (*).', 'error');
            });
            return;
        }

        const datos = {
            naturaleza: nat.value,
            prioridad: document.getElementById('emergenciaPrioridad')?.value || 'MEDIA',
            direccion: dir.value,
            parroquia: '',
            punto_referencia: '',
            coordenadas: document.getElementById('emergenciaGPS')?.value || 'No proveídas',
            nombre_denunciante: document.getElementById('emergenciaDenunciante')?.value || 'ANÓNIMO',
            telefono_denunciante: document.getElementById('emergenciaTelefono')?.value || 'N/P',
            descripcion: desc.value
        };

        const folioInput = document.getElementById('emergenciaFolio')?.value;
        const resultado = await EmergenciasService.registrarIncidente(datos);

        if (resultado.success) {
            import('../Application/ViewRenderer.js').then(v => {
                v.ViewRenderer.showToast(`Incidente ${folioInput} captado exitosamente.`, 'success');
            });
            this.closeModal();
            this.renderHistorico();
            // Simular nueva llamada tras 8 segundos
            setTimeout(() => this.triggerLlamada(), 8000);
        }
    },

    // ==========================================
    // Tabla histórica (Imagen 1)
    // ==========================================
    renderHistorico(filter = '') {
        const tbody = document.getElementById('emergenciasTableBody');
        if (!tbody) return;

        let incidentes = EmergenciasService.obtenerIncidentes();

        if (filter) {
            const f = filter.toUpperCase();
            incidentes = incidentes.filter(i =>
                (i.folio || '').toUpperCase().includes(f) ||
                (i.naturaleza || '').toUpperCase().includes(f) ||
                (i.estatus || '').toUpperCase().includes(f)
            );
        }

        if (incidentes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="emer-empty">No se encontraron incidentes registrados.</td></tr>';
            return;
        }

        const prioridadColor = (p) => {
            const map = { 'ALTA': '#ef4444', 'CRITICA': '#f59e0b', 'MEDIA': '#3b82f6', 'BAJA': '#22c55e' };
            return map[p] || '#94a3b8';
        };

        const estatusClass = (e) => {
            if (e === 'EN DESPACHO') return 'emer-estatus-despacho';
            if (e === 'CAPTADO') return 'emer-estatus-captado';
            return 'emer-estatus-default';
        };

        tbody.innerHTML = incidentes.slice(0, 15).map(inc => `
            <tr>
                <td class="emer-td-folio">${inc.folio || 'N/A'}</td>
                <td>${inc.fecha || ''}</td>
                <td><span class="emer-prioridad" style="color:${prioridadColor(inc.prioridad)}">${inc.prioridad || 'MEDIA'}</span></td>
                <td>${inc.naturaleza || 'N/A'}</td>
                <td><span class="${estatusClass(inc.estatus)}">${inc.estatus || 'N/A'}</span></td>
            </tr>
        `).join('');
    },

    // ==========================================
    // Terminal log (Imagen 3)
    // ==========================================
    logTerminal(msg) {
        const term = document.getElementById('modalTerminal');
        if (!term) return;
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const line = document.createElement('div');
        line.className = 'emer-tlog';
        line.innerHTML = `<span class="emer-tlog-time">${time}</span> - ${msg}`;
        term.appendChild(line);
        term.scrollTop = term.scrollHeight;
    },

    poblarNaturalezas() {
        const select = document.getElementById('emergenciaNaturaleza');
        if (!select) return;

        // Importamos el servicio de administración (asumiendo que está disponible)
        import('../../Service/Administracion.service.js').then(m => {
            const cats = m.AdministracionService.getCategorias();
            select.innerHTML = '<option value="">Seleccione naturaleza</option>' + 
                cats.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
        });
    }
};
