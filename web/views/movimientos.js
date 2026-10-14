export async function render() {
    const container = document.getElementById('app-view');
    
    container.innerHTML = `
        <div class="view-card">
            <h2>Historial de Movimientos</h2>
            <p>Registro detallado de tus gastos e ingresos recientes.</p>
            
            <div id="movimientos-content" class="loading">Cargando movimientos desde el servidor...</div>
        </div>
    `;

    try {
        const response = await fetch('http://localhost:3000/api/transactions');
        if (!response.ok) throw new Error('Error al conectar con la API de transacciones');
        
        const transactions = await response.json();
        const contentDiv = document.getElementById('movimientos-content');

        if (transactions.length === 0) {
            contentDiv.innerHTML = `<p class="loading">No hay movimientos registrados todavía.</p>`;
            return;
        }

        // Construir una tabla moderna y limpia para listar las transacciones
        let html = `
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: left; margin-top: 1rem;">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--border); color: var(--text-muted); font-size: 0.85rem; text-transform: uppercase;">
                            <th style="padding: 0.75rem;">Fecha</th>
                            <th style="padding: 0.75rem;">Tipo</th>
                            <th style="padding: 0.75rem;">Cuenta</th>
                            <th style="padding: 0.75rem;">Categoría</th>
                            <th style="padding: 0.75rem;">Comentario</th>
                            <th style="padding: 0.75rem; text-align: right;">Monto</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        transactions.forEach(tx => {
            const isIncome = tx.type === 'INCOME';
            const typeLabel = isIncome ? 'Ingreso' : 'Gasto';
            const typeColor = isIncome ? '#10b981' : '#ef4444'; // Verde para ingresos, rojo para gastos
            const amountPrefix = isIncome ? '+' : '-';
            
            // Formatear la fecha corta
            const fechaFormateada = tx.date ? tx.date.split('T')[0] : '-';
            const commentText = tx.comment || tx.description || '-';
            const accountTitle = tx.account_title || 'Cuenta general';
            const categoryTitle = tx.category_title || 'Sin categoría';

            html += `
                <tr style="border-bottom: 1px solid var(--border); font-size: 0.95rem;">
                    <td style="padding: 0.75rem; color: var(--text-muted);">${fechaFormateada}</td>
                    <td style="padding: 0.75rem; font-weight: 500; color: ${typeColor};">${typeLabel}</td>
                    <td style="padding: 0.75rem;">${accountTitle}</td>
                    <td style="padding: 0.75rem; color: var(--text-muted);">${categoryTitle}</td>
                    <td style="padding: 0.75rem;">${commentText}</td>
                    <td style="padding: 0.75rem; text-align: right; font-weight: bold; color: ${typeColor};">
                        ${amountPrefix} $${Number(tx.amount || tx.amountInAccountCurrency || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;

        contentDiv.innerHTML = html;

    } catch (error) {
        console.error('Error cargando movimientos:', error);
        document.getElementById('movimientos-content').innerHTML = `
            <p style="color: #ef4444;">No se pudieron cargar los movimientos: ${error.message}</p>
        `;
    }
}