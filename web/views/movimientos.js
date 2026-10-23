export async function render() {
    const container = document.getElementById('app-view');
    
    container.innerHTML = `
        <div class="view-card">
            <h2>Historial Completo de Movimientos y Transferencias</h2>
            <p style="margin-bottom: 0;">Registro detallado, edición completa y control de todas tus operaciones.</p>
            
            <!-- Barra de Filtros en la Cabecera -->
            <div id="filter-bar" style="background: rgba(15, 23, 42, 0.6); border: 1px solid var(--border); border-radius: var(--radius); padding: 1rem; margin: 1.5rem 0; display: flex; flex-direction: column; gap: 1rem;">
                
                <!-- Fila 1: Filtros Rápidos de Periodo y Búsqueda -->
                <div style="display: flex; flex-wrap: wrap; gap: 1rem; justify-content: space-between; align-items: center;">
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        <button class="filter-btn" data-period="all" style="background: var(--accent); color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem; font-weight: 500;">Histórico</button>
                        <button class="filter-btn" data-period="month" style="background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: white; padding: 0.4rem 0.8rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">Este Mes</button>
                        <button class="filter-btn" data-period="year" style="background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: white; padding: 0.4rem 0.8rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">Este Año</button>
                    </div>

                    <div style="display: flex; gap: 0.5rem; flex: 1; max-width: 300px;">
                        <input type="text" id="filter-search" placeholder="🔍 Buscar en comentarios..." style="width: 100%; padding: 0.4rem 0.6rem; background: var(--bg-primary); border: 1px solid var(--border); color: var(--text-main); border-radius: 4px; font-size: 0.85rem;">
                    </div>
                </div>

                <!-- Fila 2: Filtros Avanzados (Selectores) -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.75rem; border-top: 1px solid var(--border); padding-top: 0.75rem;">
                    <div>
                        <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.2rem;">Tipo</label>
                        <select id="filter-type" style="width: 100%; padding: 0.4rem; background: var(--bg-primary); border: 1px solid var(--border); color: var(--text-main); border-radius: 4px; font-size: 0.85rem;">
                            <option value="">Todos los tipos</option>
                            <option value="EXPENSE">Gastos</option>
                            <option value="INCOME">Ingresos</option>
                            <option value="TRANSFER">Transferencias</option>
                        </select>
                    </div>

                    <div>
                        <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.2rem;">Cuenta</label>
                        <select id="filter-account" style="width: 100%; padding: 0.4rem; background: var(--bg-primary); border: 1px solid var(--border); color: var(--text-main); border-radius: 4px; font-size: 0.85rem;">
                            <option value="">Todas las cuentas</option>
                        </select>
                    </div>

                    <div>
                        <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.2rem;">Categoría</label>
                        <select id="filter-category" style="width: 100%; padding: 0.4rem; background: var(--bg-primary); border: 1px solid var(--border); color: var(--text-main); border-radius: 4px; font-size: 0.85rem;">
                            <option value="">Todas las categorías</option>
                        </select>
                    </div>

                    <div>
                        <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.2rem;">Fecha Desde</label>
                        <input type="date" id="filter-date-from" style="width: 100%; padding: 0.35rem; background: var(--bg-primary); border: 1px solid var(--border); color: var(--text-main); border-radius: 4px; font-size: 0.85rem;">
                    </div>

                    <div>
                        <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.2rem;">Fecha Hasta</label>
                        <input type="date" id="filter-date-to" style="width: 100%; padding: 0.35rem; background: var(--bg-primary); border: 1px solid var(--border); color: var(--text-main); border-radius: 4px; font-size: 0.85rem;">
                    </div>
                </div>

            </div>

            <div id="movimientos-content" class="loading">Cargando operaciones desde el servidor...</div>
        </div>

        <!-- Modal Flotante de Edición Completa -->
        <div id="edit-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.9); z-index: 1000; justify-content: center; align-items: center; overflow-y: auto; padding: 1rem;">
            <div style="background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius); padding: 2rem; width: 100%; max-width: 600px; box-shadow: 0 15px 35px rgba(0,0,0,0.7); max-height: 90vh; overflow-y: auto;">
                <h3 id="modal-title" style="margin-bottom: 1rem; color: var(--accent); font-size: 1.2rem;">Editar Operación</h3>
                <form id="edit-modal-form" style="display: flex; flex-direction: column; gap: 1rem;">
                    <input type="hidden" id="modal-uid">
                    <input type="hidden" id="modal-kind">

                    <div>
                        <label style="display: block; font-size: 0.85rem; margin-bottom: 0.3rem;">Tipo de Operación:</label>
                        <select id="modal-type" style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                            <option value="EXPENSE">Gasto</option>
                            <option value="INCOME">Ingreso</option>
                            <option value="TRANSFER">Transferencia</option>
                        </select>
                    </div>

                    <!-- Campos Estándar (Gasto / Ingreso) -->
                    <div id="modal-section-standard" style="display: flex; flex-direction: column; gap: 1rem;">
                        <div>
                            <label style="display: block; font-size: 0.85rem; margin-bottom: 0.3rem;">Cuenta:</label>
                            <select id="modal-account" style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);"></select>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div>
                                <label style="display: block; font-size: 0.85rem; margin-bottom: 0.3rem;">Categoría Principal:</label>
                                <select id="modal-parent-category" style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);"></select>
                            </div>
                            <div>
                                <label style="display: block; font-size: 0.85rem; margin-bottom: 0.3rem;">Subcategoría:</label>
                                <select id="modal-sub-category" style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);"></select>
                            </div>
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.85rem; margin-bottom: 0.3rem;">Monto:</label>
                            <input type="number" step="0.01" id="modal-amount" style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                        </div>
                    </div>

                    <!-- Campos de Transferencia -->
                    <div id="modal-section-transfer" style="display: none; flex-direction: column; gap: 1rem;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div>
                                <label style="display: block; font-size: 0.85rem; margin-bottom: 0.3rem;">Cuenta Origen:</label>
                                <select id="modal-from-account" style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);"></select>
                            </div>
                            <div>
                                <label style="display: block; font-size: 0.85rem; margin-bottom: 0.3rem;">Cuenta Destino:</label>
                                <select id="modal-to-account" style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);"></select>
                            </div>
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.85rem; margin-bottom: 0.3rem;">Monto:</label>
                            <input type="number" step="0.01" id="modal-transfer-amount" style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                        </div>
                    </div>

                    <div>
                        <label style="display: block; font-size: 0.85rem; margin-bottom: 0.3rem;">Fecha:</label>
                        <input type="date" id="modal-date" style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                    </div>

                    <div>
                        <label style="display: block; font-size: 0.85rem; margin-bottom: 0.3rem;">Comentario:</label>
                        <textarea id="modal-comment" rows="2" style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);"></textarea>
                    </div>

                    <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                        <button type="submit" style="flex: 1; background-color: #10b981; color: white; border: none; padding: 0.7rem; border-radius: 4px; cursor: pointer; font-weight: bold;">Guardar Cambios</button>
                        <button type="button" id="modal-close-btn" style="flex: 1; background-color: #64748b; color: white; border: none; padding: 0.7rem; border-radius: 4px; cursor: pointer;">Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    await loadDataAndInit();
}

let cachedTransactions = [];
let cachedTransfers = [];
let cachedAccounts = [];
let cachedCategories = [];
let activePeriodFilter = 'all'; // 'all', 'month', 'year'

async function loadDataAndInit() {
    const contentDiv = document.getElementById('movimientos-content');
    try {
        const [txRes, trRes, accRes, catRes] = await Promise.all([
            fetch('http://localhost:3000/api/transactions'),
            fetch('http://localhost:3000/api/transfers'),
            fetch('http://localhost:3000/api/accounts'),
            fetch('http://localhost:3000/api/categories')
        ]);

        if (!txRes.ok || !trRes.ok) throw new Error('Error al conectar con la API');

        cachedTransactions = await txRes.json();
        cachedTransfers = await trRes.json();
        cachedAccounts = await accRes.json();
        cachedCategories = await catRes.json();

        populateModalDropdowns();
        populateFilterDropdowns();
        setupFilterEvents();
        setupModalEvents();

        applyFiltersAndRender();

    } catch (error) {
        console.error('Error cargando movimientos:', error);
        contentDiv.innerHTML = `<p style="color: #ef4444;">No se pudieron cargar los movimientos: ${error.message}</p>`;
    }
}

function populateFilterDropdowns() {
    const accFilter = document.getElementById('filter-account');
    if (accFilter) {
        let accOpts = '<option value="">Todas las cuentas</option>';
        cachedAccounts.forEach(acc => {
            accOpts += `<option value="${acc.uid}">${acc.title || acc.name}</option>`;
        });
        accFilter.innerHTML = accOpts;
    }

    const catFilter = document.getElementById('filter-category');
    if (catFilter) {
        let catOpts = '<option value="">Todas las categorías</option>';
        // Mostrar primero padres e hijos ordenados
        const parents = cachedCategories.filter(c => !c.parent_uid);
        parents.forEach(p => {
            catOpts += `<option value="${p.uid}">📁 ${p.title}</option>`;
            const subs = cachedCategories.filter(c => c.parent_uid === p.uid);
            subs.forEach(s => {
                catOpts += `<option value="${s.uid}">&nbsp;&nbsp;&nbsp;&nbsp;↳ ${s.title}</option>`;
            });
        });
        catFilter.innerHTML = catOpts;
    }
}

function setupFilterEvents() {
    // Botones de periodo rápido
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => {
                b.style.background = 'rgba(255,255,255,0.05)';
                b.style.fontWeight = 'normal';
            });
            e.target.style.background = 'var(--accent)';
            e.target.style.fontWeight = '500';
            activePeriodFilter = e.target.dataset.period;
            applyFiltersAndRender();
        });
    });

    // Inputs y selects de filtrado avanzado
    ['filter-search', 'filter-type', 'filter-account', 'filter-category', 'filter-date-from', 'filter-date-to'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => applyFiltersAndRender());
            el.addEventListener('change', () => applyFiltersAndRender());
        }
    });
}

function applyFiltersAndRender() {
    const searchText = document.getElementById('filter-search')?.value.toLowerCase() || '';
    const typeFilter = document.getElementById('filter-type')?.value || '';
    const accountFilter = document.getElementById('filter-account')?.value || '';
    const categoryFilter = document.getElementById('filter-category')?.value || '';
    const dateFrom = document.getElementById('filter-date-from')?.value || '';
    const dateTo = document.getElementById('filter-date-to')?.value || '';

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    const combined = [
        ...cachedTransactions.map(t => ({ ...t, kind: 'TX' })),
        ...cachedTransfers.map(tr => ({ ...tr, kind: 'TR', date: tr.date }))
    ].filter(item => {
        const itemDateStr = item.date ? item.date.split('T')[0] : '';
        const itemDate = itemDateStr ? new Date(itemDateStr + 'T00:00:00') : null;

        // 1. Filtro por periodo rápido
        if (activePeriodFilter === 'month' && itemDate) {
            if (itemDate.getFullYear() !== currentYear || itemDate.getMonth() !== currentMonth) return false;
        }
        if (activePeriodFilter === 'year' && itemDate) {
            if (itemDate.getFullYear() !== currentYear) return false;
        }

        // 2. Filtro por Fechas Desde / Hasta
        if (dateFrom && itemDateStr < dateFrom) return false;
        if (dateTo && itemDateStr > dateTo) return false;

        // 3. Filtro por Tipo
        if (typeFilter) {
            if (typeFilter === 'TRANSFER') {
                if (item.kind !== 'TR') return false;
            } else {
                if (item.kind !== 'TX' || item.type !== typeFilter) return false;
            }
        }

        // 4. Filtro por Cuenta
        if (accountFilter) {
            if (item.kind === 'TX') {
                if (item.account_uid !== accountFilter) return false;
            } else {
                if (item.fromAccountUid !== accountFilter && item.toAccountUid !== accountFilter) return false;
            }
        }

        // 5. Filtro por Categoría (Solo aplica a TX)
        if (categoryFilter) {
            if (item.kind !== 'TR') {
                if (item.category_uid !== categoryFilter) {
                    // Verificar si la categoría seleccionada es padre y el item pertenece a una subcategoría suya
                    const cat = cachedCategories.find(c => c.uid === item.category_uid);
                    if (!cat || cat.parent_uid !== categoryFilter) return false;
                }
            } else {
                return false; // Las transferencias no tienen categoría directa
            }
        }

        // 6. Filtro por Texto Libre (comentarios o cuentas)
        if (searchText) {
            const comment = (item.comment || '').toLowerCase();
            const accFrom = (item.from_account_title || '').toLowerCase();
            const accTo = (item.to_account_title || '').toLowerCase();
            const accTx = (item.account_title || '').toLowerCase();
            if (!comment.includes(searchText) && !accFrom.includes(searchText) && !accTo.includes(searchText) && !accTx.includes(searchText)) {
                return false;
            }
        }

        return true;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    renderFilteredHistory(combined);
}

function renderFilteredHistory(combined) {
    const contentDiv = document.getElementById('movimientos-content');

    if (combined.length === 0) {
        contentDiv.innerHTML = `<p class="loading" style="padding: 2rem; text-align: center; color: var(--text-muted);">No se encontraron operaciones con los filtros seleccionados.</p>`;
        return;
    }

    const groupedByDate = combined.reduce((acc, item) => {
        const rawDate = item.date ? item.date.split('T')[0] : null;
        let dateKey = 'Sin fecha';
        let formattedTitle = 'Sin fecha';

        if (rawDate) {
            dateKey = rawDate; 
            const [year, month, day] = rawDate.split('-').map(Number);
            const dateObj = new Date(year, month - 1, day);

            formattedTitle = new Intl.DateTimeFormat('es-AR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            }).format(dateObj);

            formattedTitle = formattedTitle.replace(/^\w/, c => c.toUpperCase());
        }

        if (!acc[dateKey]) {
            acc[dateKey] = {
                title: formattedTitle,
                items: []
            };
        }
        acc[dateKey].items.push(item);
        return acc;
    }, {});

    let html = `<div style="display: flex; flex-direction: column; gap: 1.5rem; margin-top: 1rem;">`;

    Object.keys(groupedByDate).forEach(dateKey => {
        const groupData = groupedByDate[dateKey];
        const itemsForDay = groupData.items;

        html += `
            <div style="background: rgba(15, 23, 42, 0.4); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden;">
                <div style="background: rgba(59, 130, 246, 0.15); padding: 0.5rem 1rem; font-weight: bold; font-size: 0.9rem; color: var(--accent); border-bottom: 1px solid var(--border);">
                    📅 ${groupData.title}
                </div>
                
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead>
                        <tr style="border-bottom: 1px solid var(--border); color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase;">
                            <th style="padding: 0.5rem 0.75rem;">Tipo</th>
                            <th style="padding: 0.5rem 0.75rem;">Detalle / Cuentas</th>
                            <th style="padding: 0.5rem 0.75rem;">Categoría / Comentario</th>
                            <th style="padding: 0.5rem 0.75rem; text-align: right;">Monto</th>
                            <th style="padding: 0.5rem 0.75rem; text-align: center;">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        itemsForDay.forEach(item => {
            const commentText = item.comment || '-';

            if (item.kind === 'TX') {
                const isIncome = item.type === 'INCOME';
                const typeLabel = isIncome ? 'Ingreso' : 'Gasto';
                const typeColor = isIncome ? '#10b981' : '#ef4444';
                const amountPrefix = isIncome ? '+' : '-';
                const accountTitle = item.account_title || 'Cuenta general';
                const amountVal = item.amount || item.amountInAccountCurrency || 0;

                let catPathParts = [];
                if (item.category_uid && cachedCategories) {
                    const cat = cachedCategories.find(c => c.uid === item.category_uid);
                    if (cat) {
                        if (cat.parent_uid) {
                            const parentCat = cachedCategories.find(c => c.uid === cat.parent_uid);
                            if (parentCat) catPathParts.push(parentCat.title);
                            catPathParts.push(cat.title);
                        } else {
                            catPathParts.push(cat.title);
                        }
                    }
                }

                let catDisplay = catPathParts.join(' / ') || 'Sin categoría';
                const tagVal = item.tag_title || item.tag;
                const tagDisplay = tagVal ? ` [#${tagVal}]` : '';
                const fullCategoryPath = `${catDisplay}${tagDisplay}`;



                html += `
                    <tr style="border-bottom: 1px solid var(--border); font-size: 0.9rem;">
                        <td style="padding: 0.6rem 0.75rem; font-weight: 500; color: ${typeColor};">${typeLabel}</td>
                        <td style="padding: 0.6rem 0.75rem;">${accountTitle}</td>
                        <td style="padding: 0.6rem 0.75rem; color: var(--text-muted);">${fullCategoryPath} - ${commentText}</td>
                        <td style="padding: 0.6rem 0.75rem; text-align: right; font-weight: bold; color: ${typeColor};">
                            ${amountPrefix} $${Number(amountVal).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td style="padding: 0.6rem 0.75rem; text-align: center; display: flex; gap: 0.25rem; justify-content: center;">
                            <button onclick="window.openEditModal('${item.uid}', 'TX')" style="background: #3b82f6; color: white; border: none; padding: 0.2rem 0.4rem; border-radius: 4px; cursor: pointer; font-size: 0.7rem;">Editar</button>
                            <button onclick="window.deleteHistoryItem('${item.uid}', 'TX')" style="background: #ef4444; color: white; border: none; padding: 0.2rem 0.4rem; border-radius: 4px; cursor: pointer; font-size: 0.7rem;">Eliminar</button>
                        </td>
                    </tr>
                `;
            } else {
                html += `
                    <tr style="border-bottom: 1px solid var(--border); font-size: 0.9rem;">
                        <td style="padding: 0.6rem 0.75rem; font-weight: 500; color: #3b82f6;">Transferencia</td>
                        <td style="padding: 0.6rem 0.75rem;">${item.from_account_title} ➔ ${item.to_account_title}</td>
                        <td style="padding: 0.6rem 0.75rem; color: var(--text-muted);">${commentText}</td>
                        <td style="padding: 0.6rem 0.75rem; text-align: right; font-weight: bold; color: #3b82f6;">
                            $${Number(item.fromAmount || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td style="padding: 0.6rem 0.75rem; text-align: center; display: flex; gap: 0.25rem; justify-content: center;">
                            <button onclick="window.openEditModal('${item.uid}', 'TR')" style="background: #3b82f6; color: white; border: none; padding: 0.2rem 0.4rem; border-radius: 4px; cursor: pointer; font-size: 0.7rem;">Editar</button>
                            <button onclick="window.deleteHistoryItem('${item.uid}', 'TR')" style="background: #ef4444; color: white; border: none; padding: 0.2rem 0.4rem; border-radius: 4px; cursor: pointer; font-size: 0.7rem;">Eliminar</button>
                        </td>
                    </tr>
                `;
            }
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;
    });

    html += `</div>`;
    contentDiv.innerHTML = html;
}

function populateModalDropdowns() {
    const accSelect = document.getElementById('modal-account');
    const fromAccSelect = document.getElementById('modal-from-account');
    const toAccSelect = document.getElementById('modal-to-account');
    const parentCatSelect = document.getElementById('modal-parent-category');

    let accOptions = '<option value="">-- Seleccionar cuenta --</option>';
    cachedAccounts.forEach(acc => {
        accOptions += `<option value="${acc.uid}">${acc.title} (${acc.currencyCode})</option>`;
    });
    if (accSelect) accSelect.innerHTML = accOptions;
    if (fromAccSelect) fromAccSelect.innerHTML = accOptions;
    if (toAccSelect) toAccSelect.innerHTML = accOptions;

    const parents = cachedCategories.filter(c => !c.parent_uid);
    let catOptions = '<option value="">-- Sin categoría --</option>';
    parents.forEach(p => {
        catOptions += `<option value="${p.uid}">${p.title}</option>`;
    });
    if (parentCatSelect) parentCatSelect.innerHTML = catOptions;
}

function setupModalEvents() {
    const modal = document.getElementById('edit-modal');
    const closeBtn = document.getElementById('modal-close-btn');
    const form = document.getElementById('edit-modal-form');
    const typeSelector = document.getElementById('modal-type');
    const standardSection = document.getElementById('modal-section-standard');
    const transferSection = document.getElementById('modal-section-transfer');
    const parentCatSelect = document.getElementById('modal-parent-category');
    const subCatSelect = document.getElementById('modal-sub-category');

    if (closeBtn && modal) {
        closeBtn.onclick = () => { modal.style.display = 'none'; };
    }

    if (typeSelector) {
        typeSelector.onchange = (e) => {
            if (e.target.value === 'TRANSFER') {
                standardSection.style.display = 'none';
                transferSection.style.display = 'flex';
            } else {
                standardSection.style.display = 'flex';
                transferSection.style.display = 'none';
            }
        };
    }

    if (parentCatSelect) {
        parentCatSelect.onchange = (e) => {
            const parentUid = e.target.value;
            if (!parentUid) {
                subCatSelect.innerHTML = '<option value="">-- Sin subcategoría --</option>';
                return;
            }
            const subs = cachedCategories.filter(c => c.parent_uid === parentUid);
            let subOptions = '<option value="">-- Sin subcategoría --</option>';
            subs.forEach(s => { subOptions += `<option value="${s.uid}">${s.title}</option>`; });
            subCatSelect.innerHTML = subOptions;
        };
    }

    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const uid = document.getElementById('modal-uid').value;
            const type = typeSelector.value;
            const date = document.getElementById('modal-date').value;
            const comment = document.getElementById('modal-comment').value;

            try {
                if (type === 'TRANSFER') {
                    const fromAccountUid = document.getElementById('modal-from-account').value;
                    const toAccountUid = document.getElementById('modal-to-account').value;
                    const fromAmount = parseFloat(document.getElementById('modal-transfer-amount').value);
                    
                    const res = await fetch(`http://localhost:3000/api/transfers/${uid}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ fromAccountUid, toAccountUid, fromAmount, toAmount: fromAmount, date, comment })
                    });
                    if (!res.ok) throw new Error('Error al actualizar transferencia');
                } else {
                    const account_uid = document.getElementById('modal-account').value;
                    const parentCat = parentCatSelect.value;
                    const subCat = subCatSelect.value;
                    const category_uid = subCat ? subCat : (parentCat ? parentCat : null);
                    const amount = parseFloat(document.getElementById('modal-amount').value);

                    const res = await fetch(`http://localhost:3000/api/transactions/${uid}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type, account_uid, category_uid, amount, date, comment })
                    });
                    if (!res.ok) throw new Error('Error al actualizar movimiento');
                }

                modal.style.display = 'none';
                await loadDataAndInit();
            } catch (err) {
                alert('Error: ' + err.message);
            }
        };
    }
}

// Funciones Globales
window.openEditModal = function(uid, kind) {
    const modal = document.getElementById('edit-modal');
    const typeSelector = document.getElementById('modal-type');
    const standardSection = document.getElementById('modal-section-standard');
    const transferSection = document.getElementById('modal-section-transfer');

    if (kind === 'TX') {
        const tx = cachedTransactions.find(t => t.uid === uid);
        if (!tx) return;
        document.getElementById('modal-uid').value = tx.uid;
        document.getElementById('modal-kind').value = 'TX';
        typeSelector.value = tx.type;
        typeSelector.dispatchEvent(new Event('change'));
        document.getElementById('modal-account').value = tx.account_uid;
        document.getElementById('modal-amount').value = tx.amount || tx.amountInAccountCurrency || 0;
        document.getElementById('modal-date').value = tx.date ? tx.date.split('T')[0] : '';
        document.getElementById('modal-comment').value = tx.comment || '';

        if (tx.category_uid) {
            const cat = cachedCategories.find(c => c.uid === tx.category_uid);
            if (cat) {
                if (cat.parent_uid) {
                    document.getElementById('modal-parent-category').value = cat.parent_uid;
                    document.getElementById('modal-parent-category').dispatchEvent(new Event('change'));
                    document.getElementById('modal-sub-category').value = cat.uid;
                } else {
                    document.getElementById('modal-parent-category').value = cat.uid;
                }
            }
        }
        document.getElementById('modal-title').textContent = 'Editar Movimiento';
    } else {
        const tr = cachedTransfers.find(t => t.uid === uid);
        if (!tr) return;
        document.getElementById('modal-uid').value = tr.uid;
        document.getElementById('modal-kind').value = 'TR';
        typeSelector.value = 'TRANSFER';
        typeSelector.dispatchEvent(new Event('change'));
        document.getElementById('modal-from-account').value = tr.fromAccountUid;
        document.getElementById('modal-to-account').value = tr.toAccountUid;
        document.getElementById('modal-transfer-amount').value = tr.fromAmount || 0;
        document.getElementById('modal-date').value = tr.date ? tr.date.split('T')[0] : '';
        document.getElementById('modal-comment').value = tr.comment || '';
        document.getElementById('modal-title').textContent = 'Editar Transferencia';
    }
    modal.style.display = 'flex';
};

window.deleteHistoryItem = async function(uid, kind) {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return;
    try {
        const endpoint = kind === 'TX' ? `transactions/${uid}` : `transfers/${uid}`;
        const res = await fetch(`http://localhost:3000/api/${endpoint}`, { method: 'DELETE' });
        
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || 'Error al eliminar el registro en el servidor');
        }

        await loadDataAndInit();
        alert('Registro eliminado exitosamente.');
    } catch (err) {
        alert('Error: ' + err.message);
    }
};