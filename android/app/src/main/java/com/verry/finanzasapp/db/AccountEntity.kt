package com.verry.finanzasapp.db

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "local_accounts")
data class AccountEntity(
    @PrimaryKey val uid: String,
    val title: String,
    val currencyCode: String,
    val balance: Double,
    val type: String? = "cash" // <-- Propiedad obligatoria en Room
)