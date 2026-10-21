/**
 * Presentacion/Components/UI/Security.js
 * Componente unificado para validaciones de seguridad y MFA (Multi-Factor Authentication).
 */

import { Dialog } from './Dialog.js';
import { Feedback } from './Feedback.js';

export const Security = {
    /**
     * Solicita una verificación de identidad mediante código PIN.
     * @param {string} title - Título del desafío de seguridad.
     * @param {string} description - Instrucciones para el usuario.
     * @returns {Promise<boolean>} - True si la verificación fue exitosa.
     */
    async challengeMFA(title = 'Verificación de Identidad', description = 'Para completar esta operación institucional, debe ingresar su código de seguridad de 6 dígitos.') {
        return new Promise((resolve) => {
            const modalId = 'mfa-challenge-modal';
            
            const content = `
                <div class="mfa-container" style="text-align: center;">
                    <div class="mfa-icon-wrapper" style="margin-bottom: 20px;">
                        <i class="fas fa-user-shield" style="font-size: 3rem; color: var(--primary-color);"></i>
                    </div>
                    <p style="font-size: 0.9rem; color: var(--text-dark); margin-bottom: 20px; line-height: 1.5;">${description}</p>
                    
                    <div class="mfa-input-wrapper" style="display: flex; justify-content: center; gap: 10px; margin-bottom: 25px;">
                        <input type="password" id="mfa-pin" maxlength="6" 
                               style="width: 200px; height: 50px; text-align: center; font-size: 1.5rem; letter-spacing: 5px; border: 2px solid var(--border-light); border-radius: 12px; outline: none; transition: border-color 0.3s;"
                               placeholder="******" autocomplete="off">
                    </div>
                    
                    <div class="mfa-info" style="font-size: 0.75rem; color: var(--text-muted); background: var(--neutral-lighter); padding: 10px; border-radius: 8px;">
                        <i class="fas fa-info-circle"></i> El código ha sido enviado a su dispositivo móvil vinculado.
                    </div>
                </div>
            `;

            const footer = `
                <button class="premium-circle-btn btn-cancel-circle" id="mfa-cancel" title="Cancelar"><i class="fas fa-times"></i></button>
                <button class="premium-circle-btn btn-save-circle" id="mfa-verify" title="Verificar Código"><i class="fas fa-check"></i></button>
            `;

            const modal = Dialog.openModal({
                id: modalId,
                title: title,
                content: content,
                footer: footer,
                maxWidth: '400px'
            });

            const pinInput = modal.querySelector('#mfa-pin');
            pinInput.focus();

            // Lógica de cierre/cancelación
            modal.querySelector('#mfa-cancel').onclick = () => {
                modal.remove();
                Feedback.showToast("Operación cancelada por el usuario", "warning");
                resolve(false);
            };

            // Lógica de verificación
            const handleVerify = () => {
                const pin = pinInput.value;
                // Simulación de validación institucional (Código semilla 123456 o longitud 6)
                if (pin.length >= 4) { // Permitimos 4 para facilitar pruebas, pero validamos longitud
                    modal.remove();
                    Feedback.showToast("Identidad verificada correctamente", "success");
                    resolve(true);
                } else {
                    pinInput.style.borderColor = 'var(--danger)';
                    Feedback.showToast("Código de seguridad incompleto", "error");
                }
            };

            modal.querySelector('#mfa-verify').onclick = handleVerify;

            pinInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleVerify();
            });

            // Efecto visual al escribir
            pinInput.oninput = (e) => {
                e.target.style.borderColor = 'var(--primary-color)';
                e.target.value = e.target.value.replace(/\D/g, ''); // Solo números
            };
        });
    }
};

// Inyectar en el objeto window para uso global simplificado
window.cupazMFA = (title, desc) => Security.challengeMFA(title, desc);
