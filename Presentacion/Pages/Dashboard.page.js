/**
 * Presentacion/Pages/Dashboard/Dashboard.page.js
 * Dashboard Ejecutivo Institucional CUPAZ
 */

export function render(props = {}) {
  return `
    <div class="dash-layout-container animate-fade-in" style="padding: 15px 25px; background: #fafbfe; min-height: 100vh; font-family: 'Inter', sans-serif;">
        <h2 style="font-size: 1.5rem; font-weight: 800; color: #0f172a; margin-bottom: 15px; letter-spacing: -0.5px;">PANEL DE CONTROL GENERAL</h2>
        
        <!-- SECCIÓN DE GRÁFICOS PIE -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">
            <!-- Panel Izquierdo: METRICAS OPERATIVAS -->
            <div style="background: white; border-radius: 10px; padding: 15px 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.02), 0 10px 15px -3px rgba(0,0,0,0.03); border: 1px solid #f1f5f9; display: flex; flex-direction: column;">
                <h4 style="font-size: 0.85rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 0.5px;">MÉTRICAS OPERATIVAS DE EMERGENCIA</h4>
                <div style="display: flex; align-items: center; justify-content: space-between; flex-grow: 1; min-height: 170px;">
                    <!-- Leyenda Personalizada -->
                    <div id="op-legend" style="display: flex; flex-direction: column; gap: 8px; min-width: 170px; text-align: left;">
                        <!-- Inyectado dinámicamente -->
                    </div>
                    <!-- Contenedor del Gráfico -->
                    <div style="width: 170px; height: 170px; position: relative; display: flex; align-items: center; justify-content: center;">
                        <canvas id="chartOperativo" style="max-width: 170px; max-height: 170px;"></canvas>
                    </div>
                </div>
            </div>

            <!-- Panel Derecho: DIRECTORIO E INFRAESTRUCTURA -->
            <div style="background: white; border-radius: 10px; padding: 15px 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.02), 0 10px 15px -3px rgba(0,0,0,0.03); border: 1px solid #f1f5f9; display: flex; flex-direction: column;">
                <h4 style="font-size: 0.85rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 0.5px;">DIRECTORIO E INFRAESTRUCTURA</h4>
                <div style="display: flex; align-items: center; justify-content: space-between; flex-grow: 1; min-height: 170px;">
                    <!-- Leyenda Personalizada -->
                    <div id="admin-legend" style="display: flex; flex-direction: column; gap: 8px; min-width: 170px; text-align: left;">
                        <!-- Inyectado dinámicamente -->
                    </div>
                    <!-- Contenedor del Gráfico -->
                    <div style="width: 170px; height: 170px; position: relative; display: flex; align-items: center; justify-content: center;">
                        <canvas id="chartAdministrativo" style="max-width: 170px; max-height: 170px;"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <!-- SECCIÓN INFERIOR: PARQUE AUTOMOTOR -->
        <div style="margin-top: 10px; text-align: left;">
            <h3 style="font-size: 1.1rem; font-weight: 700; color: #64748b; margin-bottom: 15px;">Estado del Parque Automotor</h3>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
                <!-- Tarjeta 1 -->
                <div style="background: white; border-radius: 8px; border: 1px solid #e2e8f0; padding: 15px; text-align: center; box-shadow: 0 1px 2px rgba(0,0,0,0.01);">
                    <div style="font-size: 0.85rem; font-weight: 600; color: #0f172a; margin-bottom: 10px;">Recursos Disponibles</div>
                    <div id="dashRecursosDisponibles" style="font-size: 2.2rem; font-weight: 900; color: #000000; line-height: 1;">0</div>
                </div>
                <!-- Tarjeta 2 -->
                <div style="background: white; border-radius: 8px; border: 1px solid #e2e8f0; padding: 15px; text-align: center; box-shadow: 0 1px 2px rgba(0,0,0,0.01);">
                    <div style="font-size: 0.85rem; font-weight: 600; color: #0f172a; margin-bottom: 10px;">Equipos Asignados/Activos</div>
                    <div id="dashRecursosEnUso" style="font-size: 2.2rem; font-weight: 900; color: #000000; line-height: 1;">0</div>
                </div>
                <!-- Tarjeta 3 -->
                <div style="background: white; border-radius: 8px; border: 1px solid #e2e8f0; padding: 15px; text-align: center; box-shadow: 0 1px 2px rgba(0,0,0,0.01);">
                    <div style="font-size: 0.85rem; font-weight: 600; color: #0f172a; margin-bottom: 10px;">Aislados / Mantenimiento</div>
                    <div id="dashRecursosMantenimiento" style="font-size: 2.2rem; font-weight: 900; color: #000000; line-height: 1;">0</div>
                </div>
            </div>
        </div>
    </div>
  `;
}
