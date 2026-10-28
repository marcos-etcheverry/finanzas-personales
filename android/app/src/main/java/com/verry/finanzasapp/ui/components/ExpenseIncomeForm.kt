package com.verry.finanzasapp.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.MoreHoriz
import androidx.compose.material.icons.rounded.AccountBalance
import androidx.compose.material.icons.rounded.CreditCard
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.verry.finanzasapp.network.AccountDto
import com.verry.finanzasapp.network.CategoryDto
import com.verry.finanzasapp.network.ServerConfig

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExpenseIncomeForm(
    operationMode: String,
    accountsList: List<AccountDto>,
    selectedAccount: AccountDto?,
    onAccountSelected: (AccountDto) -> Unit,
    isCreditCardSelected: Boolean,
    selectedInstallments: Int,
    onInstallmentsSelected: (Int) -> Unit,
    mainCategories: List<CategoryDto>,
    selectedMainCategory: CategoryDto?,
    onMainCategorySelected: (CategoryDto) -> Unit,
    subCategories: List<CategoryDto>,
    selectedSubCategory: CategoryDto?,
    onSubCategorySelected: (CategoryDto) -> Unit,
    amountText: String,
    onAmountChange: (String) -> Unit,
    dateText: String,
    onDateChange: (String) -> Unit,
    tagText: String,
    onTagChange: (String) -> Unit,
    commentText: String,
    onCommentChange: (String) -> Unit,
    isLoading: Boolean,
    onSubmit: () -> Unit
) {
    var expandedAccount by remember { mutableStateOf(false) }
    var expandedInstallments by remember { mutableStateOf(false) }
    var showCategoryDialog by remember { mutableStateOf(false) }

    val installmentOptions = listOf(1, 2, 3, 6, 12)
    val scrollState = rememberScrollState()
    val context = LocalContext.current
    val serverBaseUrl = ServerConfig.getServerUrl(context).removeSuffix("/")

    val textFieldColors = OutlinedTextFieldDefaults.colors(
        focusedBorderColor = Color(0xFF3B82F6),
        unfocusedBorderColor = Color(0xFF232F48),
        focusedContainerColor = Color(0xFF090D16),
        unfocusedContainerColor = Color(0xFF090D16),
        focusedTextColor = Color(0xFFF1F5F9),
        unfocusedTextColor = Color(0xFFF1F5F9),
        focusedLabelColor = Color(0xFF3B82F6),
        unfocusedLabelColor = Color(0xFF94A3B8)
    )

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .verticalScroll(scrollState)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Text(
            text = if (operationMode == "EXPENSE") "Registrar Gasto" else "Registrar Ingreso",
            color = Color(0xFFF1F5F9),
            style = MaterialTheme.typography.titleMedium
        )

        // 1. SELECTOR DE CUENTA
        ExposedDropdownMenuBox(
            expanded = expandedAccount,
            onExpandedChange = { expandedAccount = !expandedAccount }
        ) {
            OutlinedTextField(
                value = selectedAccount?.title ?: "Seleccionar cuenta...",
                onValueChange = {},
                readOnly = true,
                label = { Text("Cuenta") },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedAccount) },
                colors = textFieldColors,
                modifier = Modifier.menuAnchor().fillMaxWidth()
            )
            ExposedDropdownMenu(
                expanded = expandedAccount,
                onDismissRequest = { expandedAccount = false }
            ) {
                accountsList.forEach { account ->
                    DropdownMenuItem(
                        text = {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Surface(
                                    shape = RoundedCornerShape(6.dp),
                                    color = Color(0xFF3B82F6).copy(alpha = 0.15f),
                                    modifier = Modifier.size(36.dp)
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        val iconValue = account.icon
                                        if (!iconValue.isNullOrBlank()) {
                                            val normalizedPath = if (iconValue.startsWith("/")) iconValue else "/$iconValue"
                                            val fullImageUrl = "$serverBaseUrl$normalizedPath"

                                            AsyncImage(
                                                model = fullImageUrl,
                                                contentDescription = account.title,
                                                modifier = Modifier
                                                    .fillMaxSize()
                                                    .padding(4.dp),
                                                contentScale = ContentScale.Crop
                                            )
                                        } else {
                                            Icon(
                                                imageVector = when (account.type?.lowercase()) {
                                                    "credit_card", "tarjeta" -> Icons.Rounded.CreditCard
                                                    else -> Icons.Rounded.AccountBalance
                                                },
                                                contentDescription = null,
                                                tint = Color(0xFF60A5FA),
                                                modifier = Modifier.size(18.dp)
                                            )
                                        }
                                    }
                                }

                                Column {
                                    Text(
                                        text = "${account.title ?: account.name ?: "Cuenta"} ($${String.format("%,.2f", account.balance)})",
                                        fontSize = 13.sp,
                                        color = Color.White
                                    )
                                }
                            }
                        },
                        onClick = {
                            onAccountSelected(account)
                            expandedAccount = false
                        }
                    )
                }
            }
        }

        // 2. MONTO Y FECHA
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            OutlinedTextField(
                value = amountText,
                onValueChange = onAmountChange,
                label = { Text("Monto ($)") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                colors = textFieldColors,
                modifier = Modifier.weight(1f)
            )

            OutlinedTextField(
                value = dateText,
                onValueChange = onDateChange,
                label = { Text("Fecha") },
                colors = textFieldColors,
                modifier = Modifier.weight(1f)
            )
        }

        // 3. SELECTOR VISUAL DE CATEGORÍA PRINCIPAL (Top 7 + Botón Ver Más)
        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Text(
                text = "Categoría: ${selectedMainCategory?.title ?: "Seleccionar..."}",
                fontSize = 13.sp,
                color = Color(0xFF94A3B8),
                fontWeight = FontWeight.Medium
            )

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                val topCategories = mainCategories.take(7)

                topCategories.forEach { category ->
                    val isSelected = selectedMainCategory?.uid == category.uid
                    val borderColor = if (isSelected) Color(0xFF3B82F6) else Color(0xFF232F48)
                    val containerColor = if (isSelected) Color(0xFF3B82F6).copy(alpha = 0.2f) else Color(0xFF090D16)

                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = containerColor,
                        modifier = Modifier
                            .size(52.dp)
                            .clickable { onMainCategorySelected(category) },
                        border = BorderStroke(2.dp, borderColor)
                    ) {
                        Box(contentAlignment = Alignment.Center, modifier = Modifier.padding(6.dp)) {
                            val iconValue = category.iconUrl
                            if (!iconValue.isNullOrBlank()) {
                                val normalizedPath = if (iconValue.startsWith("/")) iconValue else "/$iconValue"
                                AsyncImage(
                                    model = "$serverBaseUrl$normalizedPath",
                                    contentDescription = category.title,
                                    modifier = Modifier.fillMaxSize(),
                                    contentScale = ContentScale.Crop
                                )
                            } else {
                                Text(
                                    text = category.title?.take(2)?.uppercase() ?: "CAT",
                                    fontSize = 10.sp,
                                    color = Color.White,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }

                // Botón "Ver más" (...) para abrir el Popup completo
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = Color(0xFF1E293B),
                    modifier = Modifier
                        .size(52.dp)
                        .clickable { showCategoryDialog = true },
                    border = BorderStroke(1.dp, Color(0xFF334155))
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = Icons.Default.MoreHoriz,
                            contentDescription = "Ver todas",
                            tint = Color(0xFF3B82F6),
                            modifier = Modifier.size(24.dp)
                        )
                    }
                }
            }
        }

        // 4. SUBCATEGORÍA VISUAL (Si la categoría seleccionada tiene subcategorías)
        if (subCategories.isNotEmpty()) {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Text(
                    text = "Subcategoría: ${selectedSubCategory?.title ?: "Seleccionar (opcional)..."}",
                    fontSize = 13.sp,
                    color = Color(0xFF94A3B8),
                    fontWeight = FontWeight.Medium
                )

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    subCategories.forEach { sub ->
                        val isSelected = selectedSubCategory?.uid == sub.uid
                        val borderColor = if (isSelected) Color(0xFF10B981) else Color(0xFF232F48)
                        val containerColor = if (isSelected) Color(0xFF10B981).copy(alpha = 0.2f) else Color(0xFF090D16)

                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = containerColor,
                            modifier = Modifier
                                .size(46.dp)
                                .clickable { onSubCategorySelected(sub) },
                            border = BorderStroke(2.dp, borderColor)
                        ) {
                            Box(contentAlignment = Alignment.Center, modifier = Modifier.padding(4.dp)) {
                                val iconValue = sub.iconUrl
                                if (!iconValue.isNullOrBlank()) {
                                    val normalizedPath = if (iconValue.startsWith("/")) iconValue else "/$iconValue"
                                    AsyncImage(
                                        model = "$serverBaseUrl$normalizedPath",
                                        contentDescription = sub.title,
                                        modifier = Modifier.fillMaxSize(),
                                        contentScale = ContentScale.Crop
                                    )
                                } else {
                                    Text(
                                        text = sub.title?.take(2)?.uppercase() ?: "SUB",
                                        fontSize = 9.sp,
                                        color = Color.White,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // 5. CUOTAS (Solo si es Gasto con Tarjeta de Crédito)
        if (operationMode == "EXPENSE" && isCreditCardSelected) {
            ExposedDropdownMenuBox(
                expanded = expandedInstallments,
                onExpandedChange = { expandedInstallments = !expandedInstallments }
            ) {
                OutlinedTextField(
                    value = "$selectedInstallments Cuota(s)",
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Financiación en Cuotas") },
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedInstallments) },
                    colors = textFieldColors,
                    modifier = Modifier.menuAnchor().fillMaxWidth()
                )
                ExposedDropdownMenu(
                    expanded = expandedInstallments,
                    onDismissRequest = { expandedInstallments = false }
                ) {
                    installmentOptions.forEach { inst ->
                        DropdownMenuItem(
                            text = { Text("$inst Cuota(s)") },
                            onClick = {
                                onInstallmentsSelected(inst)
                                expandedInstallments = false
                            }
                        )
                    }
                }
            }
        }

        // 6. COMENTARIO OPCIONAL
        OutlinedTextField(
            value = commentText,
            onValueChange = onCommentChange,
            label = { Text("Comentario / Detalle") },
            colors = textFieldColors,
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(8.dp))

        // BOTÓN DE ENVÍO
        Button(
            onClick = onSubmit,
            enabled = !isLoading,
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF3B82F6)),
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp)
        ) {
            Text(
                text = if (isLoading) "Guardando..." else "Guardar Movimiento",
                color = Color.White,
                fontWeight = FontWeight.Bold
            )
        }
    }

    // POPUP / DIÁLOGO PARA SELECCIONAR CUALQUIER CATEGORÍA
    if (showCategoryDialog) {
        AlertDialog(
            onDismissRequest = { showCategoryDialog = false },
            containerColor = Color(0xFF0F172A),
            title = {
                Text(text = "Todas las Categorías", color = Color.White, fontSize = 16.sp)
            },
            text = {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 380.dp)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    mainCategories.forEach { category ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .clickable {
                                    onMainCategorySelected(category)
                                    showCategoryDialog = false
                                }
                                .padding(8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = Color(0xFF1E293B),
                                modifier = Modifier.size(38.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    val iconValue = category.iconUrl
                                    if (!iconValue.isNullOrBlank()) {
                                        val normalizedPath = if (iconValue.startsWith("/")) iconValue else "/$iconValue"
                                        AsyncImage(
                                            model = "$serverBaseUrl$normalizedPath",
                                            contentDescription = null,
                                            modifier = Modifier.fillMaxSize(),
                                            contentScale = ContentScale.Crop
                                        )
                                    }
                                }
                            }
                            Text(
                                text = category.title ?: "Sin nombre",
                                color = Color.White,
                                fontSize = 14.sp
                            )
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showCategoryDialog = false }) {
                    Text("Cerrar", color = Color(0xFF3B82F6))
                }
            }
        )
    }
}