package com.verry.finanzasapp.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.verry.finanzasapp.network.AccountDto

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TransferForm(
    cashAccounts: List<AccountDto>,
    sourceAccount: AccountDto?,
    onSourceSelected: (AccountDto) -> Unit,
    targetAccount: AccountDto?,
    onTargetSelected: (AccountDto) -> Unit,
    transferAmountText: String,
    onAmountChange: (String) -> Unit,
    dateText: String,
    onDateChange: (String) -> Unit,
    commentText: String,
    onCommentChange: (String) -> Unit,
    isLoading: Boolean,
    onSubmit: () -> Unit
) {
    var expandedSourceDropdown by remember { mutableStateOf(false) }
    var expandedTargetDropdown by remember { mutableStateOf(false) }

    Column(modifier = Modifier.padding(16.dp)) {
        // CUENTA ORIGEN
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
                        onClick = {
                            onSourceSelected(account)
                            expandedSourceDropdown = false
                        }
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // CUENTA DESTINO
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
                        onClick = {
                            onTargetSelected(account)
                            expandedTargetDropdown = false
                        }
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        OutlinedTextField(
            value = transferAmountText,
            onValueChange = onAmountChange,
            label = { Text("Monto a Transferir") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(8.dp))

        OutlinedTextField(
            value = dateText,
            onValueChange = onDateChange,
            label = { Text("Fecha (AAAA-MM-DD)") },
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(8.dp))

        OutlinedTextField(
            value = commentText,
            onValueChange = onCommentChange,
            label = { Text("Comentario (opcional)") },
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(12.dp))

        Button(
            onClick = onSubmit,
            enabled = !isLoading,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Ejecutar Transferencia")
        }
    }
}