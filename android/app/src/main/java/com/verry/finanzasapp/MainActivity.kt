package com.verry.finanzasapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.verry.finanzasapp.db.AccountEntity
import com.verry.finanzasapp.db.AppDatabase
import com.verry.finanzasapp.db.CategoryEntity
import com.verry.finanzasapp.db.PendingTransactionEntity
import com.verry.finanzasapp.network.AccountDto
import com.verry.finanzasapp.network.CategoryDto
import com.verry.finanzasapp.network.NetworkModule
import com.verry.finanzasapp.network.TransactionRequest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val db = AppDatabase.getDatabase(this)

        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    MainScreen(db)
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(db: AppDatabase) {
    val scope = rememberCoroutineScope()
    val pendingDao = db.pendingTransactionDao()
    val accountDao = db.accountDao()
    val categoryDao = db.categoryDao()

    val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    val todayStr = sdf.format(Date())

    var accountsList by remember { mutableStateOf<List<AccountDto>>(emptyList()) }
    var categoriesList by remember { mutableStateOf<List<CategoryDto>>(emptyList()) }

    var operationMode by remember { mutableStateOf("EXPENSE") }

    var selectedAccount by remember { mutableStateOf<AccountDto?>(null) }
    var selectedMainCategory by remember { mutableStateOf<CategoryDto?>(null) }
    var selectedSubCategory by remember { mutableStateOf<CategoryDto?>(null) }
    var tagText by remember { mutableStateOf("") }
    var amountText by remember { mutableStateOf("") }
    var selectedInstallments by remember { mutableStateOf(1) }

    var sourceAccount by remember { mutableStateOf<AccountDto?>(null) }
    var targetAccount by remember { mutableStateOf<AccountDto?>(null) }
    var transferAmountText by remember { mutableStateOf("") }

    var commentText by remember { mutableStateOf("") }
    var dateText by remember { mutableStateOf(todayStr) }
    var pendingCount by remember { mutableStateOf(0) }
    var statusText by remember { mutableStateOf("Listo para registrar movimientos") }
    var isLoading by remember { mutableStateOf(false) }

    var expandedAccountDropdown by remember { mutableStateOf(false) }
    var expandedInstallmentsDropdown by remember { mutableStateOf(false) }
    var expandedMainCategoryDropdown by remember { mutableStateOf(false) }
    var expandedSubCategoryDropdown by remember { mutableStateOf(false) }
    var expandedSourceDropdown by remember { mutableStateOf(false) }
    var expandedTargetDropdown by remember { mutableStateOf(false) }

    val installmentOptions = listOf(1, 2, 3, 6, 12)
    val isCreditCardSelected = selectedAccount?.type?.lowercase() == "credit_card" || selectedAccount?.type?.lowercase() == "tarjeta"

    val cashAccounts = accountsList.filter {
        val t = it.type?.lowercase() ?: ""
        t != "credit_card" && t != "tarjeta"
    }

    val targetType = if (operationMode == "EXPENSE") "expense" else "income"
    val categoriesByMode = categoriesList.filter { (it.type ?: "expense") == targetType }

    val mainCategories = categoriesByMode.filter { it.parent_uid.isNullOrBlank() }
    val subCategories = categoriesByMode.filter { it.parent_uid == selectedMainCategory?.uid }

    LaunchedEffect(operationMode) {
        selectedMainCategory = null
        selectedSubCategory = null
        selectedInstallments = 1
    }

    fun refreshPendingCount() {
        scope.launch {
            pendingCount = pendingDao.getPendingCount()
        }
    }

    fun loadData() {
        scope.launch {
            isLoading = true
            try {
                val remoteAccounts = NetworkModule.apiService.getAccounts()
                accountDao.saveAccounts(remoteAccounts.map {
                    AccountEntity(
                        uid = it.uid,
                        title = it.title ?: "Sin nombre",
                        currencyCode = it.currencyCode ?: "ARS",
                        balance = it.balance,
                        type = it.type ?: "cash"
                    )
                })
                accountsList = remoteAccounts

                val remoteCategories = NetworkModule.apiService.getCategories()
                categoryDao.clearCategories()
                categoryDao.saveCategories(remoteCategories.map {
                    CategoryEntity(it.uid, it.title, it.parent_uid, it.type)
                })
                categoriesList = remoteCategories

                statusText = "Conectado a PC (Datos sincronizados)"
            } catch (e: Exception) {
                // FALLBACK OFFLINE CORREGIDO (Sin llaves de cierre erróneas)
                accountsList = accountDao.getLocalAccounts().map { localAcc ->
                    AccountDto(
                        id = localAcc.uid,
                        uid = localAcc.uid,
                        name = localAcc.title,
                        title = localAcc.title,
                        type = localAcc.type ?: "cash",
                        currency = localAcc.currencyCode,
                        currencyCode = localAcc.currencyCode,
                        balance = localAcc.balance
                    )
                }

                categoriesList = categoryDao.getLocalCategories().map { localCat ->
                    CategoryDto(
                        uid = localCat.uid,
                        title = localCat.title,
                        parent_uid = localCat.parentUid,
                        type = localCat.type
                    )
                }

                statusText = "Modo Offline (Usando datos locales)"
            } finally {
                if (selectedAccount == null && accountsList.isNotEmpty()) {
                    selectedAccount = accountsList.first()
                }

                val availableCash = accountsList.filter {
                    val t = it.type?.lowercase() ?: ""
                    t != "credit_card" && t != "tarjeta"
                }
                if (sourceAccount == null && availableCash.isNotEmpty()) {
                    sourceAccount = availableCash.first()
                }
                if (targetAccount == null && availableCash.size > 1) {
                    targetAccount = availableCash[1]
                } else if (targetAccount == null && availableCash.isNotEmpty()) {
                    targetAccount = availableCash.first()
                }

                isLoading = false
                refreshPendingCount()
            }
        }
    }

    fun syncPendingTransactions() {
        scope.launch {
            isLoading = true
            statusText = "Sincronizando pendientes con la PC..."
            try {
                val pendings = pendingDao.getAllPendingTransactions()
                var successCount = 0

                for (p in pendings) {
                    val req = TransactionRequest(
                        type = p.type,
                        account_uid = p.accountUid,
                        category_uid = p.categoryUid,
                        tag = p.tag,
                        amount = p.amount,
                        comment = p.comment,
                        date = sdf.format(Date(p.createdAt))
                    )
                    NetworkModule.apiService.createTransaction(req)
                    pendingDao.deleteTransaction(p.id)
                    successCount++
                }

                statusText = "¡Sincronización exitosa! ($successCount enviados)"
                loadData()
            } catch (e: Exception) {
                statusText = "Error al sincronizar: ¿Está encendido el servidor PC?"
            } finally {
                isLoading = false
                refreshPendingCount()
            }
        }
    }

    LaunchedEffect(Unit) {
        loadData()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(text = "Finanzas Personales - Registros", style = MaterialTheme.typography.titleMedium)

        Spacer(modifier = Modifier.height(8.dp))

        if (pendingCount > 0) {
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .padding(12.dp)
                        .fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(text = "Pendientes en cel: $pendingCount")
                    Button(
                        onClick = { syncPendingTransactions() },
                        enabled = !isLoading
                    ) {
                        Text("Sincronizar")
                    }
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            FilterChip(
                selected = operationMode == "EXPENSE",
                onClick = { operationMode = "EXPENSE" },
                label = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(modifier = Modifier.size(8.dp).background(Color(0xFFEF4444), shape = CircleShape))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Gasto")
                    }
                }
            )

            FilterChip(
                selected = operationMode == "INCOME",
                onClick = { operationMode = "INCOME" },
                label = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(modifier = Modifier.size(8.dp).background(Color(0xFF10B981), shape = CircleShape))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Ingreso")
                    }
                }
            )

            FilterChip(
                selected = operationMode == "TRANSFER",
                onClick = { operationMode = "TRANSFER" },
                label = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(modifier = Modifier.size(8.dp).background(Color(0xFF3B82F6), shape = CircleShape))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Transferencia")
                    }
                }
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {

                if (operationMode == "EXPENSE" || operationMode == "INCOME") {
                    ExposedDropdownMenuBox(
                        expanded = expandedAccountDropdown,
                        onExpandedChange = { expandedAccountDropdown = !expandedAccountDropdown }
                    ) {
                        OutlinedTextField(
                            value = selectedAccount?.title ?: "Seleccionar Cuenta...",
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Cuenta") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedAccountDropdown) },
                            modifier = Modifier.menuAnchor().fillMaxWidth()
                        )
                        ExposedDropdownMenu(
                            expanded = expandedAccountDropdown,
                            onDismissRequest = { expandedAccountDropdown = false }
                        ) {
                            accountsList.forEach { account ->
                                DropdownMenuItem(
                                    text = { Text("${account.title} ($${account.balance})") },
                                    onClick = {
                                        selectedAccount = account
                                        expandedAccountDropdown = false
                                    }
                                )
                            }
                        }
                    }

                    if (operationMode == "EXPENSE" && isCreditCardSelected) {
                        Spacer(modifier = Modifier.height(8.dp))

                        ExposedDropdownMenuBox(
                            expanded = expandedInstallmentsDropdown,
                            onExpandedChange = { expandedInstallmentsDropdown = !expandedInstallmentsDropdown }
                        ) {
                            OutlinedTextField(
                                value = if (selectedInstallments == 1) "1 pago (Sin cuotas)" else "$selectedInstallments cuotas",
                                onValueChange = {},
                                readOnly = true,
                                label = { Text("Cantidad de Cuotas") },
                                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedInstallmentsDropdown) },
                                modifier = Modifier.menuAnchor().fillMaxWidth()
                            )
                            ExposedDropdownMenu(
                                expanded = expandedInstallmentsDropdown,
                                onDismissRequest = { expandedInstallmentsDropdown = false }
                            ) {
                                installmentOptions.forEach { count ->
                                    DropdownMenuItem(
                                        text = { Text(if (count == 1) "1 pago" else "$count cuotas") },
                                        onClick = {
                                            selectedInstallments = count
                                            expandedInstallmentsDropdown = false
                                        }
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    ExposedDropdownMenuBox(
                        expanded = expandedMainCategoryDropdown,
                        onExpandedChange = { expandedMainCategoryDropdown = !expandedMainCategoryDropdown }
                    ) {
                        OutlinedTextField(
                            value = selectedMainCategory?.title ?: "Seleccionar Categoría...",
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Categoría Principal (${if (operationMode == "EXPENSE") "Gasto" else "Ingreso"})") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedMainCategoryDropdown) },
                            modifier = Modifier.menuAnchor().fillMaxWidth()
                        )
                        ExposedDropdownMenu(
                            expanded = expandedMainCategoryDropdown,
                            onDismissRequest = { expandedMainCategoryDropdown = false }
                        ) {
                            mainCategories.forEach { cat ->
                                DropdownMenuItem(
                                    text = { Text("📂 ${cat.title}") },
                                    onClick = {
                                        selectedMainCategory = cat
                                        selectedSubCategory = null
                                        expandedMainCategoryDropdown = false
                                    }
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    ExposedDropdownMenuBox(
                        expanded = expandedSubCategoryDropdown,
                        onExpandedChange = { if (selectedMainCategory != null) expandedSubCategoryDropdown = !expandedSubCategoryDropdown }
                    ) {
                        OutlinedTextField(
                            value = selectedSubCategory?.title ?: if (selectedMainCategory == null) "Seleccioná una categoría primero..." else "Sin Subcategoría / Opcional",
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Subcategoría") },
                            enabled = selectedMainCategory != null,
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedSubCategoryDropdown) },
                            modifier = Modifier.menuAnchor().fillMaxWidth()
                        )
                        ExposedDropdownMenu(
                            expanded = expandedSubCategoryDropdown,
                            onDismissRequest = { expandedSubCategoryDropdown = false }
                        ) {
                            subCategories.forEach { sub ->
                                DropdownMenuItem(
                                    text = { Text("  ↳ ${sub.title}") },
                                    onClick = {
                                        selectedSubCategory = sub
                                        expandedSubCategoryDropdown = false
                                    }
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = amountText,
                        onValueChange = { amountText = it },
                        label = { Text("Monto") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = dateText,
                        onValueChange = { dateText = it },
                        label = { Text("Fecha (AAAA-MM-DD)") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = tagText,
                        onValueChange = { tagText = it },
                        label = { Text("Etiqueta (opcional)") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = commentText,
                        onValueChange = { commentText = it },
                        label = { Text("Descripción / Comentario") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Button(
                        onClick = {
                            val acc = selectedAccount
                            val amount = amountText.toDoubleOrNull()
                            val categoryUidToSend = selectedSubCategory?.uid ?: selectedMainCategory?.uid

                            if (acc == null || amount == null || amount <= 0) {
                                statusText = "Verificá la cuenta y el monto."
                                return@Button
                            }

                            scope.launch {
                                isLoading = true
                                val isCard = acc.type?.lowercase() == "credit_card" || acc.type?.lowercase() == "tarjeta"
                                val isCardPurchaseWithInstallments = operationMode == "EXPENSE" && isCard && selectedInstallments > 1

                                try {
                                    if (isCardPurchaseWithInstallments) {
                                        val client = okhttp3.OkHttpClient()
                                        val json = com.google.gson.Gson().toJson(
                                            mapOf(
                                                "account_uid" to acc.uid,
                                                "total_amount" to amount,
                                                "installments" to selectedInstallments,
                                                "purchase_date" to dateText.ifBlank { todayStr },
                                                "comment" to commentText.ifBlank { null },
                                                "category_uid" to categoryUidToSend,
                                                "tag" to tagText.ifBlank { null }
                                            )
                                        )
                                        val body = okhttp3.RequestBody.create(okhttp3.MediaType.parse("application/json; charset=utf-8"), json)
                                        val request = okhttp3.Request.Builder()
                                            .url("http://192.168.68.51:3000/api/credit-cards/purchase")
                                            .post(body)
                                            .build()

                                        val response = withContext(Dispatchers.IO) { client.newCall(request).execute() }
                                        if (!response.isSuccessful) throw Exception("Error en compra con tarjeta: ${response.code()}")

                                        statusText = "¡Compra en cuotas registrada con éxito!"
                                    } else {
                                        val req = TransactionRequest(
                                            type = operationMode,
                                            account_uid = acc.uid,
                                            category_uid = categoryUidToSend,
                                            tag = tagText.ifBlank { null },
                                            amount = amount,
                                            comment = commentText.ifBlank { null },
                                            date = dateText.ifBlank { todayStr }
                                        )
                                        NetworkModule.apiService.createTransaction(req)
                                        statusText = "¡Movimiento enviado a PC!"
                                    }

                                    amountText = ""; commentText = ""; tagText = ""; selectedInstallments = 1
                                    loadData()
                                } catch (e: Exception) {
                                    pendingDao.insertTransaction(
                                        PendingTransactionEntity(
                                            type = operationMode,
                                            accountUid = acc.uid,
                                            categoryUid = categoryUidToSend,
                                            tag = tagText.ifBlank { null },
                                            amount = amount,
                                            comment = commentText.ifBlank { null }
                                        )
                                    )
                                    statusText = "Sin conexión: Guardado localmente en pendientes"
                                    amountText = ""; commentText = ""; tagText = ""
                                    refreshPendingCount()
                                } finally {
                                    isLoading = false
                                }
                            }
                        },
                        enabled = !isLoading,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(if (operationMode == "EXPENSE") "Registrar Gasto" else "Registrar Ingreso")
                    }

                } else {
                    ExposedDropdownMenuBox(
                        expanded = expandedSourceDropdown,
                        onExpandedChange = { expandedSourceDropdown = !expandedSourceDropdown }
                    ) {
                        OutlinedTextField(
                            value = sourceAccount?.title ?: "Cuenta Origen...",
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Cuenta Origen (Sale dinero)") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedSourceDropdown) },
                            modifier = Modifier.menuAnchor().fillMaxWidth()
                        )
                        ExposedDropdownMenu(
                            expanded = expandedSourceDropdown,
                            onDismissRequest = { expandedSourceDropdown = false }
                        ) {
                            cashAccounts.forEach { account ->
                                DropdownMenuItem(
                                    text = { Text("${account.title} ($${account.balance})") },
                                    onClick = { sourceAccount = account; expandedSourceDropdown = false }
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    ExposedDropdownMenuBox(
                        expanded = expandedTargetDropdown,
                        onExpandedChange = { expandedTargetDropdown = !expandedTargetDropdown }
                    ) {
                        OutlinedTextField(
                            value = targetAccount?.title ?: "Cuenta Destino...",
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Cuenta Destino (Entra dinero)") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedTargetDropdown) },
                            modifier = Modifier.menuAnchor().fillMaxWidth()
                        )
                        ExposedDropdownMenu(
                            expanded = expandedTargetDropdown,
                            onDismissRequest = { expandedTargetDropdown = false }
                        ) {
                            cashAccounts.forEach { account ->
                                DropdownMenuItem(
                                    text = { Text("${account.title} ($${account.balance})") },
                                    onClick = { targetAccount = account; expandedTargetDropdown = false }
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = transferAmountText,
                        onValueChange = { transferAmountText = it },
                        label = { Text("Monto a Transferir") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = dateText,
                        onValueChange = { dateText = it },
                        label = { Text("Fecha (AAAA-MM-DD)") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = commentText,
                        onValueChange = { commentText = it },
                        label = { Text("Comentario (opcional)") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Button(
                        onClick = {
                            val src = sourceAccount
                            val tgt = targetAccount
                            val amount = transferAmountText.toDoubleOrNull()

                            if (src == null || tgt == null) {
                                statusText = "Seleccioná cuenta origen y destino."
                                return@Button
                            }
                            if (src.uid == tgt.uid) {
                                statusText = "Origen y destino no pueden ser iguales."
                                return@Button
                            }
                            if (amount == null || amount <= 0) {
                                statusText = "Ingresá un monto válido."
                                return@Button
                            }

                            scope.launch {
                                isLoading = true
                                try {
                                    val client = okhttp3.OkHttpClient()
                                    val json = com.google.gson.Gson().toJson(
                                        mapOf(
                                            "fromAccountUid" to src.uid,
                                            "toAccountUid" to tgt.uid,
                                            "fromAmount" to amount,
                                            "toAmount" to amount,
                                            "comment" to commentText.ifBlank { null },
                                            "date" to dateText.ifBlank { todayStr }
                                        )
                                    )
                                    val body = okhttp3.RequestBody.create(okhttp3.MediaType.parse("application/json; charset=utf-8"), json)
                                    val request = okhttp3.Request.Builder()
                                        .url("http://192.168.68.51:3000/api/transfers")
                                        .post(body)
                                        .build()

                                    val response = withContext(Dispatchers.IO) { client.newCall(request).execute() }
                                    if (response.isSuccessful) {
                                        statusText = "¡Transferencia realizada con éxito!"
                                        transferAmountText = ""
                                        commentText = ""
                                        loadData()
                                    } else {
                                        statusText = "Error en transferencia: ${response.code()}"
                                    }
                                } catch (e: Exception) {
                                    statusText = "Error de red: ${e.message}"
                                } finally {
                                    isLoading = false
                                }
                            }
                        },
                        enabled = !isLoading,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Ejecutar Transferencia")
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        Text(text = statusText, style = MaterialTheme.typography.bodySmall)

        Spacer(modifier = Modifier.height(12.dp))

        LazyColumn(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(accountsList) { account ->
                Card(modifier = Modifier.fillMaxWidth()) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text(text = account.title, style = MaterialTheme.typography.bodyLarge)
                            Text(text = account.currencyCode ?: "ARS", style = MaterialTheme.typography.bodySmall)
                        }
                        Text(text = "$${account.balance}", style = MaterialTheme.typography.titleMedium)
                    }
                }
            }
        }
    }
}