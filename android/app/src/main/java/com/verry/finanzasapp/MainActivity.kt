package com.verry.finanzasapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AccountBalance
import androidx.compose.material.icons.rounded.BarChart
import androidx.compose.material.icons.rounded.CreditCard
import androidx.compose.material.icons.rounded.Home
import androidx.compose.material.icons.rounded.ReceiptLong
import androidx.compose.material.icons.rounded.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.verry.finanzasapp.db.AccountEntity
import com.verry.finanzasapp.db.AppDatabase
import com.verry.finanzasapp.db.CategoryEntity
import com.verry.finanzasapp.db.PendingTransactionEntity
import com.verry.finanzasapp.network.AccountDto
import com.verry.finanzasapp.network.CategoryDto
import com.verry.finanzasapp.network.TransactionDto
import com.verry.finanzasapp.network.NetworkModule
import com.verry.finanzasapp.network.TransactionRequest
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.time.LocalDate
import com.verry.finanzasapp.ui.components.OperationTypeSelector
import com.verry.finanzasapp.ui.components.ExpenseIncomeForm
import com.verry.finanzasapp.ui.components.TransferForm
import com.verry.finanzasapp.ui.components.AppHeader
import com.verry.finanzasapp.ui.components.DashboardScreen
import com.verry.finanzasapp.ui.components.CardsScreen
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.verry.finanzasapp.ui.components.AccountsScreen
import com.verry.finanzasapp.ui.components.CardDetailScreen
import com.verry.finanzasapp.ui.components.SettingsScreen
import com.verry.finanzasapp.ui.components.AccountDetailScreen
import com.verry.finanzasapp.ui.components.TransactionDetailScreen

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val db = AppDatabase.getDatabase(this)

        setContent {
            MaterialTheme(
                colorScheme = darkColorScheme(
                    primary = Color(0xFF3B82F6),
                    onPrimary = Color.White,
                    background = Color(0xFF090D16),
                    onBackground = Color(0xFFF1F5F9),
                    surface = Color(0xFF131B2E),
                    onSurface = Color(0xFFF1F5F9),
                    surfaceVariant = Color(0xFF131B2E),
                    onSurfaceVariant = Color(0xFF94A3B8)
                )
            ) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    MainScreen(db)
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(db: AppDatabase) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var isPrivacyActive by remember { mutableStateOf(false) }
    var currentTab by remember { mutableStateOf("dashboard") }

    var selectedAccountDetailFromDashboard by remember { mutableStateOf<AccountDto?>(null) }
    var selectedTransactionDetailType by remember { mutableStateOf<String?>(null) } // "INCOME", "EXPENSE" o null

    val pendingDao = db.pendingTransactionDao()
    val accountDao = db.accountDao()
    val categoryDao = db.categoryDao()

    val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    val todayStr = sdf.format(Date())

    var accountsList by remember { mutableStateOf<List<AccountDto>>(emptyList()) }
    var categoriesList by remember { mutableStateOf<List<CategoryDto>>(emptyList()) }
    var transactionsList by remember { mutableStateOf<List<TransactionDto>>(emptyList()) }
    var selectedPeriod by remember { mutableStateOf("month") } // "week", "month", "year", "all"
    var selectedCurrency by remember { mutableStateOf("ARS") }  // "ARS", "USD", etc.

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

    val isCreditCardSelected = selectedAccount?.type?.lowercase() == "credit_card" || selectedAccount?.type?.lowercase() == "tarjeta"

    val cashAccounts = accountsList.filter {
        val t = it.type?.lowercase() ?: ""
        t != "credit_card" && t != "tarjeta"
    }

    val creditCardsList = accountsList.filter {
        val t = it.type?.lowercase() ?: ""
        t == "credit_card" || t == "tarjeta"
    }

    val targetType = if (operationMode == "EXPENSE") "expense" else "income"
    val categoriesByMode = categoriesList.filter { (it.type ?: "expense") == targetType }

    val mainCategories = categoriesByMode.filter { it.parent_uid.isNullOrBlank() }
    val subCategories = categoriesByMode.filter { it.parent_uid == selectedMainCategory?.uid }
    var selectedCardDetail by remember { mutableStateOf<AccountDto?>(null) }

    // Listas dinámicas de monedas
    val availableCurrencies = accountsList.map { it.currencyCode ?: it.currency ?: "ARS" }.distinct()

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

    fun resetForm() {
        amountText = ""
        commentText = ""
        tagText = ""
        selectedInstallments = 1
        dateText = todayStr
        selectedMainCategory = null
        selectedSubCategory = null
        sourceAccount = null
        targetAccount = null
        transferAmountText = ""
    }

    fun loadData() {
        scope.launch {
            isLoading = true
            try {
                val apiService = NetworkModule.provideApiService(context)

                val remoteAccounts = apiService.getAccounts()
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

                val remoteCategories = apiService.getCategories()
                categoryDao.clearCategories()
                categoryDao.saveCategories(remoteCategories.map {
                    CategoryEntity(
                        uid = it.uid,
                        title = it.title ?: "Sin título",
                        parentUid = it.parent_uid,
                        type = it.type ?: "expense",
                        icon = it.icon // <-- ¡Agregado aquí para persistirlo offline!
                    )
                })
                categoriesList = remoteCategories

                val remoteTransactions = apiService.getTransactions()
                transactionsList = remoteTransactions

                statusText = "Conectado a PC (Datos sincronizados)"
            } catch (e: Exception) {
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
                        title = localCat.title ?: "Sin categoría",
                        parent_uid = localCat.parentUid,
                        type = localCat.type ?: "expense",
                        icon = localCat.icon // <-- ¡Agregado aquí para enviarlo al UI!
                    )
                }
                statusText = "Modo Offline (Usando datos locales)"
            } finally {
                if (selectedAccount == null && accountsList.isNotEmpty()) {
                    selectedAccount = accountsList.first()
                }
                isLoading = false
                refreshPendingCount()
            }
        }
    }
    LaunchedEffect(currentTab) {
        if (currentTab == "cards") {
            loadData()
        }
    }
    LaunchedEffect(Unit) {
        loadData()
    }

    Scaffold(
        modifier = Modifier
            .fillMaxSize()
            .systemBarsPadding(),
        topBar = {
            AppHeader(
                isPrivacyActive = isPrivacyActive,
                onTogglePrivacy = { isPrivacyActive = !isPrivacyActive },
                syncStatusText = if (isLoading) "Syncing..." else "Sync OK",
                onSyncClick = { loadData() }
            )
        },
        bottomBar = {
            NavigationBar(
                containerColor = Color(0xFF131B2E),
                tonalElevation = 8.dp
            ) {
                val items = listOf(
                    Triple("dashboard", "Inicio", Icons.Rounded.Home),
                    Triple("transactions", "Movs", Icons.Rounded.ReceiptLong),
                    Triple("cards", "Tarjetas", Icons.Rounded.CreditCard),
                    Triple("accounts", "Cuentas", Icons.Rounded.AccountBalance),
                    Triple("analytics", "Análisis", Icons.Rounded.BarChart),
                    Triple("settings", "Ajustes", Icons.Rounded.Settings)
                )
                items.forEach { (tabKey, title, icon) ->
                    val isSelected = currentTab == tabKey
                    NavigationBarItem(
                        selected = isSelected,
                        onClick = { currentTab = tabKey },
                        icon = {
                            Icon(
                                imageVector = icon,
                                contentDescription = title,
                                modifier = Modifier.size(20.dp)
                            )
                        },
                        label = {
                            Text(
                                text = title,
                                fontSize = 10.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                            )
                        },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = Color(0xFF3B82F6),
                            unselectedIconColor = Color(0xFF94A3B8),
                            selectedTextColor = Color(0xFF3B82F6),
                            unselectedTextColor = Color(0xFF94A3B8),
                            indicatorColor = Color(0xFF1E293B)
                        )
                    )
                }
            }
        },
        containerColor = Color(0xFF090D16)
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            when (currentTab) {
                "dashboard" -> {
                    if (selectedAccountDetailFromDashboard != null) {
                        AccountDetailScreen(
                            account = selectedAccountDetailFromDashboard!!,
                            transactionsList = transactionsList,
                            onBackClick = { selectedAccountDetailFromDashboard = null },
                            isPrivacyActive = isPrivacyActive,
                            modifier = Modifier.fillMaxSize()
                        )
                    } else if (selectedTransactionDetailType != null) {
                        val isInc = selectedTransactionDetailType == "INCOME"
                        val titleText = if (isInc) "Detalle de Ingresos" else "Detalle de Gastos"

                        // Filtrado por moneda y período para detalle
                        val currencyAccounts = accountsList.filter {
                            (it.currencyCode ?: it.currency ?: "ARS").uppercase() == selectedCurrency.uppercase()
                        }
                        val currencyAccountUids = currencyAccounts.map { it.uid }

                        val currentDate = LocalDate.now()
                        val periodFilteredTransactions = transactionsList.filter { tx ->
                            try {
                                val matchesCurrency = currencyAccountUids.contains(tx.accountUid)
                                if (!matchesCurrency) return@filter false

                                val rawDate = tx.date ?: todayStr
                                val parts = rawDate.split("-")
                                val txDate = if (parts.size == 3) {
                                    LocalDate.of(parts[0].toInt(), parts[1].padStart(2, '0').toInt(), parts[2].padStart(2, '0').toInt())
                                } else {
                                    LocalDate.now()
                                }

                                val matchesPeriod = when (selectedPeriod) {
                                    "week" -> {
                                        val startOfWeek = currentDate.with(java.time.DayOfWeek.MONDAY)
                                        val endOfWeek = currentDate.with(java.time.DayOfWeek.SUNDAY)
                                        !txDate.isBefore(startOfWeek) && !txDate.isAfter(endOfWeek)
                                    }
                                    "month" -> txDate.year == currentDate.year && txDate.month == currentDate.month
                                    "year" -> txDate.year == currentDate.year
                                    else -> true
                                }
                                matchesPeriod && tx.type.uppercase() == selectedTransactionDetailType
                            } catch (e: Exception) {
                                false
                            }
                        }

                        val totalSum = periodFilteredTransactions.sumOf { it.amount ?: 0.0 }

                        TransactionDetailScreen(
                            title = titleText,
                            transactions = periodFilteredTransactions,
                            totalAmount = totalSum,
                            onBackClick = { selectedTransactionDetailType = null },
                            isPrivacyActive = isPrivacyActive,
                            modifier = Modifier.fillMaxSize()
                        )
                    } else {
                        // Filtrado normal del Dashboard por moneda y período
                        val currencyAccounts = accountsList.filter {
                            (it.currencyCode ?: it.currency ?: "ARS").uppercase() == selectedCurrency.uppercase()
                        }
                        val currencyAccountUids = currencyAccounts.map { it.uid }

                        val currentDate = LocalDate.now()
                        val filteredTransactions = transactionsList.filter { tx ->
                            try {
                                val matchesCurrency = currencyAccountUids.contains(tx.accountUid)
                                if (!matchesCurrency) return@filter false

                                val rawDate = tx.date ?: todayStr
                                val parts = rawDate.split("-")
                                val txDate = if (parts.size == 3) {
                                    LocalDate.of(parts[0].toInt(), parts[1].padStart(2, '0').toInt(), parts[2].padStart(2, '0').toInt())
                                } else {
                                    LocalDate.now()
                                }

                                when (selectedPeriod) {
                                    "week" -> {
                                        val startOfWeek = currentDate.with(java.time.DayOfWeek.MONDAY)
                                        val endOfWeek = currentDate.with(java.time.DayOfWeek.SUNDAY)
                                        !txDate.isBefore(startOfWeek) && !txDate.isAfter(endOfWeek)
                                    }
                                    "month" -> txDate.year == currentDate.year && txDate.month == currentDate.month
                                    "year" -> txDate.year == currentDate.year
                                    else -> true
                                }
                            } catch (e: Exception) {
                                false
                            }
                        }

                        val calculatedIncome = filteredTransactions.filter { it.type.uppercase() == "INCOME" }.sumOf { it.amount ?: 0.0 }
                        val calculatedExpense = filteredTransactions.filter { it.type.uppercase() == "EXPENSE" }.sumOf { it.amount ?: 0.0 }
                        val calculatedNetWorth = currencyAccounts.sumOf { it.balance }

                        DashboardScreen(
                            accountsList = accountsList,
                            netWorth = calculatedNetWorth,
                            totalIncome = calculatedIncome,
                            totalExpense = calculatedExpense,
                            selectedPeriod = selectedPeriod,
                            onPeriodSelected = { selectedPeriod = it },
                            selectedCurrency = selectedCurrency,
                            availableCurrencies = availableCurrencies,
                            onCurrencySelected = { selectedCurrency = it },
                            onAccountSelected = { selectedAccountDetailFromDashboard = it },
                            onIncomeClick = { selectedTransactionDetailType = "INCOME" },
                            onExpenseClick = { selectedTransactionDetailType = "EXPENSE" },
                            isPrivacyActive = isPrivacyActive,
                            modifier = Modifier.fillMaxSize()
                        )
                    }
                }
                "transactions" -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        OperationTypeSelector(
                            selectedMode = operationMode,
                            onModeSelected = { operationMode = it }
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF131B2E)),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF232F48))
                        ) {
                            if (operationMode == "EXPENSE" || operationMode == "INCOME") {
                                ExpenseIncomeForm(
                                    operationMode = operationMode,
                                    accountsList = accountsList,
                                    selectedAccount = selectedAccount,
                                    onAccountSelected = { selectedAccount = it },
                                    isCreditCardSelected = isCreditCardSelected,
                                    selectedInstallments = selectedInstallments,
                                    onInstallmentsSelected = { selectedInstallments = it },
                                    mainCategories = mainCategories,
                                    selectedMainCategory = selectedMainCategory,
                                    onMainCategorySelected = { selectedMainCategory = it },
                                    subCategories = subCategories,
                                    selectedSubCategory = selectedSubCategory,
                                    onSubCategorySelected = { selectedSubCategory = it },
                                    amountText = amountText,
                                    onAmountChange = { amountText = it },
                                    dateText = dateText,
                                    onDateChange = { dateText = it },
                                    tagText = tagText,
                                    onTagChange = { tagText = it },
                                    commentText = commentText,
                                    onCommentChange = { commentText = it },
                                    isLoading = isLoading,
                                    onSubmit = {
                                        val acc = selectedAccount
                                        val amount = amountText.toDoubleOrNull()
                                        val categoryUidToSend = selectedSubCategory?.uid ?: selectedMainCategory?.uid

                                        if (acc == null || amount == null || amount <= 0) {
                                            statusText = "Verificá la cuenta y el monto."
                                        } else {
                                            scope.launch {
                                                isLoading = true
                                                val isCard = acc.type?.lowercase() == "credit_card" || acc.type?.lowercase() == "tarjeta"

                                                try {
                                                    val apiService = NetworkModule.provideApiService(context)

                                                    if (isCard) {
                                                        val purchaseReq = com.verry.finanzasapp.network.CreditCardPurchaseRequest(
                                                            accountUid = acc.uid,
                                                            totalAmount = amount,
                                                            installments = selectedInstallments,
                                                            purchaseDate = dateText.ifBlank { todayStr },
                                                            comment = commentText.ifBlank { null },
                                                            categoryUid = categoryUidToSend,
                                                            tag = tagText.ifBlank { null }
                                                        )
                                                        apiService.createCreditCardPurchase(purchaseReq)
                                                        statusText = "¡Compra con tarjeta registrada con éxito!"
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
                                                        apiService.createTransaction(req)
                                                        statusText = "¡Movimiento enviado a PC!"
                                                    }

                                                    resetForm()
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
                                                    resetForm()
                                                    refreshPendingCount()
                                                } finally {
                                                    isLoading = false
                                                }
                                            }
                                        }
                                    }
                                )
                            } else {
                                TransferForm(
                                    cashAccounts = cashAccounts,
                                    sourceAccount = sourceAccount,
                                    onSourceSelected = { sourceAccount = it },
                                    targetAccount = targetAccount,
                                    onTargetSelected = { targetAccount = it },
                                    transferAmountText = transferAmountText,
                                    onAmountChange = { transferAmountText = it },
                                    dateText = dateText,
                                    onDateChange = { dateText = it },
                                    commentText = commentText,
                                    onCommentChange = { commentText = it },
                                    isLoading = isLoading,
                                    onSubmit = {
                                        val src = sourceAccount
                                        val tgt = targetAccount
                                        val amount = transferAmountText.toDoubleOrNull()

                                        if (src == null || tgt == null) {
                                            statusText = "Seleccioná cuenta origen y destino."
                                        } else if (src.uid == tgt.uid) {
                                            statusText = "Origen y destino no pueden ser iguales."
                                        } else if (amount == null || amount <= 0) {
                                            statusText = "Ingresá un monto válido."
                                        } else {
                                            scope.launch {
                                                isLoading = true
                                                try {
                                                    val apiService = NetworkModule.provideApiService(context)
                                                    val transferReq = com.verry.finanzasapp.network.TransferRequest(
                                                        fromAccountUid = src.uid,
                                                        toAccountUid = tgt.uid,
                                                        fromAmount = amount,
                                                        toAmount = amount,
                                                        comment = commentText.ifBlank { null },
                                                        date = dateText.ifBlank { todayStr }
                                                    )
                                                    apiService.createTransfer(transferReq)

                                                    statusText = "¡Transferencia registrada con éxito!"
                                                    resetForm()
                                                    loadData()
                                                } catch (e: Exception) {
                                                    statusText = "Error en transferencia: ${e.message}"
                                                } finally {
                                                    isLoading = false
                                                }
                                            }
                                        }
                                    }
                                )
                            }
                        }
                    }
                }
                "cards" -> {
                    if (selectedCardDetail != null) {
                        CardDetailScreen(
                            card = selectedCardDetail!!,
                            onBackClick = { selectedCardDetail = null },
                            isPrivacyActive = isPrivacyActive,
                            modifier = Modifier.fillMaxSize()
                        )
                    } else {
                        CardsScreen(
                            cardsList = creditCardsList,
                            onCardClick = { selectedCardDetail = it },
                            isPrivacyActive = isPrivacyActive,
                            modifier = Modifier.fillMaxSize()
                        )
                    }
                }
                "accounts" -> {
                    AccountsScreen(
                        accountsList = accountsList,
                        categoriesList = categoriesList,
                        isPrivacyActive = isPrivacyActive,
                        modifier = Modifier.fillMaxSize()
                    )
                }
                "settings" -> {
                    SettingsScreen(modifier = Modifier.fillMaxSize())
                }
                else -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text(text = "Sección $currentTab en desarrollo...", color = Color(0xFF94A3B8))
                    }
                }
            }
        }
    }
}