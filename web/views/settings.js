export async function render() {
    const container = document.getElementById('app-view');
    
    container.innerHTML = `
        <div class="view-card" style="max-width: 650px; margin: 0 auto;">
            <h2>Configuración de Cotizaciones y Sistema</h2>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">
                Selecciona las fuentes de confianza para el cálculo automático de divisas, criptomonedas y créditos UVA, y visualiza sus valores actuales.
            </p>

            <form id="settings-form" style="display: flex; flex-direction: column; gap: 1.2rem;">
                
                <!-- Dólar -->
                <div style="background: rgba(15, 23, 42, 0.6); padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius); display: flex; flex-direction: column; gap: 0.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <label style="font-weight: bold;">Cotización Dólar:</label>
                        <span id="current-dolar-val" style="font-size: 0.85rem; color: var(--accent); background: rgba(59, 130, 246, 0.1); padding: 0.2rem 0.5rem; border-radius: 4px;">Cargando valor...</span>
                    </div>
                    <select id="setting-dolar" style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                        <option value="oficial">Dólar Oficial (Banco Nación)</option>
                        <option value="blue">Dólar Blue</option>
                        <option value="mep">Dólar MEP / Bolsa</option>
                    </select>
                </div>

                <!-- Bitcoin -->
                <div style="background: rgba(15, 23, 42, 0.6); padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius); display: flex; flex-direction: column; gap: 0.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <label style="font-weight: bold;">Cotización Bitcoin (Cripto):</label>
                        <span id="current-btc-val" style="font-size: 0.85rem; color: var(--accent); background: rgba(59, 130, 246, 0.1); padding: 0.2rem 0.5rem; border-radius: 4px;">Cargando valor...</span>
                    </div>
                    <select id="setting-btc" style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                        <option value="binance">Binance Spot API (Recomendado)</option>
                        <option value="coingecko">CoinGecko API</option>
                    </select>
                </div>

                <!-- UVA -->
                <div style="background: rgba(15, 23, 42, 0.6); padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius); display: flex; flex-direction: column; gap: 0.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <label style="font-weight: bold;">Índice UVA (Créditos Hipotecarios):</label>
                        <span id="current-uva-val" style="font-size: 0.85rem; color: var(--accent); background: rgba(59, 130, 246, 0.1); padding: 0.2rem 0.5rem; border-radius: 4px;">Cargando valor...</span>
                    </div>
                    <select id="setting-uva" style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                        <option value="bcra">BCRA (Banco Central Oficial)</option>
                        <option value="manual">Carga Manual</option>
                    </select>
                </div>

                <button type="submit" style="background-color: var(--accent); color: white; border: none; padding: 0.75rem; border-radius: var(--radius); cursor: pointer; font-weight: bold; margin-top: 0.5rem;">
                    Guardar Configuración
                </button>
            </form>
            
            <div id="settings-status" style="margin-top: 1rem; font-size: 0.9rem; text-align: center;"></div>
        </div>
    `;

    await loadCurrentSettings();
    await loadLiveRatesDisplay();
    setupSettingsForm();
}

async function loadCurrentSettings() {
    try {
        const res = await fetch('http://localhost:3000/api/settings');
        if (!res.ok) return;
        const data = await res.json();

        if (data.dolar_source) document.getElementById('setting-dolar').value = data.dolar_source;
        if (data.btc_source) document.getElementById('setting-btc').value = data.btc_source;
        if (data.uva_source) document.getElementById('setting-uva').value = data.uva_source;
    } catch (err) {
        console.error('Error cargando configuración:', err);
    }
}

async function loadLiveRatesDisplay() {
    const dolarLabel = document.getElementById('current-dolar-val');
    const btcLabel = document.getElementById('current-btc-val');
    const uvaLabel = document.getElementById('current-uva-val');

    try {
        const res = await fetch('http://localhost:3000/api/rates');
        if (!res.ok) throw new Error('Error al obtener tasas');
        const data = await res.json();

        // Obtener selecciones actuales
        const selectedDolar = document.getElementById('setting-dolar').value || 'oficial';
        const selectedBtc = document.getElementById('setting-btc').value || 'binance';
        const selectedUva = document.getElementById('setting-uva').value || 'bcra';

        // Mostrar cotización del Dólar seleccionada
        const dolarVal = data.dolar[selectedDolar] || data.dolar.oficial;
        dolarLabel.textContent = `Actual: $${dolarVal.toLocaleString('es-AR', { minimumFractionDigits: 2 })} ARS`;

        // Mostrar cotización de Bitcoin seleccionada
        const btcVal = data.btc[selectedBtc] || data.btc.binance;
        btcLabel.textContent = `Actual: $${btcVal.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD`;

        // Mostrar cotización de UVA seleccionada
        const uvaVal = data.uva[selectedUva] || data.uva.bcra;
        uvaLabel.textContent = `Actual: $${uvaVal.toLocaleString('es-AR', { minimumFractionDigits: 2 })} ARS`;

    } catch (err) {
        console.error('Error al cargar cotizaciones reales:', err);
        dolarLabel.textContent = 'No disponible';
        btcLabel.textContent = 'No disponible';
        uvaLabel.textContent = 'No disponible';
    }
}

function setupSettingsForm() {
    const form = document.getElementById('settings-form');
    const statusDiv = document.getElementById('settings-status');

    form.onsubmit = async (e) => {
        e.preventDefault();
        const dolar_source = document.getElementById('setting-dolar').value;
        const btc_source = document.getElementById('setting-btc').value;
        const uva_source = document.getElementById('setting-uva').value;

        statusDiv.style.color = 'var(--text-muted)';
        statusDiv.textContent = 'Guardando cambios...';

        try {
            const settingsToSave = [
                { key: 'dolar_source', value: dolar_source },
                { key: 'btc_source', value: btc_source },
                { key: 'uva_source', value: uva_source }
            ];

            for (const item of settingsToSave) {
                await fetch('http://localhost:3000/api/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(item)
                });
            }

            statusDiv.style.color = '#10b981';
            statusDiv.textContent = '¡Configuración guardada con éxito!';
            setTimeout(() => { statusDiv.textContent = ''; }, 3000);
        } catch (err) {
            statusDiv.style.color = '#ef4444';
            statusDiv.textContent = 'Error al guardar: ' + err.message;
        }
    };
}