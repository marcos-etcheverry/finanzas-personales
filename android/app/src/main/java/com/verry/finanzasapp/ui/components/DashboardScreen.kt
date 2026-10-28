package com.verry.finanzasapp.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.verry.finanzasapp.network.AccountDto

@Composable
fun DashboardScreen(
    accountsList: List<AccountDto>,
    netWorth: Double,
    totalIncome: Double,
    totalExpense: Double,
    selectedPeriod: String,
    onPeriodSelected: (String) -> Unit,
    selectedCurrency: String,                          // <-- Nuevo
    availableCurrencies: List<String>,                 // <-- Nuevo
    onCurrencySelected: (String) -> Unit,              // <-- Nuevo
    onAccountSelected: (AccountDto) -> Unit,
    onIncomeClick: () -> Unit,
    onExpenseClick: () -> Unit,
    isPrivacyActive: Boolean,
    modifier: Modifier = Modifier

) {
    val maskValue = if (isPrivacyActive) "••••••••" else null
// Símbolo dinámico según la moneda seleccionada
    val currencySymbol = when (selectedCurrency.uppercase()) {
        "USD" -> "US$"
        "ARS" -> "$"
        else -> "$selectedCurrency "
    }
    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFF090D16))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // 1. BARRA DE FILTROS GLOBALES (Período y Selector de Moneda Interactivo)
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF131B2E)),
                shape = RoundedCornerShape(16.dp),
                border = BorderStroke(1.dp, Color(0xFF232F48)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Selector de Períodos (izquierda)
                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        val periods = listOf("week" to "Sem", "month" to "Mes", "year" to "Año", "all" to "Todo")
                        periods.forEach { (key, label) ->
                            val isSelected = selectedPeriod == key
                            Surface(
                                shape = RoundedCornerShape(6.dp),
                                color = if (isSelected) Color(0xFF3B82F6) else Color.Transparent,
                                modifier = Modifier.clickable { onPeriodSelected(key) }
                            ) {
                                Text(
                                    text = label,
                                    fontSize = 10.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                    color = if (isSelected) Color.White else Color(0xFF94A3B8),
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 4.dp)
                                )
                            }
                        }
                    }

                    Box(modifier = Modifier.width(1.dp).height(16.dp).background(Color(0xFF232F48)))

                    // Selector de Moneda (derecha)
                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp), verticalAlignment = Alignment.CenterVertically) {
                        val currencies = if (availableCurrencies.isNotEmpty()) availableCurrencies else listOf("ARS", "USD")
                        currencies.forEach { cur ->
                            val isSelected = selectedCurrency.uppercase() == cur.uppercase()
                            Surface(
                                shape = RoundedCornerShape(6.dp),
                                color = if (isSelected) Color(0xFF10B981).copy(alpha = 0.2f) else Color.Transparent,
                                border = if (isSelected) BorderStroke(1.dp, Color(0xFF10B981)) else null,
                                modifier = Modifier.clickable { onCurrencySelected(cur) }
                            ) {
                                Text(
                                    text = cur,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isSelected) Color(0xFF10B981) else Color(0xFF94A3B8),
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                )
                            }
                        }
                    }
                }
            }
        }

        // ... (el resto de las tarjetas del Dashboard se mantienen igual)
        // 2. PATRIMONIO NETO CONSOLIDADO
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF131B2E)),
                shape = RoundedCornerShape(16.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF232F48)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "PATRIMONIO NETO CONSOLIDADO",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF94A3B8)
                        )
                        Surface(
                            shape = RoundedCornerShape(50),
                            color = Color(0xFF3B82F6).copy(alpha = 0.15f)
                        ) {
                            Text(
                                text = "Consolidado",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF60A5FA),
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                            )
                        }
                    }

                    Text(
                        text = maskValue ?: "$currencySymbol ${String.format("%,.2f", netWorth)}",
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Black,
                        color = Color(0xFFF1F5F9)
                    )
                }
            }
        }

// 3. INGRESOS VS GASTOS (GRID DE 2 COLUMNAS)
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Tarjeta Ingresos
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF131B2E)),
                    shape = RoundedCornerShape(16.dp),
                    border = BorderStroke(1.dp, Color(0xFF232F48)),
                    modifier = Modifier
                        .weight(1f)
                        .clickable { onIncomeClick() }
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text(text = "INGRESOS", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF94A3B8))
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = maskValue ?: "$currencySymbol ${String.format("%,.2f", totalIncome)}",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color(0xFF10B981)
                        )
                        Text(text = "Ver detalle →", fontSize = 9.sp, color = Color(0xFF10B981).copy(alpha = 0.7f), modifier = Modifier.padding(top = 4.dp))
                    }
                }

                // Tarjeta Gastos
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF131B2E)),
                    shape = RoundedCornerShape(16.dp),
                    border = BorderStroke(1.dp, Color(0xFF232F48)),
                    modifier = Modifier
                        .weight(1f)
                        .clickable { onExpenseClick() }
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text(text = "GASTOS", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF94A3B8))
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = maskValue ?: "$currencySymbol ${String.format("%,.2f", totalExpense)}",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color(0xFFEF4444)
                        )
                        Text(text = "Ver detalle →", fontSize = 9.sp, color = Color(0xFFEF4444).copy(alpha = 0.7f), modifier = Modifier.padding(top = 4.dp))
                    }
                }
            }
        }
        // 4. MIS CUENTAS (CARRUSEL HORIZONTAL INTERACTIVO)
        item {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = "MIS CUENTAS",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF94A3B8)
                )
                AccountsCarousel(
                    accounts = accountsList,
                    onAccountClick = { account -> onAccountSelected(account) } // <-- CONEXIÓN CON EL EVENTO
                )
            }
        }
    }
}