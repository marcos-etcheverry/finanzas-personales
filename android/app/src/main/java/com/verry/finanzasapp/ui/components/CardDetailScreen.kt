package com.verry.finanzasapp.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.verry.finanzasapp.network.AccountDto
import com.verry.finanzasapp.network.CreditCardDetailDto
import com.verry.finanzasapp.network.CreditCardProjectionDto
import com.verry.finanzasapp.network.NetworkModule
import com.verry.finanzasapp.network.TransferRequest
import com.verry.finanzasapp.network.SettleRequest
import kotlinx.coroutines.launch
import java.time.LocalDate

@Composable
fun CardDetailScreen(
    card: AccountDto,
    onBackClick: () -> Unit,
    isPrivacyActive: Boolean,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val maskValue = if (isPrivacyActive) "••••••••" else null

    var projections by remember { mutableStateOf<List<CreditCardProjectionDto>>(emptyList()) }
    var selectedMonthDetails by remember { mutableStateOf<List<CreditCardDetailDto>>(emptyList()) }
    var activeInstallments by remember { mutableStateOf<List<CreditCardDetailDto>>(emptyList()) }
    var selectedMonthTitle by remember { mutableStateOf<String?>(null) }
    var isLoadingDetails by remember { mutableStateOf(false) }
    var isLoadingProjections by remember { mutableStateOf(true) }

    // Estados para el diálogo de pago de resumen (idéntico a la web)
    var showPayDialog by remember { mutableStateOf(false) }
    var availableAccounts by remember { mutableStateOf<List<AccountDto>>(emptyList()) }
    var selectedSourceAccount by remember { mutableStateOf<AccountDto?>(null) }
    var paymentStatusMessage by remember { mutableStateOf("") }
    var isPaying by remember { mutableStateOf(false) }
    var paymentDate by remember { mutableStateOf(LocalDate.now().toString()) }
    var expandedAccountDropdown by remember { mutableStateOf(false) }

    // Cargar proyecciones y planes vigentes de la tarjeta desde el backend
    LaunchedEffect(card.uid) {
        isLoadingProjections = true
        try {
            val apiService = NetworkModule.provideApiService(context)
            val allProjections = apiService.getCreditCardProjections()
            projections = allProjections.filter {
                it.resolvedCardId == card.uid || it.resolvedCardId == card.id || it.cardUid == card.id
            }

            val firstMonth = projections.firstOrNull()?.month
            if (firstMonth != null) {
                val details = apiService.getCreditCardDetails(
                    cardUid = card.uid ?: card.id ?: "",
                    month = firstMonth,
                    status = "pending"
                )
                activeInstallments = details.filter { (it.total_installments ?: 1) > 1 }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        } finally {
            isLoadingProjections = false
        }
    }

    fun loadDetailsForMonth(month: String) {
        scope.launch {
            isLoadingDetails = true
            selectedMonthTitle = month
            try {
                val apiService = NetworkModule.provideApiService(context)
                selectedMonthDetails = apiService.getCreditCardDetails(
                    cardUid = card.uid ?: card.id ?: "",
                    month = month,
                    status = "pending"
                )
            } catch (e: Exception) {
                e.printStackTrace()
                selectedMonthDetails = emptyList()
            } finally {
                isLoadingDetails = false
            }
        }
    }

    // Lógica para abrir el modal filtrando cuentas cash/activos (excluyendo tarjetas de crédito)
    fun openPaymentDialog() {
        scope.launch {
            try {
                val apiService = NetworkModule.provideApiService(context)
                val accounts = apiService.getAccounts()

                availableAccounts = accounts.filter { acc ->
                    acc.type == null || acc.type != "credit_card"
                }.filter { acc ->
                    acc.uid != card.uid && acc.uid != card.id
                }

                if (availableAccounts.isNotEmpty()) {
                    selectedSourceAccount = availableAccounts.first()
                }
                paymentDate = LocalDate.now().toString()
                showPayDialog = true
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    val currentMonthProjection = projections.firstOrNull()
    val currentTotal = currentMonthProjection?.net_total ?: 0.0
    val futureTotal = projections.drop(1).sumOf { it.net_total ?: 0.0 }

    Box(modifier = modifier.fillMaxSize()) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0xFF090D16))
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Botón volver
            item {
                TextButton(onClick = onBackClick, contentPadding = PaddingValues(0.dp)) {
                    Text(text = "← Volver a Tarjetas", color = Color(0xFF3B82F6), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }

            // 1. TARJETA VISUAL DE CRÉDITO PRINCIPAL
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(180.dp)
                        .background(
                            brush = Brush.linearGradient(
                                colors = listOf(Color(0xFF0F172A), Color(0xFF1E1B4B), Color(0xFF0F172A))
                            ),
                            shape = RoundedCornerShape(16.dp)
                        )
                        .padding(20.dp)
                ) {
                    Column(
                        modifier = Modifier.fillMaxSize(),
                        verticalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.Top
                        ) {
                            Column {
                                Text(text = "TARJETA DE CRÉDITO", fontSize = 10.sp, color = Color(0xFF93C5FD), fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                                Text(text = card.title ?: card.name ?: "Tarjeta", fontSize = 18.sp, color = Color.White, fontWeight = FontWeight.Black)
                            }
                            Text(text = "💳", fontSize = 28.sp)
                        }

                        Text(
                            text = maskValue ?: "•••• •••• •••• ${card.uid.takeLast(4)}",
                            fontSize = 14.sp,
                            color = Color(0xFFCBD5E1),
                            fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace,
                            letterSpacing = 2.sp
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.Bottom
                        ) {
                            Column {
                                Text(text = "CIERRE", fontSize = 9.sp, color = Color(0xFF94A3B8), fontWeight = FontWeight.Bold)
                                Text(text = "Día ${card.closing_day ?: 28}", fontSize = 12.sp, color = Color.White, fontWeight = FontWeight.Bold)
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text(text = "VENCIMIENTO", fontSize = 9.sp, color = Color(0xFF94A3B8), fontWeight = FontWeight.Bold)
                                Text(text = "Día ${card.due_day ?: 10}", fontSize = 12.sp, color = Color(0xFFF59E0B), fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            // 2. TARJETAS DE ESTADO RESUMIDAS + ACCIÓN DE PAGO
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF131B2E)),
                        border = BorderStroke(1.dp, Color(0xFF232F48)),
                        modifier = Modifier.weight(1f)
                    ) {
                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(text = "RESUMEN ACTUAL", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF94A3B8))
                            val currentTotalText = maskValue ?: "$ ${String.format("%,.2f", currentTotal)}"
                            Text(text = currentTotalText, fontSize = 16.sp, fontWeight = FontWeight.Black, color = Color(0xFFEF4444))

                            Button(
                                onClick = { openPaymentDialog() },
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                                modifier = Modifier.fillMaxWidth(),
                                enabled = currentTotal > 0
                            ) {
                                Text(text = "Pagar Resumen 💸", fontSize = 10.sp, color = Color.White, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF131B2E)),
                        border = BorderStroke(1.dp, Color(0xFF232F48)),
                        modifier = Modifier.weight(1f)
                    ) {
                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(text = "CUOTAS FUTURAS", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF94A3B8))
                            val futureTotalText = maskValue ?: "$ ${String.format("%,.2f", futureTotal)}"
                            Text(text = futureTotalText, fontSize = 16.sp, fontWeight = FontWeight.Black, color = Color(0xFFF59E0B))
                            Text(text = "Próximos meses", fontSize = 9.sp, color = Color(0xFF94A3B8))
                        }
                    }
                }
            }

            if (paymentStatusMessage.isNotBlank()) {
                item {
                    Text(text = paymentStatusMessage, fontSize = 12.sp, color = Color(0xFF10B981), fontWeight = FontWeight.Bold)
                }
            }

            // 3. VENCIMIENTOS POR MES
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF131B2E)),
                    border = BorderStroke(1.dp, Color(0xFF232F48)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text(text = "📅", fontSize = 14.sp)
                            Text(text = "Vencimientos por Mes", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color(0xFFF1F5F9))
                        }

                        if (isLoadingProjections) {
                            Box(modifier = Modifier.fillMaxWidth().padding(16.dp), contentAlignment = Alignment.Center) {
                                CircularProgressIndicator(modifier = Modifier.size(24.dp), color = Color(0xFF3B82F6))
                            }
                        } else if (projections.isEmpty()) {
                            Text(text = "No hay cuotas pendientes registradas.", fontSize = 12.sp, color = Color(0xFF94A3B8))
                        } else {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                projections.take(3).forEach { proj ->
                                    val formattedAmount = maskValue ?: "$ ${String.format("%,.2f", proj.net_total ?: 0.0)}"
                                    Card(
                                        colors = CardDefaults.cardColors(containerColor = Color(0xFF090D16)),
                                        border = BorderStroke(1.dp, Color(0xFF232F48)),
                                        modifier = Modifier
                                            .weight(1f)
                                            .clickable { loadDetailsForMonth(proj.month ?: "") }
                                    ) {
                                        Column(modifier = Modifier.padding(10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                            Text(text = proj.month ?: "Período", fontSize = 10.sp, color = Color(0xFF94A3B8), fontWeight = FontWeight.Bold)
                                            Spacer(modifier = Modifier.height(4.dp))
                                            Text(text = formattedAmount, fontSize = 11.sp, color = Color(0xFFEF4444), fontWeight = FontWeight.Bold)
                                            Spacer(modifier = Modifier.height(2.dp))
                                            Text(text = "Ver detalle 🔍", fontSize = 8.sp, color = Color(0xFF3B82F6))
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // 4. DETALLE DE CONSUMOS DEL PERÍODO SELECCIONADO
            if (selectedMonthTitle != null) {
                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF131B2E)),
                        border = BorderStroke(1.dp, Color(0xFF3B82F6)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(text = "🛒 Detalle: $selectedMonthTitle", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color(0xFF60A5FA))
                                TextButton(onClick = { selectedMonthTitle = null }, contentPadding = PaddingValues(0.dp)) {
                                    Text(text = "Cerrar ✕", fontSize = 10.sp, color = Color(0xFF94A3B8))
                                }
                            }

                            if (isLoadingDetails) {
                                Box(modifier = Modifier.fillMaxWidth().padding(10.dp), contentAlignment = Alignment.Center) {
                                    CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color(0xFF3B82F6))
                                }
                            } else if (selectedMonthDetails.isEmpty()) {
                                Text(text = "No hay consumos en este período.", fontSize = 11.sp, color = Color(0xFF94A3B8))
                            } else {
                                selectedMonthDetails.forEach { detail ->
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .background(Color(0xFF090D16), RoundedCornerShape(8.dp))
                                            .padding(10.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(text = detail.description ?: "Gasto", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFFF1F5F9))
                                            Text(text = "${detail.parent_category_title ?: ""} • Cuota ${detail.installment_number}/${detail.total_installments}", fontSize = 10.sp, color = Color(0xFF94A3B8))
                                        }
                                        Text(text = "$ ${String.format("%,.2f", detail.amount ?: 0.0)}", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFFEF4444))
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // 5. PLANES VIGENTES EN CUOTAS
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF131B2E)),
                    border = BorderStroke(1.dp, Color(0xFF232F48)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text(text = "📦", fontSize = 14.sp)
                            Text(text = "Planes Vigentes en Cuotas", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color(0xFFF1F5F9))
                        }

                        if (activeInstallments.isEmpty()) {
                            Text(text = "No hay compras en cuotas activas en este período.", fontSize = 12.sp, color = Color(0xFF94A3B8))
                        } else {
                            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                activeInstallments.forEach { item ->
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .background(Color(0xFF090D16), RoundedCornerShape(8.dp))
                                            .padding(10.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(text = item.description ?: "Compra", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFFF1F5F9))
                                            Text(text = "${card.title ?: card.name ?: "Tarjeta"} • Cuota ${item.installment_number} de ${item.total_installments}", fontSize = 10.sp, color = Color(0xFF94A3B8))
                                        }
                                        Text(text = "$ ${String.format("%,.2f", item.amount ?: 0.0)} / mes", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFFEF4444))
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // MODAL DE PAGO DE RESUMEN (IDÉNTICO AL DE LA WEB)
        if (showPayDialog) {
            AlertDialog(
                onDismissRequest = { showPayDialog = false },
                containerColor = Color(0xFF131B2E),
                title = {
                    Text(text = "💳 Pagar Resumen de Tarjeta", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text(text = "Período del Resumen: ${currentMonthProjection?.month ?: "Actual"}", fontSize = 12.sp, color = Color(0xFF94A3B8))
                        Text(text = "Monto Total: $ ${String.format("%,.2f", currentTotal)}", fontSize = 18.sp, fontWeight = FontWeight.Black, color = Color(0xFF34D399))

                        // Campo Fecha de Pago (Editable, por defecto hoy YYYY-MM-DD)
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(text = "Fecha de Pago:", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFFF1F5F9))
                            OutlinedTextField(
                                value = paymentDate,
                                onValueChange = { paymentDate = it },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = Color(0xFF3B82F6),
                                    unfocusedBorderColor = Color(0xFF232F48),
                                    focusedTextColor = Color.White,
                                    unfocusedTextColor = Color.White
                                )
                            )
                        }

                        // Selector de cuenta de origen (Cash/Activo)
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(text = "Pagar desde (Cuenta Origen):", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFFF1F5F9))

                            if (availableAccounts.isEmpty()) {
                                Text(text = "No hay cuentas de pago disponibles.", fontSize = 11.sp, color = Color(0xFFEF4444))
                            } else {
                                Box(modifier = Modifier.fillMaxWidth()) {
                                    OutlinedButton(
                                        onClick = { expandedAccountDropdown = true },
                                        modifier = Modifier.fillMaxWidth(),
                                        colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White),
                                        border = BorderStroke(1.dp, Color(0xFF3B82F6))
                                    ) {
                                        Text(text = selectedSourceAccount?.title ?: selectedSourceAccount?.name ?: "Seleccionar cuenta")
                                    }

                                    DropdownMenu(
                                        expanded = expandedAccountDropdown,
                                        onDismissRequest = { expandedAccountDropdown = false }
                                    ) {
                                        availableAccounts.forEach { acc ->
                                            DropdownMenuItem(
                                                text = { Text(text = "${acc.title ?: acc.name} (${acc.currencyCode ?: acc.currency ?: "ARS"})") },
                                                onClick = {
                                                    selectedSourceAccount = acc
                                                    expandedAccountDropdown = false
                                                }
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                confirmButton = {
                    Button(
                        onClick = {
                            scope.launch {
                                isPaying = true
                                try {
                                    val apiService = NetworkModule.provideApiService(context)
                                    val sourceUid = selectedSourceAccount?.uid ?: selectedSourceAccount?.id

                                    if (sourceUid != null && currentTotal > 0) {
                                        // 1. Registrar la transferencia de pago en el backend usando la fecha seleccionada
                                        apiService.createTransfer(
                                            TransferRequest(
                                                fromAccountUid = sourceUid,
                                                toAccountUid = card.uid ?: card.id ?: "",
                                                fromAmount = currentTotal,
                                                toAmount = currentTotal,
                                                comment = "Pago de resumen ${currentMonthProjection?.month ?: ""}",
                                                date = paymentDate
                                            )
                                        )

                                        // 2. Liquidar las cuotas del período
                                        apiService.settleCreditCardPeriod(
                                            SettleRequest(
                                                month = currentMonthProjection?.month ?: "",
                                                card_uid = card.uid ?: card.id ?: ""
                                            )
                                        )

                                        paymentStatusMessage = "¡Resumen pagado y liquidado con éxito!"

                                        // Refrescar proyecciones locales
                                        val allProjections = apiService.getCreditCardProjections()
                                        projections = allProjections.filter {
                                            it.resolvedCardId == card.uid || it.resolvedCardId == card.id || it.cardUid == card.id
                                        }
                                    }
                                } catch (e: Exception) {
                                    e.printStackTrace()
                                    paymentStatusMessage = "Error al procesar el pago: ${e.message}"
                                } finally {
                                    isPaying = false
                                    showPayDialog = false
                                }
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                        enabled = !isPaying && currentTotal > 0 && selectedSourceAccount != null
                    ) {
                        Text(text = if (isPaying) "Procesando..." else "Confirmar y Pagar", color = Color.White, fontSize = 12.sp)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showPayDialog = false }) {
                        Text(text = "Cancelar", color = Color(0xFF94A3B8), fontSize = 12.sp)
                    }
                }
            )
        }
    }
}