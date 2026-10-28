package com.verry.finanzasapp.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.verry.finanzasapp.network.AccountDto
import com.verry.finanzasapp.network.CategoryDto

@Composable
fun AccountsScreen(
    accountsList: List<AccountDto>,
    categoriesList: List<CategoryDto>,
    isPrivacyActive: Boolean,
    modifier: Modifier = Modifier
) {
    var selectedTab by remember { mutableStateOf(0) } // 0: Cuentas, 1: Categorías
    val maskValue = if (isPrivacyActive) "••••••••" else null

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFF090D16))
            .padding(16.dp)
    ) {
        // Selector de Sub-pestanas: Cuentas vs Categorías
        TabRow(
            selectedTabIndex = selectedTab,
            containerColor = Color(0xFF131B2E),
            contentColor = Color(0xFF3B82F6),
            modifier = Modifier.clip(RoundedCornerShape(8.dp))
        ) {
            Tab(
                selected = selectedTab == 0,
                onClick = { selectedTab = 0 },
                text = { Text("Cuentas (${accountsList.size})", fontWeight = FontWeight.Bold) }
            )
            Tab(
                selected = selectedTab == 1,
                onClick = { selectedTab = 1 },
                text = { Text("Categorías (${categoriesList.size})", fontWeight = FontWeight.Bold) }
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        if (selectedTab == 0) {
            // LISTADO DE CUENTAS
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(accountsList) { account ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF131B2E)),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF232F48)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier
                                .padding(16.dp)
                                .fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                // Avatar / Ícono de la Cuenta
                                Surface(
                                    modifier = Modifier.size(40.dp),
                                    shape = CircleShape,
                                    color = Color(0xFF232F48)
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Text(
                                            text = account.title?.take(1)?.uppercase() ?: "C",
                                            color = Color(0xFF3B82F6),
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 16.sp
                                        )
                                    }
                                }
                                Spacer(modifier = Modifier.width(12.dp))
                                Column {
                                    Text(
                                        text = account.title ?: "Sin nombre",
                                        color = Color(0xFFF1F5F9),
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 14.sp
                                    )
                                    Text(
                                        text = account.type?.uppercase() ?: "CASH",
                                        color = Color(0xFF94A3B8),
                                        fontSize = 10.sp
                                    )
                                }
                            }

                            // Saldo de la cuenta
                            Text(
                                text = maskValue ?: "$ ${String.format("%,.2f", account.balance)}",
                                color = if (account.balance >= 0) Color(0xFF10B981) else Color(0xFFEF4444),
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            )
                        }
                    }
                }
            }
        } else {
            // LISTADO DE CATEGORÍAS
            val mainCategories = categoriesList.filter { it.parent_uid.isNullOrBlank() }

            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(mainCategories) { mainCat ->
                    val subCats = categoriesList.filter { it.parent_uid == mainCat.uid }

                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF131B2E)),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF232F48)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Surface(
                                    modifier = Modifier.size(36.dp),
                                    shape = CircleShape,
                                    color = Color(0xFF3B82F6).copy(alpha = 0.2f)
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Text(
                                            text = mainCat.title?.take(1)?.uppercase() ?: "K",
                                            color = Color(0xFF3B82F6),
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 14.sp
                                        )
                                    }
                                }
                                Spacer(modifier = Modifier.width(12.dp))
                                Text(
                                    text = mainCat.title ?: "",
                                    color = Color(0xFFF1F5F9),
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp
                                )
                            }

                            // Subcategorías asociadas
                            if (subCats.isNotEmpty()) {
                                Spacer(modifier = Modifier.height(8.dp))
                                Column(
                                    modifier = Modifier.padding(start = 48.dp),
                                    verticalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    subCats.forEach { sub ->
                                        Text(
                                            text = "• ${sub.title}",
                                            color = Color(0xFF94A3B8),
                                            fontSize = 12.sp
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

