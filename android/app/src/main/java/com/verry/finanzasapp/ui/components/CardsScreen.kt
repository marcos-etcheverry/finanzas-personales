
package com.verry.finanzasapp.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable // <-- Importante
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip // <-- Importante
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.verry.finanzasapp.network.AccountDto

@Composable
fun CardsScreen(
    cardsList: List<AccountDto>,
    onCardClick: (AccountDto) -> Unit, // <-- Añadido aquí como parámetro
    isPrivacyActive: Boolean,
    modifier: Modifier = Modifier
) {
    val maskValue = if (isPrivacyActive) "••••••••" else null

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFF090D16))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(
                text = "Tus Tarjetas y Plásticos",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFFF1F5F9)
            )
        }

        if (cardsList.isEmpty()) {
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF131B2E)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Box(modifier = Modifier.padding(24.dp).fillMaxWidth(), contentAlignment = Alignment.Center) {
                        Text(text = "No hay tarjetas registradas.", color = Color(0xFF94A3B8), fontSize = 12.sp)
                    }
                }
            }
        } else {
            items(cardsList) { card ->
                // Tarjeta visual individual con estilo degradado y clickeable
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(180.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(
                            brush = Brush.linearGradient(
                                colors = listOf(Color(0xFF0F172A), Color(0xFF1E1B4B), Color(0xFF0F172A))
                            ),
                            shape = RoundedCornerShape(16.dp)
                        )
                        .clickable { onCardClick(card) } // <-- Vinculamos el click aquí
                        .padding(20.dp)
                ) {
                    Column(
                        modifier = Modifier.fillMaxSize(),
                        verticalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "Tarjeta de Crédito",
                                    fontSize = 10.sp,
                                    color = Color(0xFF94A3B8),
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = card.title ?: "Sin nombre",
                                    fontSize = 16.sp,
                                    color = Color.White,
                                    fontWeight = FontWeight.Black
                                )
                            }
                            Surface(
                                shape = RoundedCornerShape(50),
                                color = Color(0xFF6366F1).copy(alpha = 0.2f)
                            ) {
                                Text(
                                    text = card.currencyCode ?: "ARS",
                                    fontSize = 10.sp,
                                    color = Color(0xFF818CF8),
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                                )
                            }
                        }

                        // Saldo / Resumen actual
                        Column {
                            Text(
                                text = "Saldo / Consumo Actual",
                                fontSize = 9.sp,
                                color = Color(0xFF94A3B8)
                            )
                            Text(
                                text = maskValue ?: "$ ${String.format("%,.2f", card.balance)}",
                                fontSize = 20.sp,
                                color = if (card.balance < 0) Color(0xFFEF4444) else Color(0xFF10B981),
                                fontWeight = FontWeight.Black
                            )
                        }

                        // Pie de tarjeta con fechas simuladas
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text(text = "CIERRE", fontSize = 8.sp, color = Color(0xFF94A3B8))
                                Text(text = "28 de Oct", fontSize = 11.sp, color = Color.White, fontWeight = FontWeight.Bold)
                            }
                            Column {
                                Text(text = "VENCIMIENTO", fontSize = 8.sp, color = Color(0xFF94A3B8))
                                Text(text = "10 de Nov", fontSize = 11.sp, color = Color(0xFFF59E0B), fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}