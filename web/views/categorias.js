export async function render() {
    const container = document.getElementById('app-view');
    
    container.innerHTML = `
        <div class="view-card">
            <h2>Gestión de Categorías y Subcategorías</h2>
            <p>Estructura de clasificación para tus gastos e ingresos.</p>
            
            <!-- Botón para abrir formulario de creación -->
            <div style="margin: 1.5rem 0;">
                <button id="btn-new-category" style="background-color: var(--accent); color: white; border: none; padding: 0.6rem 1.2rem; border-radius: var(--radius); cursor: pointer; font-weight: bold;">
                    + Nueva Categoría / Subcategoría
                </button>
            </div>

            <!-- Formulario oculto/modal de alta o edición -->
            <div id="category-form-container" style="display: none; background: rgba(15, 23, 42, 0.8); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.5rem; margin-bottom: 1.5rem;">
                <h3 id="form-title" style="margin-bottom: 1rem; color: var(--text);">Crear Categoría</h3>
                <form id="category-form" style="display: flex; flex-direction: column; gap: 1rem;">
                    <input type="hidden" id="cat-uid" value="">
                    
                    <div>
                        <label style="display: block; font-size: 0.85rem; margin-bottom: 0.3rem;">Nombre:</label>
                        <input type="text" id="cat-title" required style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                    </div>

                    <div>
                        <label style="display: block; font-size: 0.85rem; margin-bottom: 0.3rem;">Tipo:</label>
                        <select id="cat-type" style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                            <option value="expense">Gasto</option>
                            <option value="income">Ingreso</option>
                        </select>
                    </div>

                    <div>
                        <label style="display: block; font-size: 0.85rem; margin-bottom: 0.3rem;">Categoría Padre (Dejar vacío si es principal):</label>
                        <select id="cat-parent" style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
                            <option value="">-- Ninguna (Categoría Principal) --</option>
                        </select>
                    </div>

                    <div>
                        <label style="display: block; font-size: 0.85rem; margin-bottom: 0.3rem;">Color (Hex):</label>
                        <input type="color" id="cat-color" value="#3b82f6" style="width: 100%; height: 40px; border-radius: 4px; border: 1px solid var(--border); background: var(--bg); cursor: pointer;">
                    </div>

                    <div>
                        <label style="display: block; font-size: 0.85rem; margin-bottom: 0.3rem;">Imagen / Icono (opcional):</label>
                        <input type="file" id="cat-image" accept="image/*" style="width: 100%; padding: 0.4rem; color: var(--text);">
                    </div>

                    <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
                        <button type="submit" style="background-color: #10b981; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; font-weight: bold;">Guardar</button>
                        <button type="button" id="btn-cancel-form" style="background-color: #64748b; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">Cancelar</button>
                    </div>
                </form>
            </div>
            
            <div id="categorias-content" class="loading">Cargando categorías desde el servidor...</div>
        </div>
    `;

    await loadAndRenderCategories();
}
// Función auxiliar para renderizar el icono o imagen de la categoría
function renderCategoryIcon(icon) {
    if (!icon) return '📁'; // Icono por defecto si no tiene nada
    
    // Si es una URL, ruta local o archivo de imagen
    if (icon.startsWith('http') || icon.startsWith('/') || icon.includes('.')) {
        return `<img src="${icon}" alt="icono" style="width: 18px; height: 18px; object-fit: contain; vertical-align: middle; margin-right: 6px; border-radius: 4px;" />`;
    }
    
    // Si es un emoji o texto directo
    return `<span style="margin-right: 6px; font-size: 1.1rem; vertical-align: middle;">${icon}</span>`;
}

async function loadAndRenderCategories() {
    const contentDiv = document.getElementById('categorias-content');
    contentDiv.innerHTML = `<p class="loading">Cargando categorías...</p>`;

    try {
        const response = await fetch('http://localhost:3000/api/categories');
        if (!response.ok) throw new Error('Error al conectar con la API de categorías');
        
        const categories = await response.json();

        // Actualizar select de padres en el formulario
        updateParentDropdown(categories);

        if (categories.length === 0) {
            contentDiv.innerHTML = `<p class="loading">No hay categorías registradas todavía.</p>`;
            setupFormEvents(categories);
            return;
        }

        const parentCategories = categories.filter(c => !c.parent_uid);
        const subCategories = categories.filter(c => c.parent_uid);

        let html = `<div style="display: flex; flex-direction: column; gap: 1rem;">`;

        parentCategories.forEach(parent => {
            const subs = subCategories.filter(s => s.parent_uid === parent.uid);
            const badgeType = parent.type === 'income' 
                ? '<span style="color: #10b981; font-size: 0.8rem; border: 1px solid #10b981; padding: 0.1rem 0.4rem; border-radius: 4px;">Ingreso</span>' 
                : '<span style="color: #ef4444; font-size: 0.8rem; border: 1px solid #ef4444; padding: 0.1rem 0.4rem; border-radius: 4px;">Gasto</span>';
            
            html += `
                <div style="background-color: rgba(15, 23, 42, 0.6); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.25rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            ${parent.color ? `<span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background-color: ${parent.color};"></span>` : ''}
             <h3 style="color: var(--accent); font-size: 1.1rem; margin: 0; display: flex; align-items: center;">${renderCategoryIcon(parent.icon)} ${parent.title}</h3>
                            ${badgeType}
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn-edit" data-uid="${parent.uid}" style="background: #3b82f6; color: white; border: none; padding: 0.3rem 0.6rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">Editar</button>
                            <button class="btn-delete" data-uid="${parent.uid}" style="background: #ef4444; color: white; border: none; padding: 0.3rem 0.6rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">Eliminar</button>
                        </div>
                    </div>
            `;

            if (subs.length > 0) {
                html += `<ul style="list-style-type: none; padding-left: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.75rem; border-left: 2px solid var(--border);">`;
                subs.forEach(sub => {
                    html += `
                        <li style="display: flex; justify-content: space-between; align-items: center; color: var(--text-muted); font-size: 0.95rem;">
                            <span style="display: flex; align-items: center;">└─ ${renderCategoryIcon(sub.icon)} ${sub.title}</span>
                            <div style="display: flex; gap: 0.4rem;">
                                <button class="btn-edit" data-uid="${sub.uid}" style="background: #3b82f6; color: white; border: none; padding: 0.2rem 0.5rem; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">Editar</button>
                                <button class="btn-delete" data-uid="${sub.uid}" style="background: #ef4444; color: white; border: none; padding: 0.2rem 0.5rem; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">Eliminar</button>
                            </div>
                        </li>
                    `;
                });
                html += `</ul>`;
            } else {
                html += `<p style="color: var(--text-muted); font-size: 0.85rem; font-style: italic; margin-top: 0.4rem;">Sin subcategorías</p>`;
            }

            html += `</div>`;
        });

        html += `</div>`;
        contentDiv.innerHTML = html;

        setupFormEvents(categories);
        setupActionButtons(categories);

    } catch (error) {
        console.error('Error cargando categorías:', error);
        contentDiv.innerHTML = `<p style="color: #ef4444;">No se pudieron cargar las categorías: ${error.message}</p>`;
    }
}

function updateParentDropdown(categories) {
    const parentSelect = document.getElementById('cat-parent');
    if (!parentSelect) return;

    const parents = categories.filter(c => !c.parent_uid);
    let options = `<option value="">-- Ninguna (Categoría Principal) --</option>`;
    parents.forEach(p => {
        options += `<option value="${p.uid}">${p.title}</option>`;
    });
    parentSelect.innerHTML = options;
}

function setupFormEvents(categories) {
    const formContainer = document.getElementById('category-form-container');
    const btnNew = document.getElementById('btn-new-category');
    const btnCancel = document.getElementById('btn-cancel-form');
    const form = document.getElementById('category-form');
    const formTitle = document.getElementById('form-title');

    btnNew.onclick = () => {
        form.reset();
        document.getElementById('cat-uid').value = '';
        formTitle.textContent = 'Crear Categoría o Subcategoría';
        formContainer.style.display = 'block';
    };

    btnCancel.onclick = () => {
        formContainer.style.display = 'none';
    };

    form.onsubmit = async (e) => {
        e.preventDefault();
        const uid = document.getElementById('cat-uid').value;
        const title = document.getElementById('cat-title').value;
        const type = document.getElementById('cat-type').value;
        const parent_uid = document.getElementById('cat-parent').value;
        const color = document.getElementById('cat-color').value;
        const imageInput = document.getElementById('cat-image');

        let imageBase64 = null;
        let imageName = null;

        if (imageInput.files && imageInput.files[0]) {
            const file = imageInput.files[0];
            imageName = file.name;
            imageBase64 = await toBase64(file);
        }

        const payload = { title, type, parent_uid, color, imageBase64, imageName };

        const url = uid ? `http://localhost:3000/api/categories/${uid}` : 'http://localhost:3000/api/categories';
        const method = uid ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Error al guardar la categoría');

            formContainer.style.display = 'none';
            await loadAndRenderCategories();
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };
}

function setupActionButtons(categories) {
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.onclick = () => {
            const uid = btn.getAttribute('data-uid');
            const cat = categories.find(c => c.uid === uid);
            if (!cat) return;

            document.getElementById('cat-uid').value = cat.uid;
            document.getElementById('cat-title').value = cat.title;
            document.getElementById('cat-type').value = cat.type || 'expense';
            document.getElementById('cat-parent').value = cat.parent_uid || '';
            document.getElementById('cat-color').value = cat.color || '#3b82f6';
            
            document.getElementById('form-title').textContent = `Editar: ${cat.title}`;
            document.getElementById('category-form-container').style.display = 'block';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.onclick = async () => {
            const uid = btn.getAttribute('data-uid');
            if (!confirm('¿Estás seguro de eliminar esta categoría?')) return;

            try {
                const res = await fetch(`http://localhost:3000/api/categories/${uid}`, {
                    method: 'DELETE'
                });
                if (!res.ok) throw new Error('Error al eliminar');

                await loadAndRenderCategories();
            } catch (err) {
                alert('Error al eliminar: ' + err.message);
            }
        };
    });
}

function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}