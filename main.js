/**
 * main.js
 * Punto de entrada principal de la aplicación
 */

import { App } from './Presentacion/Application/App.js';
import { DataSeed } from './Persistencia/DataSeed.js';

document.addEventListener('DOMContentLoaded', () => {
    DataSeed.init();
    App.init();
});
