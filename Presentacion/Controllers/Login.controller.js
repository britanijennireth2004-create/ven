/**
 * Presentacion/Controllers/Login/Login.controller.js
 * Controlador para la gestión de autenticación y soporte técnico inicial.
 */

import { AuthService } from '../../Service/AuthService.js';
import { SupportService } from '../../Service/SupportService.js';
import { ViewRenderer } from '../Application/ViewRenderer.js';
import { Dialog } from '../Components/UI/Dialog.js';

export const controller = {
  async init(props) {
    const { onLoginSuccess } = props;
    
    // Bind support modal triggers
    const btnSupport = document.getElementById('btnOpenSupport');
    const btnSupportOther = document.getElementById('btnSupportOther');
    
    const openSupport = (e) => {
        e.preventDefault();
        this.handleSupportModal();
    };

    if (btnSupport) btnSupport.onclick = openSupport;
    if (btnSupportOther) btnSupportOther.onclick = openSupport;

    // Toggle password visibility
    const btnToggle = document.getElementById('btnTogglePassword');
    const inputPass = document.getElementById('password');
    if (btnToggle && inputPass) {
        btnToggle.onclick = (e) => {
            e.preventDefault();
            if (inputPass.type === 'password') {
                inputPass.type = 'text';
                btnToggle.innerText = 'OCULTAR';
            } else {
                inputPass.type = 'password';
                btnToggle.innerText = 'MOSTRAR';
            }
        };
    }
    
    await new Promise(resolve => setTimeout(resolve, 50));

    if (props.logoutMessage) {
        ViewRenderer.showToast(props.logoutMessage);
    }
    
    const form = document.getElementById('loginForm');

    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const user = document.getElementById('username').value;
        const pass = document.getElementById('password').value;
        const btn = form.querySelector('.sign-in-btn');
        
        try {
          const errorEl = document.getElementById('loginError');
          if (errorEl) {
              errorEl.style.display = 'none';
              errorEl.innerText = '';
          }

          if (btn) {
              btn.disabled = true;
              btn.innerText = 'VERIFICANDO...';
          }

          const result = await AuthService.login(user, pass);
          
          if (result.success) {
            onLoginSuccess(result.user);
          } else {
            throw new Error(result.message || "Credenciales inválidas");
          }
        } catch (error) {
          const errorEl = document.getElementById('loginError');
          if (errorEl) {
              errorEl.style.display = 'block';
              errorEl.innerText = error.message;
          }
          if (btn) {
              btn.disabled = false;
              btn.innerText = 'ACCEDER AL SISTEMA';
          }
        }
      };
    }
  },


  handleSupportModal() {
    const cuadrantes = SupportService.getCuadrantes();
    let options = '<option value="">Seleccione un cuadrante...</option>';
    
    // Solo mostrar los nombres de cuadrantes existentes activos
    cuadrantes.forEach(c => {
      const nombre = c.nombre || c.codigo || 'Sin nombre';
      options += `<option value="${nombre}">${nombre}</option>`;
    });

    const content = `
      <div style="padding: 10px;">
        <p style="font-size: 0.85rem; color: var(--text-gray); margin-bottom: 20px;">
          Si tiene problemas para acceder, complete los datos para notificar al administrador del estado Monagas.
        </p>
        
        <div class="pb-group">
          <label class="pb-label">Cédula de Identidad</label>
          <div style="display: flex; gap: 8px;">
            <select id="sup_nac" class="pb-input" style="width: 70px; flex: none;">
              <option value="V">V</option>
              <option value="E">E</option>
              <option value="J">J</option>
            </select>
            <input type="text" id="sup_cedula" class="pb-input" placeholder="00000000" 
                   oninput="this.value = this.value.replace(/[^0-9]/g, '')" maxlength="10">
          </div>
        </div>

        <div class="pb-group">
          <label class="pb-label">Cuadrante de Paz</label>
          <select id="sup_cuadrante" class="pb-input">
            ${options}
          </select>
        </div>

        <div class="pb-group">
          <label class="pb-label">Motivo de la Solicitud</label>
          <textarea id="sup_motivo" class="pb-input" rows="3" placeholder="Indique si requiere reseteo de clave o error de acceso..."></textarea>
        </div>
      </div>
    `;

    Dialog.openModal({
      title: 'CENTRO DE SOPORTE - CUPAZ MONAGAS',
      content: content,
      footer: `
        <button class="btn-upload-simple" onclick="document.getElementById('support-modal').remove()">CANCELAR</button>
        <button class="add-btn" id="btnSendSupport">ENVIAR SOLICITUD</button>
      `,
      id: 'support-modal',
      maxWidth: '450px'
    });

    document.getElementById('btnSendSupport').onclick = () => this.submitSupport();
  },

  async submitSupport() {
    const btnSend = document.getElementById('btnSendSupport');
    const fNac = document.getElementById('sup_nac');
    const fCedu = document.getElementById('sup_cedula');
    const fCuad = document.getElementById('sup_cuadrante');
    const fMoti = document.getElementById('sup_motivo');

    // Reset de estilos previos
    [fCedu, fCuad, fMoti].forEach(f => f.style.borderColor = '');

    const cedulaFull = fCedu.value.trim() ? `${fNac.value}-${fCedu.value.trim()}` : '';

    const payload = {
        cedula: cedulaFull,
        cuadrante: fCuad.value,
        motivo: fMoti.value.trim()
    };

    try {
        // Validación visual previa
        if (!fCedu.value.trim() || !payload.cuadrante || !payload.motivo) {
            if (!fCedu.value.trim()) fCedu.style.borderColor = '#dc2626';
            if (!payload.cuadrante) fCuad.style.borderColor = '#dc2626';
            if (!payload.motivo) fMoti.style.borderColor = '#dc2626';
            throw new Error("Todos los campos con borde rojo son obligatorios.");
        }

        if (btnSend) {
            btnSend.disabled = true;
            btnSend.innerText = 'ENVIANDO...';
        }

        await SupportService.enviarSolicitud(payload);
        
        document.getElementById('support-modal').remove();
        ViewRenderer.showToast("Solicitud enviada al Comando Central exitosamente.");
        
    } catch (error) {
        ViewRenderer.showToast(error.message, "error");
        if (btnSend) {
            btnSend.disabled = false;
            btnSend.innerText = 'ENVIAR SOLICITUD';
        }
    }
  }
};
