const routes = {
    '#/': () => import('../views/dashboard.js').then(m => m.render()),
    '#/cuentas': () => import('../views/cuentas.js').then(m => m.render()),
    '#/categorias': () => import('../views/categorias.js').then(m => m.render()),
    '#/movimientos': () => import('../views/movimientos.js').then(m => m.render()),
    '#/movements': () => import('../views/movements.js').then(m => m.render()),
    '#/settings': () => import('../views/settings.js').then(m => m.render()), 
    '#/tarjetas': () => import('../views/creditCards.js').then(m => m.render())
};

async function router() {
    const path = window.location.hash || '#/';
    const viewContainer = document.getElementById('app-view');
    
    const loadRoute = routes[path] || routes['#/'];
    
    try {
        viewContainer.innerHTML = '<div class="loading">Cargando módulo...</div>';
        await loadRoute();
    } catch (error) {
        viewContainer.innerHTML = `<p style="color: red;">Error al cargar la vista: ${error.message}</p>`;
    }
}


window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);