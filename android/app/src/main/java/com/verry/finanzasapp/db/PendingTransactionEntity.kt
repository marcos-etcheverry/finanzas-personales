package com.verry.finanzasapp.db

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "pending_transactions")
data class PendingTransactionEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val type: String,
    val accountUid: String,
    val categoryUid: String?,
    val tag: String?,
    val amount: Double,
    val comment: String?,
    val createdAt: Long = System.currentTimeMillis()
)