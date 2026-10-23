export async function render() {
    const container = document.getElementById('app-view');
    
    container.innerHTML = `
        <div class="view-card" style="display: flex; flex-direction: column; gap: 1.5rem;">
            <!-- CABECERA PRINCIPAL -->
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(15, 23, 42, 0.6); padding: 1.25rem 1.5rem; border: 1px solid var(--border); border-radius: var(--radius); backdrop-filter: blur(8px);">
                <div>
                    <h2 style="margin: 0; font-size: 1.4rem; display: flex; align-items: center; gap: 0.5rem;">
                        💳 Tarjetas & Proyección de Cuotas
                    </h2>
                    <p style="margin: 0.25rem 0 0 0; color: var(--text-muted); font-size: 0.85rem;">
                        Gestión centralizada de límites, fechas de cierre, resúmenes y compromisos futuros.
                    </p>
                </div>
                <button id="btn-nueva-tarjeta" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; border: none; padding: 0.65rem 1.25rem; border-radius: var(--radius); cursor: pointer; font-weight: 600; font-size: 0.85rem; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); transition: all 0.2s ease;">
                    + Nueva Tarjeta
                </button>
            </div>

            <!-- FORMULARIO CREACIÓN / EDICIÓN -->
            <div id="card-form-container" style="display: none; background: rgba(15, 23, 42, 0.9); border: 1px solid #3b82f6; border-radius: var(--radius); padding: 1.5rem; box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
                <h3 id="form-title" style="margin-top: 0; margin-bottom: 1rem; font-size: 1.1rem; color: #60a5fa; display: flex; align-items: center; gap: 0.5rem;">
                    ⚙️ Configuración de Tarjeta
                </h3>
                <form id="card-form" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; align-items: end;">
                    <input type="hidden" id="card-id">
                    
                    <div>
                        <label style="display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.3rem;">Nombre Tarjeta</label>
                        <input type="text" id="card-name" required placeholder="Ej. Visa Galicia" style="width: 100%; padding: 0.6rem; background: var(--bg-primary); border: 1px solid var(--border); color: var(--text-main); border-radius: 6px;">
                    </div>

                    <div>
                        <label style="display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.3rem;">Moneda</label>
                        <select id="card-currency" style="width: 100%; padding: 0.6rem; background: var(--bg-primary); border: 1px solid var(--border); color: var(--text-main); border-radius: 6px;">
                            <option value="ARS" selected>ARS ($)</option>
                            <option value="USD">USD (US$)</option>
                        </select>
                    </div>

                    <div>
                        <label style="display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.3rem;">Día de Cierre</label>
                        <input type="number" id="card-closing" min="1" max="31" placeholder="Ej. 22" style="width: 100%; padding: 0.6rem; background: var(--bg-primary); border: 1px solid var(--border); color: var(--text-main); border-radius: 6px;">
                    </div>

                    <div>
                        <label style="display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.3rem;">Día de Vencimiento</label>
                        <input type="number" id="card-due" min="1" max="31" placeholder="Ej. 3" style="width: 100%; padding: 0.6rem; background: var(--bg-primary); border: 1px solid var(--border); color: var(--text-main); border-radius: 6px;">
                    </div>

                    <div>
                        <label style="display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.3rem;">Color Distintivo</label>
                        <input type="color" id="card-color" value="#3b82f6" style="width: 100%; height: 38px; padding: 2px; background: var(--bg-primary); border: 1px solid var(--border); border-radius: 6px; cursor: pointer;">
                    </div>

                    <div>
                        <label style="display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.3rem;">Logotipo</label>
                        <input type="file" id="card-image-file" accept="image/*" style="width: 100%; padding: 0.4rem; background: var(--bg-primary); border: 1px solid var(--border); color: var(--text-main); border-radius: 6px;">
                    </div>

                    <div style="grid-column: 1 / -1; display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 0.5rem;">
                        <button type="button" id="btn-cancelar" style="background: #475569; color: white; border: none; padding: 0.6rem 1rem; border-radius: 6px; cursor: pointer;">Cancelar</button>
                        <button type="submit" id="btn-submit-card" style="background: #10b981; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 6px; cursor: pointer; font-weight: 600;">Guardar Tarjeta</button>
                    </div>
                </form>
            </div>
            
            <!-- TARJETAS ACTIVAS -->
            <div>
                <h3 style="font-size: 1rem; color: var(--text-muted); margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">Mis Tarjetas</h3>
                <div id="cards-content">
                    <p class="loading">Cargando tarjetas desde el servidor...</p>
                </div>
            </div>

            <!-- SECCIÓN 2: PROYECCIÓN Y ESTADO DE RESÚMENES -->
            <div style="background: rgba(15, 23, 42, 0.4); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem;">
                    <div>
                        <h3 style="margin: 0; font-size: 1.1rem; color: var(--text-main);">Proyección y Estado de Cuotas Futuras</h3>
                        <p style="color: var(--text-muted); font-size: 0.85rem; margin: 0.2rem 0 0 0;">
                            Control mensual de resúmenes liquidados vs. compromisos pendientes. Haz clic en un periodo para ver su detalle abajo.
                        </p>
                    </div>
                </div>

                <div id="projections-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem;">
                    <p style="text-align: center; color: var(--text-muted); grid-column: 1 / -1;">Cargando proyecciones...</p>
                </div>
            </div>

            <!-- SECCIÓN COLAPSIBLE: HISTORIAL DE RESÚMENES PAGADOS -->
            <div style="background: rgba(15, 23, 42, 0.4); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;" id="btn-toggle-history">
                    <div>
                        <h3 style="margin: 0; font-size: 1.1rem; color: var(--text-main); display: flex; align-items: center; gap: 0.5rem;">
                            📂 Historial de Resúmenes Pagados <span id="history-toggle-icon" style="font-size: 0.8rem; color: var(--text-muted);">▼</span>
                        </h3>
                        <p style="color: var(--text-muted); font-size: 0.85rem; margin: 0.2rem 0 0 0;">
                            Auditoría de meses anteriores ya liquidados por tarjeta (Haz clic para expandir / ocultar).
                        </p>
                    </div>
                </div>

                <div id="history-collapsible-content" style="display: none; margin-top: 1.25rem; border-top: 1px dashed var(--border); padding-top: 1.25rem;">
                    <div style="display: flex; justify-content: flex-end; margin-bottom: 1rem;">
                        <select id="filter-history-card" style="padding: 0.5rem; background: var(--bg-primary); border: 1px solid var(--border); color: var(--text-main); border-radius: 6px; font-size: 0.85rem;">
                            <option value="">Todas las tarjetas</option>
                        </select>
                    </div>
                    <div id="history-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem;">
                        <p style="text-align: center; color: var(--text-muted); grid-column: 1 / -1;">Cargando historial...</p>
                    </div>
                </div>
            </div>

            <!-- SECCIÓN 3: DETALLE INFERIOR DE GASTOS DEL RESUMEN SELECCIONADO -->
            <div id="summary-detail-section" style="background: rgba(15, 23, 42, 0.6); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.5rem; display: none;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3 id="detail-section-title" style="margin: 0; font-size: 1.1rem; color: #60a5fa;">
                        🔍 Detalle de Resumen Seleccionado
                    </h3>
                    <button id="btn-close-detail" style="background: transparent; color: var(--text-muted); border: none; cursor: pointer; font-size: 1rem;">✕ Cerrar</button>
                </div>
                <div id="summary-detail-content">
                    <p style="color: var(--text-muted); text-align: center; margin: 0;">Selecciona un resumen arriba para ver sus cuotas y gastos detallados.</p>
                </div>
            </div>
        </div>

        <!-- MODAL DE PAGO DE RESUMEN -->
        <div id="payment-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); z-index: 1000; justify-content: center; align-items: center;">
            <div style="background: rgba(15, 23, 42, 0.95); border: 1px solid var(--border); border-radius: var(--radius); padding: 2rem; width: 100%; max-width: 400px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                <h3 style="margin-top: 0; color: #60a5fa; margin-bottom: 1rem;">💳 Pagar Resumen de Tarjeta</h3>
                <form id="payment-form" style="display: flex; flex-direction: column; gap: 1rem;">
                    <input type="hidden" id="pay-card-uid">
                    <input type="hidden" id="pay-month">
                    <input type="hidden" id="pay-amount-raw">
                    <div>
                        <label style="display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.3rem;">Periodo del Resumen:</label>
                        <input type="text" id="pay-month-display" readonly style="width: 100%; padding: 0.5rem; background: var(--bg-primary); border: 1px solid var(--border); color: var(--text-main); border-radius: 6px;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.3rem;">Monto Total:</label>
                        <input type="text" id="pay-amount-display" readonly style="width: 100%; padding: 0.5rem; background: var(--bg-primary); border: 1px solid var(--border); font-weight: bold; color: #34d399; border-radius: 6px;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.3rem;">Fecha de Pago:</label>
                        <input type="date" id="pay-date" required style="width: 100%; padding: 0.5rem; background: var(--bg-primary); border: 1px solid var(--border); color: var(--text-main); border-radius: 6px;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.3rem;">Pagar desde (Cuenta Origen):</label>
                        <select id="pay-from-account" required style="width: 100%; padding: 0.5rem; background: var(--bg-primary); border: 1px solid var(--border); color: var(--text-main); border-radius: 6px;">
                            <option value="">-- Selecciona cuenta de pago --</option>
                        </select>
                    </div>
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem;">
                        <button type="button" id="btn-cancel-pay" style="background: #475569; color: white; border: none; padding: 0.6rem 1rem; border-radius: 6px; cursor: pointer;">Cancelar</button>
                        <button type="submit" style="background: #10b981; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 6px; cursor: pointer; font-weight: 600;">Confirmar y Pagar</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    await loadCards();
    await loadProjections();
    await loadHistory();
    configurarEventosTarjetas();
    configurarModalPago();
    configurarColapsableHistorial();
}

function configurarColapsableHistorial() {
    const btnToggle = document.getElementById('btn-toggle-history');
    const content = document.getElementById('history-collapsible-content');
    const icon = document.getElementById('history-toggle-icon');

    if (btnToggle && content) {
        btnToggle.onclick = () => {
            if (content.style.display === 'none') {
                content.style.display = 'block';
                icon.textContent = '▲';
            } else {
                content.style.display = 'none';
                icon.textContent = '▼';
            }
        };
    }
}

let cachedCreditCards = [];

async function loadCards() {
    const contentDiv = document.getElementById('cards-content');
    const selectFilter = document.getElementById('filter-history-card');

    try {
        const res = await fetch('http://localhost:3000/api/credit-cards');
        if (!res.ok) throw new Error('Error al cargar tarjetas');
        cachedCreditCards = await res.json();

        if (cachedCreditCards.length === 0) {
            contentDiv.innerHTML = `<p class="loading">No hay tarjetas registradas todavía.</p>`;
            if (selectFilter) selectFilter.innerHTML = `<option value="">Sin tarjetas</option>`;
            return;
        }

        let filterOptions = '<option value="">Todas las tarjetas</option>';
        cachedCreditCards.forEach(card => {
            const cardId = card.id || card.uid;
            const cardName = card.name || card.title || 'Tarjeta';
            filterOptions += `<option value="${cardId}">${cardName}</option>`;
        });
        if (selectFilter) {
            selectFilter.innerHTML = filterOptions;
            selectFilter.onchange = () => loadHistory();
        }

        let html = `<div class="metrics-grid">`;
        cachedCreditCards.forEach((card, index) => {
            const cardId = card.id || card.uid;
            const cardName = card.name || card.title || 'Tarjeta sin nombre';
            const closing = card.closing_day || 'N/A';
            const due = card.due_day || 'N/A';
            const cardColor = card.color || '#3b82f6';
            const cardIcon = card.icon || '';
            const cardPosition = card.position !== undefined ? card.position : index + 1;
            const cardCurrency = card.currencyCode || card.currency || 'ARS';
            
            let iconHtml = `<span style="font-size: 1.2rem;">💳</span>`;
            if (cardIcon && cardIcon.startsWith('uploads/')) {
                iconHtml = `<img src="http://localhost:3000/${cardIcon}" style="width: 100px; height: 70px; object-fit: cover; border-radius: 6px;" alt="Logo">`;
            }

            html += `
                <div class="metric-box" style="border-left: 4px solid ${cardColor}; display: flex; flex-direction: column; justify-content: space-between; background: rgba(30, 41, 59, 0.5); border-radius: var(--radius); padding: 1.2rem;">
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem;">
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                ${iconHtml}
                                <span style="font-size: 0.75rem; background: rgba(255,255,255,0.08); padding: 0.15rem 0.5rem; border-radius: 4px; color: var(--text-muted); font-weight: 600;">
                                    #${cardPosition} (${cardCurrency})
                                </span>
                            </div>
                        </div>
                        <h3 style="margin: 0.2rem 0; font-size: 1.1rem; color: #f8fafc;">${cardName}</h3>
                        <p style="margin-top: 0.4rem; font-size: 0.8rem; color: var(--text-muted);">
                            Cierre: <strong style="color: #cbd5e1;">Día ${closing}</strong> | Venc.: <strong style="color: #cbd5e1;">Día ${due}</strong>
                        </p>
                    </div>
                    <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                        <button class="btn-editar-tarjeta" data-id="${cardId}" data-name="${cardName}" data-currency="${cardCurrency}" data-closing="${closing !== 'N/A' ? closing : ''}" data-due="${due !== 'N/A' ? due : ''}" data-color="${cardColor}" style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4); padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem; flex: 1;">Editar</button>
                        <button class="btn-eliminar-tarjeta" data-id="${cardId}" style="background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem;">Eliminar</button>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
        contentDiv.innerHTML = html;
        vincularAccionesTarjetas();

    } catch (err) {
        console.error('Error cargando tarjetas:', err);
        contentDiv.innerHTML = `<p style="color: #ef4444;">No se pudieron cargar las tarjetas: ${err.message}</p>`;
    }
}

async function loadProjections() {
    const wrapper = document.getElementById('projections-container');
    try {
        const res = await fetch('http://localhost:3000/api/credit-cards/projections');
        if (!res.ok) throw new Error('Error al obtener proyecciones');
        const rows = await res.json();

        if (rows.length === 0) {
            wrapper.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; background: rgba(15, 23, 42, 0.3); border-radius: var(--radius); border: 1px dashed var(--border);">
                    <span style="font-size: 2rem;">🎉</span>
                    <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.5rem;">No tienes compras en cuotas pendientes en ninguna tarjeta.</p>
                </div>
            `;
            return;
        }

        const groupedByCard = {};
        rows.forEach(row => {
            if (!groupedByCard[row.card_uid]) {
                groupedByCard[row.card_uid] = {
                    cardTitle: row.card_title,
                    currency: row.currency || row.currencyCode || 'ARS',
                    projections: []
                };
            }
            groupedByCard[row.card_uid].projections.push(row);
        });

        let html = '';
        Object.keys(groupedByCard).forEach(cardUid => {
            const cardData = groupedByCard[cardUid];
            const currSymbol = cardData.currency === 'USD' ? 'US$' : '$ ';
            
            html += `
                <div style="background: rgba(30, 41, 59, 0.4); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.25rem; margin-bottom: 1rem;">
                    <h4 style="margin: 0 0 1rem 0; color: #60a5fa; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                        💳 ${cardData.cardTitle} (${cardData.currency})
                    </h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem;">
            `;

            cardData.projections.forEach((row, idx) => {
               // AHORA (toma net_total o cae a total_due como respaldo):
                const rawAmount = Number(row.net_total !== undefined ? row.net_total : (row.total_due || 0));   
                const formattedAmount = currSymbol + rawAmount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                const isSettled = row.is_settled || rawAmount === 0;
                const isCurrentMonth = idx === 0;

                let badgeBg = isSettled ? 'rgba(16, 185, 129, 0.2)' : (isCurrentMonth ? 'rgba(245, 158, 11, 0.2)' : 'rgba(100, 116, 139, 0.2)');
                let badgeColor = isSettled ? '#34d399' : (isCurrentMonth ? '#fbbf24' : '#94a3b8');
                let badgeText = isSettled ? '✓ LIQUIDADO' : (isCurrentMonth ? '⏳ ACTUAL' : '📅 PROYECTADO');

                html += `
                    <div class="projection-card" data-carduid="${cardUid}" data-cardtitle="${cardData.cardTitle}" data-month="${row.month}" style="background: rgba(15, 23, 42, 0.6); border: 1px solid ${isSettled ? '#10b98140' : (isCurrentMonth ? '#f59e0b40' : 'var(--border)')}; border-radius: 8px; padding: 1rem; display: flex; flex-direction: column; justify-content: space-between; cursor: pointer; transition: all 0.2s ease;">
                        <div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                <span style="font-size: 0.75rem; color: #f8fafc; font-weight: 700;">${row.month}</span>
                                <span style="font-size: 0.65rem; background: ${badgeBg}; color: ${badgeColor}; padding: 0.2rem 0.4rem; border-radius: 4px; font-weight: 700;">
                                    ${badgeText}
                                </span>
                            </div>

                            <div style="font-size: 1.3rem; font-weight: 800; color: ${isSettled ? '#34d399' : 'var(--accent)'}; margin: 0.3rem 0;">
                                ${isSettled ? currSymbol + '0,00' : formattedAmount}
                            </div>

                            <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.5rem;">
                                ${row.pending_installments !== undefined ? row.pending_installments : 'Movimiento(s) del'} periodo <span style="font-size: 0.65rem; color: #60a5fa;">(🔍 Ver abajo)</span>
                            </div>
                        </div>

                        ${!isSettled ? `
                            <div style="display: flex; flex-direction: column; gap: 0.35rem; margin-top: 0.5rem;">
                                <button class="btn-liquidar-mes" data-month="${row.month}" data-carduid="${cardUid}" style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); padding: 0.35rem; border-radius: 6px; cursor: pointer; font-size: 0.7rem; font-weight: 600; width: 100%;">
                                    ✓ Marcar Pagado
                                </button>
                                <button class="btn-pagar-resumen" data-month="${row.month}" data-carduid="${cardUid}" data-cardtitle="${cardData.cardTitle}" data-amount="${rawAmount}" style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4); padding: 0.35rem; border-radius: 6px; cursor: pointer; font-size: 0.7rem; font-weight: 600; width: 100%;">
                                    💳 Pagar Resumen (Transferencia)
                                </button>
                            </div>
                        ` : `
                            <div style="text-align: center; font-size: 0.7rem; color: #34d399; background: rgba(16, 185, 129, 0.08); padding: 0.3rem; border-radius: 4px; margin-top: 0.5rem;">
                                Al día
                            </div>
                        `}
                    </div>
                `;
            });

            html += `</div></div>`;
        });

        wrapper.innerHTML = html;
        vincularAccionesProyecciones();

    } catch (err) {
        console.error('Error cargando proyecciones:', err);
        wrapper.innerHTML = `<p style="color: #ef4444; grid-column: 1 / -1;">Error al cargar proyecciones.</p>`;
    }
}

async function loadHistory() {
    const wrapper = document.getElementById('history-container');
    const selectedCardUid = document.getElementById('filter-history-card')?.value || '';

    try {
        const res = await fetch('http://localhost:3000/api/credit-cards/history');
        if (!res.ok) throw new Error('Error al obtener historial');
        let rows = await res.json();

        if (selectedCardUid) {
            rows = rows.filter(r => r.card_uid === selectedCardUid);
        }

        if (rows.length === 0) {
            wrapper.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 1.5rem; background: rgba(15, 23, 42, 0.3); border-radius: var(--radius); border: 1px dashed var(--border);">
                    <p style="color: var(--text-muted); font-size: 0.85rem; margin: 0;">No hay resúmenes pagados registrados en el historial.</p>
                </div>
            `;
            return;
        }

        let html = '';
        rows.forEach(row => {
            const rawAmount = Number(row.total_paid);
            const currSymbol = row.currency === 'USD' ? 'US$' : '$ ';
            const formattedAmount = currSymbol + rawAmount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            html += `
                <div class="history-card" data-carduid="${row.card_uid}" data-cardtitle="${row.card_title}" data-month="${row.month}" style="background: rgba(15, 23, 42, 0.6); border: 1px solid #10b98140; border-radius: 8px; padding: 1rem; display: flex; flex-direction: column; justify-content: space-between; cursor: pointer; transition: all 0.2s ease;">
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <span style="font-size: 0.75rem; color: #60a5fa; font-weight: 700;">💳 ${row.card_title}</span>
                            <span style="font-size: 0.65rem; background: rgba(16, 185, 129, 0.2); color: #34d399; padding: 0.2rem 0.4rem; border-radius: 4px; font-weight: 700;">
                                ✓ LIQUIDADO
                            </span>
                        </div>

                        <div style="font-size: 0.85rem; color: #f8fafc; font-weight: bold; margin-bottom: 0.2rem;">
                            Periodo: ${row.month}
                        </div>

                        <div style="font-size: 1.2rem; font-weight: 800; color: #34d399; margin: 0.3rem 0;">
                            ${formattedAmount}
                        </div>

                        <div style="font-size: 0.75rem; color: var(--text-muted);">
                            ${row.paid_installments} cuota(s) pagada(s) <span style="font-size: 0.65rem; color: #60a5fa;">(🔍 Ver auditoría abajo)</span>
                        </div>
                    </div>
                </div>
            `;
        });

        wrapper.innerHTML = html;
        vincularAccionesHistorial();

    } catch (err) {
        console.error('Error cargando historial:', err);
        wrapper.innerHTML = `<p style="color: #ef4444; grid-column: 1 / -1;">Error al cargar historial de resúmenes.</p>`;
    }
}

function vincularAccionesHistorial() {
    document.querySelectorAll('.history-card').forEach(card => {
        card.addEventListener('click', async () => {
            const cardUid = card.dataset.carduid;
            const cardTitle = card.dataset.cardtitle;
            const month = card.dataset.month;
            
            const detailSection = document.getElementById('summary-detail-section');
            const detailTitle = document.getElementById('detail-section-title');
            const detailContent = document.getElementById('summary-detail-content');

            detailSection.style.display = 'block';
            detailTitle.textContent = `🔍 Auditoría de Historial: ${cardTitle} (${month})`;
            detailContent.innerHTML = `<p style="color: var(--text-muted); text-align: center; margin: 0; padding: 1rem;">Cargando gastos históricos del periodo...</p>`;

            detailSection.scrollIntoView({ behavior: 'smooth' });

            try {
                // Solicitamos cuotas liquidadas (status=paid) para la auditoría histórica
                const res = await fetch(`http://localhost:3000/api/credit-cards/details?card_uid=${cardUid}&month=${month}&status=paid`);
                if (!res.ok) throw new Error('Error al obtener el detalle histórico');
                const installments = await res.json();

                if (installments.length === 0) {
                    detailContent.innerHTML = `<p style="color: var(--text-muted); text-align: center; margin: 0; padding: 1rem;">No hay gastos asociados a este periodo histórico.</p>`;
                    return;
                }

                let htmlTable = `
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; text-align: left;">
                            <thead>
                                <tr style="color: var(--text-muted); border-bottom: 1px solid var(--border);">
                                    <th style="padding: 0.5rem;">Fecha Compra</th>
                                    <th style="padding: 0.5rem;">Detalle / Comercio</th>
                                    <th style="padding: 0.5rem; text-align: center;">Cuota</th>
                                    <th style="padding: 0.5rem; text-align: right;">Monto</th>
                                </tr>
                            </thead>
                            <tbody>
                `;

installments.forEach(inst => {
                    const amountFormatted = Number(inst.amount).toFixed(2);
                    const purchaseDateFormatted = inst.purchase_date ? inst.purchase_date.split('T')[0] : inst.due_date;
                    
                    const isIncome = inst.item_type === 'INCOME';
                    const amountColor = isIncome ? '#34d399' : '#f8fafc';
                    const amountSign = isIncome ? '-' : ''; 
                    
                    // Construcción limpia de Categoría / Subcategoría / Etiqueta
                    let catPathParts = [];
                    if (inst.parent_category_title) catPathParts.push(inst.parent_category_title);
                    if (inst.subcategory_title) catPathParts.push(inst.subcategory_title);
                    
                    let categoryDisplay = catPathParts.join(' / ');
                    if (inst.tag_title) {
                        categoryDisplay += categoryDisplay ? ` [${inst.tag_title}]` : `#${inst.tag_title}`;
                    }

                    // Si hay comentario, lo anexamos o usamos la categoría como principal
                    const commentPart = inst.description ? ` - ${inst.description}` : '';
                    let detailText = categoryDisplay ? `${categoryDisplay}${commentPart}` : (inst.description || (isIncome ? 'Devolución / Ajuste' : 'Compra en cuotas'));

                    let badgeDisplay = isIncome 
                        ? `<span style="color: #34d399; font-weight: bold;">🟢 Devolución</span>` 
                        : `<span style="color: var(--accent); font-weight: bold;">${inst.installment_number}/${inst.total_installments}</span>`;

                    htmlTable += `
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <td style="padding: 0.6rem 0.5rem; color: var(--text-muted);">${purchaseDateFormatted}</td>
                            <td style="padding: 0.6rem 0.5rem; font-weight: 500; color: #f8fafc;">${detailText}</td>
                            <td style="padding: 0.6rem 0.5rem; text-align: center;">${badgeDisplay}</td>
                            <td style="padding: 0.6rem 0.5rem; text-align: right; font-weight: bold; color: ${amountColor};">${amountSign}$${amountFormatted}</td>
                        </tr>
                    `;
                });

                htmlTable += `</tbody></table></div>`;
                detailContent.innerHTML = htmlTable;

            } catch (err) {
                console.error(err);
                detailContent.innerHTML = `<p style="color: #ef4444; text-align: center; margin: 0; padding: 1rem;">Error al cargar el detalle histórico.</p>`;
            }
        });
    });
}

function vincularAccionesProyecciones() {
    document.querySelectorAll('.projection-card').forEach(card => {
        card.addEventListener('click', async (e) => {
            if (e.target.closest('.btn-liquidar-mes') || e.target.closest('.btn-pagar-resumen')) return;

            const cardUid = card.dataset.carduid;
            const cardTitle = card.dataset.cardtitle;
            const month = card.dataset.month;
            
            const detailSection = document.getElementById('summary-detail-section');
            const detailTitle = document.getElementById('detail-section-title');
            const detailContent = document.getElementById('summary-detail-content');

            detailSection.style.display = 'block';
            detailTitle.textContent = `🔍 Detalle de Resumen: ${cardTitle} (${month})`;
            detailContent.innerHTML = `<p style="color: var(--text-muted); text-align: center; margin: 0; padding: 1rem;">Cargando gastos del periodo...</p>`;

            detailSection.scrollIntoView({ behavior: 'smooth' });

            try {
                // Solicitamos detalles (cuotas pendientes + devoluciones/ingresos del mes)
                const res = await fetch(`http://localhost:3000/api/credit-cards/details?card_uid=${cardUid}&month=${month}&status=pending`);
                if (!res.ok) throw new Error('Error al obtener el detalle de cuotas');
                const installments = await res.json();

                if (installments.length === 0) {
                    detailContent.innerHTML = `<p style="color: var(--text-muted); text-align: center; margin: 0; padding: 1rem;">No hay gastos pendientes registrados en este periodo.</p>`;
                    return;
                }

// LO QUE DEBES PONER:
const devoluciones = installments.filter(inst => 
    inst.item_type === 'INCOME' || 
    inst.type === 'INCOME' || 
    Number(inst.amount) < 0
);

const consumos = installments.filter(inst => 
    (inst.item_type === 'EXPENSE' || inst.type === 'EXPENSE' || !inst.item_type) && 
    Number(inst.amount) >= 0
);

// 2. Calcular los subtotales
const totalDevoluciones = devoluciones.reduce((acc, inst) => acc + Number(inst.amount), 0);
const totalConsumos = consumos.reduce((acc, inst) => acc + Number(inst.amount), 0);
const totalRealAPagar = totalConsumos - totalDevoluciones;

let htmlTable = `<div style="display: flex; flex-direction: column; gap: 1.5rem;">`;

// --- BLOQUE 1: CONSOLIDADO / DEVOLUCIONES / CRÉDITOS A FAVOR ---
if (devoluciones.length > 0) {
    htmlTable += `
        <div>
            <h4 style="margin: 0 0 0.5rem 0; font-size: 0.85rem; color: #34d399; text-transform: uppercase; letter-spacing: 0.05em;">
                💳 Consolidado / Créditos a Favor (Ajustes)
            </h4>
            <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; text-align: left;">
                <thead>
                    <tr style="color: var(--text-muted); border-bottom: 1px solid var(--border);">
                        <th style="padding: 0.4rem;">Fecha</th>
                        <th style="padding: 0.4rem;">Concepto</th>
                        <th style="padding: 0.4rem; text-align: right;">Pesos</th>
                    </tr>
                </thead>
                <tbody>
    `;
    devoluciones.forEach(inst => {
        const dateStr = inst.purchase_date ? inst.purchase_date.split('T')[0] : inst.due_date;
        const desc = inst.description || 'Devolución / Ajuste a favor';
        htmlTable += `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding: 0.5rem 0.4rem; color: var(--text-muted);">${dateStr}</td>
                <td style="padding: 0.5rem 0.4rem; color: #f8fafc;">${desc}</td>
                <td style="padding: 0.5rem 0.4rem; text-align: right; color: #34d399; font-weight: bold;">-$${Number(inst.amount).toFixed(2)}</td>
            </tr>
        `;
    });
    htmlTable += `
                <tr style="border-top: 1px solid var(--border); font-weight: bold;">
                    <td colspan="2" style="padding: 0.5rem 0.4rem; text-align: right; color: var(--text-muted);">Subtotal Créditos:</td>
                    <td style="padding: 0.5rem 0.4rem; text-align: right; color: #34d399;">-$${totalDevoluciones.toFixed(2)}</td>
                </tr>
            </tbody>
        </table>
    </div>`;
}

// --- BLOQUE 2: DETALLE DEL CONSUMO (GASTOS Y CUOTAS) ---
htmlTable += `
    <div>
        <h4 style="margin: 0 0 0.5rem 0; font-size: 0.85rem; color: #60a5fa; text-transform: uppercase; letter-spacing: 0.05em;">
            🛒 Detalle del Consumo
        </h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; text-align: left;">
            <thead>
                <tr style="color: var(--text-muted); border-bottom: 1px solid var(--border);">
                    <th style="padding: 0.4rem;">Fecha</th>
                    <th style="padding: 0.4rem;">Referencia / Comercio</th>
                    <th style="padding: 0.4rem; text-align: center;">Cuota</th>
                    <th style="padding: 0.4rem; text-align: right;">Pesos</th>
                </tr>
            </thead>
            <tbody>
`;

consumos.forEach(inst => {
    const dateStr = inst.purchase_date ? inst.purchase_date.split('T')[0] : inst.due_date;
    
    // Categoría / Subcategoría / Tag / Comentario
    let catPath = '';
    if (inst.parent_category_title && inst.subcategory_title) {
        catPath = `${inst.parent_category_title} / ${inst.subcategory_title}`;
    } else if (inst.subcategory_title || inst.parent_category_title) {
        catPath = inst.subcategory_title || inst.parent_category_title;
    }
    const tagPart = inst.tag_title ? ` [#${inst.tag_title}]` : '';
    const commentPart = inst.description ? ` (${inst.description})` : '';
    const detailText = catPath ? `${catPath}${tagPart}${commentPart}` : (inst.description || 'Gasto en cuotas');

    htmlTable += `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
            <td style="padding: 0.5rem 0.4rem; color: var(--text-muted);">${dateStr}</td>
            <td style="padding: 0.5rem 0.4rem; color: #f8fafc;">${detailText}</td>
            <td style="padding: 0.5rem 0.4rem; text-align: center; color: var(--accent); font-weight: bold;">${inst.installment_number}/${inst.total_installments}</td>
            <td style="padding: 0.5rem 0.4rem; text-align: right; font-weight: bold; color: #f8fafc;">$${Number(inst.amount).toFixed(2)}</td>
        </tr>
    `;
});

htmlTable += `
            <tr style="border-top: 1px solid var(--border); font-weight: bold;">
                <td colspan="3" style="padding: 0.5rem 0.4rem; text-align: right; color: var(--text-muted);">Total Consumos:</td>
                <td style="padding: 0.5rem 0.4rem; text-align: right; color: #f8fafc;">$${totalConsumos.toFixed(2)}</td>
            </tr>
        </tbody>
    </table>
</div>`;

// --- BLOQUE 3: FOOTER RESUMEN - TOTAL A PAGAR IGUAL A TU EXTRACTO BANCARIO ---
htmlTable += `
    <div style="background: rgba(30, 41, 59, 0.8); padding: 1rem; border-radius: 8px; border: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
        <span style="font-size: 1.1rem; font-weight: bold; color: #f8fafc;">🏷️ TOTAL A PAGAR</span>
        <span style="font-size: 1.4rem; font-weight: 800; color: #3b82f6;">$ ${totalRealAPagar.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
    </div>
</div>`;

detailContent.innerHTML = htmlTable;

            } catch (err) {
                console.error(err);
                detailContent.innerHTML = `<p style="color: #ef4444; text-align: center; margin: 0; padding: 1rem;">Error al cargar el detalle del resumen.</p>`;
            }
        });
    });

    const btnCloseDetail = document.getElementById('btn-close-detail');
    if (btnCloseDetail) {
        btnCloseDetail.onclick = () => {
            document.getElementById('summary-detail-section').style.display = 'none';
        };
    }

    document.querySelectorAll('.btn-liquidar-mes').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const month = e.target.dataset.month;
            const cardUid = e.target.dataset.carduid;
            
            if (confirm(`¿Deseas marcar las cuotas del periodo ${month} como pagadas para esta tarjeta?`)) {
                try {
                    const res = await fetch('http://localhost:3000/api/credit-cards/settle', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ month, card_uid: cardUid })
                    });

                    if (!res.ok) throw new Error('Error al registrar la liquidación');

                    await loadProjections();
                    await loadHistory();
                } catch (err) {
                    alert(`Error: ${err.message}`);
                }
            }
        });
    });

    document.querySelectorAll('.btn-pagar-resumen').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const month = e.target.dataset.month;
            const cardUid = e.target.dataset.carduid;
            const cardTitle = e.target.dataset.cardtitle;
            const amount = e.target.dataset.amount;

            abrirModalPago(cardUid, cardTitle, month, amount);
        });
    });
}

async function abrirModalPago(cardUid, cardTitle, month, amount) {
    const modal = document.getElementById('payment-modal');
    document.getElementById('pay-card-uid').value = cardUid;
    document.getElementById('pay-month').value = month;
    document.getElementById('pay-month-display').value = `${cardTitle} - Periodo: ${month}`;
    document.getElementById('pay-amount-raw').value = amount;
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('pay-date').value = today;

    const formattedAmount = Number(amount).toFixed(2);
    document.getElementById('pay-amount-display').value = `$${formattedAmount}`;

    const selectAccount = document.getElementById('pay-from-account');
    selectAccount.innerHTML = `<option value="">Cargando cuentas...</option>`;

    try {
        const res = await fetch('http://localhost:3000/api/accounts');
        const accounts = await res.json();
        const validAccounts = accounts.filter(acc => acc.uid !== cardUid);

        if (validAccounts.length === 0) {
            selectAccount.innerHTML = `<option value="">No hay cuentas disponibles</option>`;
            return;
        }

        // Cargar ÚNICAMENTE cuentas cash/activos en el combo "Pagar desde..."
const accountSelect = document.getElementById('pay-from-account');
let options = '<option value="">-- Seleccionar Cuenta de Pago --</option>';

// Filtrar para excluir cualquier tarjeta de crédito
const validPayAccounts = accounts.filter(acc => !acc.type || acc.type !== 'credit_card');

validPayAccounts.forEach(acc => {
    options += `<option value="${acc.uid}">${acc.title} (${acc.currencyCode || 'ARS'})</option>`;
});

accountSelect.innerHTML = options;

        modal.style.display = 'flex';
    } catch (err) {
        console.error('Error cargando cuentas para pago:', err);
        alert('No se pudieron cargar las cuentas');
    }
}

function configurarModalPago() {
    const modal = document.getElementById('payment-modal');
    const btnCancel = document.getElementById('btn-cancel-pay');
    const form = document.getElementById('payment-form');

    btnCancel.onclick = () => {
        modal.style.display = 'none';
    };

    form.onsubmit = async (e) => {
        e.preventDefault();
        const cardUid = document.getElementById('pay-card-uid').value;
        const month = document.getElementById('pay-month').value;
        const amount = parseFloat(document.getElementById('pay-amount-raw').value);
        const fromAccountUid = document.getElementById('pay-from-account').value;
        const paymentDate = document.getElementById('pay-date').value;

        if (!fromAccountUid || isNaN(amount) || !paymentDate) {
            alert('Completa la cuenta de origen y la fecha de pago.');
            return;
        }

        try {
            const transferRes = await fetch('http://localhost:3000/api/transfers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fromAccountUid,
                    toAccountUid: cardUid,
                    fromAmount: amount,
                    toAmount: amount,
                    comment: `Pago de resumen ${month}`,
                    date: paymentDate
                })
            });

            if (!transferRes.ok) throw new Error('Error al registrar la transferencia de pago');

            const settleRes = await fetch('http://localhost:3000/api/credit-cards/settle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ month, card_uid: cardUid })
            });

            if (!settleRes.ok) throw new Error('Error al liquidar las cuotas del periodo');

            modal.style.display = 'none';
            alert('¡Resumen pagado y liquidado con éxito!');
            await loadProjections();
            await loadHistory();
            document.getElementById('summary-detail-section').style.display = 'none';

        } catch (err) {
            alert(`Error al procesar el pago: ${err.message}`);
        }
    };
}

function configurarEventosTarjetas() {
    const formContainer = document.getElementById('card-form-container');
    const btnNueva = document.getElementById('btn-nueva-tarjeta');
    const btnCancelar = document.getElementById('btn-cancelar');
    const form = document.getElementById('card-form');

    btnNueva.addEventListener('click', () => {
        document.getElementById('form-title').innerText = 'Crear Nueva Tarjeta';
        document.getElementById('card-id').value = '';
        document.getElementById('card-name').value = '';
        document.getElementById('card-currency').value = 'ARS';
        document.getElementById('card-closing').value = '';
        document.getElementById('card-due').value = '';
        document.getElementById('card-color').value = '#3b82f6';
        document.getElementById('card-image-file').value = '';
        document.getElementById('btn-submit-card').innerText = 'Guardar Tarjeta';
        formContainer.style.display = 'block';
    });

    btnCancelar.addEventListener('click', () => {
        formContainer.style.display = 'none';
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('card-id').value;
        const name = document.getElementById('card-name').value;
        const currency = document.getElementById('card-currency').value;
        const closing_day = parseInt(document.getElementById('card-closing').value) || null;
        const due_day = parseInt(document.getElementById('card-due').value) || null;
        const color = document.getElementById('card-color').value;
        
        const fileInput = document.getElementById('card-image-file');
        let imageBase64 = null;
        let imageName = null;

        if (fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            imageName = file.name;
            imageBase64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
                reader.readAsDataURL(file);
            });
        }

        const method = id ? 'PUT' : 'POST';
        const url = id ? `http://localhost:3000/api/accounts/${id}` : 'http://localhost:3000/api/accounts';

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    type: 'credit_card',
                    balance: 0,
                    currency,
                    closing_day,
                    due_day,
                    color,
                    imageBase64,
                    imageName
                })
            });

            if (!res.ok) throw new Error('Error al guardar la tarjeta');

            formContainer.style.display = 'none';
            await loadCards();
            await loadProjections();
            await loadHistory();
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    });
}

function vincularAccionesTarjetas() {
    document.querySelectorAll('.btn-editar-tarjeta').forEach(btn => {
        btn.addEventListener('click', () => {
            const { id, name, currency, closing, due, color } = btn.dataset;
            document.getElementById('form-title').innerText = `Editar Tarjeta: ${name}`;
            document.getElementById('card-id').value = id;
            document.getElementById('card-name').value = name;
            document.getElementById('card-currency').value = currency || 'ARS';
            document.getElementById('card-closing').value = closing !== 'N/A' ? closing : '';
            document.getElementById('card-due').value = due !== 'N/A' ? due : '';
            document.getElementById('card-color').value = color || '#3b82f6';
            document.getElementById('card-image-file').value = '';
            
            document.getElementById('btn-submit-card').innerText = 'Actualizar Tarjeta';
            document.getElementById('card-form-container').style.display = 'block';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    document.querySelectorAll('.btn-eliminar-tarjeta').forEach(btn => {
        btn.addEventListener('click', async () => {
            const cardId = btn.dataset.id;

            if (!confirm('¿Estás seguro de que deseas eliminar esta tarjeta?')) {
                return;
            }

            try {
                const res = await fetch(`http://localhost:3000/api/accounts/${cardId}`, {
                    method: 'DELETE'
                });

                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.error || 'Error al eliminar la tarjeta');
                }

                await loadCards();
                await loadProjections();
                await loadHistory();
            } catch (err) {
                alert(`No se pudo eliminar: ${err.message}`);
            }
        });
    });
}