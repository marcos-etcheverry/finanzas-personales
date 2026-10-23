export async function render() {
    const container = document.getElementById('app-view');
    
    container.innerHTML = `
        <div class="view-card" style="display: flex; flex-direction: column; gap: 1.5rem;">
            <!-- CABECERA Y BOTÓN COLAPSIBLE -->
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(15, 23, 42, 0.6); padding: 1.25rem 1.5rem; border: 1px solid var(--border); border-radius: var(--radius); backdrop-filter: blur(8px);">
                <div>
                    <h2 style="margin: 0; font-size: 1.4rem; display: flex; align-items: center; gap: 0.5rem;">
                        📝 Registro de Movimientos
                    </h2>
                    <p style="margin: 0.25rem 0 0 0; color: var(--text-muted); font-size: 0.85rem;">
                        Registra, edita o elimina tus gastos, ingresos o transferencias entre cuentas.
                    </p>
                </div>
                <button id="btn-toggle-form" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; border: none; padding: 0.65rem 1.25rem; border-radius: var(--radius); cursor: pointer; font-weight: 600; font-size: 0.85rem; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); transition: all 0.2s ease;">
                    + Nuevo Movimiento
                </button>
            </div>

            <!-- FORMULARIO UNIFICADO (CONTENEDOR COLAPSIBLE) -->
            <div id="form-collapsible-container" style="display: none; background: rgba(15, 23, 42, 0.8); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.5rem; box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
                <h3 id="form-mode-title" style="margin-bottom: 1rem; font-size: 1.1rem; color: var(--accent);">Nuevo Movimiento</h3>
                
                <!-- Pestañas Visuales (Tabs) -->
                <div style="display: flex; gap: 0.5rem; margin-bottom: 1.25rem;">
                    <button type="button" class="mov-tab active" data-type="EXPENSE" style="flex: 1; padding: 0.6rem; border-radius: 6px; border: 2px solid #ef4444; background: rgba(239, 68, 68, 0.15); color: #ef4444; font-weight: bold; cursor: pointer; transition: all 0.2s;">
                        🔴 Gasto
                    </button>
                    <button type="button" class="mov-tab" data-type="INCOME" style="flex: 1; padding: 0.6rem; border-radius: 6px; border: 2px solid #10b981; background: transparent; color: #10b981; font-weight: bold; cursor: pointer; transition: all 0.2s;">
                        🟢 Ingreso
                    </button>
                    <button type="button" class="mov-tab" data-type="TRANSFER" style="flex: 1; padding: 0.6rem; border-radius: 6px; border: 2px solid #3b82f6; background: transparent; color: #3b82f6; font-weight: bold; cursor: pointer; transition: all 0.2s;">
                        🔵 Transferencia
                    </button>
                </div>

                <form id="movement-form" style="display: flex; flex-direction: column; gap: 1rem; border-top: 1px dashed var(--border); padding-top: 1rem;">
                    <input type="hidden" id="edit-uid" value="">
                    <input type="hidden" id="edit-kind" value="">
                    <input type="hidden" id="mov-current-type" value="EXPENSE">

                    <!-- Campos comunes para Gasto / Ingreso -->
                    <div id="section-standard" style="display: flex; flex-direction: column; gap: 1rem;">
                        
                        <!-- Monto, Moneda y Fecha -->
                        <div style="display: grid; grid-template-columns: 2fr 1fr 1.5fr; gap: 0.75rem; align-items: center;">
                            <div>
                                <label style="display: block; font-size: 0.81rem; margin-bottom: 0.3rem;">Monto:</label>
                                <input type="number" step="0.01" id="mov-amount" placeholder="0.00" style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                            </div>
                            <div>
                                <label style="display: block; font-size: 0.81rem; margin-bottom: 0.3rem;">Moneda:</label>
                                <select id="mov-currency" style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                                    <option value="$" selected>$</option>
                                    <option value="USD">USD</option>
                                </select>
                            </div>
                            <div>
                                <label style="display: block; font-size: 0.81rem; margin-bottom: 0.3rem;">Fecha:</label>
                                <input type="date" id="mov-date" style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                            </div>
                        </div>

                        <!-- Selector visual de cuenta con imagen/icono -->
                        <div>
                            <label style="display: block; font-size: 0.85rem; margin-bottom: 0.3rem; font-weight: bold;">Cuenta:</label>
                            <input type="hidden" id="mov-account" value="">
                            <div id="account-selector-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.5rem; max-height: 140px; overflow-y: auto; padding: 0.2rem;">
                                <span style="color: var(--text-muted); font-size: 0.8rem;">Cargando cuentas...</span>
                            </div>
                        </div>

                        <div id="installments-container" style="display: none; margin-top: 0.5rem; border-top: 1px dashed var(--border); padding-top: 0.5rem;">
                            <label style="display: block; font-size: 0.85rem; margin-bottom: 0.3rem; font-weight: bold; color: var(--accent);">Cantidad de Cuotas:</label>
                            <select id="mov-installments" style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                                <option value="1">1 pago</option>
                                <option value="2">2 cuotas</option>
                                <option value="3">3 cuotas</option>
                                <option value="6">6 cuotas</option>
                                <option value="12">12 cuotas</option>
                            </select>
                        </div>

                        <!-- Carruseles de Categorías y Subcategorías -->
                        <div style="display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 1rem; background: rgba(15, 23, 42, 0.4); padding: 0.75rem; border-radius: 6px; border: 1px solid var(--border);">
                            <div>
                                <label style="display: block; font-size: 0.8rem; margin-bottom: 0.3rem; font-weight: bold; color: var(--accent);">Categoría:</label>
                                <input type="hidden" id="mov-selected-category" value="">
                                <div id="category-carousel" style="display: flex; gap: 0.5rem; overflow-x: auto; flex-wrap: nowrap; padding: 0.5rem 0; scrollbar-width: thin;">
                                    <span style="font-size: 0.8rem; color: var(--text-muted); font-style: italic;">Cargando...</span>
                                </div>
                            </div>
                            <div>
                                <label style="display: block; font-size: 0.8rem; margin-bottom: 0.3rem; font-weight: bold; color: var(--text-muted);">Subcategoría (Opcional):</label>
                                <input type="hidden" id="mov-selected-subcategory" value="">
                                <div id="subcategory-carousel" style="display: flex; gap: 0.5rem; overflow-x: auto; flex-wrap: nowrap; padding: 0.5rem 0; scrollbar-width: thin;">
                                    <span style="font-size: 0.8rem; color: var(--text-muted); font-style: italic;">Selecciona una categoría</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label style="display: block; font-size: 0.85rem; margin-bottom: 0.3rem;">Etiqueta (Tag):</label>
                            <input type="text" id="mov-tag" placeholder="ej. supermercado" style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                        </div>
                    </div>

                    <!-- Campos específicos para Transferencia -->
                    <div id="section-transfer" style="display: none; flex-direction: column; gap: 1rem;">
                        <div style="display: grid; grid-template-columns: 2fr 1fr 1.5fr; gap: 0.75rem; align-items: center;">
                            <div>
                                <label style="display: block; font-size: 0.81rem; margin-bottom: 0.3rem;">Monto Origen:</label>
                                <input type="number" step="0.01" id="tr-from-amount" placeholder="0.00" style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                            </div>
                            <div>
                                <label style="display: block; font-size: 0.81rem; margin-bottom: 0.3rem;">Moneda:</label>
                                <select id="tr-currency" style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                                    <option value="$" selected>$</option>
                                    <option value="USD">USD</option>
                                </select>
                            </div>
                            <div>
                                <label style="display: block; font-size: 0.81rem; margin-bottom: 0.3rem;">Fecha:</label>
                                <input type="date" id="tr-date" style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                            </div>
                        </div>

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
                    </div>

                    <div>
                        <label style="display: block; font-size: 0.85rem; margin-bottom: 0.3rem;">Comentario:</label>
                        <textarea id="mov-comment" rows="2" style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);" placeholder="Notas..."></textarea>
                    </div>

                    <div style="display: flex; gap: 1rem;">
                        <button type="submit" id="btn-submit-mov" style="flex: 2; background-color: var(--accent); color: white; border: none; padding: 0.75rem; border-radius: var(--radius); cursor: pointer; font-weight: bold;">Registrar Movimiento</button>
                        <button type="button" id="btn-cancel-edit" style="flex: 1; background-color: #64748b; color: white; border: none; padding: 0.75rem; border-radius: var(--radius); cursor: pointer; display: none;">Cancelar</button>
                    </div>
                </form>
            </div>

            <!-- Listado reciente con fecha, categoría/subcategoría/etiqueta y 2 decimales -->
            <div style="margin-top: 1rem;">
                <h3>Últimos Movimientos Registrados</h3>
                <div id="recent-movements" style="margin-top: 1rem;" class="loading">Cargando historial...</div>
            </div>
        </div>
    `;

    await initializeMovementView();
}

let cachedAccounts = [];
let cachedCategories = [];
let cachedTransactions = [];
let cachedTransfers = [];

async function initializeMovementView() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('mov-date').value = today;
    document.getElementById('tr-date').value = today;

    try {
        const [accRes, catRes] = await Promise.all([
            fetch('http://localhost:3000/api/accounts'),
            fetch('http://localhost:3000/api/categories')
        ]);

        cachedAccounts = await accRes.json();
        cachedCategories = await catRes.json();

        populateDropdowns();
        setupFormInteractivity();
        await loadRecentMovements();

    } catch (err) {
        console.error('Error inicializando vista de movimientos:', err);
    }
}

function populateDropdowns() {
    renderAccountSelector();
    renderCategoryCarousel('expense');

    const fromAccSelect = document.getElementById('tr-from-account');
    const toAccSelect = document.getElementById('tr-to-account');
    
    let accOptions = '<option value="">-- Seleccionar cuenta --</option>';
    
    // Filtrar solo las cuentas que NO sean tarjetas de crédito para el combo de transferencias
    const cashAccounts = cachedAccounts.filter(acc => !acc.type || acc.type !== 'credit_card');

    cashAccounts.forEach(acc => {
        accOptions += `<option value="${acc.uid}" data-currency="${acc.currencyCode}">${acc.title} (${acc.currencyCode || 'ARS'})</option>`;
    });

    fromAccSelect.innerHTML = accOptions;
    toAccSelect.innerHTML = accOptions;
}

function renderAccountSelector() {
    const gridContainer = document.getElementById('account-selector-grid');
    const hiddenInput = document.getElementById('mov-account');

    if (cachedAccounts.length === 0) {
        gridContainer.innerHTML = `<span style="font-size: 0.8rem; color: var(--text-muted);">Sin cuentas registradas.</span>`;
        return;
    }

    let html = '';
    cachedAccounts.forEach((acc, index) => {
        if (index === 0 && !hiddenInput.value) {
            hiddenInput.value = acc.uid;
        }

        const isSelected = hiddenInput.value === acc.uid;
        const borderColor = isSelected ? 'var(--accent)' : 'var(--border)';
        const bgStyle = isSelected ? 'rgba(59, 130, 246, 0.25)' : 'rgba(15, 23, 42, 0.4)';

        let iconHtml = `<span style="font-size: 1.5rem;">💳</span>`;
        if (acc.icon && acc.icon.startsWith('uploads/')) {
            iconHtml = `<img src="http://localhost:3000/${acc.icon}" style="width: 36px; height: 36px; object-fit: cover; border-radius: 4px;" alt="Logo">`;
        }

        html += `
            <div class="account-card-item" data-uid="${acc.uid}" data-type="${acc.type || ''}" style="background: ${bgStyle}; border: 2px solid ${borderColor}; border-radius: 6px; padding: 0.5rem; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; transition: all 0.2s; box-sizing: border-box;">
                <div style="width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    ${iconHtml}
                </div>
                <div style="overflow: hidden; text-overflow: ellipsis;">
                    <div style="font-size: 0.8rem; color: var(--text); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${acc.title}</div>
                    <div style="font-size: 0.7rem; color: var(--text-muted);">${Number(acc.balance || 0).toFixed(2)} ${acc.currencyCode || ''}</div>
                </div>
            </div>
        `;
    });

    gridContainer.innerHTML = html;

    document.querySelectorAll('.account-card-item').forEach(card => {
        card.onclick = () => {
            document.querySelectorAll('.account-card-item').forEach(c => {
                c.style.borderColor = 'var(--border)';
                c.style.background = 'rgba(15, 23, 42, 0.4)';
            });
            card.style.borderColor = 'var(--accent)';
            card.style.background = 'rgba(59, 130, 246, 0.25)';
            hiddenInput.value = card.getAttribute('data-uid');
            
            // Evaluar cuotas si es tarjeta
            const accType = card.getAttribute('data-type');
            const currentType = document.getElementById('mov-current-type').value;
            const installmentsContainer = document.getElementById('installments-container');
            if (accType && accType.toLowerCase() === 'credit_card' && currentType === 'EXPENSE') {
                installmentsContainer.style.display = 'block';
            } else {
                installmentsContainer.style.display = 'none';
            }
        };
    });
}

function renderCategoryCarousel(catType) {
    const carouselContainer = document.getElementById('category-carousel');
    const selectedInput = document.getElementById('mov-selected-category');
    
    carouselContainer.style.display = 'flex';
    carouselContainer.style.flexWrap = 'nowrap';
    carouselContainer.style.overflowX = 'auto';
    carouselContainer.style.gap = '0.5rem';
    carouselContainer.style.paddingBottom = '0.5rem';

    const parents = cachedCategories.filter(c => !c.parent_uid && c.type === catType);

    if (parents.length === 0) {
        carouselContainer.innerHTML = `<span style="font-size: 0.8rem; color: var(--text-muted);">Sin categorías.</span>`;
        document.getElementById('subcategory-carousel').innerHTML = `<span style="font-size: 0.8rem; color: var(--text-muted);">-</span>`;
        return;
    }

    let html = '';
    parents.forEach((cat, index) => {
        if (index === 0 && !selectedInput.value) {
            selectedInput.value = cat.uid;
        }

        const isSelected = selectedInput.value === cat.uid;
        const borderColor = isSelected ? 'var(--accent)' : 'var(--border)';
        const bgStyle = isSelected ? 'rgba(59, 130, 246, 0.25)' : 'rgba(15, 23, 42, 0.4)';

        let iconHtml = '📁';
        if (cat.icon) {
            if (cat.icon.startsWith('http') || cat.icon.startsWith('/') || cat.icon.includes('.')) {
                iconHtml = `<img src="${cat.icon}" alt="" style="width: 50px !important; height: 50px !important; object-fit: contain; border-radius: 6px;" />`;
            } else {
                iconHtml = `<span style="font-size: 1.5rem; line-height: 1;">${cat.icon}</span>`;
            }
        }

        html += `
            <div class="cat-card-item" data-uid="${cat.uid}" style="flex: 0 0 calc(25% - 0.4rem); width: calc(25% - 0.4rem); min-width: 65px; height: 90px; background: ${bgStyle}; border: 2px solid ${borderColor}; border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; padding: 0.1rem; transition: all 0.2s; text-align: center; box-sizing: border-box;" title="${cat.title}">
                <div style="margin-bottom: 0.3rem; display: flex; align-items: center; justify-content: center; width: 45px; height: 45px;">
                    ${iconHtml}
                </div>
                <span style="font-size: 0.8rem; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; font-weight: 500;">${cat.title}</span>
            </div>
        `;
    });

    carouselContainer.innerHTML = html;

    document.querySelectorAll('.cat-card-item').forEach(card => {
        card.onclick = () => {
            document.querySelectorAll('.cat-card-item').forEach(c => {
                c.style.borderColor = 'var(--border)';
                c.style.background = 'rgba(15, 23, 42, 0.4)';
            });
            card.style.borderColor = 'var(--accent)';
            card.style.background = 'rgba(59, 130, 246, 0.25)';
            selectedInput.value = card.getAttribute('data-uid');
            
            renderSubcategoryCarousel(card.getAttribute('data-uid'));
        };
    });

    if (parents.length > 0) {
        const defaultUid = selectedInput.value || parents[0].uid;
        selectedInput.value = defaultUid;
        renderSubcategoryCarousel(defaultUid);
    }
}

function renderSubcategoryCarousel(parentUid) {
    const subCarouselContainer = document.getElementById('subcategory-carousel');
    const subSelectedInput = document.getElementById('mov-selected-subcategory');
    
    subCarouselContainer.style.display = 'flex';
    subCarouselContainer.style.flexWrap = 'nowrap';
    subCarouselContainer.style.overflowX = 'auto';
    subCarouselContainer.style.gap = '0.5rem';

    const subs = cachedCategories.filter(c => c.parent_uid === parentUid);

    if (subs.length === 0) {
        subCarouselContainer.innerHTML = `<span style="font-size: 0.8rem; color: var(--text-muted); font-style: italic; padding: 1rem;">Sin subcategorías</span>`;
        subSelectedInput.value = '';
        return;
    }

    let html = '';
    subs.forEach((sub, index) => {
        if (index === 0 && !subSelectedInput.value) {
            subSelectedInput.value = sub.uid;
        }

        const isSelected = subSelectedInput.value === sub.uid;
        const borderColor = isSelected ? '#10b981' : 'var(--border)';
        const bgStyle = isSelected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(15, 23, 42, 0.4)';

        let iconHtml = '🔹';
        if (sub.icon) {
            if (sub.icon.startsWith('http') || sub.icon.startsWith('/') || sub.icon.includes('.')) {
                iconHtml = `<img src="${sub.icon}" alt="" style="width: 50px !important; height: 50px !important; object-fit: contain; border-radius: 6px;" />`;
            } else {
                iconHtml = `<span style="font-size: 1.5rem; line-height: 1;">${sub.icon}</span>`;
            }
        }

        html += `
            <div class="subcat-card-item" data-uid="${sub.uid}" style="flex: 0 0 calc(25% - 0.4rem); width: calc(25% - 0.4rem); min-width: 60px; height: 90px; background: ${bgStyle}; border: 2px solid ${borderColor}; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; padding: 0.3rem; transition: all 0.2s; text-align: center; box-sizing: border-box;" title="${sub.title}">
                <div style="margin-bottom: 0.3rem; display: flex; align-items: center; justify-content: center; width: 45px; height: 45px;">
                    ${iconHtml}
                </div>
                <span style="font-size: 0.8rem; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; font-weight: 500;">${sub.title}</span>
            </div>
        `;
    });

    subCarouselContainer.innerHTML = html;

    document.querySelectorAll('.subcat-card-item').forEach(card => {
        card.onclick = () => {
            document.querySelectorAll('.subcat-card-item').forEach(c => {
                c.style.borderColor = 'var(--border)';
                c.style.background = 'rgba(15, 23, 42, 0.4)';
            });
            card.style.borderColor = '#10b981';
            card.style.background = 'rgba(16, 185, 129, 0.25)';
            subSelectedInput.value = card.getAttribute('data-uid');
        };
    });
}

function setupFormInteractivity() {
    const tabs = document.querySelectorAll('.mov-tab');
    const currentTypeInput = document.getElementById('mov-current-type');
    const standardSection = document.getElementById('section-standard');
    const transferSection = document.getElementById('section-transfer');
    const installmentsContainer = document.getElementById('installments-container');
    const btnCancelEdit = document.getElementById('btn-cancel-edit');
    const btnToggleForm = document.getElementById('btn-toggle-form');
    const formContainer = document.getElementById('form-collapsible-container');

    // Botón colapsable superior
    btnToggleForm.onclick = () => {
        if (formContainer.style.display === 'none') {
            formContainer.style.display = 'block';
            btnToggleForm.textContent = '✕ Ocultar Formulario';
        } else {
            formContainer.style.display = 'none';
            btnToggleForm.textContent = '+ Nuevo Movimiento';
        }
    };

    tabs.forEach(tab => {
        tab.onclick = () => {
            tabs.forEach(t => {
                t.style.background = 'transparent';
                t.style.opacity = '0.6';
            });
            tab.style.opacity = '1';
            
            const type = tab.getAttribute('data-type');
            currentTypeInput.value = type;

            if (type === 'EXPENSE') {
                tab.style.background = 'rgba(239, 68, 68, 0.15)';
                standardSection.style.display = 'flex';
                transferSection.style.display = 'none';
                renderCategoryCarousel('expense');
            } else if (type === 'INCOME') {
                tab.style.background = 'rgba(16, 185, 129, 0.15)';
                standardSection.style.display = 'flex';
                transferSection.style.display = 'none';
                renderCategoryCarousel('income');
            } else if (type === 'TRANSFER') {
                tab.style.background = 'rgba(59, 130, 246, 0.15)';
                standardSection.style.display = 'none';
                transferSection.style.display = 'flex';
                installmentsContainer.style.display = 'none';
            }
        };
    });

    btnCancelEdit.onclick = () => resetFormToCreateMode();

    document.getElementById('movement-form').onsubmit = async (e) => {
        e.preventDefault();
        const editUid = document.getElementById('edit-uid').value;
        const type = currentTypeInput.value;

        try {
 if (type === 'TRANSFER') {
                const fromAccountUid = document.getElementById('tr-from-account').value;
                const toAccountUid = document.getElementById('tr-to-account').value;
                const fromAmount = parseFloat(document.getElementById('tr-from-amount').value);
                const date = document.getElementById('tr-date').value;
                const comment = document.getElementById('mov-comment').value;

                if (!fromAccountUid || !toAccountUid || isNaN(fromAmount)) {
                    alert('Complete cuentas y monto de origen.');
                    return;
                }

                // 1. Definir el payload correctamente para transferencias
                const payload = { 
                    fromAccountUid, 
                    toAccountUid, 
                    fromAmount, 
                    toAmount: fromAmount, 
                    comment, 
                    date 
                };

                console.log("TRANSFER - Payload a enviar:", payload);

                const url = editUid ? `http://localhost:3000/api/transfers/${editUid}` : 'http://localhost:3000/api/transfers';
                const method = editUid ? 'PUT' : 'POST';

                const res = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload) // 2. Enviar el payload definido
                });

                if (!res.ok) throw new Error('Error al guardar transferencia');
                alert(editUid ? '¡Transferencia actualizada!' : '¡Transferencia registrada!');

            }else {
                const account_uid = document.getElementById('mov-account').value;
                const parentCat = document.getElementById('mov-selected-category').value;
                const subCat = document.getElementById('mov-selected-subcategory').value;
                const category_uid = subCat ? subCat : (parentCat ? parentCat : null);
                const amount = parseFloat(document.getElementById('mov-amount').value);
                const tag = document.getElementById('mov-tag').value;
                const date = document.getElementById('mov-date').value;
                const comment = document.getElementById('mov-comment').value;

                if (!account_uid || isNaN(amount)) {
                    alert('Seleccione cuenta y monto válido.');
                    return;
                }
                const apiType = type === 'INCOME' ? 'INCOME' : 'EXPENSE';
                const selectedAcc = cachedAccounts.find(a => a.uid === account_uid);
                const isCard = selectedAcc && selectedAcc.type && selectedAcc.type.toLowerCase() === 'credit_card';
                const installments = (apiType === 'EXPENSE' && isCard) ? (parseInt(document.getElementById('mov-installments').value) || 1) : 1;

                // Decidir la URL y el payload según si es compra con tarjeta de crédito nueva
                let url;
                let method;
                let payload;

                if (apiType === 'EXPENSE' && isCard && !editUid) {
                    url = 'http://localhost:3000/api/credit-cards/purchase';
                    method = 'POST';
                    payload = {
                        account_uid,
                        total_amount: amount,
                        installments,
                        purchase_date: date,
                        comment,
                        category_uid, // <--- ¡Faltaba agregar esto!
                        tag           // <--- ¡Y esto!
                    };
                } else {
                    url = editUid ? `http://localhost:3000/api/transactions/${editUid}` : 'http://localhost:3000/api/transactions';
                    method = editUid ? 'PUT' : 'POST';
                    payload = {
                        type: apiType, 
                        account_uid, 
                        category_uid, 
                        tag, 
                        amount, 
                        comment, 
                        date, 
                        installments
                    };
                }
// Poné el debugger AQUÍ, donde 'payload' ya tiene datos asignados:
console.log("PAYLOAD FINAL A ENVIAR:", payload);
debugger;
                const res = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!res.ok) throw new Error('Error al guardar movimiento');
                alert(editUid ? '¡Movimiento actualizado!' : '¡Movimiento registrado con éxito!');

            }

            resetFormToCreateMode();
            await loadRecentMovements();

        } catch (err) {
            alert('Error: ' + err.message);
        }
    };
}

function resetFormToCreateMode() {
    const form = document.getElementById('movement-form');
    form.reset();
    document.getElementById('edit-uid').value = '';
    document.getElementById('edit-kind').value = '';
    document.getElementById('form-mode-title').textContent = 'Nuevo Movimiento';
    document.getElementById('btn-submit-mov').textContent = 'Registrar Movimiento';
    document.getElementById('btn-cancel-edit').style.display = 'none';
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('mov-date').value = today;
    document.getElementById('tr-date').value = today;
    
    const expenseTab = document.querySelector('.mov-tab[data-type="EXPENSE"]');
    if (expenseTab) expenseTab.click();
}

async function loadRecentMovements() {
    const recentDiv = document.getElementById('recent-movements');
    try {
        const [txRes, trRes] = await Promise.all([
            fetch('http://localhost:3000/api/transactions'),
            fetch('http://localhost:3000/api/transfers')
        ]);

        cachedTransactions = await txRes.json();
        cachedTransfers = await trRes.json();

        const combined = [
            ...cachedTransactions.map(t => ({ ...t, kind: 'TX' })),
            ...cachedTransfers.map(tr => ({ ...tr, kind: 'TR', date: tr.date }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3); // Últimos 3 movimientos

        if (combined.length === 0) {
            recentDiv.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem;">No hay movimientos registrados.</p>`;
            return;
        }

        let html = `<div style="display: flex; flex-direction: column; gap: 0.5rem;">`;
        combined.forEach(item => {
            const formattedDate = item.date ? item.date.split('T')[0] : '';

            if (item.kind === 'TX') {
                const isInc = item.type === 'INCOME';
                const amountFormatted = Number(item.amountInAccountCurrency || item.amount || 0).toFixed(2);
                
                // Construir estructura: Categoría - Subcategoría - Etiqueta
                let catPath = '';
                if (item.category_title) {
                    catPath = item.category_title;
                }
                const tagDisplay = item.tag ? ` / #${item.tag}` : '';
                const categoryInfo = catPath ? `[${catPath}${tagDisplay}]` : (item.tag ? `[#${item.tag}]` : '');

                html += `
                    <div style="background: rgba(15, 23, 42, 0.4); border: 1px solid var(--border); border-radius: 6px; padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem;">
                        <div>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <span style="font-size: 0.75rem; color: var(--text-muted); background: rgba(255,255,255,0.05); padding: 0.1rem 0.4rem; border-radius: 4px;">${formattedDate}</span>
                                <span style="font-weight: bold; color: ${isInc ? '#10b981' : '#ef4444'};">${isInc ? '🟢 Ingreso' : '🔴 Gasto'}</span>
                                <span style="color: var(--text); font-weight: 500;">${item.account_title || ''}</span>
                            </div>
                            <div style="margin-top: 0.25rem; font-size: 0.8rem; color: var(--accent);">
                                ${categoryInfo} ${item.comment ? `- ${item.comment}` : ''}
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <div style="text-align: right;">
                                <span style="font-weight: bold; font-size: 1.05rem; color: ${isInc ? '#10b981' : '#ef4444'};">${isInc ? '+' : '-'}$${amountFormatted}</span>
                            </div>
                            <div style="display: flex; gap: 0.25rem;">
                                <button onclick="window.editMovement('${item.uid}', 'TX')" style="background: #3b82f6; color: white; border: none; padding: 0.3rem 0.6rem; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">Editar</button>
                                <button onclick="window.deleteMovement('${item.uid}', 'TX')" style="background: #ef4444; color: white; border: none; padding: 0.3rem 0.6rem; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">Eliminar</button>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                const fromAmt = Number(item.fromAmount || 0).toFixed(2);
                const toAmt = Number(item.toAmount || 0).toFixed(2);

                html += `
                    <div style="background: rgba(15, 23, 42, 0.4); border: 1px solid var(--border); border-radius: 6px; padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem;">
                        <div>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <span style="font-size: 0.75rem; color: var(--text-muted); background: rgba(255,255,255,0.05); padding: 0.1rem 0.4rem; border-radius: 4px;">${formattedDate}</span>
                                <span style="font-weight: bold; color: #3b82f6;">🔵 Transferencia</span>
                            </div>
                            <div style="margin-top: 0.25rem; font-size: 0.8rem; color: var(--text);">
                                ${item.from_account_title || 'Origen'} ➔ ${item.to_account_title || 'Destino'} ${item.comment ? `(${item.comment})` : ''}
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <div style="text-align: right;">
                                <span style="font-weight: bold; font-size: 1.05rem; color: #3b82f6;">-$${fromAmt} ➔ +$${toAmt}</span>
                            </div>
                            <div style="display: flex; gap: 0.25rem;">
                                <button onclick="window.editMovement('${item.uid}', 'TR')" style="background: #3b82f6; color: white; border: none; padding: 0.3rem 0.6rem; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">Editar</button>
                                <button onclick="window.deleteMovement('${item.uid}', 'TR')" style="background: #ef4444; color: white; border: none; padding: 0.3rem 0.6rem; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">Eliminar</button>
                            </div>
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

window.editMovement = function(uid, kind) {
    // Abrir formulario si está colapsado
    const formContainer = document.getElementById('form-collapsible-container');
    const btnToggleForm = document.getElementById('btn-toggle-form');
    if (formContainer.style.display === 'none') {
        formContainer.style.display = 'block';
        btnToggleForm.textContent = '✕ Ocultar Formulario';
    }

    if (kind === 'TX') {
        const tx = cachedTransactions.find(t => t.uid === uid);
        if (!tx) return;
        document.getElementById('edit-uid').value = tx.uid;
        document.getElementById('edit-kind').value = 'TX';
        
        const targetTab = document.querySelector(`.mov-tab[data-type="${tx.type}"]`);
        if (targetTab) targetTab.click();

        document.getElementById('mov-account').value = tx.account_uid;
        document.getElementById('mov-amount').value = Number(tx.amountInAccountCurrency || tx.amount || 0).toFixed(2);
        document.getElementById('mov-date').value = tx.date ? tx.date.split('T')[0] : '';
        document.getElementById('mov-comment').value = tx.comment || '';
        document.getElementById('mov-tag').value = tx.tag || '';

        if (tx.category_uid) {
            const cat = cachedCategories.find(c => c.uid === tx.category_uid);
            if (cat) {
                if (cat.parent_uid) {
                    document.getElementById('mov-selected-category').value = cat.parent_uid;
                    renderCategoryCarousel(cat.type);
                    document.getElementById('mov-selected-subcategory').value = cat.uid;
                    renderSubcategoryCarousel(cat.parent_uid);
                } else {
                    document.getElementById('mov-selected-category').value = cat.uid;
                    renderCategoryCarousel(cat.type);
                }
            }
        }
    } else {
        const tr = cachedTransfers.find(t => t.uid === uid);
        if (!tr) return;
        document.getElementById('edit-uid').value = tr.uid;
        document.getElementById('edit-kind').value = 'TR';
        
        const transferTab = document.querySelector('.mov-tab[data-type="TRANSFER"]');
        if (transferTab) transferTab.click();

        document.getElementById('tr-from-account').value = tr.fromAccountUid;
        document.getElementById('tr-to-account').value = tr.toAccountUid;
        document.getElementById('tr-from-amount').value = Number(tr.fromAmount || 0).toFixed(2);
        document.getElementById('tr-date').value = tr.date ? tr.date.split('T')[0] : '';
        document.getElementById('mov-comment').value = tr.comment || '';
    }

    document.getElementById('form-mode-title').textContent = 'Editar Movimiento';
    document.getElementById('btn-submit-mov').textContent = 'Guardar Cambios';
    document.getElementById('btn-cancel-edit').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteMovement = async function(uid, kind) {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return;
    try {
        const endpoint = kind === 'TX' ? `transactions/${uid}` : `transfers/${uid}`;
        const res = await fetch(`http://localhost:3000/api/${endpoint}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Error al eliminar');
        await loadRecentMovements();
    } catch (err) {
        alert('Error: ' + err.message);
    }
};