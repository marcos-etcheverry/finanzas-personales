
package com.verry.finanzasapp.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// Paleta extraída del diseño HTML
val CardBgColor = Color(0xFF131B2E)
val BorderColor = Color(0xFF232F48)
val ExpenseColor = Color(0xFFEF4444)
val IncomeColor = Color(0xFF10B981)
val TransferColor = Color(0xFF3B82F6)
val TextMutedColor = Color(0xFF94A3B8)

@Composable
fun OperationTypeSelector(
    selectedMode: String,
    onModeSelected: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(CardBgColor)
            .border(1.dp, BorderColor, RoundedCornerShape(12.dp))
            .padding(4.dp),
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        OptionTab(
            text = "Gasto",
            dotColor = ExpenseColor,
            isSelected = selectedMode == "EXPENSE",
            onClick = { onModeSelected("EXPENSE") },
            modifier = Modifier.weight(1f)
        )
        OptionTab(
            text = "Ingreso",
            dotColor = IncomeColor,
            isSelected = selectedMode == "INCOME",
            onClick = { onModeSelected("INCOME") },
            modifier = Modifier.weight(1f)
        )
        OptionTab(
            text = "Transferencia",
            dotColor = TransferColor,
            isSelected = selectedMode == "TRANSFER",
            onClick = { onModeSelected("TRANSFER") },
            modifier = Modifier.weight(1f)
        )
    }
}

@Composable
private fun OptionTab(
    text: String,
    dotColor: Color,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val backgroundColor by animateColorAsState(
        targetValue = if (isSelected) dotColor.copy(alpha = 0.15f) else Color.Transparent,
        label = "tabBgAnimation"
    )
    val borderColor by animateColorAsState(
        targetValue = if (isSelected) dotColor.copy(alpha = 0.5f) else Color.Transparent,
        label = "tabBorderAnimation"
    )

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(backgroundColor)
            .border(1.dp, borderColor, RoundedCornerShape(8.dp))
            .clickable { onClick() }
            .padding(vertical = 10.dp),
        contentAlignment = Alignment.Center
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .background(dotColor, shape = CircleShape)
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = text,
                color = if (isSelected) Color.White else TextMutedColor,
                fontSize = 12.sp,
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
            )
        }
    }
}