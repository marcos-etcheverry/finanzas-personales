package com.verry.finanzasapp.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable // <-- Asegurate de importar esto
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.verry.finanzasapp.network.AccountDto

@Composable
fun AccountsCarousel(
    accounts: List<AccountDto>,
    onAccountClick: (AccountDto) -> Unit, // <-- Nuevo callback
    modifier: Modifier = Modifier
) {
    LazyRow(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        contentPadding = PaddingValues(horizontal = 4.dp)
    ) {
        items(accounts) { account ->
            AccountCard(account = account, onClick = { onAccountClick(account) })
        }
    }
}

@Composable
private fun AccountCard(
    account: AccountDto,
    onClick: () -> Unit // <-- Nuevo callback para la tarjeta individual
) {
    val currencySymbol = if (account.currencyCode?.uppercase() == "USD" || account.currency == "USD") "US$" else "$"
    val isNegative = account.balance < 0
    val balanceColor = if (isNegative) Color(0xFFEF4444) else Color.White

    Box(
        modifier = Modifier
            .width(155.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(Color(0xFF131B2E))
            .border(1.dp, Color(0xFF232F48), RoundedCornerShape(16.dp))
            .clickable { onClick() } // <-- Hacemos la tarjeta interactiva
            .padding(12.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Text(
                text = account.title ?: account.name ?: "Cuenta",
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF94A3B8),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )

            Text(
                text = "$currencySymbol ${String.format("%,.2f", account.balance)}",
                fontSize = 13.sp,
                fontWeight = FontWeight.Black,
                color = balanceColor,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )

            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(4.dp))
                    .background(Color(0xFF3B82F6).copy(alpha = 0.15f))
                    .padding(horizontal = 6.dp, vertical = 2.dp)
            ) {
                Text(
                    text = account.currencyCode ?: account.currency ?: "ARS",
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF60A5FA)
                )
            }
        }
    }
}