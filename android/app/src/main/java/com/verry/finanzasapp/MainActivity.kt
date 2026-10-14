package com.verry.finanzasapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
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
import kotlinx.coroutines.withContext
import kotlinx.coroutines.launch
import retrofit2.http.Body
import retrofit2.http.POST
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

// DTO específico para transferencias en Retrofit
data class TransferRequest(
    val fromAccountUid: String,
    val toAccountUid: String,
    val fromAmount: Double,
    val toAmount: Double?,
    val comment: String?,
    val date: String?
)

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

    // Modos: "TRANSACTION" (Gasto/Ingreso) o "TRANSFER" (Entre cuentas)
    var operationMode by remember { mutableStateOf("TRANSACTION") }

    // Estados para Transacciones
    var selectedAccount by remember { mutableStateOf<AccountDto?>(null) }
    var selectedCategory by remember { mutableStateOf<CategoryDto?>(null) }
    var tagText by remember { mutableStateOf("") }
    var amountText by remember { mutableStateOf("") }
    var isExpense by remember { mutableStateOf(true) }

    // Estados para Transferencias
    var sourceAccount by remember { mutableStateOf<AccountDto?>(null) }
    var targetAccount by remember { mutableStateOf<AccountDto?>(null) }
    var transferAmountText by remember { mutableStateOf("") }

    // Comunes
    var commentText by remember { mutableStateOf("") }
    var dateText by remember { mutableStateOf(todayStr) }
    var pendingCount by remember { mutableStateOf(0) }
    var statusText by remember { mutableStateOf("Listo para registrar movimientos") }
    var isLoading by remember { mutableStateOf(false) }

    var expandedAccountDropdown by remember { mutableStateOf(false) }
    var expandedCategoryDropdown by remember { mutableStateOf(false) }
    var expandedSourceDropdown by remember { mutableStateOf(false) }
    var expandedTargetDropdown by remember { mutableStateOf(false) }

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
                    AccountEntity(it.uid, it.title, it.currencyCode, it.balance)
                })
                accountsList = remoteAccounts

                val remoteCategories = NetworkModule.apiService.getCategories()
                categoryDao.saveCategories(remoteCategories.map {
                    CategoryEntity(it.uid, it.title, it.parent_uid)
                })
                categoriesList = remoteCategories

                statusText = "Conectado a PC (Datos sincronizados)"
            } catch (e: Exception) {
                accountsList = accountDao.getLocalAccounts().map {
                    AccountDto(it.uid, it.uid, it.title, it.title, it.currencyCode, it.currencyCode, it.balance)
                }
                categoriesList = categoryDao.getLocalCategories().map {
                    CategoryDto(it.uid, it.title, it.parentUid)
                }
                statusText = "Modo Offline (Usando datos locales)"
            } finally {
                if (selectedAccount == null && accountsList.isNotEmpty()) selectedAccount = accountsList.first()
                if (sourceAccount == null && accountsList.isNotEmpty()) sourceAccount = accountsList.first()
                if (targetAccount == null && accountsList.size > 1) targetAccount = accountsList[1] else if (targetAccount == null && accountsList.isNotEmpty()) targetAccount = accountsList.first()
                if (selectedCategory == null && categoriesList.isNotEmpty()) selectedCategory = categoriesList.first()
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
                    modifier = Modifier.padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(text = "Pendientes en cel: $pendingCount")
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
        }

        // Selector de Modo Operación (Movimiento vs Transferencia)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            FilterChip(
                selected = operationMode == "TRANSACTION",
                onClick = { operationMode = "TRANSACTION" },
                label = { Text("Gasto / Ingreso") }
            )
            FilterChip(
                selected = operationMode == "TRANSFER",
                onClick = { operationMode = "TRANSFER" },
                label = { Text("Transferencia") }
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Formulario
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {

                if (operationMode == "TRANSACTION") {
                    // --- FORMULARIO DE GASTO / INGRESO ---
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
                                    onClick = { selectedAccount = account; expandedAccountDropdown = false }
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    ExposedDropdownMenuBox(
                        expanded = expandedCategoryDropdown,
                        onExpandedChange = { expandedCategoryDropdown = !expandedCategoryDropdown }
                    ) {
                        OutlinedTextField(
                            value = selectedCategory?.title ?: "Seleccionar Categoría...",
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Categoría") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedCategoryDropdown) },
                            modifier = Modifier.menuAnchor().fillMaxWidth()
                        )
                        ExposedDropdownMenu(
                            expanded = expandedCategoryDropdown,
                            onDismissRequest = { expandedCategoryDropdown = false }
                        ) {
                            categoriesList.forEach { cat ->
                                val parentObj = cat.parent_uid?.let { pUid -> categoriesList.find { it.uid == pUid } }
                                val displayText = if (parentObj != null) "  ↳ ${cat.title} (${parentObj.title})" else "📂 ${cat.title}"
                                DropdownMenuItem(
                                    text = { Text(displayText) },
                                    onClick = { selectedCategory = cat; expandedCategoryDropdown = false }
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                        FilterChip(selected = isExpense, onClick = { isExpense = true }, label = { Text("Gasto (-)") })
                        FilterChip(selected = !isExpense, onClick = { isExpense = false }, label = { Text("Ingreso (+)") })
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
                        label = { Text("Etiqueta (opcional, ej: #vacaciones)") },
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
                            if (acc == null || amount == null || amount <= 0) {
                                statusText = "Verificá la cuenta y el monto."
                                return@Button
                            }

                            scope.launch {
                                isLoading = true
                                try {
                                    val req = TransactionRequest(
                                        type = if (isExpense) "EXPENSE" else "INCOME",
                                        account_uid = acc.uid,
                                        category_uid = selectedCategory?.uid,
                                        tag = tagText.ifBlank { null },
                                        amount = amount,
                                        comment = commentText.ifBlank { null },
                                        date = dateText.ifBlank { todayStr }
                                    )
                                    NetworkModule.apiService.createTransaction(req)
                                    statusText = "¡Movimiento enviado a PC!"
                                    amountText = ""; commentText = ""; tagText = ""
                                    loadData()
                                } catch (e: Exception) {
                                    statusText = "Error al enviar: ${e.message}"
                                } finally {
                                    isLoading = false
                                }
                            }
                        },
                        enabled = !isLoading,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Registrar Movimiento")
                    }

                } else {
                    // --- FORMULARIO DE TRANSFERENCIA ENTRE CUENTAS ---
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
                            accountsList.forEach { account ->
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
                            accountsList.forEach { account ->
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
                                    // Petición HTTP POST /api/transfers directa al backend
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
                                        .url("http://192.168.68.52:3000/api/transfers")
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
                            Text(text = account.currencyCode, style = MaterialTheme.typography.bodySmall)
                        }
                        Text(text = "$${account.balance}", style = MaterialTheme.typography.titleMedium)
                    }
                }
            }
        }
    }
}