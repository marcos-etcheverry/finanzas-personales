export async function render() {
    const container = document.getElementById('app-view');
    
    container.innerHTML = `
        <div class="view-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <div>
                    <h2>Gestión de Tarjetas de Crédito</h2>
                    <p style="margin-bottom: 0;">Administra tarjetas, días de cierre, vencimiento, color e imágenes asociadas.</p>
                </div>
                <button id="btn-nueva-tarjeta" style="background-color: var(--accent); color: white; border: none; padding: 0.75rem 1.25rem; border-radius: var(--radius); cursor: pointer; font-weight: 500;">
                    + Nueva Tarjeta
                </button>
            </div>

            <!-- Formulario Desplegable de Creación / Edición de Tarjetas -->
            <div id="card-form-container" style="display: none; background-color: rgba(15, 23, 42, 0.8); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.5rem; margin-bottom: 1.5rem;">
                <h3 id="form-title" style="margin-bottom: 1rem; font-size: 1.1rem; color: var(--accent);">Crear Nueva Tarjeta</h3>
                <form id="card-form" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; align-items: end;">
                    <input type="hidden" id="card-id">
                    
                    <div>
                        <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.3rem;">Nombre Tarjeta</label>
                        <input type="text" id="card-name" required placeholder="Ej. Visa Galicia" style="width: 100%; padding: 0.6rem; background: var(--bg-primary); border: 1px solid var(--border); color: var(--text-main); border-radius: 6px;">
                    </div>

                    <div>
                        <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.3rem;">Día de Cierre</label>
                        <input type="number" id="card-closing" min="1" max="31" placeholder="Ej. 25" style="width: 100%; padding: 0.6rem; background: var(--bg-primary); border: 1px solid var(--border); color: var(--text-main); border-radius: 6px;">
                    </div>

                    <div>
                        <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.3rem;">Día de Vencimiento</label>
                        <input type="number" id="card-due" min="1" max="31" placeholder="Ej. 3" style="width: 100%; padding: 0.6rem; background: var(--bg-primary); border: 1px solid var(--border); color: var(--text-main); border-radius: 6px;">
                    </div>

                    <div>
                        <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.3rem;">Color Identificatorio</label>
                        <input type="color" id="card-color" value="#3b82f6" style="width: 100%; height: 38px; padding: 2px; background: var(--bg-primary); border: 1px solid var(--border); border-radius: 6px; cursor: pointer;">
                    </div>

                    <div>
                        <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.3rem;">Logotipo de la Tarjeta</label>
                        <input type="file" id="card-image-file" accept="image/*" style="width: 100%; padding: 0.4rem; background: var(--bg-primary); border: 1px solid var(--border); color: var(--text-main); border-radius: 6px;">
                    </div>

                    <div style="grid-column: 1 / -1; display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 0.5rem;">
                        <button type="button" id="btn-cancelar" style="background-color: #475569; color: white; border: none; padding: 0.6rem 1rem; border-radius: 6px; cursor: pointer;">Cancelar</button>
                        <button type="submit" id="btn-submit-card" style="background-color: #10b981; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 6px; cursor: pointer; font-weight: 500;">Guardar Tarjeta</button>
                    </div>
                </form>
            </div>
            
            <!-- Listado de Tarjetas con diseño unificado (metrics-grid) -->
            <div id="cards-content">
                <p class="loading">Cargando tarjetas desde el servidor...</p>
            </div>

            <hr style="border-color: var(--border); opacity: 0.3; margin: 2rem 0;">

            <!-- SECCIÓN 2: PROYECCIÓN DE CUOTAS FUTURAS -->
            <div>
                <h2>Proyección de Cuotas Futuras</h2>
                <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;">
                    Compromiso financiero desglosado mes a mes por compras en cuotas.
                </p>
                <div id="projections-container" style="display: flex; flex-direction: column; gap: 1rem;">
                    <p style="text-align: center; color: var(--text-muted);">Cargando proyecciones...</p>
                </div>
            </div>
        </div>
    `;

    await loadCards();
    await loadProjections();
    configurarEventosTarjetas();
}

async function loadCards() {
    const contentDiv = document.getElementById('cards-content');
    try {
        const res = await fetch('http://localhost:3000/api/credit-cards');
        if (!res.ok) throw new Error('Error al cargar tarjetas');
        const creditCards = await res.json();

        if (creditCards.length === 0) {
            contentDiv.innerHTML = `<p class="loading">No hay tarjetas registradas todavía.</p>`;
            return;
        }

        let html = `<div class="metrics-grid">`;
        creditCards.forEach((card, index) => {
            const cardId = card.id || card.uid;
            const cardName = card.name || card.title || 'Tarjeta sin nombre';
            const closing = card.closing_day || 'N/A';
            const due = card.due_day || 'N/A';
            const cardColor = card.color || '#3b82f6';
            const cardIcon = card.icon || '';
            const cardPosition = card.position !== undefined ? card.position : index + 1;
            
            let iconHtml = `<span style="font-size: 1.2rem;">💳</span>`;
            if (cardIcon && cardIcon.startsWith('uploads/')) {
                iconHtml = `<img src="http://localhost:3000/${cardIcon}" style="width: 28px; height: 28px; object-fit: cover; border-radius: 6px;" alt="Logo">`;
            }

            html += `
                <div class="metric-box" style="border-left: 4px solid ${cardColor}; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem;">
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                ${iconHtml}
                                <span style="font-size: 0.75rem; background: rgba(255,255,255,0.08); padding: 0.1rem 0.4rem; border-radius: 4px; color: var(--text-muted);">
                                    Orden: #${cardPosition}
                                </span>
                            </div>
                        </div>
                        <h3>${cardName}</h3>
                        <p style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-muted);">
                            Cierre: Día ${closing} | Venc.: Día ${due}
                        </p>
                    </div>
                    <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                        <button class="btn-editar-tarjeta" data-id="${cardId}" data-name="${cardName}" data-closing="${closing !== 'N/A' ? closing : ''}" data-due="${due !== 'N/A' ? due : ''}" data-color="${cardColor}" style="background: var(--accent); color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">Editar</button>
                        <button class="btn-eliminar-tarjeta" data-id="${cardId}" style="background: #ef4444; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">Eliminar</button>
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

function configurarEventosTarjetas() {
    const formContainer = document.getElementById('card-form-container');
    const btnNueva = document.getElementById('btn-nueva-tarjeta');
    const btnCancelar = document.getElementById('btn-cancelar');
    const form = document.getElementById('card-form');

    btnNueva.addEventListener('click', () => {
        document.getElementById('form-title').innerText = 'Crear Nueva Tarjeta';
        document.getElementById('card-id').value = '';
        document.getElementById('card-name').value = '';
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
                    currency: 'ARS',
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
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    });
}

function vincularAccionesTarjetas() {
    // Editar Tarjeta
    document.querySelectorAll('.btn-editar-tarjeta').forEach(btn => {
        btn.addEventListener('click', () => {
            const { id, name, closing, due, color } = btn.dataset;
            document.getElementById('form-title').innerText = `Editar Tarjeta: ${name}`;
            document.getElementById('card-id').value = id;
            document.getElementById('card-name').value = name;
            document.getElementById('card-closing').value = closing !== 'N/A' ? closing : '';
            document.getElementById('card-due').value = due !== 'N/A' ? due : '';
            document.getElementById('card-color').value = color || '#3b82f6';
            document.getElementById('card-image-file').value = '';
            
            document.getElementById('btn-submit-card').innerText = 'Actualizar Tarjeta';
            document.getElementById('card-form-container').style.display = 'block';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    // Eliminar Tarjeta
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
            } catch (err) {
                alert(`No se pudo eliminar: ${err.message}`);
            }
        });
    });
}

async function loadProjections() {
    const wrapper = document.getElementById('projections-container');
    try {
        const res = await fetch('http://localhost:3000/api/credit-cards/projections');
        if (!res.ok) throw new Error('Error al obtener proyecciones');
        const rows = await res.json();

        if (rows.length === 0) {
            wrapper.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem;">No tienes compras en cuotas pendientes.</p>`;
            return;
        }

        let html = `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">`;
        rows.forEach(row => {
            const formattedAmount = Number(row.total_due).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
            html += `
                <div style="background: rgba(15, 23, 42, 0.6); padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius);">
                    <span style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: bold;">${row.month}</span>
                    <div style="font-size: 1.3rem; font-weight: bold; color: var(--accent); margin: 0.3rem 0;">${formattedAmount}</div>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">${row.pending_installments} cuota(s) pendiente(s)</span>
                </div>
            `;
        });
        html += `</div>`;
        wrapper.innerHTML = html;
    } catch (err) {
        console.error('Error cargando proyecciones:', err);
    }
}