/**
 * Presentacion/Components/UI/Validator.js
 * Componente transversal para validaciones de formularios y reglas de negocio de interfaces.
 */

export const Validator = {
    /**
     * Valida un esquema predefinido de reglas
     * @param {Object} data - Los datos a validar
     * @param {Object} rules - Reglas a cumplir. Ej: { id: 'required', imei: 'required|length:15' }
     * @param {Object} messages - Mensajes de error custom. Ej: { id: 'El ID es obligatorio' }
     * @returns {Object|null} - Objeto con errores o nulo si es válido
     */
    validate(data, rules, messages = {}) {
        const errors = {};

        for (const [field, ruleString] of Object.entries(rules)) {
            const rulesArray = ruleString.split('|');
            const value = data[field];

            for (const rule of rulesArray) {
                if (rule === 'required') {
                    if (value === undefined || value === null || String(value).trim() === '') {
                        errors[field] = messages[field] || 'Este campo es obligatorio';
                        break;
                    }
                }

                if (rule.startsWith('length:')) {
                    const len = parseInt(rule.split(':')[1], 10);
                    if (value && String(value).trim().length !== len) {
                        errors[field] = messages[field] || `Debe tener exactamente ${len} caracteres`;
                        break;
                    }
                }

                if (rule.startsWith('min:')) {
                    const min = parseInt(rule.split(':')[1], 10);
                    if (value && String(value).trim().length < min) {
                        errors[field] = messages[field] || `Mínimo ${min} caracteres`;
                        break;
                    }
                }

                if (rule.startsWith('max:')) {
                    const max = parseInt(rule.split(':')[1], 10);
                    if (value && String(value).trim().length > max) {
                        errors[field] = messages[field] || `Máximo ${max} caracteres`;
                        break;
                    }
                }
                
                if (rule === 'numeric') {
                    if (value && !/^\d+$/.test(value)) {
                        errors[field] = messages[field] || 'Debe ser un valor numérico';
                        break;
                    }
                }

                if (rule === 'email') {
                    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (value && !regex.test(value)) {
                        errors[field] = messages[field] || 'El formato de correo es inválido';
                        break;
                    }
                }

                if (rule === 'password') {
                    const regex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
                    if (value && !regex.test(value)) {
                        errors[field] = messages[field] || 'Mínimo 8 caracteres, una mayúscula y un número';
                        break;
                    }
                }

                if (rule === 'letters') {
                    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
                    if (value && !regex.test(value)) {
                        errors[field] = messages[field] || 'Solo se permiten letras y espacios';
                        break;
                    }
                }

                if (rule === 'no-spaces') {
                    if (value && /\s/.test(value)) {
                        errors[field] = messages[field] || 'No se permiten espacios';
                        break;
                    }
                }
            }
        }

        return Object.keys(errors).length > 0 ? errors : null;
    },

    /**
     * Inyecta errores visuales de forma genérica en el DOM.
     */
    paintErrors(formErrors, mapHtml, options = { groupClass: '.pb-group', errClass: 'validator-error-text' }) {
        for (const [key, msg] of Object.entries(formErrors)) {
            const htmlId = mapHtml[key] || key;
            const el = document.getElementById(htmlId);
            if (!el) continue;

            el.classList.add('invalid');
            const group = el.closest(options.groupClass) || el.parentElement;
            
            if (group) {
                let nativeHelper = group.querySelector('.premium-helper-text');
                if (nativeHelper) {
                    group.classList.remove('is-success');
                    group.classList.add('is-error');
                    nativeHelper.textContent = msg;
                } else {
                    let errSpan = group.querySelector('.' + options.errClass);
                    if (!errSpan) {
                        errSpan = document.createElement('span');
                        errSpan.className = options.errClass;
                        errSpan.style.cssText = 'color: #dc2626; font-size: 0.7rem; margin-top: 4px; display: block; font-weight: 600;';
                        group.appendChild(errSpan);
                    }
                    errSpan.textContent = msg;
                }
            }
        }
    },

    /**
     * Limpia los errores visuales de un formulario completo
     */
    clearErrors(formId, options = { groupClass: '.pb-group', errClass: 'validator-error-text' }) {
        const form = document.getElementById(formId);
        if (!form) return;
        
        form.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
        form.querySelectorAll('.is-error').forEach(el => el.classList.remove('is-error'));
        form.querySelectorAll('.is-success').forEach(el => el.classList.remove('is-success'));
        form.querySelectorAll('.' + options.errClass).forEach(el => el.remove());
    },

    /**
     * Valida un formulario completo extrayendo datos automáticamente de los inputs.
     */
    validateForm(formId, mapping, rules, messages, options) {
        this.clearErrors(formId, options);
        
        const data = {};
        for (const [key, id] of Object.entries(mapping)) {
            const el = document.getElementById(id);
            if (el) data[key] = el.value.trim();
        }

        const errors = this.validate(data, rules, messages);
        if (errors) {
            this.paintErrors(errors, mapping, options);
        } else {
            // Si no hay errores, se marcan todos los campos como exitosos
            for (const [key, id] of Object.entries(mapping)) {
                const el = document.getElementById(id);
                if (el && el.value.trim().length > 0) {
                   const group = el.closest(options.groupClass) || el.parentElement;
                   if (group) group.classList.add('is-success');
                }
            }
        }
        return errors;
    },

    /**
     * Renderiza opciones dinámicas para un select
     */
    renderSelectOptions(selectId, data, mapping = { value: 'id', text: 'nombre' }, defaultText = 'Seleccione una opción...') {
        const select = document.getElementById(selectId);
        if (!select) return;

        let html = `<option value="" disabled selected>${defaultText}</option>`;
        data.forEach(item => {
            const val = item[mapping.value];
            const txt = typeof mapping.text === 'function' ? mapping.text(item) : item[mapping.text];
            html += `<option value="${val}">${txt}</option>`;
        });
        select.innerHTML = html;
    }
};
