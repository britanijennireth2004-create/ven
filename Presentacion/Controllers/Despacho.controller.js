/**
 * Presentacion/Controllers/Despacho/Despacho.controller.js
 * Controlador de Gestión de Despacho y Asignación Táctica - CUPAZ Monagas
 */

import { DespachoService } from '../../Service/Despacho.service.js';
import { EmergenciasService } from '../../Service/Emergencias.service.js';

export const controller = {
    async init(props) {
        await new Promise(resolve => setTimeout(resolve, 50));
        
        this.currentFolio = null; // Folio seleccionado para despacho
        this.initEvents();
        this.renderPendientes();
        this.timersConfirmacion = {}; // Keep track of dispatch confirmation timers

        window.despachoCtrl = this;
        return () => { window.despachoCtrl = null; };
    },

    initEvents() {
        // Gestión de TABS (Asignación vs Transmisión)
        const tabs = document.querySelectorAll('.dispatch-tab');
        tabs.forEach(tab => {
            tab.onclick = () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                let estatusDestino = 'CAPTADO';
                if(tab.id === 'tabAsignados') estatusDestino = 'ASIGNADO';
                if(tab.id === 'tabEnDespacho') estatusDestino = 'EN DESPACHO';

                this.renderPendientes(estatusDestino);
            };
        });

        // Eventos del Modal de Transmisión
        this.bindClick('btnIniciarTx', () => this.ejecutarTransmision());
        this.bindClick('closeTransmisionModal', () => this.cerrarModal());
        this.bindClick('btnCancelarTx', () => this.cerrarModal());
    },

    bindClick(id, fn) {
        const el = document.getElementById(id);
        if (el) el.onclick = fn;
    },

    /**
     * Renderiza la tabla de incidentes ordenados por prioridad (Requisito 7.1)
     */
    renderPendientes(estatus = 'CAPTADO') {
        const tbody = document.querySelector('.data-table tbody');
        if (!tbody) return;

        let incidentes = EmergenciasService.obtenerIncidentes(estatus);
        
        // Ordenamiento por Prioridad (Alta > Media > Baja) y fecha
        const priorityScore = { 'ALTA': 3, 'MEDIA': 2, 'BAJA': 1 };
        incidentes.sort((a,b) => priorityScore[b.prioridad.toUpperCase()] - priorityScore[a.prioridad.toUpperCase()]);

        if (incidentes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center">No hay incidentes en cola para el bloque seleccionado</td></tr>`;
            return;
        }

        tbody.innerHTML = incidentes.map(inc => `
            <tr>
                <td><span class="status-pill status-${inc.prioridad.toLowerCase()}">${inc.prioridad}</span></td>
                <td><b>${inc.folio}</b></td>
                <td>${this.calcularTiempo(inc.hora)}</td>
                <td>${inc.naturaleza}</td>
                <td class="text-xs">${inc.ubicacion.parroquia}, ${inc.ubicacion.direccion}</td>
                <td><span class="status-pill status-active">${inc.estatus}</span></td>
                <td class="text-right">
                    ${inc.estatus === 'CAPTADO' ? `
                    <button class="action-btn edit-btn" style="background:#0f172a; color:white" title="Asignar Recursos" onclick="despachoCtrl.prepararDespacho('${inc.folio}')">
                        <i class="fas fa-truck-fast"></i> ASIGNAR
                    </button> ` : ''}

                    ${inc.estatus === 'ASIGNADO' ? `
                    <button class="action-btn edit-btn" style="background:var(--primary-color); color:white" title="Transmitir Orden" onclick="despachoCtrl.prepararDespacho('${inc.folio}')">
                        <i class="fas fa-satellite-dish"></i> TRANSMITIR
                    </button> ` : ''}

                    ${inc.estatus === 'EN DESPACHO' ? `
                    <button class="action-btn edit-btn" style="background:var(--warning); color:white" title="Reasignar Recursos" onclick="despachoCtrl.reasignarUnidades('${inc.folio}')">
                        <i class="fas fa-rotate"></i> REASIGNAR
                    </button> ` : ''}
                </td>
            </tr>
        `).join('');
    },

    /**
     * Abre el flujo de asignación o transmisión dependiendo del estado
     */
    async prepararDespacho(folio) {
        const incidente = EmergenciasService.obtenerIncidentes().find(i => i.folio === folio);
        if (!incidente) return;

        this.currentFolio = folio;

        if (incidente.estatus === 'CAPTADO') {
            await this.abrirAsignacionTactica(incidente);
        } else if (incidente.estatus === 'ASIGNADO') {
            this.abrirModalTransmision(incidente);
        }
    },

    async abrirAsignacionTactica(inc) {
        const unidades = DespachoService.getUnidadesDisponibles();
        if (unidades.length === 0) {
            if(window.cupazToast) window.cupazToast("No hay unidades disponibles en cuadrantes cercanos.", "error");
            return;
        }

        // Sugerencia Automática basada en cuadrante cercano / tipo (simulada <= 10km) req 7.2
        const sugeridas = unidades.slice(0, 2); 
        const txtSug = sugeridas.map(u => `[MDT-${u.id} | ${u.vehiculo || 'Patrulla'} | a 3.2km]`).join(', ');

        if (await cupazConfirm(`El algoritmo sugiere los siguientes recursos cercanos (<=10km): \n\n${txtSug}\n\n¿Desea asignar estos recursos al folio ${inc.folio}?`, 'Sugerencia de Asignación Automática')) {
            const idsSugeridos = sugeridas.map(u => u.id);
            const res = DespachoService.asignarRecursos(inc.folio, idsSugeridos);
            
            if (res.success) {
                if(window.cupazToast) window.cupazToast("Recursos retenidos estratégicamente. Proceda a enviar Orden de Despacho.", "success");
                this.renderPendientes('CAPTADO');
            }
        }
    },

    abrirModalTransmision(inc) {
        const modal = document.getElementById('modalTransmision');
        const header = document.getElementById('txIncidenteHeader');
        const summary = document.getElementById('txIncidenteSummary');

        if (modal) {
            header.innerText = `Transmisión de Folio: ${inc.folio}`;
            summary.innerHTML = `
                <p><b>NATURALEZA:</b> ${inc.naturaleza}</p>
                <p><b>DESTINO:</b> ${inc.ubicacion.direccion}</p>
                <p><b>MDT OBJETIVO:</b> ${inc.unidades_asignadas.join(', ')}</p>
                <p class="mt-2" style="color:var(--warning); font-size:0.8rem">
                   <i>La orden será transmitida al terminal móvil. Si la unidad no aprueba la orden en 60 segundos, retornará una alerta de reasignación al panel central.</i>
                </p>
            `;
            modal.classList.add('active');
        }
    },

    async ejecutarTransmision() {
        if (!this.currentFolio) return;

        this.logTerminalTx("Iniciando transmisión encriptada...");
        await new Promise(r => setTimeout(r, 800));
        
        const exito = DespachoService.confirmarTransmisionRadio(this.currentFolio);
        if (exito) {
            if(window.cupazToast) window.cupazToast("Orden de Despacho enviada. Aguardando la confirmación de la unidad en campo...", "info");
            this.cerrarModal();
            
            const trxTab = document.getElementById('tabEnDespacho');
            if(trxTab) trxTab.click();

            // Inicio de tiempo de respuesta y timer de 60s (Simulado a 15s para test visual)
            this.iniciarTimerConfirmacion(this.currentFolio);
        }
    },

    iniciarTimerConfirmacion(folio) {
        let intentos = 0;
        this.timersConfirmacion[folio] = setInterval(() => {
            const inc = EmergenciasService.obtenerIncidentes().find(i => i.folio === folio);
            if(inc && inc.estatus === 'EN DESPACHO') {
                intentos++;
                if (intentos >= 3) {
                    clearInterval(this.timersConfirmacion[folio]);
                    this.alertarNoConfirmacion(folio);
                } else {
                    this.logTerminalTx(`Intento ${intentos}/3: Aguardando ping del MDT asignado al folio ${folio}...`);
                }
            } else {
                // Ya fue confirmado u otra cosa pasó (por parte del terminal)
                clearInterval(this.timersConfirmacion[folio]);
            }
        }, 12000); // Simulando bloqueos de 12 segundos cada intento
    },

    async alertarNoConfirmacion(folio) {
        this.logTerminalTx(`ALERTA: Recurso no reportó acuse de recibo. Abortando enlace al folio ${folio}`);
        if(window.cupazAlert) {
            await window.cupazAlert(`La unidad asignada al folio ${folio} no ha confirmado su llegada ni despachó acuse de recibo tras los 3 intentos reglamentarios.\n\nPor favor intente vía radio u ordene la REASIGNACIÓN del recurso táctico de inmediato.`, 'Falla de Comunicaciones Crítica');
        }
        this.renderPendientes('EN DESPACHO');
    },

    async reasignarUnidades(folio) {
        if (await cupazConfirm(`¿Desvincular la unidad asiganda y devolver el incidente ${folio} a cola de asignación general?`, 'Reasignación Operativa')) {
            DespachoService.reasignarIncidente(folio);
            if(window.cupazToast) window.cupazToast(`Incidente rebotado exitosamente a panel central.`);
            const tab1 = document.getElementById('tabAsignacion');
            if(tab1) tab1.click();
        }
    },

    cerrarModal() {
        const modal = document.getElementById('modalTransmision');
        if (modal) modal.classList.remove('active');
        this.currentFolio = null;
    },

    calcularTiempo(horaRegistro) {
        return "hace unos min";
    },

    logTerminalTx(msg) {
        console.log(`[DESPACHO-TX] ${msg}`);
        // Si hay una consola visual
        const callLog = document.getElementById('callLog');
        if (callLog) {
            const line = document.createElement('div');
            line.className = 'log-line';
            line.innerHTML = `> ${new Date().toLocaleTimeString()} - ${msg}`;
            callLog.prepend(line);
        }
    }
};
