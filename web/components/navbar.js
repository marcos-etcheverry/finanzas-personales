export function renderNavbar() {
    const navContainer = document.getElementById('app-nav');
    if (!navContainer) return;

    navContainer.innerHTML = `
        <nav style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; background: var(--card-bg, #1e293b); border-bottom: 1px solid var(--border);">
            <div style="display: flex; gap: 1.5rem; align-items: center;">
                <a href="#/" id="nav-home">Dashboard</a>
                <a href="#/movements" id="nav-movements">Movimientos</a>
                <a href="#/cuentas" id="nav-cuentas">Cuentas</a>
                <a href="#/categorias" id="nav-categorias">Categorías</a>
                <a href="#/movimientos" id="nav-movimientos">Detalle Movimientos</a>
                <a href="#/tarjetas" id="nav-tarjetas">Tarjetas</a> <!-- <-- Nuevo enlace -->
            </div>
            <div>
                <a href="#/settings" id="nav-settings" title="Configuración de Cotizaciones" style="font-size: 1.2rem; text-decoration: none; padding: 0.5rem; border-radius: 50%; display: inline-block;">
                    ⚙️
                </a>
            </div>
        </nav>
    `;

    const updateActiveLink = () => {
        const hash = window.location.hash || '#/';
        document.querySelectorAll('header nav a').forEach(a => {
            if (a.getAttribute('href') === hash) {
                a.classList.add('active');
            } else {
                a.classList.remove('active');
            }
        });
    };

    window.addEventListener('hashchange', updateActiveLink);
    updateActiveLink();
}