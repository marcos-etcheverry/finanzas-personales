package com.verry.finanzasapp.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.verry.finanzasapp.network.AccountDto
import com.verry.finanzasapp.network.TransactionDto

@Composable
fun AccountDetailScreen(
    account: AccountDto,
    transactionsList: List<TransactionDto>,
    onBackClick: () -> Unit,
    isPrivacyActive: Boolean,
    modifier: Modifier = Modifier
) {
    val maskValue = if (isPrivacyActive) "••••••••" else null

    // Filtramos las transacciones que correspondan a esta cuenta
    val accountTransactions = transactionsList.filter {
        it.accountUid == account.uid || it.accountUid == account.id
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFF090D16))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Botón volver
        item {
            TextButton(onClick = onBackClick, contentPadding = PaddingValues(0.dp)) {
                Text(text = "← Volver al Dashboard", color = Color(0xFF3B82F6), fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }

        // Cabecera de la cuenta
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF131B2E)),
                border = BorderStroke(1.dp, Color(0xFF232F48)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(text = "CUENTA SELECCIONADA", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF94A3B8))
                    Text(text = account.title ?: account.name ?: "Cuenta", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color.White)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(text = "Saldo Actual:", fontSize = 11.sp, color = Color(0xFF94A3B8))
                    Text(
                        text = maskValue ?: "$ ${String.format("%,.2f", account.balance)}",
                        fontSize = 24.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color(0xFF34D399)
                    )
                }
            }
        }

        // Listado de movimientos de la cuenta
        item {
            Text(
                text = "Movimientos de la cuenta (${accountTransactions.size})",
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFFF1F5F9)
            )
        }

        if (accountTransactions.isEmpty()) {
            item {
                Box(modifier = Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                    Text(text = "No hay movimientos registrados para esta cuenta.", fontSize = 12.sp, color = Color(0xFF94A3B8))
                }
            }
        } else {
            items(accountTransactions.size) { index ->
                val tx = accountTransactions[index]
                val isIncome = tx.type.uppercase() == "INCOME"
                val amountColor = if (isIncome) Color(0xFF10B981) else Color(0xFFEF4444)
                val sign = if (isIncome) "+" else "-"

                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF131B2E)),
                    border = BorderStroke(1.dp, Color(0xFF232F48)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(text = tx.comment ?: tx.categoryTitle ?: "Movimiento", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color.White)
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(text = "${tx.date ?: ""} • ${tx.categoryTitle ?: "Sin categoría"}[cite: 3]", fontSize = 10.sp, color = Color(0xFF94A3B8))
                        }
                        Text(
                            text = maskValue ?: "$sign $ ${String.format("%,.2f", tx.amount ?: 0.0)}",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Black,
                            color = amountColor
                        )
                    }
                }
            }
        }
    }
}
