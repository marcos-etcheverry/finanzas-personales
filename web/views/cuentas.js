export async function render() {
    const container = document.getElementById('app-view');
    
    container.innerHTML = `
        <div class="view-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <div>
                    <h2>Gestión de Cuentas y Saldos</h2>
                    <p style="margin-bottom: 0;">Controla tus cuentas bancarias, efectivo y activos.</p>
                </div>
                <button id="btn-nueva-cuenta" style="background-color: var(--accent); color: white; border: none; padding: 0.75rem 1.25rem; border-radius: var(--radius); cursor: pointer; font-weight: 500;">
                    + Nueva Cuenta
                </button>
            </div>

            <!-- Formulario de Creación / Edición Enriquecido -->
            <div id="account-form-container" style="display: none; background-color: rgba(15, 23, 42, 0.8); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.5rem; margin-bottom: 1.5rem;">
                <h3 id="form-title" style="margin-bottom: 1rem; font-size: 1.1rem; color: var(--accent);">Crear Nueva Cuenta</h3>
                <form id="account-form" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; align-items: end;">
                    <input type="hidden" id="account-id">
                    
                    <div>
                        <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.3rem;">Nombre de la Cuenta</label>
                        <input type="text" id="account-name" required placeholder="Ej. Efectivo ARS" style="width: 100%; padding: 0.6rem; background: var(--bg-primary); border: 1px solid var(--border); color: var(--text-main); border-radius: 6px;">
                    </div>

                    <div>
                        <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.3rem;">Moneda</label>
                        <select id="account-currency" style="width: 100%; padding: 0.6rem; background: var(--bg-primary); border: 1px solid var(--border); color: var(--text-main); border-radius: 6px;">
                            <option value="ARS">ARS ($)</option>
                            <option value="USD">USD (U$S)</option>
                        </select>
                    </div>

                    <div>
                        <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.3rem;">Saldo Inicial</label>
                        <input type="number" id="account-balance" step="0.01" required value="0" style="width: 100%; padding: 0.6rem; background: var(--bg-primary); border: 1px solid var(--border); color: var(--text-main); border-radius: 6px;">
                    </div>

                    <div>
                        <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.3rem;">Color Identificatorio</label>
                        <input type="color" id="account-color" value="#3b82f6" style="width: 100%; height: 38px; padding: 2px; background: var(--bg-primary); border: 1px solid var(--border); border-radius: 6px; cursor: pointer;">
                    </div>

                    <div>
                        <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.3rem;">Logotipo de la Cuenta (Imagen)</label>
                        <input type="file" id="account-image-file" accept="image/*" style="width: 100%; padding: 0.4rem; background: var(--bg-primary); border: 1px solid var(--border); color: var(--text-main); border-radius: 6px;">
                    </div>

                    <div style="display: flex; align-items: center; gap: 0.5rem; height: 100%; padding-top: 1.2rem;">
                        <input type="checkbox" id="account-include-balance" checked style="width: 18px; height: 18px; accent-color: var(--accent);">
                        <label for="account-include-balance" style="font-size: 0.85rem; color: var(--text-main); cursor: pointer;">Incluir en balance total</label>
                    </div>

                    <div style="grid-column: 1 / -1; display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 0.5rem;">
                        <button type="button" id="btn-cancelar" style="background-color: #475569; color: white; border: none; padding: 0.6rem 1rem; border-radius: 6px; cursor: pointer;">Cancelar</button>
                        <button type="submit" style="background-color: #10b981; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 6px; cursor: pointer; font-weight: 500;">Guardar Cuenta</button>
                    </div>
                </form>
            </div>
            
            <div id="cuentas-content" class="loading">Cargando cuentas desde el servidor...</div>
        </div>
    `;

    await cargarCuentas();
    configurarEventosABM();
}

async function cargarCuentas() {
    const contentDiv = document.getElementById('cuentas-content');
    try {
        const response = await fetch('http://localhost:3000/api/accounts');
        if (!response.ok) throw new Error('Error al conectar con la API de cuentas');
        
        const accounts = await response.json();

        if (accounts.length === 0) {
            contentDiv.innerHTML = `<p class="loading">No hay cuentas registradas todavía.</p>`;
            return;
        }

        // Ordenar por posición si existe
        accounts.sort((a, b) => (a.position || 0) - (b.position || 0));

        let html = `
            <div style="background: rgba(15, 23, 42, 0.4); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; margin-top: 1rem;">
                <div style="display: flex; flex-direction: column;">
        `;

        accounts.forEach((acc, index) => {
            const currencySymbol = acc.currency === 'USD' ? 'U$S' : '$';
            const balanceValue = acc.balance !== undefined ? acc.balance : (acc.balance_cents || 0);
            const accountId = acc.id || acc.uid;
            const accountName = acc.name || acc.title;
            const accountCurrency = acc.currency || acc.currencyCode;
            const accountColor = acc.color || '#3b82f6';
            const accountIcon = acc.icon || '';
            const includeBalance = acc.include_in_balance !== 0;
            const accountPosition = acc.position !== undefined ? acc.position : index + 1;
            const accountType = acc.type || 'cash'; // Determinamos el tipo correcto
            
            let iconHtml = `<span style="font-size: 1.2rem;">💼</span>`;
            if (accountIcon && accountIcon.startsWith('uploads/')) {
                iconHtml = `<img src="http://localhost:3000/${accountIcon}" style="width: 70px; height: 50px; object-fit: cover; border-radius: 6px;" alt="Logo">`;
            }

            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.85rem 1.25rem; border-bottom: 1px solid var(--border); border-left: 4px solid ${accountColor}; background: rgba(15, 23, 42, 0.2); transition: background 0.2s;" onmouseover="this.style.background='rgba(59, 130, 246, 0.08)'" onmouseout="this.style.background='rgba(15, 23, 42, 0.2)'">
                    
                    <!-- Izquierda: Icono, Nombre, Moneda y Estado -->
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                            ${iconHtml}
                        </div>
                        <div>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <span style="font-weight: bold; font-size: 1rem; color: var(--text-main);">${accountName}</span>
                                <span style="font-size: 0.75rem; background: rgba(255,255,255,0.08); padding: 0.1rem 0.4rem; border-radius: 4px; color: var(--text-muted);">
                                    ${accountCurrency}
                                </span>
                                ${includeBalance ? '' : '<span style="font-size: 0.7rem; color: #f59e0b; background: rgba(245, 158, 11, 0.1); padding: 0.1rem 0.3rem; border-radius: 4px;">Excluida del balance</span>'}
                            </div>
                            <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.1rem;">
                                Orden: #${accountPosition} • Tipo: ${accountType}
                            </div>
                        </div>
                    </div>

                    <!-- Derecha: Saldo y Botones de Control / Acciones -->
                    <div style="display: flex; align-items: center; gap: 1.5rem;">
                        <div style="text-align: right;">
                            <span style="font-size: 1.05rem; font-weight: bold; color: var(--text-main);">
                                ${currencySymbol} ${Number(balanceValue).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </span>
                        </div>

                        <div style="display: flex; align-items: center; gap: 0.35rem;">
                            <!-- Botones de Reordenamiento Rápido -->
                            <button class="btn-subir" data-id="${accountId}" data-pos="${accountPosition}" title="Subir" style="background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: white; cursor: pointer; padding: 0.3rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">▲</button>
                            <button class="btn-bajar" data-id="${accountId}" data-pos="${accountPosition}" title="Bajar" style="background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: white; cursor: pointer; padding: 0.3rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">▼</button>
                            
                            <div style="width: 1px; height: 20px; background: var(--border); margin: 0 0.25rem;"></div>

                            <!-- Botones de ABM (con data-type inyectado) -->
                            <button class="btn-editar" data-id="${accountId}" data-type="${accountType}" data-name="${accountName}" data-currency="${accountCurrency}" data-balance="${balanceValue}" data-color="${accountColor}" data-include="${includeBalance ? 1 : 0}" data-position="${accountPosition}" style="background: #3b82f6; color: white; border: none; padding: 0.4rem 0.7rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem; font-weight: 500;">Editar</button>
                            <button class="btn-eliminar" data-id="${accountId}" style="background: #ef4444; color: white; border: none; padding: 0.4rem 0.7rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem; font-weight: 500;">Eliminar</button>
                        </div>
                    </div>

                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;

        contentDiv.innerHTML = html;
        vincularAccionesABM();

    } catch (error) {
        console.error('Error cargando cuentas:', error);
        contentDiv.innerHTML = `<p style="color: #ef4444;">No se pudieron cargar las cuentas: ${error.message}</p>`;
    }
}

function configurarEventosABM() {
    const formContainer = document.getElementById('account-form-container');
    const btnNueva = document.getElementById('btn-nueva-cuenta');
    const btnCancelar = document.getElementById('btn-cancelar');
    const form = document.getElementById('account-form');

    btnNueva.addEventListener('click', () => {
        document.getElementById('form-title').innerText = 'Crear Nueva Cuenta';
        document.getElementById('account-id').value = '';
        document.getElementById('account-name').value = '';
        document.getElementById('account-currency').value = 'ARS';
        document.getElementById('account-balance').value = '0';
        document.getElementById('account-color').value = '#3b82f6';
        document.getElementById('account-image-file').value = '';
        document.getElementById('account-include-balance').checked = true;
        formContainer.style.display = 'block';
    });

    btnCancelar.addEventListener('click', () => {
        formContainer.style.display = 'none';
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('account-id').value;
        const name = document.getElementById('account-name').value;
        const currency = document.getElementById('account-currency').value;
        const balance = Number(document.getElementById('account-balance').value);
        const color = document.getElementById('account-color').value;
        const include_in_balance = document.getElementById('account-include-balance').checked ? 1 : 0;
        
        const fileInput = document.getElementById('account-image-file');
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
                body: JSON.stringify({ name, type: 'cash', currency, balance, color, include_in_balance, imageBase64, imageName })
            });

            if (!res.ok) throw new Error('Error al guardar la cuenta');

            formContainer.style.display = 'none';
            await cargarCuentas();
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    });
}

function vincularAccionesABM() {
    // 1. Vincular botones de editar con discriminación de tipo
    document.querySelectorAll('.btn-editar').forEach(btn => {
        btn.addEventListener('click', () => {
            const { id, name, currency, balance, color, include, type, position } = btn.dataset;
            
            // Verificamos si es una tarjeta de crédito o una cuenta normal
            if (type === 'credit_card' || type === 'TARJETA') {
                // Redirigir a la sección de tarjetas de crédito
                window.location.hash = `#/tarjetas?edit=${id}`;
            } else {
                // Abrir el formulario estándar de edición de cuentas
                document.getElementById('form-title').innerText = `Editar Cuenta: ${name}`;
                document.getElementById('account-id').value = id;
                document.getElementById('account-name').value = name;
                document.getElementById('account-currency').value = currency;
                document.getElementById('account-balance').value = balance;
                document.getElementById('account-color').value = color || '#3b82f6';
                document.getElementById('account-include-balance').checked = include === '1';
                document.getElementById('account-form-container').style.display = 'block';
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });

    // 2. Vincular botones de eliminar
    document.querySelectorAll('.btn-eliminar').forEach(btn => {
        btn.addEventListener('click', async () => {
            const accountId = btn.dataset.id;

            if (!confirm('¿Estás seguro de que deseas eliminar esta cuenta?')) {
                return;
            }

            try {
                const res = await fetch(`http://localhost:3000/api/accounts/${accountId}`, {
                    method: 'DELETE'
                });

                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.error || 'Error al eliminar la cuenta');
                }

                await cargarCuentas();
            } catch (err) {
                alert(`No se pudo eliminar: ${err.message}`);
            }
        });
    });

    // 3. Vincular botones de ordenar (Subir / Bajar)
    document.querySelectorAll('.btn-subir, .btn-bajar').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const currentPos = parseInt(btn.dataset.pos);
            const delta = btn.classList.contains('btn-subir') ? -1 : 1;
            const newPos = Math.max(1, currentPos + delta);

            if (newPos === currentPos) return;

            try {
                const putRes = await fetch(`http://localhost:3000/api/accounts/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ position: newPos })
                });

                if (!putRes.ok) {
                    const errData = await putRes.json();
                    throw new Error(errData.error || 'Falló la actualización de orden');
                }

                await cargarCuentas();
            } catch (err) {
                alert(`Error al reordenar: ${err.message}`);
            }
        });
    });
}