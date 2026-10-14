export async function render() {
    const container = document.getElementById('app-view');
    
    container.innerHTML = `
        <div class="view-card">
            <h2>Registro de Movimientos</h2>
            <p>Registra tus gastos, ingresos o transferencias entre cuentas.</p>
            
            <!-- Formulario Unificado -->
            <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.5rem; margin-top: 1.5rem;">
                <form id="movement-form" style="display: flex; flex-direction: column; gap: 1rem;">
                    
                    <!-- Selector de Tipo de Movimiento -->
                    <div>
                        <label style="display: block; font-size: 0.85rem; margin-bottom: 0.3rem; font-weight: bold;">Tipo de Operación:</label>
                        <select id="mov-type-selector" style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                            <option value="EXPENSE">Gasto</option>
                            <option value="INCOME">Ingreso</option>
                            <option value="TRANSFER">Transferencia</option>
                        </select>
                    </div>

                    <!-- Campos comunes para Gasto / Ingreso -->
                    <div id="section-standard" style="display: flex; flex-direction: column; gap: 1rem;">
                        <div>
                            <label style="display: block; font-size: 0.85rem; margin-bottom: 0.3rem;">Cuenta:</label>
                            <select id="mov-account" style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                                <option value="">-- Selecciona una cuenta --</option>
                            </select>
                        </div>
                            <!-- Selector de cuotas para tarjetas de crédito (inicialmente oculto) -->
                            <div id="installments-container" style="display: none; margin-top: 1rem; border-top: 1px dashed var(--border); padding-top: 1rem;">
                                <label style="display: block; font-size: 0.85rem; margin-bottom: 0.3rem; font-weight: bold; color: var(--accent);">Cantidad de Cuotas:</label>
                                <select id="mov-installments" style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                                    <option value="1">1 pago</option>
                                    <option value="2">2 cuotas</option>
                                    <option value="3">3 cuotas</option>
                                    <option value="6">6 cuotas</option>
                                    <option value="9">9 cuotas</option>
                                    <option value="12">12 cuotas</option>
                                    <option value="18">18 cuotas</option>
                                </select>
                            </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div>
                                <label style="display: block; font-size: 0.85rem; margin-bottom: 0.3rem;">Categoría Principal:</label>
                                <select id="mov-parent-category" style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                                    <option value="">-- Sin categoría --</option>
                                </select>
                            </div>
                            <div>
                                <label style="display: block; font-size: 0.85rem; margin-bottom: 0.3rem;">Subcategoría:</label>
                                <select id="mov-sub-category" style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);" disabled>
                                    <option value="">-- Sin subcategoría --</option>
                                </select>
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div>
                                <label style="display: block; font-size: 0.85rem; margin-bottom: 0.3rem;">Monto:</label>
                                <input type="number" step="0.01" id="mov-amount" placeholder="0.00" style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                            </div>
                            <div>
                                <label style="display: block; font-size: 0.85rem; margin-bottom: 0.3rem;">Etiqueta (Tag):</label>
                                <input type="text" id="mov-tag" placeholder="ej. supermercado, vacaciones" style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                            </div>
                        </div>
                    </div>

                    <!-- Campos específicos para Transferencia -->
                    <div id="section-transfer" style="display: none; flex-direction: column; gap: 1rem; border-top: 1px dashed var(--border); padding-top: 1rem;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div>
                                <label style="display: block; font-size: 0.85rem; margin-bottom: 0.3rem;">Cuenta Origen:</label>
                                <select id="tr-from-account" style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                                    <option value="">-- Origen --</option>
                                </select>
                            </div>
                            <div>
                                <label style="display: block; font-size: 0.85rem; margin-bottom: 0.3rem;">Cuenta Destino:</label>
                                <select id="tr-to-account" style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                                    <option value="">-- Destino --</option>
                                </select>
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div>
                                <label style="display: block; font-size: 0.85rem; margin-bottom: 0.3rem;">Monto Origen:</label>
                                <input type="number" step="0.01" id="tr-from-amount" placeholder="0.00" style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                            </div>
                            <div id="multicurrency-container" style="display: none;">
                                <label style="display: block; font-size: 0.85rem; margin-bottom: 0.3rem;">Monto Destino (<span id="dest-currency-label">USD</span>):</label>
                                <input type="number" step="0.01" id="tr-to-amount" placeholder="0.00" style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                            </div>
                        </div>
                        <div id="exchange-rate-info" style="font-size: 0.8rem; color: var(--accent); font-style: italic; display: none;">
                            Cotización aplicada: 1 <span id="lbl-from-curr"></span> = <span id="lbl-rate"></span> <span id="lbl-to-curr"></span>
                        </div>
                    </div>

                    <!-- Campos comunes finales -->
                    <div>
                        <label style="display: block; font-size: 0.85rem; margin-bottom: 0.3rem;">Fecha:</label>
                        <input type="date" id="mov-date" style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                    </div>

                    <div>
                        <label style="display: block; font-size: 0.85rem; margin-bottom: 0.3rem;">Comentario:</label>
                        <textarea id="mov-comment" rows="2" style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);" placeholder="Notas adicionales..."></textarea>
                    </div>

                    <button type="submit" style="background-color: var(--accent); color: white; border: none; padding: 0.75rem; border-radius: var(--radius); cursor: pointer; font-weight: bold; margin-top: 0.5rem;">Registrar Movimiento</button>
                </form>
            </div>

            <!-- Listado reciente de últimos movimientos -->
            <div style="margin-top: 2rem;">
                <h3>Últimos Movimientos Registrados</h3>
                <div id="recent-movements" style="margin-top: 1rem;" class="loading">Cargando historial...</div>
            </div>
        </div>
    `;

    await initializeMovementView();
}

let cachedAccounts = [];
let cachedCategories = [];
let cachedSettings = {};
async function initializeMovementView() {
    document.getElementById('mov-date').value = new Date().toISOString().split('T')[0];

    try {
        // Añadimos la llamada a /api/settings en el Promise.all
        const [accRes, catRes, setRes] = await Promise.all([
            fetch('http://localhost:3000/api/accounts'),
            fetch('http://localhost:3000/api/categories'),
            fetch('http://localhost:3000/api/settings')
        ]);

        cachedAccounts = await accRes.json();
        cachedCategories = await catRes.json();
        cachedSettings = await setRes.json(); // <--- Guardamos las configuraciones

        populateDropdowns();
        setupFormInteractivity();
        await loadRecentMovements();

    } catch (err) {
        console.error('Error inicializando vista de movimientos:', err);
    }
}

function populateDropdowns() {
    const accSelect = document.getElementById('mov-account');
    const fromAccSelect = document.getElementById('tr-from-account');
    const toAccSelect = document.getElementById('tr-to-account');
    const parentCatSelect = document.getElementById('mov-parent-category');

    let accOptions = '<option value="">-- Seleccionar cuenta --</option>';
    cachedAccounts.forEach(acc => {
        accOptions += `<option value="${acc.uid}" data-currency="${acc.currencyCode}">${acc.title} (${acc.currencyCode})</option>`;
    });
    accSelect.innerHTML = accOptions;
    fromAccSelect.innerHTML = accOptions;
    toAccSelect.innerHTML = accOptions;

    // Categorías principales (parent_uid es null)
    const parents = cachedCategories.filter(c => !c.parent_uid);
    let catOptions = '<option value="">-- Sin categoría --</option>';
    parents.forEach(p => {
        catOptions += `<option value="${p.uid}">${p.title} (${p.type === 'income' ? 'Ingreso' : 'Gasto'})</option>`;
    });
    parentCatSelect.innerHTML = catOptions;
}

function setupFormInteractivity() {
    const typeSelector = document.getElementById('mov-type-selector');
    const standardSection = document.getElementById('section-standard');
    const transferSection = document.getElementById('section-transfer');
    const parentCatSelect = document.getElementById('mov-parent-category');
    const subCatSelect = document.getElementById('mov-sub-category');
    const fromAccSelect = document.getElementById('tr-from-account');
    const toAccSelect = document.getElementById('tr-to-account');
    const fromAmountInput = document.getElementById('tr-from-amount');
    const toAmountInput = document.getElementById('tr-to-amount');
    const accountSelect = document.getElementById('mov-account');
    const installmentsContainer = document.getElementById('installments-container');

    // Función auxiliar para evaluar si la cuenta seleccionada es Tarjeta de Crédito
    const checkCreditCard = () => {
        const selectedUid = accountSelect.value;
        const selectedAccount = cachedAccounts.find(a => a.uid === selectedUid);
        
        console.log('[DEBUG] Cuenta seleccionada:', selectedAccount);

        if (selectedAccount && selectedAccount.type && selectedAccount.type.toLowerCase() === 'credit_card') {
            installmentsContainer.style.display = 'block';
        } else {
            installmentsContainer.style.display = 'none';
            const instSelect = document.getElementById('mov-installments');
            if (instSelect) instSelect.value = '1';
        }
    };

    // Escuchar cambio de cuenta
    accountSelect.onchange = checkCreditCard;

    // Cambiar entre Gasto/Ingreso y Transferencia
    typeSelector.onchange = (e) => {
        const val = e.target.value;
        if (val === 'TRANSFER') {
            standardSection.style.display = 'none';
            transferSection.style.display = 'flex';
            installmentsContainer.style.display = 'none';
        } else {
            standardSection.style.display = 'flex';
            transferSection.style.display = 'none';
            
            // Re-evaluar la tarjeta al cambiar el tipo de operación
            checkCreditCard();

            // Filtrar categorías según tipo (Gasto o Ingreso)
            const filteredParents = cachedCategories.filter(c => !c.parent_uid && c.type === (val === 'INCOME' ? 'income' : 'expense'));
            let catOptions = '<option value="">-- Sin categoría --</option>';
            filteredParents.forEach(p => { catOptions += `<option value="${p.uid}">${p.title}</option>`; });
            parentCatSelect.innerHTML = catOptions;
            subCatSelect.innerHTML = '<option value="">-- Sin subcategoría --</option>';
            subCatSelect.disabled = true;
        }
    };

    // Manejar subcategorías al seleccionar categoría padre
    parentCatSelect.onchange = (e) => {
        const parentUid = e.target.value;
        if (!parentUid) {
            subCatSelect.innerHTML = '<option value="">-- Sin subcategoría --</option>';
            subCatSelect.disabled = true;
            return;
        }
        const subs = cachedCategories.filter(c => c.parent_uid === parentUid);
        if (subs.length === 0) {
            subCatSelect.innerHTML = '<option value="">-- Sin subcategorías --</option>';
            subCatSelect.disabled = true;
            return;
        }
        let subOptions = '<option value="">-- Seleccionar subcategoría --</option>';
        subs.forEach(s => { subOptions += `<option value="${s.uid}">${s.title}</option>`; });
        subCatSelect.innerHTML = subOptions;
        subCatSelect.disabled = false;
    };

    // Validación y detección multimoneda en transferencias
 // Validación y detección multimoneda en transferencias (con cotización real)
    const checkMulticurrency = async () => {
        const fromId = fromAccSelect.value;
        const toId = toAccSelect.value;
        if (!fromId || !toId) return;

        const fromAcc = cachedAccounts.find(a => a.uid === fromId);
        const toAcc = cachedAccounts.find(a => a.uid === toId);
        const multiContainer = document.getElementById('multicurrency-container');
        const rateInfo = document.getElementById('exchange-rate-info');

        if (fromAcc && toAcc && fromAcc.currencyCode !== toAcc.currencyCode) {
            multiContainer.style.display = 'block';
            rateInfo.style.display = 'block';
            document.getElementById('dest-currency-label').textContent = toAcc.currencyCode;
            document.getElementById('lbl-from-curr').textContent = fromAcc.currencyCode;
            document.getElementById('lbl-to-curr').textContent = toAcc.currencyCode;
            
            try {
                // Consultamos las tasas reales y la configuración actual del usuario en paralelo
                const [ratesRes, settingsRes] = await Promise.all([
                    fetch('http://localhost:3000/api/rates'),
                    fetch('http://localhost:3000/api/settings')
                ]);

                const ratesData = await ratesRes.json();
                const settingsData = await settingsRes.json();

                // Determinamos qué fuente de dólar está configurada (por defecto 'oficial')
                const dolarSource = settingsData.dolar_source || 'oficial';
                const dolarVal = ratesData.dolar && ratesData.dolar[dolarSource] ? ratesData.dolar[dolarSource] : 1;

                const fromAmt = parseFloat(fromAmountInput.value) || 0;

                // Si pasamos de ARS a USD, el monto en dólares es el monto en pesos dividido el valor del dólar
                if (fromAcc.currencyCode === 'ARS' && toAcc.currencyCode === 'USD' && dolarVal > 0) {
                    if (fromAmt > 0) {
                        toAmountInput.value = (fromAmt / dolarVal).toFixed(2);
                    }
                    document.getElementById('lbl-rate').textContent = dolarVal.toFixed(2);
                } else if (fromAcc.currencyCode === 'USD' && toAcc.currencyCode === 'ARS' && dolarVal > 0) {
                    // Si pasamos de USD a ARS, multiplicamos por el valor del dólar
                    if (fromAmt > 0) {
                        toAmountInput.value = (fromAmt * dolarVal).toFixed(2);
                    }
                    document.getElementById('lbl-rate').textContent = dolarVal.toFixed(2);
                } else {
                    if (!toAmountInput.value && fromAmt > 0) {
                        toAmountInput.value = fromAmt;
                    }
                    updateExchangeRateDisplay();
                }

            } catch (err) {
                console.error('Error al obtener cotización para transferencia:', err);
                if (!toAmountInput.value && fromAmountInput.value) {
                    toAmountInput.value = fromAmountInput.value;
                }
                updateExchangeRateDisplay();
            }

        } else {
            multiContainer.style.display = 'none';
            rateInfo.style.display = 'none';
            toAmountInput.value = '';
        }
    };

    fromAccSelect.onchange = checkMulticurrency;
    toAccSelect.onchange = checkMulticurrency;

    fromAmountInput.oninput = () => {
        const multiContainer = document.getElementById('multicurrency-container');
        if (multiContainer.style.display !== 'none' && !toAmountInput.value) {
            toAmountInput.value = fromAmountInput.value;
        }
        updateExchangeRateDisplay();
    };

    toAmountInput.oninput = updateExchangeRateDisplay;

    // Envío del formulario
    document.getElementById('movement-form').onsubmit = async (e) => {
        e.preventDefault();
        const type = typeSelector.value;
        const date = document.getElementById('mov-date').value;
        const comment = document.getElementById('mov-comment').value;

        try {
            if (type === 'TRANSFER') {
                const fromAccountUid = fromAccSelect.value;
                const toAccountUid = toAccSelect.value;
                const fromAmount = parseFloat(fromAmountInput.value);
                const toAmount = document.getElementById('multicurrency-container').style.display !== 'none' 
                    ? parseFloat(toAmountInput.value) 
                    : fromAmount;

                if (!fromAccountUid || !toAccountUid || isNaN(fromAmount)) {
                    alert('Por favor complete las cuentas y el monto de origen.');
                    return;
                }

                const res = await fetch('http://localhost:3000/api/transfers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fromAccountUid, toAccountUid, fromAmount, toAmount, comment, date })
                });

                if (!res.ok) throw new Error('Error al registrar transferencia');
                alert('¡Transferencia registrada con éxito!');

            } else {
                const account_uid = document.getElementById('mov-account').value;
                const subCat = subCatSelect.value;
                const parentCat = parentCatSelect.value;
                const category_uid = subCat ? subCat : (parentCat ? parentCat : null);
                const amount = parseFloat(document.getElementById('mov-amount').value);
                const tag = document.getElementById('mov-tag').value;

                if (!account_uid || isNaN(amount)) {
                    alert('Por favor seleccione una cuenta y un monto válido.');
                    return;
                }

                const apiType = type === 'INCOME' ? 'INCOME' : 'EXPENSE';
                const selectedAccount = cachedAccounts.find(a => a.uid === account_uid);
                const isCreditCard = selectedAccount && selectedAccount.type && selectedAccount.type.toLowerCase() === 'credit_card';
                
                let installments = 1;
                if (isCreditCard) {
                    const instSelect = document.getElementById('mov-installments');
                    installments = instSelect ? parseInt(instSelect.value) || 1 : 1;
                }

                const res = await fetch('http://localhost:3000/api/transactions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        type: apiType, 
                        account_uid, 
                        category_uid, 
                        tag, 
                        amount, 
                        comment, 
                        date, 
                        installments 
                    })
                });

                if (!res.ok) throw new Error('Error al registrar transacción');
                alert(isCreditCard && installments > 1 
                    ? `¡Compra en ${installments} cuotas registrada con éxito!` 
                    : '¡Movimiento registrado con éxito!');
            }

            document.getElementById('movement-form').reset();
            document.getElementById('mov-date').value = new Date().toISOString().split('T')[0];
            transferSection.style.display = 'none';
            standardSection.style.display = 'flex';
            
            const instContainer = document.getElementById('installments-container');
            if (instContainer) instContainer.style.display = 'none';

            await loadRecentMovements();

        } catch (err) {
            alert('Error: ' + err.message);
        }
    };
}

function updateExchangeRateDisplay() {
    const fromAmt = parseFloat(document.getElementById('tr-from-amount').value) || 0;
    const toAmt = parseFloat(document.getElementById('tr-to-amount').value) || 0;
    if (fromAmt > 0 && toAmt > 0) {
        const rate = (toAmt / fromAmt).toFixed(4);
        document.getElementById('lbl-rate').textContent = rate;
    }
}

async function loadRecentMovements() {
    const recentDiv = document.getElementById('recent-movements');
    try {
        const [txRes, trRes] = await Promise.all([
            fetch('http://localhost:3000/api/transactions'),
            fetch('http://localhost:3000/api/transfers')
        ]);

        const transactions = await txRes.json();
        const transfers = await trRes.json();

        // Combinar y ordenar por fecha descendente
        const combined = [
            ...transactions.map(t => ({ ...t, kind: 'TX' })),
            ...transfers.map(tr => ({ ...tr, kind: 'TR', date: tr.date }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

        if (combined.length === 0) {
            recentDiv.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem;">No hay movimientos registrados.</p>`;
            return;
        }

        let html = `<div style="display: flex; flex-direction: column; gap: 0.5rem;">`;
        combined.forEach(item => {
            if (item.kind === 'TX') {
                const isInc = item.type === 'INCOME';
                html += `
                    <div style="background: rgba(15, 23, 42, 0.4); border: 1px solid var(--border); border-radius: 4px; padding: 0.75rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem;">
                        <div>
                            <span style="font-weight: bold; color: ${isInc ? '#10b981' : '#ef4444'};">${isInc ? 'Ingreso' : 'Gasto'}</span>
                            <span style="margin-left: 0.5rem; color: var(--text);">${item.account_title}</span>
                            ${item.category_title ? `<span style="color: var(--text-muted); font-size: 0.8rem; margin-left: 0.5rem;">[${item.category_title}]</span>` : ''}
                            ${item.tag ? `<span style="background: var(--border); padding: 0.1rem 0.3rem; border-radius: 3px; font-size: 0.75rem; margin-left: 0.5rem;">#${item.tag}</span>` : ''}
                        </div>
                        <div style="text-align: right;">
                            <span style="font-weight: bold; color: ${isInc ? '#10b981' : '#ef4444'};">${isInc ? '+' : '-'}$${item.amountInAccountCurrency}</span>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">${item.date.split('T')[0]}</div>
                        </div>
                    </div>
                `;
            } else {
                html += `
                    <div style="background: rgba(15, 23, 42, 0.4); border: 1px solid var(--border); border-radius: 4px; padding: 0.75rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem;">
                        <div>
                            <span style="font-weight: bold; color: #3b82f6;">Transferencia</span>
                            <span style="margin-left: 0.5rem; color: var(--text);">${item.from_account_title} ➔ ${item.to_account_title}</span>
                        </div>
                        <div style="text-align: right;">
                            <span style="font-weight: bold; color: #3b82f6;">-$${item.fromAmount} ➔ +$${item.toAmount}</span>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">${item.date.split('T')[0]}</div>
                        </div>
                    </div>
                `;
            }
        });
        html += `</div>`;
        recentDiv.innerHTML = html;

    } catch (err) {
        recentDiv.innerHTML = `<p style="color: #ef4444;">Error al cargar historial: ${err.message}</p>`;
    }
}