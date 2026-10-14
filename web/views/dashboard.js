export async function render() {
    const container = document.getElementById('app-view');
    
    container.innerHTML = `
        <div class="view-card">
            <h2>Panel de Control (Dashboard)</h2>
            <p>Resumen general de saldos y estado financiero actual.</p>
            
            <div id="dashboard-content" class="loading">Cargando métricas del sistema...</div>
        </div>
    `;

    try {
        // Consultar cuentas y transacciones en paralelo
        const [accountsRes, transactionsRes] = await Promise.all([
            fetch('http://localhost:3000/api/accounts'),
            fetch('http://localhost:3000/api/transactions')
        ]);

        if (!accountsRes.ok || !transactionsRes.ok) {
            throw new Error('Error al conectar con los servicios del backend');
        }

        const accounts = await accountsRes.json();
        const transactions = await transactionsRes.json();

        // Calcular saldos totales por moneda (ARS y USD)
        let totalArs = 0;
        let totalUsd = 0;

        accounts.forEach(acc => {
            const balance = Number(acc.balance !== undefined ? acc.balance : (acc.balance_cents || 0));
            const currency = (acc.currency || acc.currencyCode || 'ARS').toUpperCase();
            
            if (currency === 'USD') {
                totalUsd += balance;
            } else {
                totalArs += balance;
            }
        });

        // Contar transacciones del mes o totales
        const totalTransactions = transactions.length;

        // Renderizar el Dashboard con datos reales
        const contentDiv = document.getElementById('dashboard-content');
        contentDiv.innerHTML = `
            <div class="metrics-grid">
                <div class="metric-box">
                    <h3>Saldo Total ARS</h3>
                    <p>$ ${totalArs.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div class="metric-box">
                    <h3>Saldo Total USD</h3>
                    <p>U$S ${totalUsd.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div class="metric-box">
                    <h3>Cuentas Activas</h3>
                    <p>${accounts.length}</p>
                </div>
                <div class="metric-box">
                    <h3>Movimientos Registrados</h3>
                    <p>${totalTransactions}</p>
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Error cargando el dashboard:', error);
        document.getElementById('dashboard-content').innerHTML = `
            <p style="color: #ef4444;">No se pudieron cargar las métricas: ${error.message}</p>
        `;
    }
}